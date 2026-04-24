import { supabase } from './supabase';

export type ExamType =
  | 'mammographie'
  | 'frottis'
  | 'densitometrie'
  | 'bilan_sanguin'
  | 'bilan_cardio'
  | 'coloscopie'
  | 'ophtalmologie'
  | 'dermatologue';

export interface PreventiveExam {
  id: string;
  exam_type: ExamType;
  date_dernier: string | null;
  reminder_active: boolean;
}

export interface ExamConfig {
  label: string;
  intervalMonths: number;
  frequency: string;
}

export const EXAM_CONFIG: Record<ExamType, ExamConfig> = {
  mammographie:  { label: 'Mammographie',          intervalMonths: 24,  frequency: 'Tous les 2 ans' },
  frottis:       { label: 'Frottis cervical',       intervalMonths: 36,  frequency: 'Tous les 3 ans' },
  densitometrie: { label: 'Densitométrie osseuse',  intervalMonths: 24,  frequency: 'Tous les 2 ans' },
  bilan_sanguin: { label: 'Bilan sanguin',          intervalMonths: 12,  frequency: 'Chaque année' },
  bilan_cardio:  { label: 'Bilan cardiovasculaire', intervalMonths: 60,  frequency: 'Tous les 5 ans' },
  coloscopie:    { label: 'Coloscopie / test FIT',  intervalMonths: 24,  frequency: 'Tous les 2 ans' },
  ophtalmologie: { label: 'Ophtalmologie',          intervalMonths: 24,  frequency: 'Tous les 2 ans' },
  dermatologue:  { label: 'Dermatologue',           intervalMonths: 24,  frequency: 'Tous les 2 ans' },
};

export const EXAM_ORDER: ExamType[] = [
  'mammographie', 'frottis', 'densitometrie', 'bilan_sanguin',
  'bilan_cardio', 'coloscopie', 'ophtalmologie', 'dermatologue',
];

export type ExamStatus = 'ok' | 'soon' | 'due' | 'unknown';

export function getNextDate(dateDernier: string, intervalMonths: number): Date {
  const d = new Date(dateDernier);
  d.setMonth(d.getMonth() + intervalMonths);
  return d;
}

export function getDaysUntil(date: Date): number {
  const now = new Date();
  now.setHours(0, 0, 0, 0);
  return Math.round((date.getTime() - now.getTime()) / 86_400_000);
}

export function examStatus(exam: PreventiveExam): ExamStatus {
  if (!exam.date_dernier) return 'unknown';
  const next = getNextDate(exam.date_dernier, EXAM_CONFIG[exam.exam_type].intervalMonths);
  const days = getDaysUntil(next);
  if (days < 0)   return 'due';
  if (days <= 60) return 'soon';
  return 'ok';
}

export function formatNextDate(exam: PreventiveExam): string {
  if (!exam.date_dernier) return 'Non renseigné';
  const next = getNextDate(exam.date_dernier, EXAM_CONFIG[exam.exam_type].intervalMonths);
  const days = getDaysUntil(next);
  if (days < 0)   return `En retard · ${Math.abs(days)} j`;
  if (days === 0) return "Aujourd'hui";
  if (days <= 60) return `Dans ${days} jour${days > 1 ? 's' : ''}`;
  return next.toLocaleDateString('fr-FR', { month: 'long', year: 'numeric' });
}

/** Merge fetched exams with the full EXAM_ORDER, filling missing ones with defaults. */
export function mergeWithDefaults(fetched: PreventiveExam[]): PreventiveExam[] {
  const byType = Object.fromEntries(fetched.map(e => [e.exam_type, e]));
  return EXAM_ORDER.map(type => byType[type] ?? {
    id: '',
    exam_type: type,
    date_dernier: null,
    reminder_active: false,
  });
}

export async function getExams(userId: string): Promise<PreventiveExam[]> {
  const { data, error } = await supabase
    .from('preventive_exams')
    .select('id, exam_type, date_dernier, reminder_active')
    .eq('user_id', userId);
  if (error) throw error;
  return mergeWithDefaults((data ?? []) as PreventiveExam[]);
}

export async function upsertExam(
  userId: string,
  examType: ExamType,
  dateDernier: string | null,
  reminderActive: boolean,
): Promise<void> {
  const { error } = await supabase
    .from('preventive_exams')
    .upsert(
      { user_id: userId, exam_type: examType, date_dernier: dateDernier, reminder_active: reminderActive },
      { onConflict: 'user_id,exam_type' },
    );
  if (error) throw error;
}

/** Parse "MM/AAAA" input → "AAAA-MM-01" ISO string, or null on failure. */
export function parseDateInput(input: string): string | null {
  const parts = input.trim().split('/');
  if (parts.length !== 2) return null;
  const month = parseInt(parts[0], 10);
  const year  = parseInt(parts[1], 10);
  if (isNaN(month) || isNaN(year)) return null;
  if (month < 1 || month > 12)     return null;
  if (year < 1900 || year > 2100)  return null;
  return `${year}-${String(month).padStart(2, '0')}-01`;
}

/** Format "AAAA-MM-DD" → "MM/AAAA" for display in input. */
export function formatDateInput(iso: string | null): string {
  if (!iso) return '';
  const [year, month] = iso.split('-');
  return `${month}/${year}`;
}
