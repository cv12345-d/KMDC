import { useState } from 'react';
import {
  View, Text, TouchableOpacity, StyleSheet,
  ScrollView, Platform,
} from 'react-native';
import { router, useLocalSearchParams } from 'expo-router';
import { theme } from '../../lib/theme';
import { strings } from '../../lib/strings';
import { calculatePhases, addWeeks, formatDateISO, phaseLabelFr } from '../../lib/phases';
import { getUser, updateProfile, createPhaseProgress } from '../../lib/auth';

export default function OnboardingStep3() {
  const params = useLocalSearchParams<{
    age: string; weight: string; target: string;
    height: string; waist: string; hips: string;
  }>();

  const weight  = parseFloat(params.weight);
  const target  = parseFloat(params.target);
  const { offensiveWeeks, destockageWeeks } = calculatePhases(weight, target);

  const today   = new Date();
  const offEnd  = addWeeks(today, offensiveWeeks);
  const desEnd  = addWeeks(offEnd, destockageWeeks);

  const [loading, setLoading] = useState(false);
  const [error,   setError]   = useState('');

  async function handleStart() {
    setError('');
    setLoading(true);
    try {
      const user = await getUser();
      if (!user) { router.replace('/(auth)/login'); return; }

      const startISO = formatDateISO(today);

      await updateProfile(user.id, {
        age:               parseInt(params.age, 10),
        taille_cm:         parseInt(params.height, 10),
        poids_initial_kg:  weight,
        poids_objectif_kg: target,
        tour_taille_cm:    params.waist  ? parseInt(params.waist, 10)  : null,
        tour_hanches_cm:   params.hips   ? parseInt(params.hips, 10)   : null,
        date_debut_parcours: startISO,
      });

      await createPhaseProgress(user.id, [
        { phase: 'offensive',     date_debut: startISO,              date_fin_prevue: formatDateISO(offEnd) },
        { phase: 'destockage',    date_debut: formatDateISO(offEnd),  date_fin_prevue: formatDateISO(desEnd) },
        { phase: 'stabilisation', date_debut: formatDateISO(desEnd),  date_fin_prevue: null },
      ]);

      router.replace('/(tabs)/home');
    } catch (e: unknown) {
      const msg = e instanceof Error ? e.message : JSON.stringify(e);
      setError(msg || strings.errors.networkError);
    } finally {
      setLoading(false);
    }
  }

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.inner}>
      <View style={styles.progress}>
        <View style={[styles.dot, styles.dotDone]} />
        <View style={[styles.dot, styles.dotDone]} />
        <View style={[styles.dot, styles.dotActive]} />
      </View>

      <Text style={styles.title}>{strings.onboarding.step3Title}</Text>
      <Text style={styles.subtitle}>{strings.onboarding.step3Subtitle}</Text>

      <View style={styles.summaryCard}>
        <PhaseRow
          phase={phaseLabelFr('offensive')}
          duration={strings.onboarding.weeks(offensiveWeeks)}
          color={theme.colors.primary}
          isFirst
        />
        <PhaseRow
          phase={phaseLabelFr('destockage')}
          duration={strings.onboarding.weeks(destockageWeeks)}
          color={theme.colors.accent}
        />
        <PhaseRow
          phase={phaseLabelFr('stabilisation')}
          duration={strings.onboarding.indefinite}
          color={theme.colors.journalAccent}
          isLast
        />
      </View>

      <Text style={styles.summaryNote}>{strings.onboarding.summaryIntro}</Text>

      {error ? <Text style={styles.error}>{error}</Text> : null}

      <TouchableOpacity
        style={[styles.btn, loading && styles.btnDisabled]}
        onPress={handleStart}
        disabled={loading}
        accessibilityLabel={strings.onboarding.btnStart}
      >
        <Text style={styles.btnText}>
          {loading ? 'Enregistrement…' : strings.onboarding.btnStart}
        </Text>
      </TouchableOpacity>
    </ScrollView>
  );
}

function PhaseRow({
  phase, duration, color, isFirst, isLast,
}: {
  phase: string; duration: string; color: string;
  isFirst?: boolean; isLast?: boolean;
}) {
  return (
    <View style={[
      rowStyles.row,
      isFirst && rowStyles.rowFirst,
      isLast  && rowStyles.rowLast,
    ]}>
      <View style={[rowStyles.dot, { backgroundColor: color }]} />
      <View style={rowStyles.texts}>
        <Text style={rowStyles.name}>{phase}</Text>
      </View>
      <Text style={rowStyles.duration}>{duration}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: theme.colors.background },
  inner: { padding: theme.spacing.lg, paddingTop: theme.spacing.xxl },
  progress: { flexDirection: 'row', gap: 8, marginBottom: theme.spacing.xl },
  dot: { width: 8, height: 8, borderRadius: 4, backgroundColor: theme.colors.border },
  dotActive: { backgroundColor: theme.colors.primary, width: 24 },
  dotDone:   { backgroundColor: theme.colors.accent },
  title:    { fontSize: theme.fontSize.xxl, color: theme.colors.textDark, marginBottom: theme.spacing.sm },
  subtitle: { fontSize: theme.fontSize.sm, color: theme.colors.textMuted, fontStyle: 'italic', lineHeight: 22, marginBottom: theme.spacing.xl },
  summaryCard: {
    backgroundColor: theme.colors.card, borderRadius: theme.borderRadius.lg,
    borderWidth: 1, borderColor: theme.colors.border,
    marginBottom: theme.spacing.md,
    overflow: 'hidden',
  },
  summaryNote: {
    fontSize: theme.fontSize.sm, color: theme.colors.textMuted,
    fontStyle: 'italic', textAlign: 'center',
    marginBottom: theme.spacing.xl,
  },
  error: { fontSize: theme.fontSize.sm, color: '#C0392B', marginBottom: theme.spacing.md },
  btn: {
    backgroundColor: theme.colors.primary, borderRadius: theme.borderRadius.md,
    padding: theme.spacing.md, alignItems: 'center', minHeight: theme.touchTarget,
  },
  btnDisabled: { opacity: 0.6 },
  btnText: { color: '#FFF', fontSize: theme.fontSize.md },
});

const rowStyles = StyleSheet.create({
  row: {
    flexDirection: 'row', alignItems: 'center', gap: theme.spacing.md,
    padding: theme.spacing.md,
    borderBottomWidth: 1, borderBottomColor: theme.colors.border,
  },
  rowFirst: {},
  rowLast:  { borderBottomWidth: 0 },
  dot:      { width: 12, height: 12, borderRadius: 6, flexShrink: 0 },
  texts:    { flex: 1 },
  name:     { fontSize: theme.fontSize.md, color: theme.colors.textMid },
  duration: { fontSize: theme.fontSize.sm, color: theme.colors.textSoft },
});
