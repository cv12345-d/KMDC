import { useState } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, ScrollView, ActivityIndicator } from 'react-native';
import { router, useLocalSearchParams } from 'expo-router';
import { theme } from '../lib/theme';
import { getUser } from '../lib/auth';
import { addPhaseProgress } from '../lib/auth';
import {
  type PhaseName, phaseLabelFr, phaseNumberFr, phaseListsFr,
} from '../lib/phases';

interface PhaseInfo {
  number: string;
  name: string;
  lists: string;
  duration: string;
  description: string;
  what_changes: string;
  color: string;
}

const PHASE_INFO: Record<PhaseName, PhaseInfo> = {
  preparation: {
    number:      'PHASE 1',
    name:        'Préparation',
    lists:       'Toutes les listes',
    duration:    '7 jours',
    description: 'On n\'enlève rien, on ajoute. 2 L d\'eau, 3 repas posés, observation sans jugement.',
    what_changes:'Aucune restriction — seulement des habitudes à installer.',
    color:       '#9A8E80',
  },
  reset: {
    number:      'PHASE 2',
    name:        'Reset',
    lists:       'Liste verte uniquement',
    duration:    '5 jours',
    description: 'Kick-off court sur liste verte stricte (IG < 20). Stabilisation de la glycémie, premier effet motivant.',
    what_changes:'Seule la liste verte est au menu. Eau citronnée, protéines, légumes, yaourt soja.',
    color:       '#3A7D44',
  },
  destockage: {
    number:      'PHASE 3',
    name:        'Déstockage actif',
    lists:       'Listes verte + jaune',
    duration:    "Jusqu'à 70 % de votre objectif",
    description: 'La phase longue où le poids descend vraiment, à un rythme soutenable (0,3 à 0,7 kg par semaine).',
    what_changes:'La liste jaune s\'ouvre. Fruits, légumineuses, céréales complètes rejoignent votre menu.',
    color:       '#8A7A20',
  },
  reinsertion: {
    number:      'PHASE 4',
    name:        'Réintroduction',
    lists:       'Verte + jaune + orange progressif',
    duration:    '4 à 8 semaines',
    description: 'Phase critique pour éviter la reprise. L\'orange s\'introduit progressivement : 1 jour sur 3, puis 1 jour sur 2.',
    what_changes:'Les aliments orange apparaissent certains jours (pain complet, pomme de terre vapeur, riz basmati).',
    color:       '#C07A2A',
  },
  equilibre: {
    number:      'PHASE 5',
    name:        'Équilibre de vie',
    lists:       'Toutes les listes, avec discernement',
    duration:    'À vie',
    description: 'Mode de vie stable. Orange libre dans la semaine, rouge occasionnel lors des occasions.',
    what_changes:'Pas de prescription stricte — des principes. Verte et jaune en base, orange selon appétit, rouge en plaisir conscient.',
    color:       '#4A6B9A',
  },
};

export default function TransitionScreen() {
  const params = useLocalSearchParams<{ from: string; to: string }>();
  const toPhaseName = params.to as PhaseName;
  const info = PHASE_INFO[toPhaseName];

  const [loading, setLoading] = useState(false);

  async function handleConfirm() {
    setLoading(true);
    try {
      const user = await getUser();
      if (!user) { router.replace('/(auth)/login'); return; }

      const today = new Date().toISOString().split('T')[0];
      await addPhaseProgress(user.id, {
        phase:          toPhaseName,
        date_debut:     today,
        date_fin_prevue: null,
      });

      router.replace('/(tabs)/home');
    } catch (e) {
      console.error('Phase transition error:', e);
      setLoading(false);
    }
  }

  if (!info) {
    router.replace('/(tabs)/home');
    return null;
  }

  return (
    <ScrollView style={s.root} contentContainerStyle={s.scroll}>

      {/* ── TOP BAR ── */}
      <View style={s.topBar}>
        <Text style={s.fromLabel}>
          ← {phaseLabelFr(params.from as PhaseName).toUpperCase()}
        </Text>
      </View>

      {/* ── HEADER ── */}
      <View style={s.header}>
        <Text style={s.phaseNumber}>{info.number}</Text>
        <Text style={s.phaseName}>{info.name}.</Text>
      </View>

      <View style={s.inkDivider} />

      <View style={s.body}>

        {/* ── DESCRIPTION ── */}
        <View style={s.section}>
          <Text style={s.sectionLabel}>CE QUI CHANGE</Text>
          <View style={s.sectionLine} />
          <Text style={s.description}>{info.description}</Text>
          <Text style={s.whatChanges}>{info.what_changes}</Text>
        </View>

        {/* ── LISTE & DURÉE ── */}
        <View style={s.section}>
          <Text style={s.sectionLabel}>DÉTAILS</Text>
          <View style={s.sectionLine} />

          <View style={s.detailRow}>
            <Text style={s.detailKey}>LISTES</Text>
            <View style={[s.detailDot, { backgroundColor: info.color }]} />
            <Text style={s.detailVal}>{info.lists}</Text>
          </View>
          <View style={[s.detailRow, s.detailRowLast]}>
            <Text style={s.detailKey}>DURÉE</Text>
            <Text style={s.detailVal}>{info.duration}</Text>
          </View>
        </View>

        {/* ── CTA ── */}
        <View style={s.ctaSection}>
          <TouchableOpacity
            style={[s.btnConfirm, loading && s.btnLoading]}
            onPress={handleConfirm}
            disabled={loading}
            activeOpacity={0.85}
          >
            {loading
              ? <ActivityIndicator color={theme.colors.invertInk} />
              : <Text style={s.btnConfirmText}>JE PASSE EN {info.number} →</Text>
            }
          </TouchableOpacity>

          <TouchableOpacity
            style={s.btnStay}
            onPress={() => router.back()}
            activeOpacity={0.7}
          >
            <Text style={s.btnStayText}>PAS ENCORE, JE RESTE UN PEU</Text>
          </TouchableOpacity>
        </View>

      </View>
    </ScrollView>
  );
}

