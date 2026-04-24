-- Statut premium de l'utilisatrice (géré manuellement en beta, RevenueCat ensuite)
alter table public.profiles
  add column if not exists is_premium boolean not null default false;
