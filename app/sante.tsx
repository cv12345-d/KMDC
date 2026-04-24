import { useState, useEffect } from 'react';
import {
  View, Text, TouchableOpacity, StyleSheet, ScrollView,
  TextInput, ActivityIndicator,
} from 'react-native';
import * as Notifications from 'expo-notifications';
import { router } from 'expo-router';
import { theme } from '../lib/theme';
import { getUser } from '../lib/auth';
import {
  type ExamType, type PreventiveExam, type ExamStatus,
  EXAM_ORDER, EXAM_CONFIG,
  getExams, upsertExam,
  examStatus, formatNextDate, getNextDate,
  parseDateInput, formatDateInput,
} from '../lib/preventive';
import { requestNotificationPermissions, scheduleExamReminder, cancelExamReminder } from '../lib/notifications';

const STATUS_COLOR: Record<ExamStatus, string> = {
  ok:      theme.colors.inkMuted,
  soon:    '#C07A2A',
  due:     '#B03030',
  unknown: theme.colors.inkMuted,
};

export default function SanteScreen() {
  const [exams,    setExams]    = useState<PreventiveExam[]>([]);
  const [loading,  setLoading]  = useState(true);
  const [userId,   setUserId]   = useState<string | null>(null);
  const [expanded, setExpanded] = useState<ExamType | null>(null);

  useEffect(() => {
    (async () => {
      const user = await getUser();
      if (!user) return;
      setUserId(user.id);
      const data = await getExams(user.id);
      setExams(data);
      setLoading(false);
    })();
  }, []);

  async function handleSave(
    examType: ExamType,
    dateInput: string,
    reminderOn: boolean,
  ) {
    if (!userId) return;
    const iso = parseDateInput(dateInput);
    if (dateInput.trim() !== '' && iso === null) return; // invalid format

    const finalDate = dateInput.trim() === '' ? null : iso;

    if (reminderOn && finalDate) {
      const { status } = await Notifications.getPermissionsAsync();
      if (status !== 'granted') {
        const granted = await requestNotificationPermissions();
        if (!granted) return;
      }
      const next = getNextDate(finalDate, EXAM_CONFIG[examType].intervalMonths);
      await scheduleExamReminder(examType, EXAM_CONFIG[examType].label, next);
    } else {
      await cancelExamReminder(examType);
    }

    await upsertExam(userId, examType, finalDate, reminderOn && !!finalDate);
    const updated = await getExams(userId);
    setExams(updated);
    setExpanded(null);
  }

  if (loading) {
    return <View style={s.centered}><ActivityIndicator color={theme.colors.inkSoft} /></View>;
  }

  return (
    <ScrollView style={s.root} contentContainerStyle={s.scroll}>

      {/* ── HEADER ── */}
      <TouchableOpacity style={s.backRow} onPress={() => router.canGoBack() ? router.back() : router.replace('/(tabs)/settings')}>
        <Text style={s.backText}>← RETOUR</Text>
      </TouchableOpacity>
      <View style={s.header}>
        <Text style={s.eyebrow}>SANTÉ PRÉVENTIVE</Text>
        <Text style={s.title}>Mes examens.</Text>
        <Text style={s.subtitle}>
          Renseignez la date de votre dernier examen. L'app calcule la prochaine échéance et peut vous rappeler de prendre rendez-vous.
        </Text>
      </View>

      <View style={s.divider} />

      <View style={s.body}>
        <View style={s.inkDivider} />
        {EXAM_ORDER.map((type, i) => {
          const exam = exams.find(e => e.exam_type === type) ?? {
            id: '', exam_type: type, date_dernier: null, reminder_active: false,
          };
          const isLast = i === EXAM_ORDER.length - 1;
          const isOpen = expanded === type;
          return (
            <ExamRow
              key={type}
              exam={exam}
              index={i + 1}
              isOpen={isOpen}
              isLast={isLast && !isOpen}
              onToggle={() => setExpanded(isOpen ? null : type)}
              onSave={handleSave}
            />
          );
        })}
      </View>

    </ScrollView>
  );
}

