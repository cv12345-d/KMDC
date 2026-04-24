import { supabase } from './supabase';
import { todayISO } from './journal';

export interface MeasurementEntry {
  id: string;
  date_mesure: string;
  tour_taille_cm:  number | null;
  tour_hanches_cm: number | null;
  tour_bras_cm:    number | null;
  tour_cuisse_cm:  number | null;
}

export interface MeasurementDraft {
  tour_taille_cm:  string;
  tour_hanches_cm: string;
  tour_bras_cm:    string;
  tour_cuisse_cm:  string;
}

export const EMPTY_MEASURE_DRAFT: MeasurementDraft = {
  tour_taille_cm:  '',
  tour_hanches_cm: '',
  tour_bras_cm:    '',
  tour_cuisse_cm:  '',
};

const COLS = 'id, date_mesure, tour_taille_cm, tour_hanches_cm, tour_bras_cm, tour_cuisse_cm';

export async function getTodayMeasurement(userId: string): Promise<MeasurementEntry | null> {
  const { data, error } = await supabase
    .from('body_measurements')
    .select(COLS)
    .eq('user_id', userId)
    .eq('date_mesure', todayISO())
    .maybeSingle();
  if (error) throw error;
  return data;
}

export async function getLast6Measurements(userId: string): Promise<MeasurementEntry[]> {
  const { data, error } = await supabase
    .from('body_measurements')
    .select(COLS)
    .eq('user_id', userId)
    .order('date_mesure', { ascending: false })
    .limit(6);
  if (error) throw error;
  return data ?? [];
}

export async function getMeasurementsInRange(userId: string, from: string, to: string): Promise<MeasurementEntry[]> {
  const { data, error } = await supabase
    .from('body_measurements')
    .select(COLS)
    .eq('user_id', userId)
    .gte('date_mesure', from)
    .lte('date_mesure', to)
    .order('date_mesure', { ascending: true });
  if (error) throw error;
  return data ?? [];
}

export async function upsertMeasurement(userId: string, draft: MeasurementDraft): Promise<void> {
  const parse = (v: string) => { const n = parseFloat(v.replace(',', '.')); return isNaN(n) ? null : n; };
  const { error } = await supabase
    .from('body_measurements')
    .upsert({
      user_id:         userId,
      date_mesure:     todayISO(),
      tour_taille_cm:  parse(draft.tour_taille_cm),
      tour_hanches_cm: parse(draft.tour_hanches_cm),
      tour_bras_cm:    parse(draft.tour_bras_cm),
      tour_cuisse_cm:  parse(draft.tour_cuisse_cm),
    }, { onConflict: 'user_id,date_mesure' });
  if (error) throw error;
}
