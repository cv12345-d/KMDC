import { useState, useCallback } from 'react';
import {
  View, Text, TextInput, TouchableOpacity, StyleSheet,
  ScrollView, ActivityIndicator, useWindowDimensions,
} from 'react-native';
import { useFocusEffect } from 'expo-router';
import Svg, { Path, Line as SvgLine, Text as SvgText, Defs, LinearGradient as SvgGradient, Stop } from 'react-native-svg';
import { theme } from '../../lib/theme';
import { strings } from '../../lib/strings';
import { getUser, getProfile } from '../../lib/auth';
import { getLast30Entries, getTodayEntry, upsertWeight, type WeightEntry } from '../../lib/weight';
import {
  getTodayMeasurement, getLast6Measurements, upsertMeasurement,
  EMPTY_MEASURE_DRAFT, type MeasurementEntry, type MeasurementDraft,
} from '../../lib/measurements';

function WeightLineChart({ data, data2, width, height, color, color2 }: {
  data:   Array<{ value: number; label: string }>;
  data2:  Array<{ value: number; label: string }>;
  width:  number;
  height: number;
  color:  string;
  color2: string;
}) {
  if (data.length < 2) return null;
  const PL = 30, PB = 18, PT = 6;
  const cW = width - PL, cH = height - PB - PT;
  const all = [...data.map(d => d.value), ...data2.map(d => d.value)];
  const minV = Math.min(...all) - 0.3;
  const maxV = Math.max(...all) + 0.3;
  const range = maxV - minV || 1;
  const tx = (i: number, len: number) => PL + (i / Math.max(len - 1, 1)) * cW;
  const ty = (v: number) => PT + ((maxV - v) / range) * cH;
  const mkPath = (pts: Array<{ value: number }>) =>
    pts.map((p, i) => `${i === 0 ? 'M' : 'L'}${tx(i, pts.length).toFixed(1)},${ty(p.value).toFixed(1)}`).join(' ');
  const p1 = mkPath(data);
  const p2 = mkPath(data2);
  const area = `${p1} L${tx(data.length - 1, data.length).toFixed(1)},${(PT + cH).toFixed(1)} L${PL},${(PT + cH).toFixed(1)} Z`;
  const xStep = Math.max(1, Math.floor(data.length / 5));
  const yTicks = [0, 0.25, 0.5, 0.75, 1].map(f => minV + f * range);
  return (
    <Svg width={width} height={height}>
      <Defs>
        <SvgGradient id="wg" x1="0" y1="0" x2="0" y2="1">
          <Stop offset="0" stopColor={color} stopOpacity="0.1" />
          <Stop offset="1" stopColor={color} stopOpacity="0" />
        </SvgGradient>
      </Defs>
      <SvgLine x1={PL} y1={PT + cH} x2={width} y2={PT + cH} stroke={theme.colors.line} strokeWidth={1} />
      {yTicks.map((v, i) => (
        <SvgText key={i} x={PL - 4} y={ty(v) + 3} textAnchor="end" fontSize={8} fill={theme.colors.inkMuted} fontFamily={theme.fontFamily.mono}>
          {v.toFixed(1)}
        </SvgText>
      ))}
      <Path d={area} fill="url(#wg)" />
      {data2.length > 1 && <Path d={p2} stroke={color2} strokeWidth={1} fill="none" />}
      <Path d={p1} stroke={color} strokeWidth={2} fill="none" />
      {data.map((d, i) => {
        if (i % xStep !== 0 && i !== data.length - 1) return null;
        return (
          <SvgText key={i} x={tx(i, data.length)} y={PT + cH + 13} textAnchor="middle" fontSize={8} fill={theme.colors.inkMuted} fontFamily={theme.fontFamily.mono}>
            {d.label}
          </SvgText>
        );
      })}
    </Svg>
  );
}

function movingAverage(entries: WeightEntry[], window = 7) {
  return entries.map((e, i) => {
    const start = Math.max(0, i - window + 1);
    const slice = entries.slice(start, i + 1);
    const avg = slice.reduce((sum, x) => sum + x.poids_kg, 0) / slice.length;
    return {
      value: +avg.toFixed(2),
      label: e.date_mesure.slice(5).replace('-', '/'),
      dataPointText: '',
    };
  });
}

