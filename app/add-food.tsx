import { useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, StyleSheet, ScrollView, Alert } from 'react-native';
import { router } from 'expo-router';
import { theme } from '../lib/theme';
import { getUser } from '../lib/auth';
import { addCustomFood, suggestColor, type Categorie, type Sucre } from '../lib/custom_foods';
import type { FoodList } from '../lib/foods';

const CATEGORIES: { key: Categorie; label: string; sub: string }[] = [
  { key: 'legume',     label: 'Légume',           sub: 'Brocoli, courgette, salade…' },
  { key: 'fruit',      label: 'Fruit',            sub: 'Pomme, fraise, orange…' },
  { key: 'proteine',   label: 'Protéine',         sub: 'Viande, poisson, œuf, tofu…' },
  { key: 'feculent',   label: 'Féculent',         sub: 'Pâtes, riz, pain, pomme de terre…' },
  { key: 'laitier',    label: 'Produit laitier',  sub: 'Yaourt, fromage, lait…' },
  { key: 'transforme', label: 'Plat transformé',  sub: 'Plats préparés, biscuits salés…' },
  { key: 'sucre',      label: 'Sucré',            sub: 'Bonbons, sodas, pâtisseries…' },
];

const SUCRES: { key: Sucre; label: string }[] = [
  { key: 'non',      label: 'Non, pas de sucre ajouté' },
  { key: 'peu',      label: 'Un peu (< 5 g / 100 g)' },
  { key: 'beaucoup', label: 'Beaucoup (> 5 g / 100 g)' },
];

const LIST_DOT: Record<FoodList, string> = {
  verte:  '#3A7D44',
  jaune:  '#8A7A20',
  orange: '#C07A2A',
  rouge:  '#B03030',
};

const LIST_LABEL: Record<FoodList, string> = {
  verte:  'VERTE',
  jaune:  'JAUNE',
  orange: 'ORANGE',
  rouge:  'ROUGE',
};

