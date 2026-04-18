import { useEffect, useState, useCallback } from 'react';
import {
  View, Text, TextInput, TouchableOpacity, StyleSheet,
  ScrollView, ActivityIndicator, useWindowDimensions,
} from 'react-native';
import { useFocusEffect } from 'expo-router';
import { LineChart } from 'react-native-gifted-charts';
import { theme } from '../../lib/theme';
import { strings } from '../../lib/strings';
import { getUser, getProfile } from '../../lib/auth';
import { getLast30Entries, getTodayEntry, upsertWeight, type WeightEntry } from '../../lib/weight';

export default function SuiviScreen() {
  const { width } = useWindowDimensions();
  const chartWidth = width - theme.spacing.lg * 2 - 2;

  const [userId,       setUserId]       = useState<string | null>(null);
  const [poidsInitial, setPoidsInitial] = useState<number | null>(null);
  const [poidsObjectif,setPoidsObjectif]= useState<number | null>(null);
  const [entries,      setEntries]      = useState<WeightEntry[]>([]);
  const [todayEntry,   setTodayEntry]   = useState<WeightEntry | null>(null);
  const [input,        setInput]        = useState('');
  const [editMode,     setEditMode]     = useState(false);
  const [loading,      setLoading]      = useState(true);
  const [saving,       setSaving]       = useState(false);
  const [saved,        setSaved]        = useState(false);
  const [error,        setError]        = useState('');

  useFocusEffect(useCallback(() => {
    load();
  }, []));

  async function load() {
    setLoading(true);
    try {
      const user = await getUser();
      if (!user) return;
      setUserId(user.id);

      const [profile, hist, today] = await Promise.all([
        getProfile(user.id),
        getLast30Entries(user.id),
        getTodayEntry(user.id),
      ]);

      setPoidsInitial(profile.poids_initial_kg ?? null);
      setPoidsObjectif(profile.poids_objectif_kg ?? null);
      setEntries(hist);
      setTodayEntry(today);
      if (today) {
        setInput(String(today.poids_kg).replace('.', ','));
        setEditMode(false);
      } else {
        setInput('');
        setEditMode(true);
      }
    } finally {
      setLoading(false);
    }
  }

  async function handleSave() {
    if (!userId) return;
    setError('');
    const val = parseFloat(input.replace(',', '.'));
    if (isNaN(val) || val < 20 || val > 300) {
      setError(strings.weight.errorInvalid);
      return;
    }
    setSaving(true);
    try {
      await upsertWeight(userId, val);
      setSaved(true);
      setEditMode(false);
      setTimeout(() => setSaved(false), 3000);
      await load();
    } catch {
      setError(strings.errors.networkError);
    } finally {
      setSaving(false);
    }
  }

  const currentWeight = todayEntry?.poids_kg
    ?? (entries.length ? entries[entries.length - 1].poids_kg : null);

  const chartData = entries.map(e => ({
    value: e.poids_kg,
    label: e.date_mesure.slice(5).replace('-', '/'),
    dataPointText: '',
  }));

  if (loading) {
    return <View style={styles.centered}><ActivityIndicator color={theme.colors.primary} /></View>;
  }

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.scroll}>
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.title}>{strings.weight.title}</Text>

        {/* Stats row */}
        <View style={styles.statsRow}>
          <StatCard label={strings.weight.initialLabel} value={poidsInitial} />
          <StatCard label={strings.weight.currentLabel} value={currentWeight} highlight />
          <StatCard label={strings.weight.goalLabel}    value={poidsObjectif} />
        </View>
      </View>

      <View style={styles.body}>
        {/* Entry form */}
        <View style={styles.card}>
          <Text style={styles.cardLabel}>{strings.weight.labelToday}</Text>
          <View style={styles.inputRow}>
            <TextInput
              style={[styles.input, !editMode && styles.inputReadOnly]}
              value={input}
              onChangeText={setInput}
              placeholder={strings.weight.placeholder}
              placeholderTextColor={theme.colors.textMuted}
              keyboardType="decimal-pad"
              editable={editMode}
              accessibilityLabel={strings.weight.labelToday}
            />
            <Text style={styles.unit}>{strings.weight.kgUnit}</Text>
          </View>

          {error  ? <Text style={styles.error}>{error}</Text>  : null}
          {saved  ? <Text style={styles.saved}>{strings.weight.savedMessage}</Text> : null}

          {editMode ? (
            <TouchableOpacity
              style={[styles.btn, saving && styles.btnDisabled]}
              onPress={handleSave}
              disabled={saving}
              accessibilityLabel={strings.weight.btnSave}
            >
              <Text style={styles.btnText}>
                {saving ? strings.weight.saving : strings.weight.btnSave}
              </Text>
            </TouchableOpacity>
          ) : (
            <TouchableOpacity
              style={styles.btnGhost}
              onPress={() => setEditMode(true)}
              accessibilityLabel={strings.weight.btnEdit}
            >
              <Text style={styles.btnGhostText}>{strings.weight.btnEdit}</Text>
            </TouchableOpacity>
          )}
        </View>

        {/* Chart */}
        {chartData.length > 1 ? (
          <View style={styles.card}>
            <Text style={styles.cardTitle}>{strings.weight.chartTitle}</Text>
            <LineChart
              data={chartData}
              width={chartWidth - theme.spacing.md * 2}
              height={180}
              color={theme.colors.primary}
              thickness={2}
              dataPointsColor={theme.colors.primary}
              dataPointsRadius={4}
              startFillColor={theme.colors.accent}
              endFillColor={theme.colors.background}
              startOpacity={0.25}
              endOpacity={0.02}
              areaChart
              curved
              hideRules
              xAxisLabelTextStyle={{ color: theme.colors.textMuted, fontSize: 10 }}
              yAxisTextStyle={{ color: theme.colors.textMuted, fontSize: 10 }}
              yAxisColor="transparent"
              xAxisColor={theme.colors.border}
              noOfSections={4}
              hideDataPoints={chartData.length > 15}
            />
          </View>
        ) : (
          <View style={styles.card}>
            <Text style={styles.empty}>{strings.weight.noData}</Text>
          </View>
        )}
      </View>
    </ScrollView>
  );
}