export default function SuiviScreen() {
  const { width } = useWindowDimensions();
  const chartWidth = width - theme.spacing.lg * 2 - 2;

  const [userId,        setUserId]        = useState<string | null>(null);
  const [poidsInitial,  setPoidsInitial]  = useState<number | null>(null);
  const [poidsObjectif, setPoidsObjectif] = useState<number | null>(null);
  const [entries,       setEntries]       = useState<WeightEntry[]>([]);
  const [todayEntry,    setTodayEntry]    = useState<WeightEntry | null>(null);
  const [input,         setInput]         = useState('');
  const [editMode,      setEditMode]      = useState(false);
  const [loading,       setLoading]       = useState(true);
  const [saving,        setSaving]        = useState(false);
  const [saved,         setSaved]         = useState(false);
  const [error,         setError]         = useState('');

  const [measurements,  setMeasurements]  = useState<MeasurementEntry | null>(null);
  const [measHistory,   setMeasHistory]   = useState<MeasurementEntry[]>([]);
  const [measDraft,     setMeasDraft]     = useState<MeasurementDraft>(EMPTY_MEASURE_DRAFT);
  const [measEditMode,  setMeasEditMode]  = useState(false);
  const [measSaving,    setMeasSaving]    = useState(false);
  const [measSaved,     setMeasSaved]     = useState(false);
  const [measError,     setMeasError]     = useState('');

  useFocusEffect(useCallback(() => { load(); }, []));

  async function load() {
    setLoading(true);
    try {
      const user = await getUser();
      if (!user) return;
      setUserId(user.id);
      const [profile, hist, today, todayMeas, measHist] = await Promise.all([
        getProfile(user.id),
        getLast30Entries(user.id),
        getTodayEntry(user.id),
        getTodayMeasurement(user.id),
        getLast6Measurements(user.id),
      ]);
      setPoidsInitial(profile?.poids_initial_kg ?? null);
      setPoidsObjectif(profile?.poids_objectif_kg ?? null);
      setEntries(hist);
      setTodayEntry(today);
      if (today) { setInput(String(today.poids_kg).replace('.', ',')); setEditMode(false); }
      else        { setInput(''); setEditMode(true); }

      setMeasurements(todayMeas);
      setMeasHistory(measHist);
      if (todayMeas) {
        setMeasDraft({
          tour_taille_cm:  todayMeas.tour_taille_cm  != null ? String(todayMeas.tour_taille_cm).replace('.', ',')  : '',
          tour_hanches_cm: todayMeas.tour_hanches_cm != null ? String(todayMeas.tour_hanches_cm).replace('.', ',') : '',
          tour_bras_cm:    todayMeas.tour_bras_cm    != null ? String(todayMeas.tour_bras_cm).replace('.', ',')    : '',
          tour_cuisse_cm:  todayMeas.tour_cuisse_cm  != null ? String(todayMeas.tour_cuisse_cm).replace('.', ',')  : '',
        });
        setMeasEditMode(false);
      } else {
        setMeasDraft(EMPTY_MEASURE_DRAFT);
        setMeasEditMode(false);
      }
    } finally {
      setLoading(false);
    }
  }

  async function handleSave() {
    if (!userId) return;
    setError('');
    const val = parseFloat(input.replace(',', '.'));
    if (isNaN(val) || val < 20 || val > 300) { setError(strings.weight.errorInvalid); return; }
    setSaving(true);
    try {
      await upsertWeight(userId, val);
      setSaved(true); setEditMode(false);
      setTimeout(() => setSaved(false), 3000);
      await load();
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : JSON.stringify(e));
    } finally {
      setSaving(false);
    }
  }

  async function handleSaveMeasurements() {
    if (!userId) return;
    setMeasError('');
    setMeasSaving(true);
    try {
      await upsertMeasurement(userId, measDraft);
      setMeasSaved(true); setMeasEditMode(false);
      setTimeout(() => setMeasSaved(false), 3000);
      const [todayMeas, measHist] = await Promise.all([
        getTodayMeasurement(userId),
        getLast6Measurements(userId),
      ]);
      setMeasurements(todayMeas);
      setMeasHistory(measHist);
    } catch (e: unknown) {
      setMeasError(e instanceof Error ? e.message : JSON.stringify(e));
    } finally {
      setMeasSaving(false);
    }
  }

  const currentWeight = todayEntry?.poids_kg ?? (entries.length ? entries[entries.length - 1].poids_kg : null);
  const delta = poidsInitial != null && currentWeight != null ? +(poidsInitial - currentWeight).toFixed(1) : null;
  const toGo  = poidsObjectif != null && currentWeight != null ? +(currentWeight - poidsObjectif).toFixed(1) : null;

  const rawData = entries.map(e => ({
    value: e.poids_kg,
    label: e.date_mesure.slice(5).replace('-', '/'),
    dataPointText: '',
  }));

  const smoothedData = entries.length >= 3 ? movingAverage(entries) : rawData;

  const measFields: { key: keyof MeasurementDraft; label: string }[] = [
    { key: 'tour_taille_cm',  label: strings.measurements.labelWaist  },
    { key: 'tour_hanches_cm', label: strings.measurements.labelHips   },
    { key: 'tour_bras_cm',    label: strings.measurements.labelArm    },
    { key: 'tour_cuisse_cm',  label: strings.measurements.labelThigh  },
  ];

  if (loading) {
    return <View style={s.centered}><ActivityIndicator color={theme.colors.inkSoft} /></View>;
  }

  return (
    <ScrollView style={s.root} contentContainerStyle={s.scroll}>

      {/* ── HEADER ── */}
      <View style={s.header}>
        <Text style={s.eyebrow}>SUIVI</Text>
        <View style={s.titleRow}>
          <Text style={s.title}>Progrès.</Text>
          {poidsObjectif != null && (
            <View style={s.goalBox}>
              <Text style={s.goalLbl}>OBJECTIF</Text>
              <Text style={s.goalVal}>{poidsObjectif} kg</Text>
            </View>
          )}
        </View>
      </View>

      <View style={s.divider} />

      {/* ── STATS ROW ── */}
      <View style={s.statsRow}>
        {[
          { label: strings.weight.initialLabel, value: poidsInitial },
          { label: strings.weight.currentLabel, value: currentWeight, highlight: true },
          { label: 'Restant',                   value: toGo != null && toGo > 0 ? toGo : null },
        ].map((st, i) => (
          <View key={i} style={[s.statCell, i > 0 && s.statCellBorder]}>
            <Text style={[s.statVal, st.highlight && s.statValHL]}>
              {st.value != null ? `${st.value} kg` : '—'}
            </Text>
            <Text style={s.statLbl}>{st.label.toUpperCase()}</Text>
          </View>
        ))}
      </View>

      <View style={s.body}>

        {/* ── PESÉE ── */}
        <View style={s.section}>
          <Text style={s.sectionLabel}>PESÉE D'AUJOURD'HUI</Text>
          <View style={s.inkDivider} />
          <View style={s.inputRow}>
            <TextInput
              style={[s.weightInput, !editMode && s.weightInputReadOnly]}
              value={input}
              onChangeText={setInput}
              placeholder="—"
              placeholderTextColor={theme.colors.inkMuted}
              keyboardType="decimal-pad"
              editable={editMode}
            />
            <Text style={s.unit}>kg</Text>
          </View>
          {error ? <Text style={s.error}>{error}</Text> : null}
          {saved  ? <Text style={s.savedMsg}>{strings.weight.savedMessage}</Text> : null}
          {editMode ? (
            <TouchableOpacity style={[s.btn, saving && s.btnDisabled]} onPress={handleSave} disabled={saving}>
              <Text style={s.btnText}>{saving ? strings.weight.saving : strings.weight.btnSave.toUpperCase()}</Text>
            </TouchableOpacity>
          ) : (
            <TouchableOpacity style={s.btnGhost} onPress={() => setEditMode(true)}>
              <Text style={s.btnGhostText}>{strings.weight.btnEdit.toUpperCase()}</Text>
            </TouchableOpacity>
          )}
        </View>

        {/* ── GRAPHIQUE POIDS ── */}
        {rawData.length > 1 && (
          <View style={s.section}>
            <View style={s.rowBetween}>
              <Text style={s.sectionLabel}>ÉVOLUTION · 30 JOURS</Text>
              {delta != null && delta > 0 && <Text style={s.deltaChip}>↓ {delta} kg</Text>}
            </View>
            <View style={s.inkDivider} />
            {entries.length >= 3 && (
              <View style={s.chartLegend}>
                <View style={s.legendItem}>
                  <View style={[s.legendLine, s.legendLineMuted]} />
                  <Text style={s.legendText}>BRUT</Text>
                </View>
                <View style={s.legendItem}>
                  <View style={s.legendLine} />
                  <Text style={s.legendText}>LISSÉ 7J</Text>
                </View>
              </View>
            )}
            <View style={s.chartWrap}>
              <WeightLineChart
                data={smoothedData}
                data2={rawData}
                width={chartWidth}
                height={160}
                color={theme.colors.ink}
                color2={theme.colors.inkSoft}
              />
            </View>
          </View>
        )}

        {/* ── MESURES DU CORPS ── */}
        <View style={s.section}>
          <View style={s.rowBetween}>
            <Text style={s.sectionLabel}>{strings.measurements.eyebrow}</Text>
            {measurements && !measEditMode && (
              <TouchableOpacity onPress={() => setMeasEditMode(true)}>
                <Text style={s.linkText}>{strings.measurements.btnEdit.toUpperCase()}</Text>
              </TouchableOpacity>
            )}
          </View>
          <View style={s.inkDivider} />

          {measEditMode || !measurements ? (
            <>
              <View style={s.measGrid}>
                {measFields.map(f => (
                  <View key={f.key} style={s.measCell}>
                    <Text style={s.measLabel}>{f.label.toUpperCase()}</Text>
                    <View style={s.measInputRow}>
                      <TextInput
                        style={s.measInput}
                        value={measDraft[f.key]}
                        onChangeText={v => setMeasDraft(d => ({ ...d, [f.key]: v }))}
                        placeholder="—"
                        placeholderTextColor={theme.colors.inkMuted}
                        keyboardType="decimal-pad"
                      />
                      <Text style={s.measUnit}>cm</Text>
                    </View>
                    <View style={s.measUnderline} />
                  </View>
                ))}
              </View>
              {measError ? <Text style={s.error}>{measError}</Text> : null}
              {measSaved  ? <Text style={s.savedMsg}>{strings.measurements.savedMessage}</Text> : null}
              <View style={s.measBtnRow}>
                {measEditMode && measurements && (
                  <TouchableOpacity style={s.btnGhostSm} onPress={() => setMeasEditMode(false)}>
                    <Text style={s.btnGhostSmText}>{strings.measurements.cancel.toUpperCase()}</Text>
                  </TouchableOpacity>
                )}
                <TouchableOpacity
                  style={[s.btn, measSaving && s.btnDisabled, measEditMode && measurements ? s.btnFlex : null]}
                  onPress={handleSaveMeasurements}
                  disabled={measSaving}
                >
                  <Text style={s.btnText}>{measSaving ? strings.measurements.saving : strings.measurements.btnSave.toUpperCase()}</Text>
                </TouchableOpacity>
              </View>
            </>
          ) : (
            <>
              <View style={s.measGrid}>
                {measFields.map(f => (
                  <View key={f.key} style={s.measCell}>
                    <Text style={s.measLabel}>{f.label.toUpperCase()}</Text>
                    <Text style={s.measReadVal}>
                      {measurements[f.key] != null ? `${measurements[f.key]} cm` : '—'}
                    </Text>
                  </View>
                ))}
              </View>
              {measSaved && <Text style={s.savedMsg}>{strings.measurements.savedMessage}</Text>}
            </>
          )}
        </View>

        {/* ── HISTORIQUE MESURES ── */}
        {measHistory.length > 1 && (
          <View style={s.section}>
            <Text style={s.sectionLabel}>{strings.measurements.historyTitle}</Text>
            <View style={s.inkDivider} />
            <View style={s.histHeaderRow}>
              <Text style={[s.histDate, s.histHead]}>DATE</Text>
              <Text style={[s.histVal, s.histHead]}>TAILLE</Text>
              <Text style={[s.histVal, s.histHead]}>HANCHES</Text>
              <Text style={[s.histVal, s.histHead]}>BRAS</Text>
              <Text style={[s.histVal, s.histHead]}>CUISSE</Text>
            </View>
            {measHistory.map(m => (
              <View key={m.id} style={s.histRow}>
                <Text style={s.histDate}>{m.date_mesure.slice(5).replace('-', '/')}</Text>
                <Text style={s.histVal}>{m.tour_taille_cm  ?? '—'}</Text>
                <Text style={s.histVal}>{m.tour_hanches_cm ?? '—'}</Text>
                <Text style={s.histVal}>{m.tour_bras_cm    ?? '—'}</Text>
                <Text style={s.histVal}>{m.tour_cuisse_cm  ?? '—'}</Text>
              </View>
            ))}
          </View>
        )}

      </View>
    </ScrollView>
  );
}

