import { useState, useEffect } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, ScrollView, ActivityIndicator } from 'react-native';
import * as Print from 'expo-print';
import * as Sharing from 'expo-sharing';
import { router } from 'expo-router';
import { theme } from '../lib/theme';
import { getUser, getProfile } from '../lib/auth';
import { getEntriesInRange as getWeightInRange } from '../lib/weight';
import { getMeasurementsInRange } from '../lib/measurements';
import { getEntriesInRange as getJournalInRange } from '../lib/journal';
import { buildPdfHtml } from '../lib/pdf';

type Period = '30j' | '3m' | '6m' | 'all';

const PERIODS: { key: Period; label: string; sub: string }[] = [
  { key: '30j', label: '30 jours',      sub: '4 SEMAINES'        },
  { key: '3m',  label: '3 mois',        sub: '12 SEMAINES'       },
  { key: '6m',  label: '6 mois',        sub: '26 SEMAINES'       },
  { key: 'all', label: 'Depuis le début', sub: 'PARCOURS COMPLET' },
];

function computeFromISO(period: Period, debutParcours: string | null): string {
  if (period === 'all' && debutParcours) return debutParcours;
  const d = new Date();
  if (period === '30j') d.setDate(d.getDate() - 30);
  else if (period === '3m') d.setMonth(d.getMonth() - 3);
  else if (period === '6m') d.setMonth(d.getMonth() - 6);
  else d.setFullYear(d.getFullYear() - 2); // fallback if no debut date
  return d.toISOString().split('T')[0];
}

function periodLabel(period: Period, debutParcours: string | null): string {
  const found = PERIODS.find(p => p.key === period);
  if (period === 'all' && !debutParcours) return 'Parcours complet';
  return found?.label ?? '';
}

