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
    .select('prenom')
    .eq('id', userId)
    .single();
  if (error) throw error;
  return data;
}