function ExamRow({
  exam, index, isOpen, isLast, onToggle, onSave,
}: {
  exam: PreventiveExam;
  index: number;
  isOpen: boolean;
  isLast: boolean;
  onToggle: () => void;
  onSave: (type: ExamType, date: string, reminder: boolean) => Promise<void>;
}) {
  const cfg    = EXAM_CONFIG[exam.exam_type];
  const status = examStatus(exam);
  const color  = STATUS_COLOR[status];
  const nextLabel = formatNextDate(exam);

  const [dateInput,  setDateInput]  = useState(formatDateInput(exam.date_dernier));
  const [reminderOn, setReminderOn] = useState(exam.reminder_active);
  const [saving,     setSaving]     = useState(false);
  const [error,      setError]      = useState('');

  // Sync when exam prop updates (after save)
  useEffect(() => {
    setDateInput(formatDateInput(exam.date_dernier));
    setReminderOn(exam.reminder_active);
  }, [exam.date_dernier, exam.reminder_active]);

  async function save() {
    if (dateInput.trim() !== '' && parseDateInput(dateInput) === null) {
      setError('Format invalide — ex. 03/2024');
      return;
    }
    setError('');
    setSaving(true);
    await onSave(exam.exam_type, dateInput, reminderOn);
    setSaving(false);
  }

  return (
    <View style={[s.examBlock, isLast && s.examBlockLast]}>
      <TouchableOpacity style={s.examRow} onPress={onToggle} activeOpacity={0.7}>
        <Text style={s.examNum}>{String(index).padStart(2, '0')}</Text>
        <View style={s.examMid}>
          <Text style={s.examLabel}>{cfg.label}</Text>
          <Text style={[s.examNext, { color }]}>
            {status === 'unknown' ? cfg.frequency : nextLabel}
          </Text>
        </View>
        <View style={[s.statusDot, { backgroundColor: color }]} />
      </TouchableOpacity>

      {isOpen && (
        <View style={s.expandBox}>
          <Text style={s.expandHint}>DERNIER EXAMEN — MM/AAAA</Text>
          <TextInput
            style={[s.dateInput, error ? s.dateInputError : null]}
            value={dateInput}
            onChangeText={v => { setDateInput(v); setError(''); }}
            placeholder="ex. 03/2023"
            placeholderTextColor={theme.colors.inkMuted}
            keyboardType="numbers-and-punctuation"
            maxLength={7}
          />
          {!!error && <Text style={s.errorText}>{error}</Text>}

          <TouchableOpacity style={s.reminderRow} onPress={() => setReminderOn(v => !v)}>
            <Text style={s.reminderLabel}>Rappel 30 jours avant</Text>
            <View style={[s.toggle, reminderOn && s.toggleOn]}>
              <View style={[s.toggleThumb, reminderOn && s.toggleThumbOn]} />
            </View>
          </TouchableOpacity>

          <View style={s.expandBtns}>
            <TouchableOpacity style={s.btnSave} onPress={save} disabled={saving}>
              {saving
                ? <ActivityIndicator color={theme.colors.invertInk} />
                : <Text style={s.btnSaveText}>ENREGISTRER</Text>
              }
            </TouchableOpacity>
            <TouchableOpacity style={s.btnCancel} onPress={onToggle}>
              <Text style={s.btnCancelText}>ANNULER</Text>
            </TouchableOpacity>
          </View>
        </View>
      )}
    </View>
  );
}

