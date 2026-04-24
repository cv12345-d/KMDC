-- ============================================================
-- Migration 003 — Suivi du cycle hormonal
-- À exécuter dans Supabase > SQL Editor
-- ============================================================

create table public.cycle_entries (
  id         uuid primary key default gen_random_uuid(),
  user_id    uuid not null references public.profiles(id) on delete cascade,
  date_jour  date not null,
  type       text not null check (type in ('debut_regles', 'fin_regles', 'spotting')),
  notes      text,
  created_at timestamptz not null default now(),
  unique(user_id, date_jour, type)
);

alter table public.cycle_entries enable row level security;

create policy "own_cycle_select" on public.cycle_entries for select using (user_id = auth.uid());
create policy "own_cycle_insert" on public.cycle_entries for insert with check (user_id = auth.uid());
create policy "own_cycle_update" on public.cycle_entries for update using (user_id = auth.uid());
create policy "own_cycle_delete" on public.cycle_entries for delete using (user_id = auth.uid());
