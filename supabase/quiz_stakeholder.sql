insert into public.quiz_sets (id, name, description)
values ('a1b2c3d4-0000-4000-8000-000000000001', 'The Art of Stakeholder Engagement', 'Kahoot quiz on stakeholder engagement');

select add_question (
  quiz_set_id => 'a1b2c3d4-0000-4000-8000-000000000001'::uuid,
  body => 'What is the most important foundation for building a strong stakeholder relationship?'::text,
  "order" => 0,
  choices => array[
      '{"body": "Meeting stakeholders only when an issue arises", "is_correct": false}'::json,
      '{"body": "Building trust through responsiveness, reliability and consistency", "is_correct": true}'::json,
      '{"body": "Agreeing with every stakeholder request", "is_correct": false}'::json,
      '{"body": "Focusing only on the stakeholder’s official position", "is_correct": false}'::json
  ]
);
select add_question (
  quiz_set_id => 'a1b2c3d4-0000-4000-8000-000000000001'::uuid,
  body => 'A stakeholder makes a request that could conflict with PETRONAS policies or CoBE. What should you do?'::text,
  "order" => 1,
  choices => array[
      '{"body": "Agree to maintain the relationship", "is_correct": false}'::json,
      '{"body": "Ignore the request", "is_correct": false}'::json,
      '{"body": "Pass the decision to someone else", "is_correct": false}'::json,
      '{"body": "Handle it tactfully while remaining firm on PETRONAS policies and principles", "is_correct": true}'::json
  ]
);
select add_question (
  quiz_set_id => 'a1b2c3d4-0000-4000-8000-000000000001'::uuid,
  body => 'You are meeting a senior stakeholder for the first time. What is the BEST preparation?'::text,
  "order" => 2,
  choices => array[
      '{"body": "Only study their official job title", "is_correct": false}'::json,
      '{"body": "Prepare a standard presentation", "is_correct": false}'::json,
      '{"body": "Understand their background, achievements, interests & current issues", "is_correct": true}'::json,
      '{"body": "Prepare to discuss political issues to make the conversation interesting", "is_correct": false}'::json
  ]
);
select add_question (
  quiz_set_id => 'a1b2c3d4-0000-4000-8000-000000000001'::uuid,
  body => 'Which behaviour BEST demonstrates effective stakeholder engagement?'::text,
  "order" => 3,
  choices => array[
      '{"body": "Speaking more to demonstrate expertise", "is_correct": false}'::json,
      '{"body": "Contacting stakeholders only when you need something", "is_correct": false}'::json,
      '{"body": "Using the same communication style with everyone", "is_correct": false}'::json,
      '{"body": "Listening carefully and adapting your approach to the stakeholder", "is_correct": true}'::json
  ]
);
select add_question (
  quiz_set_id => 'a1b2c3d4-0000-4000-8000-000000000001'::uuid,
  body => 'Who is responsible for stakeholder management?'::text,
  "order" => 4,
  choices => array[
      '{"body": "Government Relations teams only", "is_correct": false}'::json,
      '{"body": "Employees dealing with external stakeholders", "is_correct": false}'::json,
      '{"body": "Senior management", "is_correct": false}'::json,
      '{"body": "Everyone in the organisation", "is_correct": true}'::json
  ]
);
