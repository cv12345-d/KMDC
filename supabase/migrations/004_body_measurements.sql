-- Mesures corporelles (tour de taille, hanches, bras, cuisse)
create table public.body_measurements (
  id              uuid primary key default gen_random_uuid(),
  user_id         uuid not null references auth.users(id) on delete cascade,
  date_mesure     date not null,
  tour_taille_cm  numeric(5,1),
  tour_hanches_cm numeric(5,1),
  tour_bras_cm    numeric(5,1),
  tour_cuisse_cm  numeric(5,1),
  created_at      timestamptz default now(),
  unique(user_id, date_mesure)
);

alter table public.body_measurements enable row level security;

create policy "Users manage own body_measurements"
  on public.body_measurements
  for all
  using  (auth.uid() = user_id)
  with check (auth.uid() = user_id);
