import { useEffect, useState, useCallback } from 'react';
import {
  View, Text, TextInput, TouchableOpacity, StyleSheet,
  FlatList, ActivityIndicator, Alert,
} from 'react-native';
import { useFocusEffect, router } from 'expo-router';
import AsyncStorage from '@react-native-async-storage/async-storage';
import * as Print from 'expo-print';
import * as Sharing from 'expo-sharing';
import { theme } from '../../lib/theme';
import { strings } from '../../lib/strings';
import { getFoods, type Food, type FoodList } from '../../lib/foods';
import { getCustomFoods, customToFood, deleteCustomFood } from '../../lib/custom_foods';
import { getUser } from '../../lib/auth';
import { getCurrentPhase } from '../../lib/parcours';
import { type PhaseName } from '../../lib/phases';

const SHOPPING_KEY = 'shopping_list_v1';

const LIST_ORDER: FoodList[] = ['verte', 'jaune', 'orange', 'rouge'];

const LIST_LABEL: Record<FoodList, string> = {
  verte:  'VERTE',
  jaune:  'JAUNE',
  orange: 'ORANGE',
  rouge:  'ROUGE',
};

const LIST_DOT: Record<FoodList, string> = {
  verte:  '#3A7D44',
  jaune:  '#8A7A20',
  orange: '#C07A2A',
  rouge:  '#B03030',
};

const PHASE_HINT: Partial<Record<PhaseName, { text: string; highlight: FoodList[] }>> = {
  reset:       { text: 'Phase 2 — Liste verte conseillée',                    highlight: ['verte'] },
  destockage:  { text: 'Phase 3 — Listes verte et jaune conseillées',         highlight: ['verte', 'jaune'] },
  reinsertion: { text: 'Phase 4 — Introduisez orange progressivement',        highlight: ['verte', 'jaune', 'orange'] },
};

