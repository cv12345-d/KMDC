export type PhaseName = 'preparation' | 'reset' | 'destockage' | 'reinsertion' | 'equilibre';

export const PREPARATION_DAYS       = 7;
export const RESET_DAYS             = 5;
export const DESTOCKAGE_TRIGGER_PCT = 70;
export const REINSERTION_DAYS_MIN   = 28; // 4 semaines minimum

export function addDays(date: Date, days: number): Date {
  const result = new Date(date);
  result.setDate(result.getDate() + days);
  return result;
}

export function addWeeks(date: Date, weeks: number): Date {
  return addDays(date, weeks * 7);
}

export function formatDateISO(date: Date): string {
  return date.toISOString().split('T')[0];
}

export function phaseLabelFr(phase: PhaseName): string {
  switch (phase) {
    case 'preparation': return 'Préparation';
    case 'reset':       return 'Reset';
    case 'destockage':  return 'Déstockage actif';
    case 'reinsertion': return 'Réintroduction';
    case 'equilibre':   return 'Équilibre de vie';
  }
}

export function phaseNumberFr(phase: PhaseName): string {
  switch (phase) {
    case 'preparation': return 'PHASE 1';
    case 'reset':       return 'PHASE 2';
    case 'destockage':  return 'PHASE 3';
    case 'reinsertion': return 'PHASE 4';
    case 'equilibre':   return 'PHASE 5';
  }
}

export function phaseListsFr(phase: PhaseName): string {
  switch (phase) {
    case 'preparation': return 'Toutes les listes';
    case 'reset':       return 'Liste verte uniquement';
    case 'destockage':  return 'Listes verte + jaune';
    case 'reinsertion': return 'Verte + jaune + orange progressif';
    case 'equilibre':   return 'Toutes les listes, avec discernement';
  }
}

export function nextPhase(phase: PhaseName): PhaseName | null {
  switch (phase) {
    case 'preparation': return 'reset';
    case 'reset':       return 'destockage';
    case 'destockage':  return 'reinsertion';
    case 'reinsertion': return 'equilibre';
    case 'equilibre':   return null;
  }
}

export function isTransitionReady(
  phase: PhaseName,
  daysDone: number,
  weightPct = 0,
): boolean {
  switch (phase) {
    case 'preparation': return daysDone >= PREPARATION_DAYS;
    case 'reset':       return daysDone >= RESET_DAYS;
    case 'destockage':  return weightPct >= DESTOCKAGE_TRIGGER_PCT;
    case 'reinsertion': return daysDone >= REINSERTION_DAYS_MIN;
    case 'equilibre':   return false;
  }
}

export function orangeRhythmFr(daysDone: number): string {
  if (daysDone < 14) return 'Orange 1 jour sur 3';
  if (daysDone < 28) return 'Orange 1 jour sur 2';
  return 'Selon votre équilibre';
}