export default function ExportScreen() {
  const [selected,  setSelected]  = useState<Period>('30j');
  const [loading,   setLoading]   = useState(true);
  const [exporting, setExporting] = useState(false);
  const [isPremium, setIsPremium] = useState(false);
  const [userId,    setUserId]    = useState<string | null>(null);
  const [profile,   setProfile]   = useState<{
    prenom: string;
    poids_initial_kg: number | null;
    poids_objectif_kg: number | null;
    date_debut_parcours: string | null;
    is_premium: boolean;
  } | null>(null);

  useEffect(() => {
    (async () => {
      const user = await getUser();
      if (!user) { router.replace('/'); return; }
      setUserId(user.id);
      const p = await getProfile(user.id);
      if (p) {
        setProfile({
          prenom:              p.prenom ?? 'Vous',
          poids_initial_kg:    p.poids_initial_kg ?? null,
          poids_objectif_kg:   p.poids_objectif_kg ?? null,
          date_debut_parcours: p.date_debut_parcours ?? null,
          is_premium:          p.is_premium ?? false,
        });
        setIsPremium(p.is_premium ?? false);
      }
      setLoading(false);
    })();
  }, []);

  async function handleExport() {
    if (!userId || !profile) return;
    if (!isPremium) { router.push('/paywall'); return; }

    setExporting(true);
    try {
      const toISO   = new Date().toISOString().split('T')[0];
      const fromISO = computeFromISO(selected, profile.date_debut_parcours);
      const label   = periodLabel(selected, profile.date_debut_parcours);

      const [weightEntries, measurements, journalEntries] = await Promise.all([
        getWeightInRange(userId, fromISO, toISO),
        getMeasurementsInRange(userId, fromISO, toISO),
        getJournalInRange(userId, fromISO, toISO),
      ]);

      const html = buildPdfHtml({
        prenom:         profile.prenom,
        periodLabel:    label,
        fromISO,
        toISO,
        weightEntries,
        measurements,
        journalEntries,
        poidsInitial:   profile.poids_initial_kg,
        poidsObjectif:  profile.poids_objectif_kg,
      });

      const { uri } = await Print.printToFileAsync({ html, base64: false });
      await Sharing.shareAsync(uri, {
        mimeType: 'application/pdf',
        dialogTitle: `Rapport KMDC — ${profile.prenom}`,
        UTI: 'com.adobe.pdf',
      });
    } catch (e) {
      console.error('PDF export error:', e);
    } finally {
      setExporting(false);
    }
  }

  if (loading) {
    return <View style={s.centered}><ActivityIndicator color={theme.colors.inkSoft} /></View>;
  }

  return (
    <ScrollView style={s.root} contentContainerStyle={s.scroll}>

      {/* ── BACK ── */}
      <TouchableOpacity style={s.backRow} onPress={() => router.back()}>
        <Text style={s.backText}>← RETOUR</Text>
      </TouchableOpacity>

      {/* ── HEADER ── */}
      <View style={s.header}>
        <Text style={s.eyebrow}>EXPORT PDF</Text>
        <Text style={s.title}>Rapport médecin.</Text>
        <Text style={s.subtitle}>
          Générez un rapport complet de votre suivi — poids, mesures, humeur — à partager avec votre médecin ou nutritionniste.
        </Text>
      </View>

      <View style={s.divider} />

      <View style={s.body}>

        {/* ── PERIOD PICKER ── */}
        <View style={s.section}>
          <Text style={s.sectionLabel}>PÉRIODE</Text>
          <View style={s.inkDivider} />
          {PERIODS.map((p, i) => {
            const isLast     = i === PERIODS.length - 1;
            const isSelected = selected === p.key;
            const isDisabled = p.key === 'all' && !profile?.date_debut_parcours;
            return (
              <TouchableOpacity
                key={p.key}
                style={[s.periodRow, isLast && s.periodRowLast, isSelected && s.periodRowSelected]}
                onPress={() => !isDisabled && setSelected(p.key)}
                activeOpacity={0.7}
                disabled={isDisabled}
              >
                <View style={[s.radio, isSelected && s.radioSelected]} />
                <View style={s.periodText}>
                  <Text style={[s.periodLabel, isSelected && s.periodLabelSelected, isDisabled && s.periodLabelMuted]}>
                    {p.label}
                  </Text>
                  <Text style={s.periodSub}>{p.sub}</Text>
                </View>
                {isSelected && <Text style={s.checkmark}>✓</Text>}
              </TouchableOpacity>
            );
          })}
        </View>

        {/* ── PREMIUM GATE OR GENERATE ── */}
        {isPremium ? (
          <View style={s.section}>
            <TouchableOpacity
              style={[s.btnGenerate, exporting && s.btnGenerating]}
              onPress={handleExport}
              disabled={exporting}
              activeOpacity={0.85}
            >
              {exporting
                ? <ActivityIndicator color={theme.colors.invertInk} />
                : <Text style={s.btnGenerateText}>GÉNÉRER LE PDF</Text>
              }
            </TouchableOpacity>
            <Text style={s.hint}>
              Le fichier s'ouvrira dans votre application de partage habituelle (Mail, AirDrop, WhatsApp…)
            </Text>
          </View>
        ) : (
          <View style={s.section}>
            <View style={s.premiumBlock}>
              <Text style={s.premiumEyebrow}>FONCTIONNALITÉ PREMIUM</Text>
              <Text style={s.premiumText}>
                L'export PDF est inclus dans l'accès Premium à 24,99 € — 7 jours gratuits, puis paiement unique à vie.
              </Text>
            </View>
            <TouchableOpacity style={s.btnUpgrade} onPress={() => router.push('/paywall')} activeOpacity={0.85}>
              <Text style={s.btnUpgradeText}>DÉCOUVRIR PREMIUM →</Text>
            </TouchableOpacity>
          </View>
        )}

      </View>
    </ScrollView>
  );
}

