import { View, Text, TouchableOpacity, StyleSheet, ScrollView } from 'react-native';
import { router } from 'expo-router';
import { theme } from '../lib/theme';

const PHASES = [
  {
    number:  'PHASE 1',
    name:    'Préparation',
    duration:'7 JOURS',
    color:   '#9A8E80',
    goal:    'Installer des habitudes sans rien enlever.',
    lists:   'Toutes les listes autorisées',
    actions: [
      'Boire 2 L d\'eau par jour',
      '3 repas assis, sans écran',
      'Observer vos habitudes sans jugement',
      'Aucune restriction alimentaire',
    ],
  },
  {
    number:  'PHASE 2',
    name:    'Reset',
    duration:'5 JOURS',
    color:   '#3A7D44',
    goal:    'Stabiliser la glycémie et créer le premier élan.',
    lists:   'Liste verte uniquement (IG < 20)',
    actions: [
      'Eau citronnée le matin à jeun',
      'Protéines à chaque repas',
      'Légumes verts à volonté — fibres importantes pour le transit',
      'Zéro sucre, zéro fruit, zéro céréales',
      'Tofu et soja autorisés (phytoestrogènes bénéfiques)',
    ],
  },
  {
    number:  'PHASE 3',
    name:    'Déstockage actif',
    duration:'JUSQU\'À 70 % DE L\'OBJECTIF',
    color:   '#8A7A20',
    goal:    'Perdre du poids à un rythme soutenable (0,3–0,7 kg/semaine).',
    lists:   'Listes verte + jaune',
    actions: [
      'Pesée chaque matin, même heure, même conditions',
      'Fruits, légumineuses et céréales complètes autorisés',
      'Pas de glucides après 18h',
      'Une source de calcium à chaque repas (fromage, sardines, brocoli, amandes)',
      'Poisson gras (saumon, sardine, maquereau) 3× par semaine — oméga-3',
    ],
  },
  {
    number:  'PHASE 4',
    name:    'Réintroduction',
    duration:'4 À 8 SEMAINES',
    color:   '#C07A2A',
    goal:    'Éviter la reprise en réintroduisant progressivement.',
    lists:   'Verte + jaune + orange progressif',
    actions: [
      'Semaines 1–2 : orange 1 jour sur 3',
      'Semaines 3–4 : orange 1 jour sur 2',
      'Observer les sensations après chaque réintroduction',
      'Maintenir la pesée quotidienne',
      'Continuer calcium + oméga-3 à chaque repas — phase critique pour les os',
    ],
  },
  {
    number:  'PHASE 5',
    name:    'Équilibre de vie',
    duration:'À VIE',
    color:   '#4A6B9A',
    goal:    'Vivre avec les principes sans règles strictes.',
    lists:   'Toutes les listes, avec discernement',
    actions: [
      'Verte et jaune en base quotidienne',
      'Orange selon votre appétit et la saison',
      'Rouge en plaisir conscient, sans culpabilité',
      'Pesée 2–3 fois par semaine pour rester ancré',
      '1 c.s. graines de lin moulues par jour (phytoestrogènes + fibres)',
      'Calcium et vitamine D : soleil, poissons gras, produits laitiers',
    ],
  },
];

const PRINCIPES = [
  { n: '01', text: 'On commence par ajouter, jamais par enlever.' },
  { n: '02', text: 'L\'indice glycémique guide, pas interdit.' },
  { n: '03', text: 'La régularité vaut mieux que la perfection.' },
  { n: '04', text: 'Le corps féminin après 45 ans a ses propres règles.' },
];

export default function MethodeScreen() {
  return (
    <ScrollView style={s.root} contentContainerStyle={s.inner}>

      {/* ── TOP BAR ── */}
      <TouchableOpacity style={s.backRow} onPress={() => router.canGoBack() ? router.back() : router.replace('/(tabs)/home')}>
        <Text style={s.backText}>← RETOUR</Text>
      </TouchableOpacity>

      {/* ── HEADER ── */}
      <Text style={s.eyebrow}>LA MÉTHODE KMDC</Text>
      <Text style={s.title}>5 phases.{'\n'}Un rythme.</Text>
      <View style={s.divider} />
      <Text style={s.subtitle}>
        Une progression pensée pour les femmes de 45 ans et plus. Pas un régime — un recadrage métabolique progressif.
      </Text>

      {/* ── PRINCIPES ── */}
      <View style={s.section}>
        <Text style={s.sectionLabel}>RÈGLES D'OR</Text>
        <View style={s.sectionLine} />
        {PRINCIPES.map(p => (
          <View key={p.n} style={s.principeRow}>
            <Text style={s.principeN}>{p.n}</Text>
            <Text style={s.principeText}>{p.text}</Text>
          </View>
        ))}
      </View>

      {/* ── 5 PHASES ── */}
      <View style={s.section}>
        <Text style={s.sectionLabel}>LES 5 PHASES</Text>
        <View style={s.sectionLine} />
        {PHASES.map((ph, i) => (
          <View key={ph.number} style={[s.phaseCard, i < PHASES.length - 1 && s.phaseCardBorder]}>

            <View style={s.phaseHeader}>
              <View style={[s.phaseDot, { backgroundColor: ph.color }]} />
              <View style={s.phaseHeaderText}>
                <Text style={s.phaseNumber}>{ph.number}</Text>
                <Text style={s.phaseName}>{ph.name}</Text>
              </View>
              <Text style={s.phaseDuration}>{ph.duration}</Text>
            </View>

            <Text style={s.phaseGoal}>{ph.goal}</Text>

            <View style={s.phaseListRow}>
              <Text style={s.phaseListLabel}>LISTES</Text>
              <Text style={s.phaseListVal}>{ph.lists}</Text>
            </View>

            <View style={s.phaseActions}>
              {ph.actions.map(a => (
                <View key={a} style={s.actionRow}>
                  <View style={[s.actionDot, { backgroundColor: ph.color }]} />
                  <Text style={s.actionText}>{a}</Text>
                </View>
              ))}
            </View>

          </View>
        ))}
      </View>

    </ScrollView>
  );
}

