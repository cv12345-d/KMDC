import { supabase } from './supabase';

export interface JournalEntry {
  id: string;
  date_jour: string;
  humeur: string | null;
  reussite: string | null;
  energie_gain: string | null;
  energie_perte: string | null;
  intention_demain: string | null;
}

export interface JournalDraft {
  humeur: string | null;
  reussite: string;
  energie_gain: string;
  energie_perte: string;
  intention_demain: string;
}

export function todayISO(): string {
  return new Date().toISOString().split('T')[0];
}

export function formatDateFr(isoDate: string): string {
  const [year, month, day] = isoDate.split('-').map(Number);
  const date = new Date(year, month - 1, day);
  return date.toLocaleDateString('fr-FR', { weekday: 'long', day: 'numeric', month: 'long' });
}

export async function getTodayEntry(userId: string): Promise<JournalEntry | null> {
  const { data, error } = await supabase
    .from('journal_entries')
    .select('id, date_jour, humeur, reussite, energie_gain, energie_perte, intention_demain')
    .eq('user_id', userId)
    .eq('date_jour', todayISO())
    .maybeSingle();
  if (error) throw error;
  return data;
}

export async function getRecentEntries(userId: string, limit = 7): Promise<JournalEntry[]> {
  const { data, error } = await supabase
    .from('journal_entries')
    .select('id, date_jour, humeur, reussite, energie_gain, energie_perte, intention_demain')
    .eq('user_id', userId)
    .lt('date_jour', todayISO())
    .order('date_jour', { ascending: false })
    .limit(limit);
  if (error) throw error;
  return data ?? [];
}

export async function getEntriesInRange(userId: string, from: string, to: string): Promise<JournalEntry[]> {
  const { data, error } = await supabase
    .from('journal_entries')
    .select('id, date_jour, humeur, reussite, energie_gain, energie_perte, intention_demain')
    .eq('user_id', userId)
    .gte('date_jour', from)
    .lte('date_jour', to)
    .order('date_jour', { ascending: true });
  if (error) throw error;
  return data ?? [];
}

export async function saveJournalEntry(userId: string, draft: JournalDraft): Promise<void> {
  const row = {
    user_id:          userId,
    date_jour:        todayISO(),
    humeur:           draft.humeur,
    reussite:         draft.reussite || null,
    energie_gain:     draft.energie_gain || null,
    energie_perte:    draft.energie_perte || null,
    intention_demain: draft.intention_demain || null,
  };

  const { error } = await supabase
    .from('journal_entries')
    .upsert(row, { onConflict: 'user_id,date_jour' });
  if (error) throw error;
}
