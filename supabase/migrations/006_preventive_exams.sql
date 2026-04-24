-- Suivi des examens préventifs (mammographie, frottis, etc.)
create table public.preventive_exams (
  id              uuid primary key default gen_random_uuid(),
  user_id         uuid not null references auth.users(id) on delete cascade,
  exam_type       text not null,
  date_dernier    date,
  reminder_active boolean not null default false,
  created_at      timestamptz default now(),
  unique(user_id, exam_type)
);

alter table public.preventive_exams enable row level security;

create policy "Users manage own preventive_exams" on public.preventive_exams
  for all using (auth.uid() = user_id) with check (auth.uid() = user_id);
