import { supabase } from './supabase';

export interface WeightEntry {
  id: string;
  poids_kg: number;
  date_mesure: string;
}

export async function getLast30Entries(userId: string): Promise<WeightEntry[]> {
  const from = new Date();
  from.setDate(from.getDate() - 30);
  const fromISO = from.toISOString().split('T')[0];

  const { data, error } = await supabase
    .from('weight_entries')
    .select('id, poids_kg, date_mesure')
    .eq('user_id', userId)
    .gte('date_mesure', fromISO)
    .order('date_mesure', { ascending: true });
  if (error) throw error;
  return data as WeightEntry[];
}

export async function getTodayEntry(userId: string): Promise<WeightEntry | null> {
  const today = new Date().toISOString().split('T')[0];
  const { data, error } = await supabase
    .from('weight_entries')
    .select('id, poids_kg, date_mesure')
    .eq('user_id', userId)
    .eq('date_mesure', today)
    .maybeSingle();
  if (error) throw error;
  return data;
}

export async function upsertWeight(userId: string, poids_kg: number): Promise<void> {
  const today = new Date().toISOString().split('T')[0];
  const { error } = await supabase
    .from('weight_entries')
    .upsert(
      { user_id: userId, poids_kg, date_mesure: today },
      { onConflict: 'user_id,date_mesure' },
    );
  if (error) throw error;
}
