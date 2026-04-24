import { useState } from 'react';
import {
  View, Text, TouchableOpacity, StyleSheet,
  ScrollView,
} from 'react-native';
import { router, useLocalSearchParams } from 'expo-router';
import { theme } from '../../lib/theme';
import { strings } from '../../lib/strings';
import { addDays, PREPARATION_DAYS, RESET_DAYS, formatDateISO } from '../../lib/phases';
import { getUser, updateProfile, createPhaseProgress } from '../../lib/auth';

export default function OnboardingStep3() {
  const params = useLocalSearchParams<{
    age: string; weight: string; target: string;
    height: string; waist: string; hips: string;
    menopause: string; regles: string;
    nycturie: string; sommeil: string; ths: string;
  }>();

  const weight  = parseFloat(params.weight);
  const target  = parseFloat(params.target);

  const today    = new Date();
  const prepEnd  = addDays(today, PREPARATION_DAYS);
  const resetEnd = addDays(prepEnd, RESET_DAYS);

  const [loading, setLoading] = useState(false);
  const [error,   setError]   = useState('');

  async function handleStart() {
    setError('');
    setLoading(true);
    try {
      const user = await getUser();
      if (!user) { router.replace('/(auth)/login'); return; }

      const startISO = formatDateISO(today);

      const reglesParsed = (() => {
        if (!params.regles) return null;
        const [d, m, y] = params.regles.split('/').map(Number);
        if (!d || !m || !y) return null;
        return `${y}-${String(m).padStart(2, '0')}-${String(d).padStart(2, '0')}`;
      })();

      await updateProfile(user.id, {
        age:               parseInt(params.age, 10),
        taille_cm:         parseInt(params.height, 10),
        poids_initial_kg:  weight,
        poids_objectif_kg: target,
        tour_taille_cm:    params.waist ? parseInt(params.waist, 10) : null,
        tour_hanches_cm:   params.hips  ? parseInt(params.hips, 10)  : null,
        date_debut_parcours: startISO,
        statut_menopause:  params.menopause as 'menopausee' | 'perimenopaused' | 'non',
        date_dernieres_regles: reglesParsed,
        nycturie:          params.nycturie === '1',
        manque_sommeil:    params.sommeil  === '1',
        ths:               params.ths as 'oui' | 'non' | 'inconnu',
      });

      await createPhaseProgress(user.id, [
        { phase: 'preparation', date_debut: startISO,               date_fin_prevue: formatDateISO(prepEnd)  },
        { phase: 'reset',       date_debut: formatDateISO(prepEnd), date_fin_prevue: formatDateISO(resetEnd) },
        { phase: 'destockage',  date_debut: formatDateISO(resetEnd), date_fin_prevue: null                   },
      ]);

      router.replace('/(tabs)/home');
    } catch (e: unknown) {
      const msg = e instanceof Error ? e.message : JSON.stringify(e);
      setError(msg || strings.errors.networkError);
    } finally {
      setLoading(false);
    }
  }

  const phases = [
    { label: 'Préparation',      duration: '7 JOURS' },
    { label: 'Reset',            duration: '5 JOURS' },
    { label: 'Déstockage actif', duration: "JUSQU'À VOTRE OBJECTIF" },
    { label: 'Réintroduction',   duration: '4 À 8 SEMAINES' },
    { label: 'Équilibre de vie', duration: 'MODE DE VIE DURABLE' },
  ];

  return (
    <ScrollView style={s.root} contentContainerStyle={s.inner}>

      {/* ── PROGRESS ── */}
      <View style={s.progress}>
        <View style={[s.tick, s.tickDone]} />
        <View style={[s.tick, s.tickDone]} />
        <View style={[s.tick, s.tickDone]} />
        <View style={[s.tick, s.tickOn]} />
      </View>
      <Text style={s.stepLabel}>ÉTAPE 4 / 4</Text>

      {/* ── HEADER ── */}
      <View style={s.header}>
        <Text style={s.title}>{strings.onboarding.step3Title}</Text>
      </View>
      <View style={s.divider} />

      <Text style={s.subtitle}>{strings.onboarding.step3Subtitle}</Text>

      {/* ── PHASES ── */}
      <View style={s.phases}>
        {phases.map((p, i) => (
          <View key={p.label} style={[s.phaseRow, i < phases.length - 1 && s.phaseRowBorder]}>
            <Text style={s.phaseNum}>{String(i + 1).padStart(2, '0')}</Text>
            <Text style={s.phaseName}>{p.label}</Text>
            <Text style={s.phaseDur}>{p.duration}</Text>
          </View>
        ))}
      </View>

      <Text style={s.note}>{strings.onboarding.summaryIntro}</Text>

      {error ? <Text style={s.error}>{error}</Text> : null}

      <TouchableOpacity style={[s.btn, loading && s.btnDisabled]} onPress={handleStart} disabled={loading}>
        <Text style={s.btnText}>{loading ? 'ENREGISTREMENT…' : strings.onboarding.btnStart.toUpperCase()}</Text>
      </TouchableOpacity>

    </ScrollView>
  );
}