const s = StyleSheet.create({
  root:   { flex: 1, backgroundColor: theme.colors.app },
  scroll: { flexGrow: 1 },

  topBar:    { paddingTop: theme.spacing.xxl, paddingHorizontal: theme.spacing.lg, paddingBottom: theme.spacing.sm },
  fromLabel: { fontFamily: theme.fontFamily.mono, fontSize: theme.fontSize.xs, color: theme.colors.inkMuted, letterSpacing: 2 },

  header:    { paddingHorizontal: theme.spacing.lg, paddingBottom: theme.spacing.lg, paddingTop: 4 },
  phaseNumber: { fontFamily: theme.fontFamily.mono, fontSize: theme.fontSize.xs, color: theme.colors.inkMuted, letterSpacing: 2, marginBottom: 8 },
  phaseName: {
    fontFamily: theme.fontFamily.display,
    fontSize: theme.fontSize.display,
    lineHeight: theme.fontSize.display * 0.9,
    color: theme.colors.ink,
    letterSpacing: -2,
  },

  inkDivider: { height: 1, backgroundColor: theme.colors.ink, marginHorizontal: theme.spacing.lg },
  body:       { paddingHorizontal: theme.spacing.lg, paddingBottom: theme.spacing.xxl },

  section:     { paddingTop: theme.spacing.xl },
  sectionLabel:{ fontFamily: theme.fontFamily.mono, fontSize: theme.fontSize.xs, color: theme.colors.inkMuted, letterSpacing: 2, marginBottom: 10 },
  sectionLine: { height: 1, backgroundColor: theme.colors.ink, marginBottom: 14 },

  description: {
    fontFamily: theme.fontFamily.display,
    fontSize: theme.fontSize.lg,
    color: theme.colors.ink,
    lineHeight: theme.fontSize.lg * 1.4,
    letterSpacing: -0.3,
    marginBottom: 12,
  },
  whatChanges: {
    fontFamily: theme.fontFamily.mono,
    fontSize: theme.fontSize.xs,
    color: theme.colors.inkSoft,
    letterSpacing: 0.5,
    lineHeight: 18,
    fontStyle: 'italic',
  },

  detailRow: {
    flexDirection: 'row', alignItems: 'center', gap: 12,
    paddingVertical: 14,
    borderBottomWidth: 1, borderBottomColor: theme.colors.line,
  },
  detailRowLast: { borderBottomWidth: 0 },
  detailKey:  { fontFamily: theme.fontFamily.mono, fontSize: 9, color: theme.colors.inkMuted, letterSpacing: 2, width: 52 },
  detailDot:  { width: 8, height: 8, flexShrink: 0 },
  detailVal:  { fontFamily: theme.fontFamily.display, fontSize: theme.fontSize.md, color: theme.colors.ink, flex: 1 },

  ctaSection:   { paddingTop: theme.spacing.xl, gap: theme.spacing.sm },
  btnConfirm: {
    backgroundColor: theme.colors.ink,
    paddingVertical: 18,
    alignItems: 'center',
    minHeight: theme.touchTarget,
  },
  btnLoading:     { opacity: 0.6 },
  btnConfirmText: { fontFamily: theme.fontFamily.mono, fontSize: theme.fontSize.xs, color: theme.colors.invertInk, letterSpacing: 2.5 },

  btnStay: {
    borderWidth: 1, borderColor: theme.colors.line,
    paddingVertical: 16,
    alignItems: 'center',
    minHeight: theme.touchTarget,
  },
  btnStayText: { fontFamily: theme.fontFamily.mono, fontSize: theme.fontSize.xs, color: theme.colors.inkMuted, letterSpacing: 1.5 },
});
