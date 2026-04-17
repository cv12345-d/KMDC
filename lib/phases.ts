// Phase duration rules — to be validated by a nutritionist
// Based on 0.5 kg/week loss rate for women 45+

export type PhaseName = 'offensive' | 'destockage' | 'stabilisation';

export interface PhaseCalculation {
  offensiveWeeks: number;
  destockageWeeks: number;
}

/** Returns offensive phase duration in weeks based on kg to lose. */
export function getOffensiveWeeks(kgToLose: number): number {
  if (kgToLose <= 4)  return 6;
  if (kgToLose <= 8)  return 10;
  if (kgToLose <= 12) return 14;
  if (kgToLose <= 16) return 18;
  return 22;
}

/** Returns déstockage phase duration in weeks (offensive ÷ 2, rounded up to full months). */
export function getDestockageWeeks(offensiveWeeks: number): number {
  const raw = offensiveWeeks / 2;
  const months = Math.ceil(raw / 4);
  return months * 4;
}

export function calculatePhases(poids_initial: number, poids_objectif: number): PhaseCalculation {
  const kgToLose = Math.max(0, poids_initial - poids_objectif);
  const offensiveWeeks = getOffensiveWeeks(kgToLose);
  const destockageWeeks = getDestockageWeeks(offensiveWeeks);
  return { offensiveWeeks, destockageWeeks };
}

export function addWeeks(date: Date, weeks: number): Date {
  const result = new Date(date);
  result.setDate(result.getDate() + weeks * 7);
  return result;
}

export function formatDateISO(date: Date): string {
  return date.toISOString().split('T')[0];
}

export function phaseLabelFr(phase: PhaseName): string {
  switch (phase) {
    case 'offensive':     return 'Phase offensive';
    case 'destockage':    return 'Phase de déstockage';
    case 'stabilisation': return 'Stabilisation';
  }
}