const s = StyleSheet.create({
  root:  { flex: 1, backgroundColor: theme.colors.app },
  inner: { paddingHorizontal: theme.spacing.lg, paddingTop: theme.spacing.xxl, paddingBottom: theme.spacing.xl },

  progress:  { flexDirection: 'row', gap: 6, marginBottom: 8 },
  tick:      { flex: 1, height: 3, backgroundColor: theme.colors.line },
  tickOn:    { backgroundColor: theme.colors.ink },
  tickDone:  { backgroundColor: theme.colors.inkSoft },
  stepLabel: { fontFamily: theme.fontFamily.mono, fontSize: 9, color: theme.colors.inkMuted, letterSpacing: 2, marginBottom: theme.spacing.lg },

  header:  { paddingBottom: theme.spacing.lg },
  title:   { fontFamily: theme.fontFamily.display, fontSize: theme.fontSize.display, lineHeight: theme.fontSize.display * 0.9, color: theme.colors.ink, letterSpacing: -2 },
  divider: { height: 1, backgroundColor: theme.colors.ink, marginBottom: theme.spacing.lg },
  subtitle:{ fontFamily: theme.fontFamily.mono, fontSize: theme.fontSize.xs, color: theme.colors.inkMuted, letterSpacing: 0.5, lineHeight: 18, marginBottom: theme.spacing.xl },

  phases:        { borderTopWidth: 1, borderTopColor: theme.colors.ink, marginBottom: theme.spacing.lg },
  phaseRow:      { flexDirection: 'row', alignItems: 'center', paddingVertical: 16, gap: 14 },
  phaseRowBorder:{ borderBottomWidth: 1, borderBottomColor: theme.colors.line },
  phaseNum:      { fontFamily: theme.fontFamily.mono, fontSize: 10, color: theme.colors.inkMuted, width: 24, letterSpacing: 1 },
  phaseName:     { flex: 1, fontFamily: theme.fontFamily.display, fontSize: theme.fontSize.md, color: theme.colors.ink },
  phaseDur:      { fontFamily: theme.fontFamily.mono, fontSize: 9, color: theme.colors.inkSoft, letterSpacing: 1 },

  note:        { fontFamily: theme.fontFamily.mono, fontSize: 9, color: theme.colors.inkMuted, letterSpacing: 0.5, lineHeight: 16, textAlign: 'center', marginBottom: theme.spacing.xl },
  error:       { fontFamily: theme.fontFamily.mono, fontSize: theme.fontSize.xs, color: '#C0392B', marginBottom: theme.spacing.md },
  btn:         { backgroundColor: theme.colors.ink, padding: theme.spacing.md, alignItems: 'center', minHeight: theme.touchTarget },
  btnDisabled: { opacity: 0.5 },
  btnText:     { fontFamily: theme.fontFamily.mono, fontSize: theme.fontSize.xs, color: theme.colors.invertInk, letterSpacing: 2 },
});