const s = StyleSheet.create({
  root:     { flex: 1, backgroundColor: theme.colors.app },
  scroll:   { flexGrow: 1 },
  centered: { flex: 1, alignItems: 'center', justifyContent: 'center' },

  backRow:  { paddingTop: theme.spacing.xxl, paddingHorizontal: theme.spacing.lg, paddingBottom: theme.spacing.sm },
  backText: { fontFamily: theme.fontFamily.mono, fontSize: theme.fontSize.xs, color: theme.colors.inkSoft, letterSpacing: 1.5 },

  header:   { paddingHorizontal: theme.spacing.lg, paddingBottom: theme.spacing.lg },
  eyebrow:  { fontFamily: theme.fontFamily.mono, fontSize: theme.fontSize.xs, color: theme.colors.inkMuted, letterSpacing: 2, marginBottom: 14 },
  title:    { fontFamily: theme.fontFamily.display, fontSize: theme.fontSize.display, lineHeight: theme.fontSize.display * 0.9, color: theme.colors.ink, letterSpacing: -2, marginBottom: 16 },
  subtitle: { fontFamily: theme.fontFamily.display, fontSize: theme.fontSize.sm, color: theme.colors.inkMid, lineHeight: theme.fontSize.sm * 1.5 },

  divider:    { height: 1, backgroundColor: theme.colors.ink, marginHorizontal: theme.spacing.lg },
  body:       { paddingHorizontal: theme.spacing.lg, paddingBottom: theme.spacing.xxl },

  section:    { paddingTop: theme.spacing.xl },
  sectionLabel: { fontFamily: theme.fontFamily.mono, fontSize: theme.fontSize.xs, color: theme.colors.inkMuted, letterSpacing: 2, marginBottom: 10 },
  inkDivider: { height: 1, backgroundColor: theme.colors.ink, marginBottom: 0 },

  periodRow: {
    flexDirection: 'row', alignItems: 'center', gap: 14,
    paddingVertical: 16, borderBottomWidth: 1, borderBottomColor: theme.colors.line,
    minHeight: theme.touchTarget,
  },
  periodRowLast:     { borderBottomWidth: 0 },
  periodRowSelected: {},
  radio: {
    width: 14, height: 14,
    borderWidth: 1, borderColor: theme.colors.line,
    flexShrink: 0,
  },
  radioSelected: { borderColor: theme.colors.ink, backgroundColor: theme.colors.ink },
  periodText:    { flex: 1 },
  periodLabel:   { fontFamily: theme.fontFamily.display, fontSize: theme.fontSize.md, color: theme.colors.inkSoft },
  periodLabelSelected: { color: theme.colors.ink },
  periodLabelMuted:    { color: theme.colors.inkMuted },
  periodSub:     { fontFamily: theme.fontFamily.mono, fontSize: 9, color: theme.colors.inkMuted, letterSpacing: 1.5, marginTop: 3 },
  checkmark:     { fontFamily: theme.fontFamily.mono, fontSize: theme.fontSize.xs, color: theme.colors.ink },

  btnGenerate: {
    backgroundColor: theme.colors.ink,
    paddingVertical: 18,
    alignItems: 'center',
    minHeight: theme.touchTarget,
    marginBottom: 14,
  },
  btnGenerating:    { opacity: 0.6 },
  btnGenerateText:  { fontFamily: theme.fontFamily.mono, fontSize: theme.fontSize.xs, color: theme.colors.invertInk, letterSpacing: 2.5 },

  hint: {
    fontFamily: theme.fontFamily.mono, fontSize: 9,
    color: theme.colors.inkMuted, letterSpacing: 0.5,
    lineHeight: 14,
  },

  premiumBlock: {
    borderWidth: 1, borderColor: theme.colors.line,
    padding: theme.spacing.md,
    marginBottom: theme.spacing.md,
  },
  premiumEyebrow: {
    fontFamily: theme.fontFamily.mono, fontSize: 9,
    color: theme.colors.inkMuted, letterSpacing: 2,
    marginBottom: 8,
  },
  premiumText: {
    fontFamily: theme.fontFamily.display, fontSize: theme.fontSize.sm,
    color: theme.colors.inkMid, lineHeight: theme.fontSize.sm * 1.5,
  },
  btnUpgrade: {
    borderWidth: 1, borderColor: theme.colors.ink,
    paddingVertical: 16, alignItems: 'center',
    minHeight: theme.touchTarget,
  },
  btnUpgradeText: { fontFamily: theme.fontFamily.mono, fontSize: theme.fontSize.xs, color: theme.colors.ink, letterSpacing: 2 },
});
