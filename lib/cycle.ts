import { supabase } from './supabase';

export type CyclePhase = 'regles' | 'folliculaire' | 'ovulation' | 'luteale';

export interface PhaseInfo {
  phase: CyclePhase;
  label: string;
  day: number;         // jour du cycle (1-28)
  daysLeft: number;    // jours restants dans cette phase
  nextLabel: string;
}

export interface CycleEntry {
  date_jour: string;
  type: 'debut_regles' | 'fin_regles' | 'spotting';
}

const CYCLE_LENGTH = 28;

// Retourne le jour du cycle (1-based) pour une date donnée
export function getCycleDay(lastReglesISO: string, forDate = new Date()): number {
  const last = new Date(lastReglesISO);
  last.setHours(0, 0, 0, 0);
  const target = new Date(forDate);
  target.setHours(0, 0, 0, 0);
  const diff = Math.floor((target.getTime() - last.getTime()) / (1000 * 60 * 60 * 24));
  return ((diff % CYCLE_LENGTH) + CYCLE_LENGTH) % CYCLE_LENGTH + 1;
}

export function getPhaseForDay(day: number): CyclePhase {
  if (day <= 5)  return 'regles';
  if (day <= 13) return 'folliculaire';
  if (day <= 16) return 'ovulation';
  return 'luteale';
}

export function getPhaseInfo(lastReglesISO: string, forDate = new Date()): PhaseInfo {
  const day = getCycleDay(lastReglesISO, forDate);
  const phase = getPhaseForDay(day);

  const phaseEnd: Record<CyclePhase, number> = {
    regles:       5,
    folliculaire: 13,
    ovulation:    16,
    luteale:      28,
  };
  const nextPhase: Record<CyclePhase, CyclePhase> = {
    regles:       'folliculaire',
    folliculaire: 'ovulation',
    ovulation:    'luteale',
    luteale:      'regles',
  };
  const labels: Record<CyclePhase, string> = {
    regles:       'Règles',
    folliculaire: 'Phase folliculaire',
    ovulation:    'Ovulation',
    luteale:      'Phase lutéale',
  };

  return {
    phase,
    label:     labels[phase],
    day,
    daysLeft:  phaseEnd[phase] - day + 1,
    nextLabel: labels[nextPhase[phase]],
  };
}

// Pour chaque jour d'un mois, retourne la phase
export function getMonthPhases(
  year: number, month: number, lastReglesISO: string
): Record<number, CyclePhase> {
  const days = new Date(year, month + 1, 0).getDate();
  const result: Record<number, CyclePhase> = {};
  for (let d = 1; d <= days; d++) {
    const date = new Date(year, month, d);
    result[d] = getPhaseForDay(getCycleDay(lastReglesISO, date));
  }
  return result;
}

export const PHASE_TIPS: Record<CyclePhase, { foods: string[]; avoid: string[]; tip: string }> = {
  regles: {
    foods: ['Lentilles', 'Épinards', 'Chocolat >70%', 'Gingembre'],
    avoid: ['Sel en excès', 'Alcool', 'Café'],
    tip: 'Privilégiez le fer et le magnésium pour compenser les pertes.',
  },
  folliculaire: {
    foods: ['Avoine', 'Légumineuses', 'Légumes verts', 'Graines de lin'],
    avoid: ['Sucres rapides', 'Aliments transformés'],
    tip: 'Énergie en hausse — bon moment pour reprendre l\'activité physique.',
  },
  ovulation: {
    foods: ['Fruits rouges', 'Brocoli', 'Noix', 'Saumon'],
    avoid: ['Graisses saturées', 'Sucre'],
    tip: 'Pic d\'énergie et de clarté mentale. Profitez-en.',
  },
  luteale: {
    foods: ['Magnésium (amandes)', 'Oméga-3 (sardines)', 'Patate douce', 'Camomille'],
    avoid: ['Sucres rapides', 'Caféine en soirée', 'Sel'],
    tip: 'Les fringales sont hormonales — misez sur les aliments rassasiants à IG bas.',
  },
};

// ── Supabase CRUD ────────────────────────────────────────────

export async function getCycleEntries(
  userId: string, year: number, month: number
): Promise<CycleEntry[]> {
  const from = `${year}-${String(month + 1).padStart(2, '0')}-01`;
  const to   = `${year}-${String(month + 1).padStart(2, '0')}-${new Date(year, month + 1, 0).getDate()}`;
  const { data, error } = await supabase
    .from('cycle_entries')
    .select('date_jour, type')
    .eq('user_id', userId)
    .gte('date_jour', from)
    .lte('date_jour', to);
  if (error) throw error;
  return data ?? [];
}

export async function toggleCycleEntry(
  userId: string, dateISO: string, type: CycleEntry['type']
): Promise<void> {
  const { data } = await supabase
    .from('cycle_entries')
    .select('id')
    .eq('user_id', userId)
    .eq('date_jour', dateISO)
    .eq('type', type)
    .maybeSingle();

  if (data) {
    await supabase.from('cycle_entries').delete().eq('id', data.id);
  } else {
    await supabase.from('cycle_entries').insert({ user_id: userId, date_jour: dateISO, type });
  }
}