const s = StyleSheet.create({
  root:    { flex: 1, backgroundColor: theme.colors.app },
  scroll:  { flexGrow: 1 },
  centered:{ flex: 1, alignItems: 'center', justifyContent: 'center' },

  backRow: { paddingTop: theme.spacing.xxl, paddingHorizontal: theme.spacing.lg, paddingBottom: theme.spacing.sm },
  backText:{ fontFamily: theme.fontFamily.mono, fontSize: theme.fontSize.xs, color: theme.colors.inkSoft, letterSpacing: 1.5 },

  header:   { paddingHorizontal: theme.spacing.lg, paddingBottom: theme.spacing.lg },
  eyebrow:  { fontFamily: theme.fontFamily.mono, fontSize: theme.fontSize.xs, color: theme.colors.inkMuted, letterSpacing: 2, marginBottom: 14 },
  title:    { fontFamily: theme.fontFamily.display, fontSize: theme.fontSize.display, lineHeight: theme.fontSize.display * 0.9, color: theme.colors.ink, letterSpacing: -2, marginBottom: 16 },
  subtitle: { fontFamily: theme.fontFamily.display, fontSize: theme.fontSize.sm, color: theme.colors.inkMid, lineHeight: theme.fontSize.sm * 1.5 },

  divider:    { height: 1, backgroundColor: theme.colors.ink, marginHorizontal: theme.spacing.lg },
  body:       { paddingHorizontal: theme.spacing.lg, paddingBottom: theme.spacing.xxl, paddingTop: theme.spacing.xl },
  inkDivider: { height: 1, backgroundColor: theme.colors.ink },

  examBlock:     { borderBottomWidth: 1, borderBottomColor: theme.colors.line },
  examBlockLast: { borderBottomWidth: 0 },

  examRow: {
    flexDirection: 'row', alignItems: 'center', gap: 14,
    paddingVertical: 16, minHeight: theme.touchTarget,
  },
  examNum:   { fontFamily: theme.fontFamily.mono, fontSize: 10, color: theme.colors.inkMuted, width: 24, letterSpacing: 1 },
  examMid:   { flex: 1 },
  examLabel: { fontFamily: theme.fontFamily.display, fontSize: theme.fontSize.md, color: theme.colors.ink, marginBottom: 3 },
  examNext:  { fontFamily: theme.fontFamily.mono, fontSize: 9, letterSpacing: 1.5 },
  statusDot: { width: 8, height: 8, flexShrink: 0 },

  expandBox: { paddingBottom: 20, paddingLeft: 38 },
  expandHint:{ fontFamily: theme.fontFamily.mono, fontSize: 9, color: theme.colors.inkMuted, letterSpacing: 2, marginBottom: 8 },

  dateInput: {
    fontFamily: theme.fontFamily.mono, fontSize: theme.fontSize.sm,
    color: theme.colors.ink,
    borderBottomWidth: 1, borderBottomColor: theme.colors.ink,
    paddingVertical: 8, letterSpacing: 0.5,
    marginBottom: 4,
  },
  dateInputError: { borderBottomColor: '#B03030' },
  errorText: { fontFamily: theme.fontFamily.mono, fontSize: 9, color: '#B03030', letterSpacing: 1, marginBottom: 8 },

  reminderRow: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    paddingVertical: 14, borderBottomWidth: 1, borderBottomColor: theme.colors.line,
    marginBottom: 14,
  },
  reminderLabel: { fontFamily: theme.fontFamily.mono, fontSize: 10, color: theme.colors.ink, letterSpacing: 1, flex: 1 },

  toggle: {
    width: 40, height: 22, borderWidth: 1, borderColor: theme.colors.line,
    justifyContent: 'center', paddingHorizontal: 3,
  },
  toggleOn:        { borderColor: theme.colors.ink, backgroundColor: theme.colors.ink },
  toggleThumb:     { width: 14, height: 14, backgroundColor: theme.colors.line },
  toggleThumbOn:   { backgroundColor: theme.colors.invertInk, alignSelf: 'flex-end' },

  expandBtns: { flexDirection: 'row', gap: 10 },
  btnSave:    { flex: 1, backgroundColor: theme.colors.ink, paddingVertical: 12, alignItems: 'center', minHeight: theme.touchTarget },
  btnSaveText:{ fontFamily: theme.fontFamily.mono, fontSize: theme.fontSize.xs, color: theme.colors.invertInk, letterSpacing: 2 },
  btnCancel:  { borderWidth: 1, borderColor: theme.colors.line, paddingVertical: 12, paddingHorizontal: 16, alignItems: 'center', minHeight: theme.touchTarget },
  btnCancelText:{ fontFamily: theme.fontFamily.mono, fontSize: theme.fontSize.xs, color: theme.colors.inkMuted, letterSpacing: 2 },
});