export default function AlimentsScreen() {
  const [foods,        setFoods]        = useState<Food[]>([]);
  const [search,       setSearch]       = useState('');
  const [filter,       setFilter]       = useState<FoodList | null>(null);
  const [loading,      setLoading]      = useState(true);
  const [currentPhase, setCurrentPhase] = useState<PhaseName | null>(null);
  const [selected,     setSelected]     = useState<Set<string>>(new Set());
  const [exporting,    setExporting]    = useState(false);

  useEffect(() => {
    AsyncStorage.getItem(SHOPPING_KEY).then(stored => {
      if (stored) setSelected(new Set(JSON.parse(stored)));
    });
  }, []);

  useFocusEffect(useCallback(() => {
    (async () => {
      try {
        const user = await getUser();
        const [globalFoods, customFoods] = await Promise.all([
          getFoods(),
          user ? getCustomFoods(user.id) : Promise.resolve([]),
        ]);
        const merged: Food[] = [...customFoods.map(customToFood), ...globalFoods];
        setFoods(merged);
        if (user) {
          const phase = await getCurrentPhase(user.id);
          setCurrentPhase(phase?.phase ?? null);
        }
      } finally {
        setLoading(false);
      }
    })();
  }, []));

  async function handleDeleteCustom(id: string) {
    const realId = id.replace(/^custom_/, '');
    Alert.alert(
      'Supprimer cet aliment ?',
      'Il sera retiré de vos aliments personnels.',
      [
        { text: 'Annuler', style: 'cancel' },
        { text: 'Supprimer', style: 'destructive', onPress: async () => {
          await deleteCustomFood(realId);
          setFoods(prev => prev.filter(f => f.id !== id));
          setSelected(prev => {
            const next = new Set(prev);
            next.delete(id);
            AsyncStorage.setItem(SHOPPING_KEY, JSON.stringify([...next]));
            return next;
          });
        }},
      ]
    );
  }

  async function toggleSelect(id: string) {
    const next = new Set(selected);
    if (next.has(id)) next.delete(id); else next.add(id);
    setSelected(next);
    await AsyncStorage.setItem(SHOPPING_KEY, JSON.stringify([...next]));
  }

  async function clearList() {
    setSelected(new Set());
    await AsyncStorage.removeItem(SHOPPING_KEY);
  }

  async function exportShoppingList() {
    if (selected.size === 0) return;
    setExporting(true);
    try {
      const picked = foods.filter(f => selected.has(f.id));
      const html = buildShoppingListHtml(picked);
      const { uri } = await Print.printToFileAsync({ html });
      if (await Sharing.isAvailableAsync()) {
        await Sharing.shareAsync(uri, { mimeType: 'application/pdf', dialogTitle: 'Liste de courses' });
      }
    } catch (e) {
      Alert.alert('Erreur', 'Impossible de générer le PDF.');
      console.error(e);
    } finally {
      setExporting(false);
    }
  }

  const visible = foods.filter(f => {
    const matchSearch = f.nom.toLowerCase().includes(search.toLowerCase());
    const matchFilter = filter ? f.liste === filter : true;
    return matchSearch && matchFilter;
  });

  const hint = currentPhase ? PHASE_HINT[currentPhase] : undefined;

  if (loading) {
    return <View style={s.centered}><ActivityIndicator color={theme.colors.inkSoft} /></View>;
  }

  return (
    <View style={s.root}>

      {/* ── HEADER ── */}
      <View style={s.header}>
        <View style={s.headerTopRow}>
          <Text style={s.eyebrow}>ALIMENTATION</Text>
          <TouchableOpacity onPress={() => router.push('/add-food' as never)} style={s.addBtn}>
            <Text style={s.addBtnText}>+ AJOUTER</Text>
          </TouchableOpacity>
        </View>
        <Text style={s.title}>Listes{'\n'}aliments.</Text>
      </View>

      <View style={s.divider} />

      {/* ── PHASE HINT ── */}
      {hint && (
        <View style={s.hintBanner}>
          <Text style={s.hintText}>{hint.text}</Text>
          <View style={s.hintDots}>
            {hint.highlight.map(l => (
              <View key={l} style={[s.hintDot, { backgroundColor: LIST_DOT[l] }]} />
            ))}
          </View>
        </View>
      )}

      {/* ── SEARCH ── */}
      <View style={s.searchWrap}>
        <TextInput
          style={s.search}
          value={search}
          onChangeText={setSearch}
          placeholder={strings.foods.searchPlaceholder}
          placeholderTextColor={theme.colors.inkMuted}
          accessibilityLabel={strings.foods.searchPlaceholder}
          clearButtonMode="while-editing"
        />
      </View>

      {/* ── FILTER TABS ── */}
      <View style={s.filterRow}>
        <FilterBtn label="TOUS" active={filter === null} onPress={() => setFilter(null)} />
        {LIST_ORDER.map(l => (
          <FilterBtn
            key={l}
            label={LIST_LABEL[l]}
            active={filter === l}
            suggested={hint?.highlight.includes(l)}
            onPress={() => setFilter(prev => prev === l ? null : l)}
            dot={LIST_DOT[l]}
          />
        ))}
      </View>

      <View style={s.listDivider} />

      {/* ── LIST ── */}
      <FlatList
        data={visible}
        keyExtractor={item => item.id}
        contentContainerStyle={[s.list, selected.size > 0 && s.listWithFooter]}
        ListEmptyComponent={<Text style={s.empty}>{strings.foods.emptySearch}</Text>}
        renderItem={({ item }) => (
          <FoodRow
            food={item}
            isSelected={selected.has(item.id)}
            onToggle={() => toggleSelect(item.id)}
            onLongPress={item.id.startsWith('custom_') ? () => handleDeleteCustom(item.id) : undefined}
          />
        )}
        keyboardShouldPersistTaps="handled"
      />

      {/* ── FOOTER LISTE DE COURSES ── */}
      {selected.size > 0 && (
        <View style={s.footer}>
          <View style={s.footerInfo}>
            <Text style={s.footerCount}>{selected.size}</Text>
            <Text style={s.footerLabel}>{selected.size > 1 ? 'ALIMENTS SÉLECTIONNÉS' : 'ALIMENT SÉLECTIONNÉ'}</Text>
          </View>
          <TouchableOpacity style={s.footerClear} onPress={clearList}>
            <Text style={s.footerClearText}>VIDER</Text>
          </TouchableOpacity>
          <TouchableOpacity style={[s.footerExport, exporting && s.footerExportDisabled]} onPress={exportShoppingList} disabled={exporting}>
            <Text style={s.footerExportText}>{exporting ? '…' : 'TÉLÉCHARGER'}</Text>
          </TouchableOpacity>
        </View>
      )}
    </View>
  );
}