const s = StyleSheet.create({
  root:  { flex: 1, backgroundColor: theme.colors.app },
  inner: { paddingHorizontal: theme.spacing.lg, paddingTop: theme.spacing.xxl, paddingBottom: theme.spacing.xl },

  backRow:  { marginBottom: theme.spacing.lg },
  backText: { fontFamily: theme.fontFamily.mono, fontSize: theme.fontSize.xs, color: theme.colors.inkMuted, letterSpacing: 2 },

  eyebrow:  { fontFamily: theme.fontFamily.mono, fontSize: 9, color: theme.colors.inkMuted, letterSpacing: 2, marginBottom: 10 },
  title:    { fontFamily: theme.fontFamily.display, fontSize: theme.fontSize.display, lineHeight: theme.fontSize.display * 0.9, color: theme.colors.ink, letterSpacing: -2, marginBottom: theme.spacing.lg },
  divider:  { height: 1, backgroundColor: theme.colors.ink, marginBottom: theme.spacing.lg },
  subtitle: { fontFamily: theme.fontFamily.mono, fontSize: theme.fontSize.xs, color: theme.colors.inkMuted, letterSpacing: 0.5, lineHeight: 18, marginBottom: theme.spacing.xl },

  section:     { marginBottom: theme.spacing.xl },
  sectionLabel:{ fontFamily: theme.fontFamily.mono, fontSize: 9, color: theme.colors.inkMuted, letterSpacing: 2, marginBottom: 10 },
  sectionLine: { height: 1, backgroundColor: theme.colors.ink, marginBottom: 0 },

  principeRow: { flexDirection: 'row', gap: 14, paddingVertical: 14, borderBottomWidth: 1, borderBottomColor: theme.colors.line, alignItems: 'flex-start' },
  principeN:   { fontFamily: theme.fontFamily.mono, fontSize: 9, color: theme.colors.inkMuted, letterSpacing: 1, width: 20, paddingTop: 2 },
  principeText:{ flex: 1, fontFamily: theme.fontFamily.display, fontSize: theme.fontSize.sm, color: theme.colors.ink, lineHeight: 20 },

  phaseCard:       { paddingVertical: theme.spacing.lg },
  phaseCardBorder: { borderBottomWidth: 1, borderBottomColor: theme.colors.line },

  phaseHeader:     { flexDirection: 'row', alignItems: 'center', gap: 12, marginBottom: 10 },
  phaseDot:        { width: 10, height: 10, flexShrink: 0 },
  phaseHeaderText: { flex: 1 },
  phaseNumber:     { fontFamily: theme.fontFamily.mono, fontSize: 9, color: theme.colors.inkMuted, letterSpacing: 2 },
  phaseName:       { fontFamily: theme.fontFamily.display, fontSize: theme.fontSize.xl, color: theme.colors.ink, letterSpacing: -0.5 },
  phaseDuration:   { fontFamily: theme.fontFamily.mono, fontSize: 9, color: theme.colors.inkMuted, letterSpacing: 1, textAlign: 'right', maxWidth: 100 },

  phaseGoal: { fontFamily: theme.fontFamily.mono, fontSize: theme.fontSize.xs, color: theme.colors.inkSoft, letterSpacing: 0.3, lineHeight: 18, marginBottom: 10, fontStyle: 'italic' },

  phaseListRow:  { flexDirection: 'row', gap: 12, alignItems: 'center', paddingVertical: 8, borderTopWidth: 1, borderTopColor: theme.colors.lineSoft, marginBottom: 10 },
  phaseListLabel:{ fontFamily: theme.fontFamily.mono, fontSize: 9, color: theme.colors.inkMuted, letterSpacing: 2, width: 40 },
  phaseListVal:  { flex: 1, fontFamily: theme.fontFamily.mono, fontSize: theme.fontSize.xs, color: theme.colors.inkMid, letterSpacing: 0.5 },

  phaseActions: { gap: 6 },
  actionRow:    { flexDirection: 'row', alignItems: 'flex-start', gap: 10 },
  actionDot:    { width: 5, height: 5, marginTop: 5, flexShrink: 0 },
  actionText:   { flex: 1, fontFamily: theme.fontFamily.display, fontSize: theme.fontSize.sm, color: theme.colors.ink, lineHeight: 20 },
});