function StatCard({ label, value, highlight }: { label: string; value: number | null; highlight?: boolean }) {
  return (
    <View style={[statStyles.card, highlight && statStyles.cardHighlight]}>
      <Text style={[statStyles.value, highlight && statStyles.valueHighlight]}>
        {value != null ? `${value} kg` : '—'}
      </Text>
      <Text style={statStyles.label}>{label}</Text>
    </View>
  );
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
    gap: theme.spacing.md,
  },
  title: { fontSize: theme.fontSize.xl, color: theme.colors.textDark },
  statsRow: { flexDirection: 'row', gap: theme.spacing.sm },
  body: { padding: theme.spacing.lg, gap: theme.spacing.md },
  card: {
    backgroundColor: theme.colors.card, borderRadius: theme.borderRadius.lg,
    borderWidth: 1, borderColor: theme.colors.border,
    padding: theme.spacing.md, gap: theme.spacing.sm,
  },
  cardLabel: { fontSize: theme.fontSize.sm, color: theme.colors.textSoft },
  cardTitle: { fontSize: theme.fontSize.sm, color: theme.colors.textMuted, textTransform: 'uppercase', letterSpacing: 1 },
  inputRow:  { flexDirection: 'row', alignItems: 'center', gap: theme.spacing.sm },
  input: {
    flex: 1, backgroundColor: theme.colors.inputBg,
    borderWidth: 1.5, borderColor: theme.colors.border,
    borderRadius: theme.borderRadius.md,
    padding: theme.spacing.md, fontSize: theme.fontSize.lg,
    color: theme.colors.textDark, minHeight: theme.touchTarget,
  },
  inputReadOnly: { backgroundColor: theme.colors.background, borderColor: 'transparent' },
  unit:   { fontSize: theme.fontSize.md, color: theme.colors.textMuted, width: 28 },
  error:  { fontSize: theme.fontSize.sm, color: '#C0392B' },
  saved:  { fontSize: theme.fontSize.sm, color: theme.colors.primary, fontStyle: 'italic' },
  empty:  { fontSize: theme.fontSize.sm, color: theme.colors.textMuted, fontStyle: 'italic', textAlign: 'center', padding: theme.spacing.md },
  btn: {
    backgroundColor: theme.colors.primary, borderRadius: theme.borderRadius.md,
    padding: theme.spacing.md, alignItems: 'center', minHeight: theme.touchTarget,
  },
  btnDisabled: { opacity: 0.6 },
  btnText:     { color: '#FFF', fontSize: theme.fontSize.md },
  btnGhost: {
    borderWidth: 1.5, borderColor: theme.colors.border,
    borderRadius: theme.borderRadius.md, padding: theme.spacing.md,
    alignItems: 'center', minHeight: theme.touchTarget,
  },
  btnGhostText: { fontSize: theme.fontSize.sm, color: theme.colors.textMuted },
});

const statStyles = StyleSheet.create({
  card: {
    flex: 1, backgroundColor: theme.colors.card,
    borderRadius: theme.borderRadius.md, padding: theme.spacing.sm,
    alignItems: 'center', borderWidth: 1, borderColor: theme.colors.border,
  },
  cardHighlight: { backgroundColor: theme.colors.primary, borderColor: theme.colors.primary },
  value:          { fontSize: theme.fontSize.md, color: theme.colors.textDark },
  valueHighlight: { color: '#FFF' },
  label:          { fontSize: theme.fontSize.xs, color: theme.colors.textMuted, textAlign: 'center' },
});
