import { supabase } from './supabase';
import { phaseLabelFr, type PhaseName } from './phases';

export interface CurrentPhase {
  phase: PhaseName;
  label: string;
  dateDebut: string;
  dateFinPrevue: string | null;
  daysDone: number;
  daysTotal: number | null;
  progressPercent: number;
  weekNumber: number;
}

export async function getCurrentPhase(userId: string): Promise<CurrentPhase | null> {
  const today = new Date().toISOString().split('T')[0];

  const { data, error } = await supabase
    .from('phase_progress')
    .select('phase, date_debut, date_fin_prevue')
    .eq('user_id', userId)
    .lte('date_debut', today)
    .order('date_debut', { ascending: false })
    .limit(1)
    .maybeSingle();

  if (error) throw error;
  if (!data) return null;

  const phase = data.phase as PhaseName;
  const start = new Date(data.date_debut);
  const now   = new Date(today);
  const daysDone = Math.floor((now.getTime() - start.getTime()) / 86400000);

  let daysTotal: number | null = null;
  let progressPercent = 0;

  if (data.date_fin_prevue) {
    const end = new Date(data.date_fin_prevue);
    daysTotal = Math.floor((end.getTime() - start.getTime()) / 86400000);
    progressPercent = Math.min(100, Math.round((daysDone / daysTotal) * 100));
  }

  return {
    phase,
    label:         phaseLabelFr(phase),
    dateDebut:     data.date_debut,
    dateFinPrevue: data.date_fin_prevue,
    daysDone:      Math.max(0, daysDone),
    daysTotal,
    progressPercent,
    weekNumber:    Math.floor(daysDone / 7) + 1,
  };
}
