# CLAUDE.md — Méthode KMDC

Application mobile React Native (Expo) pour accompagner les utilisatrices de la méthode KMDC (perte de poids progressive).

## Stack technique

- **Framework** : Expo SDK 52, React Native, TypeScript
- **Navigation** : Expo Router (file-based)
- **Backend** : Supabase (PostgreSQL + Auth + RLS)
- **Build** : EAS Build (profil `preview` pour Android interne)
- **Repo GitHub** : `https://github.com/cv12345-d/KMDC` (branche `develop`)

## Structure du projet

```
app/
  (auth)/         login.tsx, signup.tsx
  (onboarding)/   step1.tsx, step2.tsx, step3.tsx
  (tabs)/         home.tsx, journal.tsx, aliments.tsx, suivi.tsx, settings.tsx
lib/
  auth.ts         signUp, signIn, signOut, getUser, getProfile, updateProfile, createPhaseProgress
  supabase.ts     client Supabase
  weight.ts       getLast30Entries, getTodayEntry, upsertWeight, getStreak
  journal.ts      getTodayEntry, saveJournalEntry
  foods.ts        getFoods, FoodList type ('verte'|'jaune'|'orange'|'rouge')
  notifications.ts scheduleWeightReminder, scheduleJournalReminder, cancel*
  phases.ts       calculatePhases, getCurrentPhase
  parcours.ts     getCurrentPhase, type CurrentPhase
  strings.ts      toutes les chaînes FR de l'app
  theme.ts        couleurs, spacing, typography
supabase/
  migrations/     001_initial_schema.sql
  seed_foods.sql  ~250 aliments sur 4 listes
```

## Variables d'environnement

Dans `.env.local` (non commité) et dans `eas.json` profil `preview` :
```
EXPO_PUBLIC_SUPABASE_URL=https://eejejvejpddayiczhsrm.supabase.co
EXPO_PUBLIC_SUPABASE_ANON_KEY=eyJhbGci...
```

## Base de données Supabase — état actuel

### Corrections appliquées manuellement (SQL Editor)

1. **FK weight_entries** — `user_id` référence `auth.users(id)` (pas `profiles(id)`)
2. **FK phase_progress** — `user_id` référence `auth.users(id)` (pas `profiles(id)`)
3. **foods** — colonne `ig` nullable (les protéines/graisses n'ont pas d'IG), contrainte liste inclut `'jaune'`
4. **profiles** — `email` et `prenom` ont un DEFAULT `''` (pour permettre upsert depuis onboarding)

### Tables principales

| Table | Description |
|-------|-------------|
| `profiles` | Profil utilisatrice (poids, taille, âge, objectifs) |
| `weight_entries` | Pesées quotidiennes |
| `journal_entries` | Journal quotidien (humeur, réussites, énergie, intention) |
| `phase_progress` | Phases du parcours (offensive / déstockage / stabilisation) |
| `foods` | Base alimentaire commune (~250 aliments, 4 listes) |

## Fonctionnement de l'onboarding

1. **step1** : âge + poids actuel + objectif
2. **step2** : taille + mensurations (optionnel)
3. **step3** : calcul automatique des phases → `updateProfile` (upsert) + `createPhaseProgress` (delete puis insert)

`createPhaseProgress` supprime les anciennes lignes avant d'insérer pour éviter les doublons.

## Build Android (EAS)

```bash
eas build --profile preview --platform android
```
- Tier gratuit : file d'attente de 15-45 min
- Le lien APK est disponible sur expo.dev après le build

## État d'avancement

### Jalon 1 — Auth + onboarding ✅
- Inscription / connexion
- Onboarding 3 étapes avec calcul de phases

### Jalon 2 ✅
- Base alimentaire (4 listes : verte, jaune, orange, rouge)
- Suivi poids (graphique 30 jours)
- Journal quotidien (humeur + 4 questions)
- Notifications push (rappel pesée 7h30, journal 20h)
- Onglet Paramètres
- EAS Build configuré

### Jalon 3 ✅
- Écran d'accueil enrichi : carte progression poids (départ/actuel/objectif + barre %) + streak 🔥

### À faire
- **Paywall RevenueCat** — bloqué par un problème de création de compte RevenueCat
- **Tests iOS** — nécessite Apple Developer Program ($99/an)
- **Jalon 4** — à définir (mesures corporelles, historique journal, partage ?)

## Commandes utiles

```bash
npx expo start --clear          # dev local
eas build --profile preview --platform android   # build Android
git push origin develop         # push GitHub
```
