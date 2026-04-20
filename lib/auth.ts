import { supabase } from './supabase';

export async function signUp(email: string, password: string, prenom: string) {
  const { data, error } = await supabase.auth.signUp({ email, password });
  if (error) throw error;
  if (!data.user) throw new Error('Compte non créé.');

  // La session est disponible immédiatement (confirmation email désactivée).
  // On attend qu'elle soit propagée avant d'insérer le profil.
  const { error: profileError } = await supabase
    .from('profiles')
    .insert({ id: data.user.id, email, prenom });

  if (profileError) throw profileError;

  return data;
}

export async function signIn(email: string, password: string) {
  const { data, error } = await supabase.auth.signInWithPassword({ email, password });
  if (error) throw error;
  return data;
}

export async function signOut() {
  const { error } = await supabase.auth.signOut();
  if (error) throw error;
}

export async function getUser() {
  const { data: { user } } = await supabase.auth.getUser();
  return user;
}

export async function getProfile(userId: string) {
  const { data, error } = await supabase
    .from('profiles')
    .select('prenom, poids_initial_kg, poids_objectif_kg, taille_cm, age, tour_taille_cm, tour_hanches_cm, date_debut_parcours')
    .eq('id', userId)
    .maybeSingle();
  if (error) throw error;
  return data;
}

export async function updateProfile(userId: string, updates: {
  age?: number;
  taille_cm?: number;
  poids_initial_kg?: number;
  poids_objectif_kg?: number;
  tour_taille_cm?: number | null;
  tour_hanches_cm?: number | null;
  date_debut_parcours?: string;
}) {
  const { data: { user } } = await supabase.auth.getUser();
  const existing = await getProfile(userId);
  const { error } = await supabase
    .from('profiles')
    .upsert({
      id: userId,
      email: user?.email ?? '',
      prenom: existing?.prenom ?? '',
      ...updates,
    });
  if (error) throw error;
}

export async function createPhaseProgress(userId: string, entries: Array<{
  phase: 'offensive' | 'destockage' | 'stabilisation';
  date_debut: string;
  date_fin_prevue: string | null;
}>) {
  await supabase.from('phase_progress').delete().eq('user_id', userId);
  const rows = entries.map(e => ({ user_id: userId, ...e }));
  const { error } = await supabase.from('phase_progress').insert(rows);
  if (error) throw error;
}
