import { useEffect, useState, useCallback } from 'react';
import {
  View, Text, TextInput, TouchableOpacity, StyleSheet,
  FlatList, ActivityIndicator,
} from 'react-native';
import { useFocusEffect } from 'expo-router';
import { theme } from '../../lib/theme';
import { strings } from '../../lib/strings';
import { getFoods, type Food, type FoodList } from '../../lib/foods';
import { getUser } from '../../lib/auth';
import { getCurrentPhase } from '../../lib/parcours';
import { phaseNumberFr, type PhaseName } from '../../lib/phases';

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

  useEffect(() => {
    getFoods()
      .then(setFoods)
      .finally(() => setLoading(false));
  }, []);

  useFocusEffect(useCallback(() => {
    (async () => {
      const user = await getUser();
      if (!user) return;
      const phase = await getCurrentPhase(user.id);
      setCurrentPhase(phase?.phase ?? null);
    })();
  }, []));

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
        <Text style={s.eyebrow}>ALIMENTATION</Text>
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
        contentContainerStyle={s.list}
        ListEmptyComponent={<Text style={s.empty}>{strings.foods.emptySearch}</Text>}
        renderItem={({ item }) => <FoodRow food={item} />}
        keyboardShouldPersistTaps="handled"
      />
    </View>
  );
}

function FoodRow({ food }: { food: Food }) {
  return (
    <View style={s.row}>
      <View style={[s.dot, { backgroundColor: LIST_DOT[food.liste] }]} />
      <Text style={s.rowName}>{food.nom}</Text>
      {food.ig !== null && food.ig > 0 && (
        <Text style={s.ig}>IG {food.ig}</Text>
      )}
    </View>
  );
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

  header:  { paddingTop: theme.spacing.xxl, paddingHorizontal: theme.spacing.lg, paddingBottom: theme.spacing.lg },
  eyebrow: { fontFamily: theme.fontFamily.mono, fontSize: theme.fontSize.xs, color: theme.colors.inkMuted, letterSpacing: 2, marginBottom: 14 },
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

  list: { paddingBottom: theme.spacing.xl },
  row: {
    flexDirection: 'row', alignItems: 'center', gap: 12,
    paddingHorizontal: theme.spacing.lg, paddingVertical: 14,
    borderBottomWidth: 1, borderBottomColor: theme.colors.line,
    minHeight: theme.touchTarget,
  },
  dot:     { width: 6, height: 6, flexShrink: 0 },
  rowName: { flex: 1, fontFamily: theme.fontFamily.display, fontSize: theme.fontSize.md, color: theme.colors.ink },
  ig:      { fontFamily: theme.fontFamily.mono, fontSize: 9, color: theme.colors.inkMuted, letterSpacing: 1 },

  empty: { fontFamily: theme.fontFamily.mono, fontSize: theme.fontSize.xs, color: theme.colors.inkMuted, fontStyle: 'italic', textAlign: 'center', marginTop: theme.spacing.xl, letterSpacing: 1 },
});
