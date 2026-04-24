-- ============================================================
-- Migration 002 — Profil santé (femmes 45+)
-- À exécuter dans Supabase > SQL Editor
-- ============================================================

alter table public.profiles
  add column if not exists statut_menopause    text check (statut_menopause in ('menopausee', 'perimenopaused', 'non')),
  add column if not exists date_dernieres_regles date,
  add column if not exists nycturie            boolean,
  add column if not exists manque_sommeil      boolean,
  add column if not exists ths                 text check (ths in ('oui', 'non', 'inconnu'));
