import { useState, useCallback } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView, ActivityIndicator } from 'react-native';
import { router, useFocusEffect } from 'expo-router';
import { getUser, getProfile, signOut } from '../../lib/auth';
import { getTodayEntry as getJournalToday } from '../../lib/journal';
import { getTodayEntry as getWeightToday } from '../../lib/weight';
import { getCurrentPhase, type CurrentPhase } from '../../lib/parcours';
import { theme } from '../../lib/theme';
import { strings } from '../../lib/strings';

interface HomeData {
  prenom: string;
  phase: CurrentPhase | null;
  hasWeight: boolean;
  hasJournal: boolean;
}

export default function HomeScreen() {
  const [data,    setData]    = useState<HomeData | null>(null);
  const [loading, setLoading] = useState(true);

  useFocusEffect(useCallback(() => {
    load();
  }, []));

  async function load() {
    setLoading(true);
    try {
      const user = await getUser();
      if (!user) { router.replace('/(auth)/login'); return; }

      const [profile, phase, weightEntry, journalEntry] = await Promise.all([
        getProfile(user.id),
        getCurrentPhase(user.id),
        getWeightToday(user.id),
        getJournalToday(user.id),
      ]);

      if (!profile || !profile.poids_initial_kg) {
        router.replace('/(onboarding)/step1');
        return;
      }

      setData({
        prenom:     profile.prenom,
        phase,
        hasWeight:  !!weightEntry,
        hasJournal: !!journalEntry,
      });
    } finally {
      setLoading(false);
    }
  }

  async function handleSignOut() {
    await signOut();
    router.replace('/(auth)/login');
  }

  if (loading) {
    return <View style={styles.centered}><ActivityIndicator color={theme.colors.primary} /></View>;
  }

  const thought = strings.home.thoughts[new Date().getDay() % strings.home.thoughts.length];

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.scroll}>
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.dateLabel}>{formatDateFr()}</Text>
        <Text style={styles.greeting}>{strings.home.greeting(data?.prenom ?? '')}</Text>
        <Text style={styles.tagline}>{strings.home.tagline}</Text>
      </View>

      <View style={styles.body}>
        {/* Phase card */}
        {data?.phase && (
          <Section label={strings.home.sectionParcours}>
            <PhaseCard phase={data.phase} />
          </Section>
        )}

        {/* Today checklist */}
        <Section label={strings.home.sectionToday}>
          <View style={styles.card}>
            <CheckRow
              label={strings.home.checkinWeight}
              done={data?.hasWeight ?? false}
              onPress={() => router.push('/(tabs)/suivi')}
            />
            <CheckRow
              label={strings.home.checkinJournal}
              done={data?.hasJournal ?? false}
              onPress={() => router.push('/(tabs)/journal')}
              last
            />
          </View>
        </Section>

        {/* Daily thought */}
        <Section label={strings.home.sectionThought}>
          <View style={styles.card}>
            <Text style={styles.thought}>{`"${thought}"`}</Text>
          </View>
        </Section>

        {/* Sign out */}
        <TouchableOpacity style={styles.signOutBtn} onPress={handleSignOut} accessibilityLabel={strings.home.signOut}>
          <Text style={styles.signOutText}>{strings.home.signOut}</Text>
        </TouchableOpacity>
      </View>
    </ScrollView>
  );
}

function Section({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <View style={sectionStyles.wrapper}>
      <Text style={sectionStyles.label}>{label}</Text>
      {children}
    </View>
  );
}

function PhaseCard({ phase }: { phase: CurrentPhase }) {
  return (
    <View style={styles.card}>
      <View style={styles.phaseBadge}>
        <Text style={styles.phaseBadgeText}>{phase.label}</Text>
      </View>
      <Text style={styles.phaseWeek}>{strings.home.weekLabel(phase.weekNumber)}</Text>
      {phase.daysTotal && (
        <>
          <View style={styles.progressBg}>
            <View style={[styles.progressFill, { width: `${phase.progressPercent}%` as unknown as number }]} />
          </View>
          <Text style={styles.progressLabel}>
            {strings.home.daysLabel(phase.daysDone, phase.daysTotal)}
          </Text>
        </>
      )}
      {!phase.daysTotal && (
        <Text style={styles.progressLabel}>{strings.home.daysDoneLabel(phase.daysDone)}</Text>
      )}
    </View>
  );
}