function FoodRow({ food, isSelected, onToggle, onLongPress }: { food: Food; isSelected: boolean; onToggle: () => void; onLongPress?: () => void }) {
  const isCustom = food.id.startsWith('custom_');
  return (
    <TouchableOpacity style={[s.row, isSelected && s.rowSelected]} onPress={onToggle} onLongPress={onLongPress} activeOpacity={0.7}>
      <View style={[s.dot, { backgroundColor: LIST_DOT[food.liste] }]} />
      <Text style={[s.rowName, isSelected && s.rowNameSelected]}>{food.nom}</Text>
      {isCustom && <Text style={s.customTag}>PERSO</Text>}
      {food.ig !== null && food.ig > 0 && (
        <Text style={s.ig}>IG {food.ig}</Text>
      )}
      <View style={[s.checkbox, isSelected && s.checkboxOn]}>
        {isSelected && <Text style={s.checkmark}>✓</Text>}
      </View>
    </TouchableOpacity>
  );
}

function buildShoppingListHtml(foods: Food[]): string {
  const byList: Record<FoodList, Food[]> = { verte: [], jaune: [], orange: [], rouge: [] };
  foods.forEach(f => byList[f.liste].push(f));

  const generatedAt = new Date().toLocaleDateString('fr-FR', { day: 'numeric', month: 'long', year: 'numeric' });

  const sections = (['verte', 'jaune', 'orange', 'rouge'] as FoodList[])
    .filter(l => byList[l].length > 0)
    .map(l => {
      const label = LIST_LABEL[l];
      const color = LIST_DOT[l];
      const items = byList[l].map(f => `
        <li>
          <span class="box"></span>
          <span class="name">${f.nom}</span>
          ${f.ig !== null && f.ig > 0 ? `<span class="ig">IG ${f.ig}</span>` : ''}
        </li>`).join('');
      return `
        <div class="section">
          <div class="section-header">
            <span class="dot" style="background:${color}"></span>
            <span class="section-title">LISTE ${label}</span>
            <span class="section-count">${byList[l].length} aliment${byList[l].length > 1 ? 's' : ''}</span>
          </div>
          <ul>${items}</ul>
        </div>`;
    }).join('');

  return `<!DOCTYPE html>
<html lang="fr">
<head>
<meta charset="UTF-8" />
<style>
  * { box-sizing: border-box; margin: 0; padding: 0; }
  body {
    font-family: Georgia, 'Times New Roman', serif;
    font-size: 12pt; color: #121E30; background: #fff;
    padding: 24mm 20mm; line-height: 1.5;
  }
  .header { border-bottom: 2px solid #121E30; padding-bottom: 14px; margin-bottom: 24px; }
  .title { font-size: 28pt; letter-spacing: -1px; margin-bottom: 4px; }
  .meta {
    font-family: 'Courier New', monospace; font-size: 8pt;
    color: #7A6E62; letter-spacing: 1.5px; text-transform: uppercase;
  }
  .section { margin-bottom: 22px; page-break-inside: avoid; }
  .section-header {
    display: flex; align-items: center; gap: 8px;
    border-bottom: 1px solid #D4C8B8; padding-bottom: 6px; margin-bottom: 10px;
  }
  .dot { display: inline-block; width: 10px; height: 10px; }
  .section-title {
    flex: 1;
    font-family: 'Courier New', monospace; font-size: 9pt;
    color: #121E30; letter-spacing: 2px;
  }
  .section-count {
    font-family: 'Courier New', monospace; font-size: 8pt;
    color: #9A8E80; letter-spacing: 1px;
  }
  ul { list-style: none; }
  li {
    display: flex; align-items: center; gap: 10px;
    padding: 6px 0; border-bottom: 1px dotted #E8E0D4;
    font-size: 11pt;
  }
  .box {
    width: 12px; height: 12px;
    border: 1.5px solid #121E30; flex-shrink: 0;
  }
  .name { flex: 1; }
  .ig {
    font-family: 'Courier New', monospace; font-size: 8pt;
    color: #9A8E80; letter-spacing: 0.5px;
  }
  .footer {
    margin-top: 30px; padding-top: 10px;
    border-top: 1px solid #D4C8B8;
    font-family: 'Courier New', monospace; font-size: 7.5pt;
    color: #9A8E80; letter-spacing: 0.3px;
  }
</style>
</head>
<body>
  <div class="header">
    <div class="title">Liste de courses</div>
    <div class="meta">Méthode KMDC · ${generatedAt} · ${foods.length} aliment${foods.length > 1 ? 's' : ''}</div>
  </div>
  ${sections}
  <div class="footer">
    Cochez vos aliments au fur et à mesure. Listes verte et jaune à privilégier au quotidien.
  </div>
</body>
</html>`;
}

