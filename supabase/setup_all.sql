-- ===== supabase/migrations/20231215125748_remote_schema.sql =====
create table if not exists public.quiz_sets (
    id uuid default gen_random_uuid() not null primary key,
    created_at timestamp with time zone default now() not null,
    name text not null,
    description text
);

create table if not exists public.questions (
    id uuid default gen_random_uuid() not null primary key,
    created_at timestamp with time zone default now() not null,
    body text not null,
    image_url text,
    "order" smallint not null,
    quiz_set_id uuid not null references quiz_sets(id) on delete cascade on update cascade
);

create table if not exists public.choices (
    id uuid default gen_random_uuid() not null primary key,
    created_at timestamp with time zone default now() not null,
    question_id uuid not null references questions(id) on delete cascade on update cascade,
    body text not null,
    is_correct boolean default false not null
);

create table if not exists public.games (
    id uuid default gen_random_uuid() not null primary key,
    created_at timestamp with time zone default now() not null,
    current_question_sequence smallint default 0 not null,
    is_answer_revealed boolean default false not null,
    phase text default 'lobby' not null,
    quiz_set_id uuid not null references quiz_sets(id) on delete cascade on update cascade
);

alter table public.games
    add constraint check_game_phase check (phase in ('lobby', 'quiz', 'result'));

create table if not exists public.participants (
    id uuid default gen_random_uuid() not null primary key,
    created_at timestamp with time zone default now() not null,
    nickname text not null,
    game_id uuid not null references games(id) on delete cascade on update cascade,
    user_id uuid default auth.uid() not null references auth.users(id) on delete cascade on update cascade,
    unique (game_id, user_id)
);

create table if not exists public.answers (
    id uuid default gen_random_uuid() not null primary key,
    created_at timestamp with time zone default now() not null,
    participant_id uuid default auth.uid() not null references public.participants(id) on delete cascade on update cascade,
    question_id uuid not null references public.questions(id) on delete cascade on update cascade,
    score smallint not null,
    unique (participant_id, question_id)
);

alter publication supabase_realtime add table games;
alter publication supabase_realtime add table participants;

-- ===== supabase/migrations/20240410082019_result_view.sql =====
create or replace view game_results as 
    select
        participants.id as participant_id,
        participants.nickname,
        sum(answers.score) total_score,
        games.id as game_id
    from games
    inner join quiz_sets on games.quiz_set_id = quiz_sets.id
    inner join questions on quiz_sets.id = questions.quiz_set_id
    inner join answers on questions.id = answers.question_id
    inner join participants on answers.participant_id = participants.id and games.id = participants.game_id
    group by games.id, participants.id;


-- ===== supabase/migrations/20240412023540_rls.sql =====
create or replace function add_question (
  quiz_set_id uuid,
  body text,
  "order" int,
  choices json[] -- i.e. [{"body": "Postgres", "is_correct": true},{"body": "MySQL", "is_correct": false}]
) returns void language plpgsql as $$
declare
  question_id uuid;
  choice json;
begin
  insert into questions(body, "order", quiz_set_id)
  values (add_question.body, add_question."order", add_question.quiz_set_id)
  returning id into question_id;

  foreach choice in array choices
  loop 
    insert into public.choices
        (question_id, body, is_correct)
        values (question_id, choice->>'body', (choice->>'is_correct')::boolean);
  end loop;
end;
$$ security invoker;


alter table public.quiz_sets enable row level security;
create policy "Quiz sets are viewable by everyone" on public.quiz_sets for select using (true);

alter table public.questions enable row level security;
create policy "Questions are viewable by everyone" on public.questions for select using (true);

alter table public.choices enable row level security;
create policy "Choices are viewable by everyone" on public.choices for select using (true);

alter table public.games
  add column host_user_id uuid default auth.uid() references auth.users(id) on delete set null on update cascade;

alter table public.games enable row level security;
create policy "Choices are viewable by everyone" on public.games for select using (true);
create policy "Host can start a game" on public.games for insert with check (auth.uid() = host_user_id);
create policy "Host can update their games" on public.games for update using (auth.uid() = host_user_id) with check (auth.uid() = host_user_id);

alter table public.participants enable row level security;
create policy "Participants are viewable by everyone." on public.participants for select using (true);
create policy "Participants can insert theirselves" on public.participants for insert with check (auth.uid() = user_id);

alter table public.answers enable row level security;
create policy "Answers are viewable by everyone." on public.answers for select using (true);
create policy "Participants can insert their own answers" on public.answers for insert with check (true);

alter table public.answers add column choice_id uuid references public.choices(id) on delete set null on update cascade;

alter publication supabase_realtime add table public.answers;