export default function AddFoodScreen() {
  const [nom,        setNom]        = useState('');
  const [categorie,  setCategorie]  = useState<Categorie | null>(null);
  const [sucre,      setSucre]      = useState<Sucre | null>(null);
  const [override,   setOverride]   = useState<FoodList | null>(null);
  const [saving,     setSaving]     = useState(false);

  const suggestion = (categorie && sucre) ? suggestColor(categorie, sucre) : null;
  const finalList  = override ?? suggestion?.liste ?? null;

  async function handleSave() {
    if (!nom.trim() || !finalList) return;
    setSaving(true);
    try {
      const user = await getUser();
      if (!user) { router.replace('/(auth)/login'); return; }
      await addCustomFood(user.id, nom.trim(), finalList, suggestion?.ig ?? null);
      router.back();
    } catch (e) {
      console.error(e);
      Alert.alert('Erreur', 'Impossible d\'enregistrer cet aliment.');
    } finally {
      setSaving(false);
    }
  }

  const canSave = nom.trim().length > 0 && finalList !== null && !saving;

  return (
    <ScrollView style={s.root} contentContainerStyle={s.inner} keyboardShouldPersistTaps="handled">

      <TouchableOpacity style={s.backRow} onPress={() => router.back()}>
        <Text style={s.backText}>← RETOUR</Text>
      </TouchableOpacity>

      <Text style={s.eyebrow}>NOUVEL ALIMENT</Text>
      <Text style={s.title}>Ajouter{'\n'}un aliment.</Text>
      <View style={s.divider} />
      <Text style={s.subtitle}>
        Quelques questions simples pour suggérer la liste qui correspond.
        Vous pouvez toujours choisir une autre couleur ensuite.
      </Text>

      {/* ── NOM ── */}
      <View style={s.section}>
        <Text style={s.sectionLabel}>NOM DE L'ALIMENT</Text>
        <View style={s.sectionLine} />
        <TextInput
          style={s.input}
          value={nom}
          onChangeText={setNom}
          placeholder="Ex. Quinoa, lentilles corail…"
          placeholderTextColor={theme.colors.inkMuted}
        />
      </View>

      {/* ── CATÉGORIE ── */}
      <View style={s.section}>
        <Text style={s.sectionLabel}>QUELLE CATÉGORIE ?</Text>
        <View style={s.sectionLine} />
        {CATEGORIES.map(c => (
          <TouchableOpacity
            key={c.key}
            style={[s.option, categorie === c.key && s.optionOn]}
            onPress={() => setCategorie(c.key)}
          >
            <View style={[s.radio, categorie === c.key && s.radioOn]}>
              {categorie === c.key && <View style={s.radioDot} />}
            </View>
            <View style={s.optionText}>
              <Text style={[s.optionLabel, categorie === c.key && s.optionLabelOn]}>{c.label}</Text>
              <Text style={s.optionSub}>{c.sub}</Text>
            </View>
          </TouchableOpacity>
        ))}
      </View>

      {/* ── SUCRE ── */}
      {categorie && (
        <View style={s.section}>
          <Text style={s.sectionLabel}>SUCRE AJOUTÉ ?</Text>
          <View style={s.sectionLine} />
          {SUCRES.map(su => (
            <TouchableOpacity
              key={su.key}
              style={[s.option, sucre === su.key && s.optionOn]}
              onPress={() => setSucre(su.key)}
            >
              <View style={[s.radio, sucre === su.key && s.radioOn]}>
                {sucre === su.key && <View style={s.radioDot} />}
              </View>
              <Text style={[s.optionLabel, sucre === su.key && s.optionLabelOn]}>{su.label}</Text>
            </TouchableOpacity>
          ))}
        </View>
      )}

      {/* ── SUGGESTION ── */}
      {suggestion && (
        <View style={s.section}>
          <Text style={s.sectionLabel}>NOTRE SUGGESTION</Text>
          <View style={s.sectionLine} />
          <View style={s.suggestion}>
            <View style={[s.suggestDot, { backgroundColor: LIST_DOT[suggestion.liste] }]} />
            <View style={s.suggestText}>
              <Text style={s.suggestList}>LISTE {LIST_LABEL[suggestion.liste]}</Text>
              <Text style={s.suggestReason}>{suggestion.reason}</Text>
              {suggestion.ig > 0 && <Text style={s.suggestIg}>IG estimé : {suggestion.ig}</Text>}
            </View>
          </View>

          <Text style={s.overrideLabel}>OU CHOISIR UNE AUTRE COULEUR</Text>
          <View style={s.overrideRow}>
            {(['verte', 'jaune', 'orange', 'rouge'] as FoodList[]).map(l => {
              const isFinal = finalList === l;
              return (
                <TouchableOpacity
                  key={l}
                  style={[s.overrideBtn, isFinal && s.overrideBtnOn]}
                  onPress={() => setOverride(l === suggestion.liste ? null : l)}
                >
                  <View style={[s.overrideDot, { backgroundColor: LIST_DOT[l] }]} />
                  <Text style={[s.overrideText, isFinal && s.overrideTextOn]}>{LIST_LABEL[l]}</Text>
                </TouchableOpacity>
              );
            })}
          </View>
        </View>
      )}

      {/* ── BOUTON SAVE ── */}
      <TouchableOpacity
        style={[s.btn, !canSave && s.btnDisabled]}
        onPress={handleSave}
        disabled={!canSave}
      >
        <Text style={s.btnText}>{saving ? 'ENREGISTREMENT…' : 'AJOUTER À MES ALIMENTS'}</Text>
      </TouchableOpacity>

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
  sectionLine: { height: 1, backgroundColor: theme.colors.ink, marginBottom: theme.spacing.md },

  input: {
    fontFamily: theme.fontFamily.display, fontSize: theme.fontSize.md,
    color: theme.colors.ink,
    borderBottomWidth: 1, borderBottomColor: theme.colors.line,
    paddingVertical: 12,
  },

  option: {
    flexDirection: 'row', alignItems: 'center', gap: 14,
    paddingVertical: 14,
    borderBottomWidth: 1, borderBottomColor: theme.colors.line,
  },
  optionOn:        {},
  radio:           { width: 22, height: 22, borderRadius: 11, borderWidth: 1.5, borderColor: theme.colors.line, alignItems: 'center', justifyContent: 'center', flexShrink: 0 },
  radioOn:         { borderColor: theme.colors.ink },
  radioDot:        { width: 10, height: 10, borderRadius: 5, backgroundColor: theme.colors.ink },
  optionText:      { flex: 1 },
  optionLabel:     { fontFamily: theme.fontFamily.display, fontSize: theme.fontSize.md, color: theme.colors.ink },
  optionLabelOn:   { fontWeight: '500' },
  optionSub:       { fontFamily: theme.fontFamily.mono, fontSize: 9, color: theme.colors.inkMuted, letterSpacing: 0.5, marginTop: 2 },

  suggestion: {
    flexDirection: 'row', gap: 14,
    backgroundColor: theme.colors.surface, padding: theme.spacing.md,
    marginBottom: theme.spacing.md,
  },
  suggestDot:    { width: 14, height: 14, marginTop: 2, flexShrink: 0 },
  suggestText:   { flex: 1 },
  suggestList:   { fontFamily: theme.fontFamily.mono, fontSize: theme.fontSize.xs, color: theme.colors.ink, letterSpacing: 2, marginBottom: 6 },
  suggestReason: { fontFamily: theme.fontFamily.display, fontSize: theme.fontSize.sm, color: theme.colors.inkMid, lineHeight: 20 },
  suggestIg:     { fontFamily: theme.fontFamily.mono, fontSize: 9, color: theme.colors.inkMuted, letterSpacing: 1, marginTop: 6 },

  overrideLabel: { fontFamily: theme.fontFamily.mono, fontSize: 9, color: theme.colors.inkMuted, letterSpacing: 2, marginBottom: 10, marginTop: 4 },
  overrideRow:   { flexDirection: 'row', gap: 6 },
  overrideBtn:   { flex: 1, flexDirection: 'row', alignItems: 'center', gap: 5, paddingHorizontal: 8, paddingVertical: 10, borderWidth: 1, borderColor: theme.colors.line },
  overrideBtnOn: { borderColor: theme.colors.ink, backgroundColor: theme.colors.ink },
  overrideDot:   { width: 8, height: 8 },
  overrideText:  { fontFamily: theme.fontFamily.mono, fontSize: 9, color: theme.colors.inkMuted, letterSpacing: 1.5 },
  overrideTextOn:{ color: theme.colors.invertInk },

  btn:         { backgroundColor: theme.colors.ink, padding: theme.spacing.md, alignItems: 'center', minHeight: theme.touchTarget, marginTop: theme.spacing.md },
  btnDisabled: { backgroundColor: theme.colors.line },
  btnText:     { fontFamily: theme.fontFamily.mono, fontSize: theme.fontSize.xs, color: theme.colors.invertInk, letterSpacing: 2 },
});
