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

-- ===== supabase/migrations/20261030000000_quiz_admin.sql =====
-- Quiz management protected by a shared host passcode.
--
-- The passcode is stored as a bcrypt hash in host_settings, which is not readable
-- through the API. The functions below are security definer, so they can write to
-- the quiz tables (which have no insert/update/delete policies) once the passcode
-- checks out.
--
-- Set the passcode once, in the SQL editor:
--   insert into public.host_settings (passcode_hash)
--   values (extensions.crypt('YOUR-PASSCODE', extensions.gen_salt('bf')))
--   on conflict (id) do update set passcode_hash = excluded.passcode_hash;

create schema if not exists extensions;
create extension if not exists pgcrypto with schema extensions;

create table if not exists public.host_settings (
  id boolean primary key default true check (id),
  passcode_hash text not null
);

alter table public.host_settings enable row level security;
revoke all on public.host_settings from anon, authenticated;

create or replace function public.verify_host_passcode(p_passcode text)
returns boolean
language plpgsql
security definer
set search_path = public, extensions
as $$
declare
  ok boolean;
begin
  select (h.passcode_hash = crypt(coalesce(p_passcode, ''), h.passcode_hash))
    into ok
    from public.host_settings h;

  if not coalesce(ok, false) then
    -- slow down guessing
    perform pg_sleep(1);
    return false;
  end if;
  return true;
end;
$$;

-- Raises when the quiz payload is not usable.
-- p_questions: [{"id": uuid|null, "body": text, "choices": [{"body": text, "is_correct": bool}]}]
create or replace function public._validate_quiz(p_name text, p_questions jsonb)
returns void
language plpgsql
as $$
declare
  q jsonb;
  c jsonb;
  choice_count int;
  correct_count int;
begin
  if p_name is null or btrim(p_name) = '' then
    raise exception 'Quiz title is required';
  end if;
  if p_questions is null
     or jsonb_typeof(p_questions) <> 'array'
     or jsonb_array_length(p_questions) = 0 then
    raise exception 'Add at least one question';
  end if;

  for q in select * from jsonb_array_elements(p_questions) loop
    if coalesce(btrim(q->>'body'), '') = '' then
      raise exception 'Every question needs text';
    end if;
    if jsonb_typeof(q->'choices') is distinct from 'array' then
      raise exception 'Every question needs choices';
    end if;

    choice_count := 0;
    correct_count := 0;
    for c in select * from jsonb_array_elements(q->'choices') loop
      if coalesce(btrim(c->>'body'), '') = '' then
        raise exception 'Choices cannot be empty';
      end if;
      choice_count := choice_count + 1;
      if coalesce((c->>'is_correct')::boolean, false) then
        correct_count := correct_count + 1;
      end if;
    end loop;

    if choice_count < 2 or choice_count > 4 then
      raise exception 'Each question needs 2 to 4 choices';
    end if;
    if correct_count <> 1 then
      raise exception 'Each question needs exactly one correct choice';
    end if;
  end loop;
end;
$$;

-- Replaces the choices of one question.
create or replace function public._write_choices(p_question_id uuid, p_choices jsonb)
returns void
language plpgsql
as $$
declare
  c jsonb;
begin
  delete from public.choices where question_id = p_question_id;
  for c in select * from jsonb_array_elements(p_choices) loop
    insert into public.choices (question_id, body, is_correct)
    values (p_question_id, btrim(c->>'body'), coalesce((c->>'is_correct')::boolean, false));
  end loop;
end;
$$;

create or replace function public.create_quiz(
  p_passcode text,
  p_name text,
  p_description text,
  p_questions jsonb
)
returns uuid
language plpgsql
security definer
set search_path = public, extensions
as $$
declare
  new_quiz_id uuid;
  new_question_id uuid;
  q jsonb;
  idx int := 0;
begin
  if not public.verify_host_passcode(p_passcode) then
    raise exception 'Invalid passcode' using errcode = '28000';
  end if;
  perform public._validate_quiz(p_name, p_questions);

  insert into public.quiz_sets (name, description)
  values (btrim(p_name), nullif(btrim(coalesce(p_description, '')), ''))
  returning id into new_quiz_id;

  for q in select * from jsonb_array_elements(p_questions) loop
    insert into public.questions (quiz_set_id, body, "order")
    values (new_quiz_id, btrim(q->>'body'), idx)
    returning id into new_question_id;
    perform public._write_choices(new_question_id, q->'choices');
    idx := idx + 1;
  end loop;

  return new_quiz_id;
end;
$$;

-- Questions that carry an id of this quiz are updated in place (so past answers stay);
-- questions without one are added; questions missing from the payload are removed.
create or replace function public.update_quiz(
  p_passcode text,
  p_quiz_id uuid,
  p_name text,
  p_description text,
  p_questions jsonb
)
returns void
language plpgsql
security definer
set search_path = public, extensions
as $$
declare
  q jsonb;
  qid uuid;
  idx int := 0;
begin
  if not public.verify_host_passcode(p_passcode) then
    raise exception 'Invalid passcode' using errcode = '28000';
  end if;
  if not exists (select 1 from public.quiz_sets where id = p_quiz_id) then
    raise exception 'Quiz not found';
  end if;
  perform public._validate_quiz(p_name, p_questions);

  update public.quiz_sets
     set name = btrim(p_name),
         description = nullif(btrim(coalesce(p_description, '')), '')
   where id = p_quiz_id;

  delete from public.questions
   where quiz_set_id = p_quiz_id
     and id not in (
       select (e->>'id')::uuid
         from jsonb_array_elements(p_questions) e
        where nullif(e->>'id', '') is not null
     );

  for q in select * from jsonb_array_elements(p_questions) loop
    qid := null;
    if nullif(q->>'id', '') is not null then
      update public.questions
         set body = btrim(q->>'body'), "order" = idx
       where id = (q->>'id')::uuid and quiz_set_id = p_quiz_id
      returning id into qid;
    end if;

    if qid is null then
      insert into public.questions (quiz_set_id, body, "order")
      values (p_quiz_id, btrim(q->>'body'), idx)
      returning id into qid;
    end if;

    perform public._write_choices(qid, q->'choices');
    idx := idx + 1;
  end loop;
end;
$$;

-- Also removes the quiz's games, participants and answers (they cascade).
create or replace function public.delete_quiz(p_passcode text, p_quiz_id uuid)
returns void
language plpgsql
security definer
set search_path = public, extensions
as $$
begin
  if not public.verify_host_passcode(p_passcode) then
    raise exception 'Invalid passcode' using errcode = '28000';
  end if;
  delete from public.quiz_sets where id = p_quiz_id;
end;
$$;

revoke execute on function public._validate_quiz(text, jsonb) from public, anon, authenticated;
revoke execute on function public._write_choices(uuid, jsonb) from public, anon, authenticated;

revoke execute on function public.verify_host_passcode(text) from public;
revoke execute on function public.create_quiz(text, text, text, jsonb) from public;
revoke execute on function public.update_quiz(text, uuid, text, text, jsonb) from public;
revoke execute on function public.delete_quiz(text, uuid) from public;

grant execute on function public.verify_host_passcode(text) to anon, authenticated;
grant execute on function public.create_quiz(text, text, text, jsonb) to anon, authenticated;
grant execute on function public.update_quiz(text, uuid, text, text, jsonb) to anon, authenticated;
grant execute on function public.delete_quiz(text, uuid) to anon, authenticated;