function FilterBtn({
  label, active, onPress, dot, suggested,
}: {
  label: string; active: boolean; onPress: () => void; dot?: string; suggested?: boolean;
}) {
  return (
    <TouchableOpacity
      style={[s.filterBtn, active && s.filterBtnOn, !active && suggested && s.filterBtnSuggested]}
      onPress={onPress}
      accessibilityLabel={label}
    >
      {dot && <View style={[s.filterDot, { backgroundColor: dot }]} />}
      <Text style={[s.filterText, active && s.filterTextOn, !active && suggested && s.filterTextSuggested]}>
        {label}
      </Text>
    </TouchableOpacity>
  );
}

const s = StyleSheet.create({
  root:    { flex: 1, backgroundColor: theme.colors.app },
  centered:{ flex: 1, alignItems: 'center', justifyContent: 'center' },

  header:        { paddingTop: theme.spacing.xxl, paddingHorizontal: theme.spacing.lg, paddingBottom: theme.spacing.lg },
  headerTopRow:  { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 14 },
  eyebrow:       { fontFamily: theme.fontFamily.mono, fontSize: theme.fontSize.xs, color: theme.colors.inkMuted, letterSpacing: 2 },
  addBtn:        { paddingHorizontal: 12, paddingVertical: 6, borderWidth: 1, borderColor: theme.colors.ink },
  addBtnText:    { fontFamily: theme.fontFamily.mono, fontSize: 9, color: theme.colors.ink, letterSpacing: 1.5 },
  title:   { fontFamily: theme.fontFamily.display, fontSize: theme.fontSize.display, lineHeight: theme.fontSize.display * 0.9, color: theme.colors.ink, letterSpacing: -2 },

  divider:     { height: 1, backgroundColor: theme.colors.ink, marginHorizontal: theme.spacing.lg },
  listDivider: { height: 1, backgroundColor: theme.colors.line },

  hintBanner: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    paddingHorizontal: theme.spacing.lg, paddingVertical: 8,
    borderBottomWidth: 1, borderBottomColor: theme.colors.lineSoft,
  },
  hintText: { fontFamily: theme.fontFamily.mono, fontSize: 9, color: theme.colors.inkSoft, letterSpacing: 1, flex: 1 },
  hintDots: { flexDirection: 'row', gap: 4 },
  hintDot:  { width: 6, height: 6 },

  searchWrap: { paddingHorizontal: theme.spacing.lg, paddingTop: theme.spacing.lg, paddingBottom: theme.spacing.sm },
  search: {
    fontFamily: theme.fontFamily.mono, fontSize: theme.fontSize.sm,
    color: theme.colors.ink,
    borderBottomWidth: 1, borderBottomColor: theme.colors.ink,
    paddingVertical: 10,
    letterSpacing: 0.5,
  },

  filterRow: {
    flexDirection: 'row', gap: 0,
    paddingHorizontal: theme.spacing.lg, paddingVertical: theme.spacing.sm,
  },
  filterBtn:          { flexDirection: 'row', alignItems: 'center', gap: 4, paddingHorizontal: 8, paddingVertical: 7, borderWidth: 1, borderColor: theme.colors.line, marginRight: 5 },
  filterBtnOn:        { borderColor: theme.colors.ink, backgroundColor: theme.colors.ink },
  filterBtnSuggested: { borderColor: theme.colors.inkSoft },
  filterDot:          { width: 6, height: 6 },
  filterText:          { fontFamily: theme.fontFamily.mono, fontSize: 9, color: theme.colors.inkMuted, letterSpacing: 1.5 },
  filterTextOn:        { color: theme.colors.invertInk },
  filterTextSuggested: { color: theme.colors.inkSoft },

  list:           { paddingBottom: theme.spacing.xl },
  listWithFooter: { paddingBottom: 88 },
  row: {
    flexDirection: 'row', alignItems: 'center', gap: 12,
    paddingHorizontal: theme.spacing.lg, paddingVertical: 14,
    borderBottomWidth: 1, borderBottomColor: theme.colors.line,
    minHeight: theme.touchTarget,
  },
  rowSelected:     { backgroundColor: theme.colors.lineSoft },
  dot:             { width: 6, height: 6, flexShrink: 0 },
  rowName:         { flex: 1, fontFamily: theme.fontFamily.display, fontSize: theme.fontSize.md, color: theme.colors.ink },
  rowNameSelected: { fontStyle: 'italic' },
  customTag:       { fontFamily: theme.fontFamily.mono, fontSize: 8, color: theme.colors.inkSoft, letterSpacing: 1.5, borderWidth: 1, borderColor: theme.colors.line, paddingHorizontal: 5, paddingVertical: 1 },
  ig:              { fontFamily: theme.fontFamily.mono, fontSize: 9, color: theme.colors.inkMuted, letterSpacing: 1 },
  checkbox: {
    width: 22, height: 22, borderWidth: 1.5, borderColor: theme.colors.line,
    alignItems: 'center', justifyContent: 'center', flexShrink: 0,
  },
  checkboxOn: { backgroundColor: theme.colors.ink, borderColor: theme.colors.ink },
  checkmark:  { color: theme.colors.invertInk, fontSize: 12 },

  empty: { fontFamily: theme.fontFamily.mono, fontSize: theme.fontSize.xs, color: theme.colors.inkMuted, fontStyle: 'italic', textAlign: 'center', marginTop: theme.spacing.xl, letterSpacing: 1 },

  footer: {
    position: 'absolute', left: 0, right: 0, bottom: 0,
    flexDirection: 'row', alignItems: 'center', gap: 0,
    backgroundColor: theme.colors.app,
    borderTopWidth: 1, borderTopColor: theme.colors.ink,
    paddingHorizontal: theme.spacing.lg, paddingVertical: 12,
  },
  footerInfo:        { flex: 1, flexDirection: 'row', alignItems: 'baseline', gap: 8 },
  footerCount:       { fontFamily: theme.fontFamily.display, fontSize: theme.fontSize.xl, color: theme.colors.ink, letterSpacing: -0.5 },
  footerLabel:       { fontFamily: theme.fontFamily.mono, fontSize: 9, color: theme.colors.inkMuted, letterSpacing: 1.5 },
  footerClear:       { paddingHorizontal: 14, paddingVertical: 12, borderWidth: 1, borderColor: theme.colors.line, marginRight: 8 },
  footerClearText:   { fontFamily: theme.fontFamily.mono, fontSize: 10, color: theme.colors.inkMuted, letterSpacing: 1.5 },
  footerExport:      { paddingHorizontal: 14, paddingVertical: 12, backgroundColor: theme.colors.ink },
  footerExportDisabled: { opacity: 0.5 },
  footerExportText:  { fontFamily: theme.fontFamily.mono, fontSize: 10, color: theme.colors.invertInk, letterSpacing: 1.5 },
});
