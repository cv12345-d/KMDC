import { View, Text, TouchableOpacity, StyleSheet, ScrollView } from 'react-native';
import { router } from 'expo-router';
import { theme } from '../lib/theme';

const FEATURES = [
  {
    n: '01',
    title: 'Historique illimité',
    sub:   'Journal, pesées et mesures corporelles sans limite dans le temps. Voyez votre progression sur des mois.',
  },
  {
    n: '02',
    title: 'Export PDF médecin',
    sub:   'Générez un rapport complet — poids, mesures, humeur — à partager lors de vos consultations.',
  },
  {
    n: '03',
    title: 'Recettes & accompagnement',
    sub:   'Recettes adaptées à chaque phase et à votre cycle. Rappels intelligents. Courbe lissée avec projections. Mode restart sans culpabilité.',
  },
];

export default function PaywallScreen() {
  return (
    <ScrollView style={s.root} contentContainerStyle={s.scroll}>

      {/* Retour */}
      <TouchableOpacity style={s.backRow} onPress={() => router.back()}>
        <Text style={s.backText}>← RETOUR</Text>
      </TouchableOpacity>

      {/* Hero */}
      <View style={s.hero}>
        <View style={s.inkBlock}>
          <Text style={s.heroEyebrow}>7 JOURS GRATUITS · ACCÈS COMPLET</Text>
          <Text style={s.heroTitle}>Allez plus{'\n'}loin.</Text>
          <Text style={s.heroSub}>
            Découvrez la méthode pendant 7 jours, puis un seul paiement pour un accès à vie. Pas d'abonnement, pas de renouvellement.
          </Text>
        </View>
      </View>

      {/* Features */}
      <View style={s.body}>
        <Text style={s.sectionLabel}>CE QUE VOUS DÉBLOQUEZ</Text>
        <View style={s.inkDivider} />

        {FEATURES.map(f => (
          <View key={f.n} style={s.featureRow}>
            <Text style={s.featureNum}>{f.n}</Text>
            <View style={s.featureText}>
              <Text style={s.featureTitle}>{f.title}</Text>
              <Text style={s.featureSub}>{f.sub}</Text>
            </View>
          </View>
        ))}

        {/* Prix */}
        <View style={s.priceBlock}>
          <Text style={s.priceLabel}>APRÈS LES 7 JOURS GRATUITS</Text>
          <Text style={s.price}>24,99 €</Text>
          <Text style={s.priceSub}>une seule fois · accès à vie</Text>
        </View>

        {/* CTA */}
        <TouchableOpacity
          style={s.btnPrimary}
          onPress={() => {
            // TODO: déclencher RevenueCat purchase flow (avec trial 7 jours)
            alert('Le paiement sera disponible très bientôt.');
          }}
        >
          <Text style={s.btnPrimaryText}>COMMENCER GRATUITEMENT — 7 JOURS</Text>
        </TouchableOpacity>

        <Text style={s.legal}>
          Aucun paiement n'est demandé pendant les 7 premiers jours. Le paiement in-app sera activé lors du lancement officiel. En beta, contactez-nous pour activer votre accès.
        </Text>
      </View>

    </ScrollView>
  );
}

const s = StyleSheet.create({
  root:  { flex: 1, backgroundColor: theme.colors.app },
  scroll:{ flexGrow: 1 },

  backRow: { paddingTop: theme.spacing.xxl, paddingHorizontal: theme.spacing.lg, paddingBottom: theme.spacing.sm },
  backText:{ fontFamily: theme.fontFamily.mono, fontSize: theme.fontSize.xs, color: theme.colors.inkSoft, letterSpacing: 1.5 },

  hero:     { marginHorizontal: theme.spacing.lg, marginBottom: theme.spacing.xl },
  inkBlock: { backgroundColor: theme.colors.ink, padding: theme.spacing.lg },
  heroEyebrow:{ fontFamily: theme.fontFamily.mono, fontSize: 9, color: 'rgba(242,237,227,0.5)', letterSpacing: 2, marginBottom: 14 },
  heroTitle:  { fontFamily: theme.fontFamily.display, fontSize: theme.fontSize.display, lineHeight: theme.fontSize.display * 0.9, color: theme.colors.invertInk, letterSpacing: -2, marginBottom: 16 },
  heroSub:    { fontFamily: theme.fontFamily.display, fontSize: theme.fontSize.md, color: 'rgba(242,237,227,0.7)', lineHeight: theme.fontSize.md * 1.5 },

  body:        { paddingHorizontal: theme.spacing.lg, paddingBottom: theme.spacing.xxl },
  sectionLabel:{ fontFamily: theme.fontFamily.mono, fontSize: theme.fontSize.xs, color: theme.colors.inkMuted, letterSpacing: 2, marginBottom: 10 },
  inkDivider:  { height: 1, backgroundColor: theme.colors.ink, marginBottom: 0 },

  featureRow:  { flexDirection: 'row', gap: 16, paddingVertical: 18, borderBottomWidth: 1, borderBottomColor: theme.colors.line, alignItems: 'flex-start' },
  featureNum:  { fontFamily: theme.fontFamily.mono, fontSize: theme.fontSize.xs, color: theme.colors.inkMuted, width: 24, letterSpacing: 1, paddingTop: 2 },
  featureText: { flex: 1 },
  featureTitle:{ fontFamily: theme.fontFamily.display, fontSize: theme.fontSize.lg, color: theme.colors.ink, letterSpacing: -0.3, marginBottom: 4 },
  featureSub:  { fontFamily: theme.fontFamily.display, fontSize: theme.fontSize.sm, color: theme.colors.inkMid, lineHeight: theme.fontSize.sm * 1.5 },

  priceBlock: { alignItems: 'center', paddingVertical: theme.spacing.xl },
  priceLabel: { fontFamily: theme.fontFamily.mono, fontSize: 9, color: theme.colors.inkMuted, letterSpacing: 2, marginBottom: 8 },
  price:      { fontFamily: theme.fontFamily.display, fontSize: 56, color: theme.colors.ink, letterSpacing: -2, lineHeight: 56 },
  priceSub:   { fontFamily: theme.fontFamily.mono, fontSize: 9, color: theme.colors.inkMuted, letterSpacing: 1, marginTop: 4 },

  btnPrimary:    { backgroundColor: theme.colors.ink, padding: theme.spacing.md, alignItems: 'center', minHeight: theme.touchTarget, marginBottom: theme.spacing.sm },
  btnPrimaryText:{ fontFamily: theme.fontFamily.mono, fontSize: theme.fontSize.xs, color: theme.colors.invertInk, letterSpacing: 2 },
  btnGhost:      { borderWidth: 1, borderColor: theme.colors.line, padding: theme.spacing.md, alignItems: 'center', minHeight: theme.touchTarget, marginBottom: theme.spacing.xl },
  btnGhostText:  { fontFamily: theme.fontFamily.mono, fontSize: theme.fontSize.xs, color: theme.colors.inkMuted, letterSpacing: 2 },

  legal: { fontFamily: theme.fontFamily.mono, fontSize: 9, color: theme.colors.inkMuted, textAlign: 'center', lineHeight: 14, letterSpacing: 0.3 },
});
