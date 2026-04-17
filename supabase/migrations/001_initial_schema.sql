-- ============================================================
-- Migration 001 — Schéma initial Méthode KMDC
-- À exécuter dans Supabase > SQL Editor
-- ============================================================

-- 1. profiles
create table public.profiles (
  id               uuid primary key references auth.users(id) on delete cascade,
  email            text not null,
  prenom           text not null,
  age              integer,
  taille_cm        integer,
  poids_initial_kg numeric(5,2),
  poids_objectif_kg numeric(5,2),
  tour_taille_cm   integer,
  tour_hanches_cm  integer,
  date_debut_parcours date,
  created_at       timestamptz not null default now()
);

-- 2. weight_entries
create table public.weight_entries (
  id           uuid primary key default gen_random_uuid(),
  user_id      uuid not null references public.profiles(id) on delete cascade,
  poids_kg     numeric(5,2) not null,
  date_mesure  date not null,
  created_at   timestamptz not null default now()
);

-- 3. measurement_entries
create table public.measurement_entries (
  id              uuid primary key default gen_random_uuid(),
  user_id         uuid not null references public.profiles(id) on delete cascade,
  tour_taille_cm  integer,
  tour_hanches_cm integer,
  date_mesure     date not null,
  created_at      timestamptz not null default now()
);

-- 4. phase_progress
create table public.phase_progress (
  id               uuid primary key default gen_random_uuid(),
  user_id          uuid not null references public.profiles(id) on delete cascade,
  phase            text not null check (phase in ('offensive', 'destockage', 'stabilisation')),
  date_debut       date not null,
  date_fin_prevue  date,
  date_fin_reelle  date,
  created_at       timestamptz not null default now()
);

-- 5. daily_checkins
create table public.daily_checkins (
  id         uuid primary key default gen_random_uuid(),
  user_id    uuid not null references public.profiles(id) on delete cascade,
  date_jour  date not null,
  statut     text not null default 'fait',
  created_at timestamptz not null default now(),
  unique(user_id, date_jour)
);

-- 6. journal_entries
create table public.journal_entries (
  id               uuid primary key default gen_random_uuid(),
  user_id          uuid not null references public.profiles(id) on delete cascade,
  date_jour        date not null,
  humeur           text,
  reussite         text,
  energie_gain     text,
  energie_perte    text,
  intention_demain text,
  created_at       timestamptz not null default now(),
  unique(user_id, date_jour)
);

-- 7. foods (lecture seule, commune à toutes les utilisatrices)
create table public.foods (
  id         uuid primary key default gen_random_uuid(),
  nom        text not null,
  ig         integer not null check (ig between 0 and 100),
  liste      text not null check (liste in ('verte', 'orange', 'rouge')),
  created_at timestamptz not null default now()
);

-- 8. favorite_foods
create table public.favorite_foods (
  id         uuid primary key default gen_random_uuid(),
  user_id    uuid not null references public.profiles(id) on delete cascade,
  food_id    uuid not null references public.foods(id) on delete cascade,
  created_at timestamptz not null default now(),
  unique(user_id, food_id)
);

-- 9. subscriptions
create table public.subscriptions (
  id             uuid primary key default gen_random_uuid(),
  user_id        uuid not null references public.profiles(id) on delete cascade,
  tier           text not null default 'free' check (tier in ('free', 'premium')),
  revenuecat_id  text,
  expires_at     timestamptz,
  updated_at     timestamptz not null default now(),
  unique(user_id)
);

-- ============================================================
-- Row Level Security
-- ============================================================

alter table public.profiles           enable row level security;
alter table public.weight_entries      enable row level security;
alter table public.measurement_entries enable row level security;
alter table public.phase_progress      enable row level security;
alter table public.daily_checkins      enable row level security;
alter table public.journal_entries     enable row level security;
alter table public.favorite_foods      enable row level security;
alter table public.subscriptions       enable row level security;
-- foods : RLS activé mais lecture publique
alter table public.foods               enable row level security;

-- Policies : chaque utilisatrice ne voit que ses propres données
do $$
declare
  t text;
begin
  foreach t in array array[
    'weight_entries','measurement_entries',
    'phase_progress','daily_checkins','journal_entries',
    'favorite_foods','subscriptions'
  ]
  loop
    execute format('
      create policy "own_data_%1$s_select" on public.%1$s
        for select using (user_id = auth.uid());
      create policy "own_data_%1$s_insert" on public.%1$s
        for insert with check (user_id = auth.uid());
      create policy "own_data_%1$s_update" on public.%1$s
        for update using (user_id = auth.uid());
      create policy "own_data_%1$s_delete" on public.%1$s
        for delete using (user_id = auth.uid());
    ', t);
  end loop;
end;
$$;

-- profiles : l'id est auth.uid() directement (pas de colonne user_id)
drop policy if exists "own_data_profiles_select" on public.profiles;
drop policy if exists "own_data_profiles_insert" on public.profiles;
drop policy if exists "own_data_profiles_update" on public.profiles;
drop policy if exists "own_data_profiles_delete" on public.profiles;

create policy "profiles_select" on public.profiles
  for select using (id = auth.uid());
create policy "profiles_insert" on public.profiles
  for insert with check (id = auth.uid());
create policy "profiles_update" on public.profiles
  for update using (id = auth.uid());
create policy "profiles_delete" on public.profiles
  for delete using (id = auth.uid());

-- foods : lecture pour tout le monde (connecté ou non)
create policy "foods_public_read" on public.foods
  for select using (true);

-- ============================================================
-- Données de test (10 aliments)
-- ============================================================

insert into public.foods (nom, ig, liste) values
  ('Lentilles',          25, 'verte'),
  ('Pois chiches',       28, 'verte'),
  ('Patate douce',       44, 'verte'),
  ('Flocons d''avoine',  42, 'verte'),
  ('Riz basmati',        58, 'orange'),
  ('Pain complet',       65, 'orange'),
  ('Banane mûre',        60, 'orange'),
  ('Pain blanc',         75, 'rouge'),
  ('Riz blanc',          72, 'rouge'),
  ('Pomme de terre',     80, 'rouge');
