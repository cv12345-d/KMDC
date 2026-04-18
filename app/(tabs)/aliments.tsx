import { useEffect, useState } from 'react';
import {
  View, Text, TextInput, TouchableOpacity, StyleSheet,
  FlatList, ActivityIndicator,
} from 'react-native';
import { theme } from '../../lib/theme';
import { strings } from '../../lib/strings';
import { getFoods, type Food, type FoodList } from '../../lib/foods';

const LIST_ORDER: FoodList[] = ['verte', 'orange', 'rouge'];

const LIST_COLORS: Record<FoodList, string> = {
  verte:  '#3A7D44',
  orange: '#C07A2A',
  rouge:  '#B03030',
};

const LIST_BG: Record<FoodList, string> = {
  verte:  '#EAF5EB',
  orange: '#FBF0E2',
  rouge:  '#FAEAEA',
};

export default function AlimentsScreen() {
  const [foods,   setFoods]   = useState<Food[]>([]);
  const [search,  setSearch]  = useState('');
  const [filter,  setFilter]  = useState<FoodList | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    getFoods()
      .then(setFoods)
      .finally(() => setLoading(false));
  }, []);

  const visible = foods.filter(f => {
    const matchSearch = f.nom.toLowerCase().includes(search.toLowerCase());
    const matchFilter = filter ? f.liste === filter : true;
    return matchSearch && matchFilter;
  });

  if (loading) {
    return (
      <View style={styles.centered}>
        <ActivityIndicator color={theme.colors.primary} />
      </View>
    );
  }

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.title}>{strings.foods.title}</Text>
        <TextInput
          style={styles.search}
          value={search}
          onChangeText={setSearch}
          placeholder={strings.foods.searchPlaceholder}
          placeholderTextColor={theme.colors.textMuted}
          accessibilityLabel={strings.foods.searchPlaceholder}
          clearButtonMode="while-editing"
        />

        {/* Filter tabs */}
        <View style={styles.filterRow}>
          <FilterBtn label="Tous" active={filter === null} onPress={() => setFilter(null)} color={theme.colors.primary} />
          {LIST_ORDER.map(l => (
            <FilterBtn
              key={l}
              label={l.charAt(0).toUpperCase() + l.slice(1)}
              active={filter === l}
              onPress={() => setFilter(prev => prev === l ? null : l)}
              color={LIST_COLORS[l]}
            />
          ))}
        </View>
      </View>

      {/* List */}
      <FlatList
        data={visible}
        keyExtractor={item => item.id}
        contentContainerStyle={styles.list}
        ListEmptyComponent={<Text style={styles.empty}>{strings.foods.emptySearch}</Text>}
        renderItem={({ item }) => <FoodRow food={item} />}
        keyboardShouldPersistTaps="handled"
      />
    </View>
  );
}

function FoodRow({ food }: { food: Food }) {
  return (
    <View style={[styles.row, { backgroundColor: LIST_BG[food.liste] }]}>
      <Text style={styles.rowName}>{food.nom}</Text>
      <View style={[styles.igBadge, { backgroundColor: LIST_COLORS[food.liste] }]}>
        <Text style={styles.igText}>{strings.foods.igLabel} {food.ig}</Text>
      </View>
    </View>
  );
}

function FilterBtn({
  label, active, onPress, color,
}: {
  label: string; active: boolean; onPress: () => void; color: string;
}) {
  return (
    <TouchableOpacity
      style={[styles.filterBtn, active && { backgroundColor: color, borderColor: color }]}
      onPress={onPress}
      accessibilityLabel={label}
    >
      <Text style={[styles.filterText, active && styles.filterTextActive]}>{label}</Text>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: theme.colors.background },
  centered:  { flex: 1, alignItems: 'center', justifyContent: 'center' },
  header: {
    backgroundColor: theme.colors.backgroundHeader,
    paddingTop: theme.spacing.xxl,
    paddingHorizontal: theme.spacing.lg,
    paddingBottom: theme.spacing.md,
    gap: theme.spacing.sm,
  },
  title: { fontSize: theme.fontSize.xl, color: theme.colors.textDark },
  search: {
    backgroundColor: theme.colors.card,
    borderWidth: 1.5, borderColor: theme.colors.border,
    borderRadius: theme.borderRadius.md,
    padding: theme.spacing.md, fontSize: theme.fontSize.md,
    color: theme.colors.textDark, minHeight: theme.touchTarget,
  },
  filterRow: { flexDirection: 'row', gap: theme.spacing.sm, flexWrap: 'wrap' },
  filterBtn: {
    paddingHorizontal: theme.spacing.md, paddingVertical: 8,
    borderRadius: theme.borderRadius.full,
    borderWidth: 1.5, borderColor: theme.colors.border,
    minHeight: 36,
  },
  filterText:       { fontSize: theme.fontSize.sm, color: theme.colors.textSoft },
  filterTextActive: { color: '#FFF' },
  list: { padding: theme.spacing.md, gap: theme.spacing.sm },
  row: {
    flexDirection: 'row', alignItems: 'center',
    padding: theme.spacing.md, borderRadius: theme.borderRadius.md,
    minHeight: theme.touchTarget,
  },
  rowName:  { flex: 1, fontSize: theme.fontSize.md, color: theme.colors.textDark },
  igBadge: {
    paddingHorizontal: theme.spacing.sm, paddingVertical: 4,
    borderRadius: theme.borderRadius.sm,
  },
  igText:   { fontSize: theme.fontSize.xs, color: '#FFF' },
  empty:    { textAlign: 'center', color: theme.colors.textMuted, fontStyle: 'italic', marginTop: theme.spacing.xl },
});
