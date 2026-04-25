-- Aliments personnels ajoutés par l'utilisatrice
create table public.custom_foods (
  id          uuid primary key default gen_random_uuid(),
  user_id     uuid not null references public.profiles(id) on delete cascade,
  nom         text not null,
  liste       text not null check (liste in ('verte', 'jaune', 'orange', 'rouge')),
  ig_estime   integer check (ig_estime between 0 and 100),
  created_at  timestamptz not null default now()
);

create index idx_custom_foods_user on public.custom_foods(user_id);

alter table public.custom_foods enable row level security;

create policy "users read own custom foods"
  on public.custom_foods for select using (auth.uid() = user_id);

create policy "users insert own custom foods"
  on public.custom_foods for insert with check (auth.uid() = user_id);

create policy "users update own custom foods"
  on public.custom_foods for update using (auth.uid() = user_id);

create policy "users delete own custom foods"
  on public.custom_foods for delete using (auth.uid() = user_id);