function CheckRow({ label, done, onPress, last }: {
  label: string; done: boolean; onPress: () => void; last?: boolean;
}) {
  return (
    <TouchableOpacity
      style={[checkStyles.row, last && checkStyles.rowLast]}
      onPress={onPress}
      accessibilityLabel={label}
    >
      <View style={[checkStyles.circle, done && checkStyles.circleDone]}>
        {done && <Text style={checkStyles.check}>✓</Text>}
      </View>
      <Text style={[checkStyles.label, done && checkStyles.labelDone]}>{label}</Text>
    </TouchableOpacity>
  );
}

function formatDateFr(): string {
  return new Date().toLocaleDateString('fr-FR', { weekday: 'long', day: 'numeric', month: 'long' });
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: theme.colors.background },
  centered:  { flex: 1, alignItems: 'center', justifyContent: 'center' },
  scroll:    { flexGrow: 1 },
  header: {
    backgroundColor: theme.colors.backgroundHeader,
    paddingTop: theme.spacing.xxl,
    paddingHorizontal: theme.spacing.lg,
    paddingBottom: theme.spacing.lg,
  },
  dateLabel: { fontSize: theme.fontSize.xs, color: theme.colors.textSoft, letterSpacing: 1.5, textTransform: 'uppercase', marginBottom: 6 },
  greeting:  { fontSize: theme.fontSize.xxl, color: theme.colors.textDark, marginBottom: 6 },
  tagline:   { fontSize: theme.fontSize.sm, color: theme.colors.textSoft, fontStyle: 'italic' },
  body:      { padding: theme.spacing.lg, gap: theme.spacing.md },
  card: {
    backgroundColor: theme.colors.card, borderRadius: theme.borderRadius.lg,
    borderWidth: 1, borderColor: theme.colors.border, padding: theme.spacing.md,
  },
  phaseBadge: {
    alignSelf: 'flex-start', backgroundColor: theme.colors.badge,
    borderRadius: theme.borderRadius.full, paddingHorizontal: theme.spacing.md,
    paddingVertical: 4, marginBottom: theme.spacing.sm,
  },
  phaseBadgeText: { fontSize: theme.fontSize.xs, color: theme.colors.textSoft },
  phaseWeek:      { fontSize: theme.fontSize.md, color: theme.colors.textMid, marginBottom: theme.spacing.sm },
  progressBg:     { height: 5, backgroundColor: theme.colors.border, borderRadius: 3, marginBottom: 6 },
  progressFill:   { height: 5, backgroundColor: theme.colors.primary, borderRadius: 3 },
  progressLabel:  { fontSize: theme.fontSize.xs, color: theme.colors.textMuted, textAlign: 'right' },
  thought: {
    fontSize: theme.fontSize.sm, color: theme.colors.textMid,
    fontStyle: 'italic', lineHeight: 22,
    borderLeftWidth: 3, borderLeftColor: theme.colors.accent,
    paddingLeft: theme.spacing.md,
  },
  signOutBtn: {
    padding: theme.spacing.md, alignItems: 'center',
    borderWidth: 1.5, borderColor: theme.colors.border,
    borderRadius: theme.borderRadius.md, minHeight: theme.touchTarget,
    justifyContent: 'center', marginTop: theme.spacing.sm,
  },
  signOutText: { fontSize: theme.fontSize.sm, color: theme.colors.textMuted },
});

const sectionStyles = StyleSheet.create({
  wrapper: { gap: theme.spacing.sm },
  label:   { fontSize: theme.fontSize.xs, color: theme.colors.textMuted, textTransform: 'uppercase', letterSpacing: 1.5 },
});

const checkStyles = StyleSheet.create({
  row: {
    flexDirection: 'row', alignItems: 'center', gap: theme.spacing.md,
    paddingVertical: theme.spacing.sm,
    borderBottomWidth: 1, borderBottomColor: theme.colors.border,
    minHeight: theme.touchTarget,
  },
  rowLast:    { borderBottomWidth: 0 },
  circle: {
    width: 24, height: 24, borderRadius: 12,
    borderWidth: 1.5, borderColor: theme.colors.accent,
    alignItems: 'center', justifyContent: 'center',
  },
  circleDone: { backgroundColor: theme.colors.primary, borderColor: theme.colors.primary },
  check:      { color: '#FFF', fontSize: 12 },
  label:      { fontSize: theme.fontSize.md, color: theme.colors.textMid },
  labelDone:  { color: theme.colors.textMuted, textDecorationLine: 'line-through' },
});