const s = StyleSheet.create({
  root:    { flex: 1, backgroundColor: theme.colors.app },
  centered:{ flex: 1, alignItems: 'center', justifyContent: 'center' },
  scroll:  { flexGrow: 1 },

  header:   { paddingTop: theme.spacing.xxl, paddingHorizontal: theme.spacing.lg, paddingBottom: theme.spacing.lg },
  eyebrow:  { fontFamily: theme.fontFamily.mono, fontSize: theme.fontSize.xs, color: theme.colors.inkMuted, letterSpacing: 2, marginBottom: 14 },
  titleRow: { flexDirection: 'row', alignItems: 'flex-end', justifyContent: 'space-between' },
  title:    { fontFamily: theme.fontFamily.display, fontSize: theme.fontSize.display, lineHeight: theme.fontSize.display * 0.9, color: theme.colors.ink, letterSpacing: -2 },
  goalBox:  { alignItems: 'flex-end', paddingBottom: 6 },
  goalLbl:  { fontFamily: theme.fontFamily.mono, fontSize: 9, color: theme.colors.inkMuted, letterSpacing: 1.5 },
  goalVal:  { fontFamily: theme.fontFamily.display, fontSize: theme.fontSize.xl, color: theme.colors.ink, letterSpacing: -1, marginTop: 2 },

  divider:       { height: 1, backgroundColor: theme.colors.ink, marginHorizontal: theme.spacing.lg },
  statsRow:      { flexDirection: 'row', borderBottomWidth: 1, borderBottomColor: theme.colors.line },
  statCell:      { flex: 1, paddingVertical: 16, alignItems: 'center' },
  statCellBorder:{ borderLeftWidth: 1, borderLeftColor: theme.colors.line },
  statVal:       { fontFamily: theme.fontFamily.display, fontSize: theme.fontSize.lg, color: theme.colors.ink, letterSpacing: -0.5 },
  statValHL:     { color: theme.colors.inkSoft, fontSize: theme.fontSize.xl },
  statLbl:       { fontFamily: theme.fontFamily.mono, fontSize: 9, color: theme.colors.inkMuted, letterSpacing: 1.5, marginTop: 4 },

  body:        { paddingHorizontal: theme.spacing.lg, paddingBottom: theme.spacing.xl },
  section:     { paddingTop: theme.spacing.xl, gap: theme.spacing.sm },
  sectionLabel:{ fontFamily: theme.fontFamily.mono, fontSize: theme.fontSize.xs, color: theme.colors.inkMuted, letterSpacing: 2 },
  inkDivider:  { height: 1, backgroundColor: theme.colors.ink },
  rowBetween:  { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'baseline' },
  deltaChip:   { fontFamily: theme.fontFamily.mono, fontSize: 10, color: theme.colors.inkSoft, letterSpacing: 1 },
  linkText:    { fontFamily: theme.fontFamily.mono, fontSize: 9, color: theme.colors.inkSoft, letterSpacing: 1.5 },
  chartWrap:   { paddingTop: theme.spacing.sm },
  chartLegend: { flexDirection: 'row', gap: 16, paddingTop: theme.spacing.sm },
  legendItem:  { flexDirection: 'row', alignItems: 'center', gap: 6 },
  legendLine:  { width: 16, height: 2, backgroundColor: theme.colors.ink },
  legendLineMuted: { backgroundColor: theme.colors.inkSoft },
  legendText:  { fontFamily: theme.fontFamily.mono, fontSize: 8, color: theme.colors.inkMuted, letterSpacing: 1.5 },

  inputRow:           { flexDirection: 'row', alignItems: 'flex-end', gap: 8, borderBottomWidth: 1, borderBottomColor: theme.colors.ink, paddingBottom: 8 },
  weightInput:        { flex: 1, fontFamily: theme.fontFamily.display, fontSize: 40, color: theme.colors.ink, letterSpacing: -1 },
  weightInputReadOnly:{ color: theme.colors.inkMid },
  unit:               { fontFamily: theme.fontFamily.mono, fontSize: theme.fontSize.md, color: theme.colors.inkMuted, paddingBottom: 4 },

  measGrid:     { flexDirection: 'row', flexWrap: 'wrap', marginTop: theme.spacing.sm },
  measCell:     { width: '50%', paddingRight: theme.spacing.md, paddingBottom: theme.spacing.md },
  measLabel:    { fontFamily: theme.fontFamily.mono, fontSize: 9, color: theme.colors.inkMuted, letterSpacing: 1.5, marginBottom: 6 },
  measInputRow: { flexDirection: 'row', alignItems: 'flex-end', gap: 4 },
  measInput:    { flex: 1, fontFamily: theme.fontFamily.display, fontSize: theme.fontSize.xl, color: theme.colors.ink, letterSpacing: -0.5 },
  measUnit:     { fontFamily: theme.fontFamily.mono, fontSize: 10, color: theme.colors.inkMuted, paddingBottom: 4 },
  measUnderline:{ height: 1, backgroundColor: theme.colors.ink, marginTop: 6 },
  measReadVal:  { fontFamily: theme.fontFamily.display, fontSize: theme.fontSize.xl, color: theme.colors.inkMid, letterSpacing: -0.5 },
  measBtnRow:   { flexDirection: 'row', gap: theme.spacing.sm, marginTop: theme.spacing.sm },
  btnFlex:      { flex: 1 },

  histHeaderRow:{ flexDirection: 'row', paddingVertical: 8, borderBottomWidth: 1, borderBottomColor: theme.colors.ink },
  histRow:      { flexDirection: 'row', paddingVertical: 8, borderBottomWidth: 1, borderBottomColor: theme.colors.lineSoft },
  histHead:     { color: theme.colors.inkMuted, letterSpacing: 1 },
  histDate:     { fontFamily: theme.fontFamily.mono, fontSize: 9, width: 36 },
  histVal:      { fontFamily: theme.fontFamily.mono, fontSize: 10, color: theme.colors.inkMid, flex: 1, textAlign: 'center' },

  error:       { fontFamily: theme.fontFamily.mono, fontSize: theme.fontSize.xs, color: '#C0392B' },
  savedMsg:    { fontFamily: theme.fontFamily.mono, fontSize: theme.fontSize.xs, color: theme.colors.inkSoft, fontStyle: 'italic' },
  empty:       { fontFamily: theme.fontFamily.mono, fontSize: theme.fontSize.xs, color: theme.colors.inkMuted, fontStyle: 'italic', letterSpacing: 1 },

  btn:         { backgroundColor: theme.colors.ink, padding: theme.spacing.md, alignItems: 'center', minHeight: theme.touchTarget },
  btnDisabled: { opacity: 0.5 },
  btnText:     { fontFamily: theme.fontFamily.mono, fontSize: theme.fontSize.xs, color: theme.colors.invertInk, letterSpacing: 2 },
  btnGhost:    { borderWidth: 1, borderColor: theme.colors.ink, padding: theme.spacing.md, alignItems: 'center', minHeight: theme.touchTarget },
  btnGhostText:{ fontFamily: theme.fontFamily.mono, fontSize: theme.fontSize.xs, color: theme.colors.ink, letterSpacing: 2 },
  btnGhostSm:  { borderWidth: 1, borderColor: theme.colors.line, padding: theme.spacing.md, alignItems: 'center', minHeight: theme.touchTarget, justifyContent: 'center' },
  btnGhostSmText:{ fontFamily: theme.fontFamily.mono, fontSize: theme.fontSize.xs, color: theme.colors.inkMuted, letterSpacing: 2 },
});
