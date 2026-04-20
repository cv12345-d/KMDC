import { useEffect, useState, useCallback } from 'react';
import {
  View, Text, TextInput, TouchableOpacity, StyleSheet,
  ScrollView, KeyboardAvoidingView, Platform, ActivityIndicator,
} from 'react-native';
import { useFocusEffect } from 'expo-router';
import { theme } from '../../lib/theme';
import { strings } from '../../lib/strings';
import { getUser } from '../../lib/auth';
import {
  getTodayEntry, saveJournalEntry, formatDateFr, todayISO,
  type JournalEntry, type JournalDraft,
} from '../../lib/journal';

type MoodKey = 'difficile' | 'neutre' | 'bien' | 'legere';

const EMPTY_DRAFT: JournalDraft = {
  humeur: null, reussite: '', energie_gain: '', energie_perte: '', intention_demain: '',
};

export default function JournalScreen() {
  const [userId,   setUserId]   = useState<string | null>(null);
  const [entry,    setEntry]    = useState<JournalEntry | null>(null);
  const [draft,    setDraft]    = useState<JournalDraft>(EMPTY_DRAFT);
  const [editMode, setEditMode] = useState(false);
  const [loading,  setLoading]  = useState(true);
  const [saving,   setSaving]   = useState(false);
  const [saved,    setSaved]    = useState(false);
  const [error,    setError]    = useState('');

  useFocusEffect(useCallback(() => {
    loadEntry();
  }, []));

  async function loadEntry() {
    setLoading(true);
    try {
      const user = await getUser();
      if (!user) return;
      setUserId(user.id);
      const existing = await getTodayEntry(user.id);
      if (existing) {
        setEntry(existing);
        setDraft({
          humeur:           existing.humeur,
          reussite:         existing.reussite         ?? '',
          energie_gain:     existing.energie_gain     ?? '',
          energie_perte:    existing.energie_perte    ?? '',
          intention_demain: existing.intention_demain ?? '',
        });
        setEditMode(false);
      } else {
        setEntry(null);
        setDraft(EMPTY_DRAFT);
        setEditMode(true);
      }
    } finally {
      setLoading(false);
    }
  }

  async function handleSave() {
    if (!userId) return;
    setSaving(true);
    setError('');
    try {
      await saveJournalEntry(userId, draft);
      setSaved(true);
      setEditMode(false);
      const updated = await getTodayEntry(userId);
      setEntry(updated);
      setTimeout(() => setSaved(false), 3000);
    } catch (e: unknown) {
      const msg = e instanceof Error ? e.message : JSON.stringify(e);
      setError(msg || strings.errors.networkError);
    } finally {
      setSaving(false);
    }
  }

  const dateLabel = formatDateFr(todayISO());

  if (loading) {
    return (
      <View style={styles.centered}>
        <ActivityIndicator color={theme.colors.primary} />
      </View>
    );
  }

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
    >
      <ScrollView contentContainerStyle={styles.scroll} keyboardShouldPersistTaps="handled">

        {/* Header */}
        <View style={styles.header}>
          <Text style={styles.headerLabel}>{strings.journal.headerLabel(dateLabel)}</Text>
          <Text style={styles.headerTitle}>{strings.journal.headerTitle}</Text>

          {/* Mood selector */}
          <View style={styles.moodRow}>
            {strings.journal.moods.map(m => {
              const active = draft.humeur === m.key;
              return (
                <TouchableOpacity
                  key={m.key}
                  style={[styles.moodItem, active && styles.moodItemActive]}
                  onPress={() => editMode && setDraft(d => ({ ...d, humeur: m.key as MoodKey }))}
                  accessibilityLabel={m.label}
                >
                  <Text style={styles.moodEmoji}>{m.emoji}</Text>
                  <Text style={[styles.moodLabel, active && styles.moodLabelActive]}>{m.label}</Text>
                </TouchableOpacity>
              );
            })}
          </View>
        </View>

        {/* Questions */}
        <View style={styles.body}>
          <Question
            label={strings.journal.q1Label}
            placeholder={strings.journal.q1Placeholder}
            value={draft.reussite}
            onChange={v => setDraft(d => ({ ...d, reussite: v }))}
            editable={editMode}
          />
          <Question
            label={strings.journal.q2Label}
            placeholder={strings.journal.q2Placeholder}
            value={draft.energie_gain}
            onChange={v => setDraft(d => ({ ...d, energie_gain: v }))}
            editable={editMode}
          />
          <Question
            label={strings.journal.q3Label}
            placeholder={strings.journal.q3Placeholder}
            value={draft.energie_perte}
            onChange={v => setDraft(d => ({ ...d, energie_perte: v }))}
            editable={editMode}
          />
          <Question
            label={strings.journal.q4Label}
            placeholder={strings.journal.q4Placeholder}
            value={draft.intention_demain}
            onChange={v => setDraft(d => ({ ...d, intention_demain: v }))}
            editable={editMode}
          />

          {error ? <Text style={styles.error}>{error}</Text> : null}
          {saved  ? <Text style={styles.saved}>{strings.journal.savedMessage}</Text> : null}

          {editMode ? (
            <TouchableOpacity
              style={[styles.btn, saving && styles.btnDisabled]}
              onPress={handleSave}
              disabled={saving}
              accessibilityLabel={strings.journal.btnSave}
            >
              <Text style={styles.btnText}>
                {saving ? strings.journal.saving : strings.journal.btnSave}
              </Text>
            </TouchableOpacity>
          ) : (
            <TouchableOpacity
              style={styles.btnGhost}
              onPress={() => setEditMode(true)}
              accessibilityLabel={strings.journal.btnEdit}
            >
              <Text style={styles.btnGhostText}>{strings.journal.btnEdit}</Text>
            </TouchableOpacity>
          )}
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

function Question({
  label, placeholder, value, onChange, editable,
}: {
  label: string; placeholder: string; value: string;
  onChange: (v: string) => void; editable: boolean;
}) {
  return (
    <View style={qStyles.wrapper}>
      <Text style={qStyles.label}>{label}</Text>
      <TextInput
        style={[qStyles.input, !editable && qStyles.inputReadOnly]}
        value={value}
        onChangeText={onChange}
        placeholder={editable ? placeholder : '—'}
        placeholderTextColor={theme.colors.textMuted}
        multiline
        editable={editable}
        accessibilityLabel={label}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container:  { flex: 1, backgroundColor: theme.colors.background },
  centered:   { flex: 1, alignItems: 'center', justifyContent: 'center' },
  scroll:     { flexGrow: 1 },
  header: {
    backgroundColor: theme.colors.journalBg,
    paddingTop: theme.spacing.xxl,
    paddingHorizontal: theme.spacing.lg,
    paddingBottom: theme.spacing.lg,
  },
  headerLabel: {
    fontSize: theme.fontSize.xs, color: theme.colors.journalText,
    letterSpacing: 1.5, textTransform: 'uppercase', marginBottom: 6,
  },
  headerTitle: {
    fontSize: theme.fontSize.xl, color: theme.colors.textDark, marginBottom: theme.spacing.md,
  },
  moodRow:      { flexDirection: 'row', gap: theme.spacing.sm },
  moodItem: {
    flex: 1, alignItems: 'center', gap: 5,
    paddingVertical: theme.spacing.sm, paddingHorizontal: 4,
    backgroundColor: 'rgba(255,255,255,0.45)',
    borderRadius: theme.borderRadius.md,
    borderWidth: 2, borderColor: 'transparent',
  },
  moodItemActive: { backgroundColor: theme.colors.card, borderColor: theme.colors.journalAccent },
  moodEmoji:     { fontSize: 22 },
  moodLabel:     { fontSize: theme.fontSize.xs, color: theme.colors.journalText },
  moodLabelActive: { color: theme.colors.journalAccent },
  body: { padding: theme.spacing.lg, gap: theme.spacing.md },
  error: { fontSize: theme.fontSize.sm, color: '#C0392B' },
  saved: { fontSize: theme.fontSize.sm, color: theme.colors.primary, fontStyle: 'italic' },
  btn: {
    backgroundColor: theme.colors.journalAccent, borderRadius: theme.borderRadius.md,
    padding: theme.spacing.md, alignItems: 'center', minHeight: theme.touchTarget,
  },
  btnDisabled: { opacity: 0.6 },
  btnText: { color: '#FFF', fontSize: theme.fontSize.md },
  btnGhost: {
    borderWidth: 1.5, borderColor: theme.colors.border,
    borderRadius: theme.borderRadius.md, padding: theme.spacing.md,
    alignItems: 'center', minHeight: theme.touchTarget,
  },
  btnGhostText: { fontSize: theme.fontSize.sm, color: theme.colors.textMuted },
});

const qStyles = StyleSheet.create({
  wrapper: { gap: 6 },
  label:   { fontSize: theme.fontSize.sm, color: theme.colors.textMid, fontStyle: 'italic', lineHeight: 20 },
  input: {
    backgroundColor: theme.colors.inputBg, borderWidth: 1.5,
    borderColor: theme.colors.border, borderRadius: theme.borderRadius.md,
    padding: theme.spacing.md, fontSize: theme.fontSize.sm,
    color: theme.colors.textDark, minHeight: 72, lineHeight: 20,
    textAlignVertical: 'top',
  },
  inputReadOnly: { backgroundColor: theme.colors.background, borderColor: 'transparent' },
});
