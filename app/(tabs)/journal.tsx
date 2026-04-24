import { useState, useCallback, useEffect } from 'react';
import {
  View, Text, TextInput, TouchableOpacity, StyleSheet,
  ScrollView, KeyboardAvoidingView, Platform, ActivityIndicator,
} from 'react-native';
import { useFocusEffect } from 'expo-router';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { theme } from '../../lib/theme';
import { strings } from '../../lib/strings';
import { getUser } from '../../lib/auth';
import {
  getTodayEntry, getRecentEntries, saveJournalEntry, formatDateFr, todayISO,
  type JournalEntry, type JournalDraft,
} from '../../lib/journal';
import { getFoods, type Food, type FoodList } from '../../lib/foods';

type LoggedFood = { id: string; nom: string; liste: FoodList };

const LIST_DOT: Record<FoodList, string> = {
  verte:  '#3A7D44',
  jaune:  '#8A7A20',
  orange: '#C07A2A',
  rouge:  '#B03030',
};

type MoodKey = 'difficile' | 'neutre' | 'bien' | 'legere';

const EMPTY_DRAFT: JournalDraft = {
  humeur: null, reussite: '', energie_gain: '', energie_perte: '', intention_demain: '',
};

const ROMAN = ['I', 'II', 'III', 'IV'];

export default function JournalScreen() {
  const [userId,      setUserId]      = useState<string | null>(null);
  const [entry,       setEntry]       = useState<JournalEntry | null>(null);
  const [history,     setHistory]     = useState<JournalEntry[]>([]);
  const [draft,       setDraft]       = useState<JournalDraft>(EMPTY_DRAFT);
  const [editMode,    setEditMode]    = useState(false);
  const [loading,     setLoading]     = useState(true);
  const [saving,      setSaving]      = useState(false);
  const [saved,       setSaved]       = useState(false);
  const [error,       setError]       = useState('');
  const [loggedFoods, setLoggedFoods] = useState<LoggedFood[]>([]);
  const [allFoods,    setAllFoods]    = useState<Food[]>([]);
  const [foodSearch,  setFoodSearch]  = useState('');

  useFocusEffect(useCallback(() => { loadEntry(); }, []));

  useEffect(() => {
    getFoods().then(setAllFoods).catch(() => {});
  }, []);

  async function loadEntry() {
    setLoading(true);
    try {
      const user = await getUser();
      if (!user) return;
      setUserId(user.id);
      const [existing, recent] = await Promise.all([
        getTodayEntry(user.id),
        getRecentEntries(user.id, 7),
      ]);
      setHistory(recent);
      if (existing) {
        setEntry(existing);
        setDraft({
          humeur:           existing.humeur,
          reussite:         existing.reussite         ?? '',
          energie_gain:     existing.energie_gain     ?? '',
          energie_perte:    existing.energie_perte    ?? '',
          intention_demain: existing.intention_demain ?? '',
        });
        setEditMode(false);
      } else {
        setEntry(null);
        setDraft(EMPTY_DRAFT);
        setEditMode(true);
      }
      const storedAssiette = await AsyncStorage.getItem(`assiette_${todayISO()}`);
      setLoggedFoods(storedAssiette ? JSON.parse(storedAssiette) : []);
    } finally {
      setLoading(false);
    }
  }

  function addFood(f: Food) {
    const updated = [...loggedFoods, { id: f.id, nom: f.nom, liste: f.liste }];
    setLoggedFoods(updated);
    setFoodSearch('');
    AsyncStorage.setItem(`assiette_${todayISO()}`, JSON.stringify(updated));
  }

  function removeFood(i: number) {
    const updated = loggedFoods.filter((_, idx) => idx !== i);
    setLoggedFoods(updated);
    AsyncStorage.setItem(`assiette_${todayISO()}`, JSON.stringify(updated));
  }

  async function handleSave() {
    if (!userId) return;
    setSaving(true); setError('');
    try {
      await saveJournalEntry(userId, draft);
      setSaved(true); setEditMode(false);
      const updated = await getTodayEntry(userId);
      setEntry(updated);
      setTimeout(() => setSaved(false), 3000);
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : JSON.stringify(e));
    } finally {
      setSaving(false);
    }
  }

  const dateLabel = formatDateFr(todayISO());

  if (loading) {
    return <View style={s.centered}><ActivityIndicator color={theme.colors.inkSoft} /></View>;
  }

  const questions = [
    { key: 'reussite' as const,         n: ROMAN[0], q: strings.journal.q1Label, h: strings.journal.q1Placeholder },
    { key: 'energie_gain' as const,     n: ROMAN[1], q: strings.journal.q2Label, h: strings.journal.q2Placeholder },
    { key: 'energie_perte' as const,    n: ROMAN[2], q: strings.journal.q3Label, h: strings.journal.q3Placeholder },
    { key: 'intention_demain' as const, n: ROMAN[3], q: strings.journal.q4Label, h: strings.journal.q4Placeholder },
  ];

  return (
    <KeyboardAvoidingView style={s.root} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
      <ScrollView contentContainerStyle={s.scroll} keyboardShouldPersistTaps="handled">

        {/* ── HEADER ── */}
        <View style={s.header}>
          <Text style={s.eyebrow}>{dateLabel.toUpperCase()}</Text>
          <Text style={s.title}>Journal{'\n'}du jour.</Text>
        </View>
        <View style={s.divider} />

        {/* ── MOOD ── */}
        <View style={s.moodSection}>
          <Text style={s.moodEyebrow}>COMMENT ALLEZ-VOUS ?</Text>
          <View style={s.moodRow}>
            {strings.journal.moods.map((m, i) => {
              const on = draft.humeur === m.key;
              return (
                <TouchableOpacity
                  key={m.key}
                  style={[s.moodItem, on && s.moodItemOn, i === strings.journal.moods.length - 1 && s.moodItemLast]}
                  onPress={() => editMode && setDraft(d => ({ ...d, humeur: m.key as MoodKey }))}
                >
                  <Text style={[s.moodNum, on && s.moodNumOn]}>{String(i + 1).padStart(2, '0')}</Text>
                  <Text style={[s.moodLabel, on && s.moodLabelOn]}>{m.label}</Text>
                </TouchableOpacity>
              );
            })}
          </View>
        </View>

        {/* ── QUESTIONS ── */}
        <View style={s.body}>
          {questions.map((qq) => (
            <View key={qq.key} style={s.questionBlock}>
              <View style={s.questionHeader}>
                <Text style={s.roman}>{qq.n}</Text>
                <Text style={s.questionText}>{qq.q}</Text>
              </View>
              <Text style={s.helper}>{qq.h.toUpperCase()}</Text>
              <TextInput
                style={[s.textarea, !editMode && s.textareaReadOnly]}
                value={draft[qq.key]}
                onChangeText={v => setDraft(d => ({ ...d, [qq.key]: v }))}
                placeholder="—"
                placeholderTextColor={theme.colors.inkMuted}
                multiline
                editable={editMode}
              />
            </View>
          ))}

          {/* ── ASSIETTE DU JOUR ── */}
          <View style={s.assiettBlock}>
            <Text style={s.assiettEyebrow}>MON ASSIETTE DU JOUR</Text>
            <View style={s.assiettDivider} />

            <View style={s.colorBar}>
              {loggedFoods.length === 0
                ? <View style={[s.colorSeg, { flex: 1, backgroundColor: theme.colors.lineSoft }]} />
                : (['verte', 'jaune', 'orange', 'rouge'] as FoodList[]).map(l => {
                    const n = loggedFoods.filter(f => f.liste === l).length;
                    return n > 0 ? <View key={l} style={[s.colorSeg, { flex: n, backgroundColor: LIST_DOT[l] }]} /> : null;
                  })}
            </View>

            {loggedFoods.length > 0 && (
              <View style={s.colorTally}>
                {(['verte', 'jaune', 'orange', 'rouge'] as FoodList[]).map(l => {
                  const n = loggedFoods.filter(f => f.liste === l).length;
                  return n > 0 ? (
                    <View key={l} style={s.colorTallyItem}>
                      <View style={[s.colorTallyDot, { backgroundColor: LIST_DOT[l] }]} />
                      <Text style={s.colorTallyCount}>{n}</Text>
                    </View>
                  ) : null;
                })}
              </View>
            )}

            {loggedFoods.length > 0 && (
              <View style={s.foodChips}>
                {loggedFoods.map((f, i) => (
                  <TouchableOpacity key={`${f.id}_${i}`} style={[s.foodChip, { borderColor: LIST_DOT[f.liste] }]} onPress={() => removeFood(i)}>
                    <View style={[s.foodChipDot, { backgroundColor: LIST_DOT[f.liste] }]} />
                    <Text style={s.foodChipText}>{f.nom}</Text>
                    <Text style={s.foodChipX}>×</Text>
                  </TouchableOpacity>
                ))}
              </View>
            )}

            <View style={s.foodSearchRow}>
              <TextInput
                style={s.foodSearch}
                placeholder="Ajouter un aliment…"
                value={foodSearch}
                onChangeText={setFoodSearch}
                placeholderTextColor={theme.colors.inkMuted}
              />
            </View>
            {foodSearch.length >= 2 && (
              <View style={s.foodResults}>
                {allFoods
                  .filter(f => f.nom.toLowerCase().includes(foodSearch.toLowerCase()))
                  .slice(0, 6)
                  .map(f => (
                    <TouchableOpacity key={f.id} style={s.foodResultRow} onPress={() => addFood(f)}>
                      <View style={[s.foodResultDot, { backgroundColor: LIST_DOT[f.liste] }]} />
                      <Text style={s.foodResultName}>{f.nom}</Text>
                    </TouchableOpacity>
                  ))}
              </View>
            )}
          </View>

          {error ? <Text style={s.error}>{error}</Text> : null}
          {saved  ? <Text style={s.savedMsg}>{strings.journal.savedMessage}</Text> : null}

          {editMode ? (
            <TouchableOpacity style={[s.btn, saving && s.btnDisabled]} onPress={handleSave} disabled={saving}>
              <Text style={s.btnText}>{saving ? strings.journal.saving : strings.journal.btnSave.toUpperCase()}</Text>
            </TouchableOpacity>
          ) : (
            <TouchableOpacity style={s.btnGhost} onPress={() => setEditMode(true)}>
              <Text style={s.btnGhostText}>{strings.journal.btnEdit.toUpperCase()}</Text>
            </TouchableOpacity>
          )}

          {history.length > 0 && (
            <View style={s.histSection}>
              <Text style={s.histEyebrow}>MES DERNIERS JOURS</Text>
              <View style={s.histDivider} />
              {history.map(h => {
                const mood = strings.journal.moods.find(m => m.key === h.humeur);
                return (
                  <View key={h.id} style={s.histItem}>
                    <View style={s.histItemTop}>
                      <Text style={s.histDate}>{formatDateFr(h.date_jour)}</Text>
                      {mood && <Text style={s.histEmoji}>{mood.emoji}</Text>}
                    </View>
                    {h.reussite ? (
                      <Text style={s.histReussite} numberOfLines={1}>{h.reussite}</Text>
                    ) : null}
                  </View>
                );
              })}
            </View>
          )}

          <Text style={s.signature}>{`« Votre journal est prêt\nlorsque vous l'êtes. »`}</Text>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const s = StyleSheet.create({
  root:    { flex: 1, backgroundColor: theme.colors.app },
  centered:{ flex: 1, alignItems: 'center', justifyContent: 'center' },
  scroll:  { flexGrow: 1 },
  header:  { paddingTop: theme.spacing.xxl, paddingHorizontal: theme.spacing.lg, paddingBottom: theme.spacing.lg },
  eyebrow: { fontFamily: theme.fontFamily.mono, fontSize: theme.fontSize.xs, color: theme.colors.inkMuted, letterSpacing: 2, marginBottom: 14 },
  title:   { fontFamily: theme.fontFamily.display, fontSize: theme.fontSize.display, lineHeight: theme.fontSize.display * 0.9, color: theme.colors.ink, letterSpacing: -2 },
  divider: { height: 1, backgroundColor: theme.colors.ink, marginHorizontal: theme.spacing.lg },

  moodSection:  { paddingHorizontal: theme.spacing.lg, paddingTop: theme.spacing.lg },
  moodEyebrow:  { fontFamily: theme.fontFamily.mono, fontSize: theme.fontSize.xs, color: theme.colors.inkMuted, letterSpacing: 2, marginBottom: 10 },
  moodRow:      { flexDirection: 'row', borderWidth: 1, borderColor: theme.colors.ink },
  moodItem:     { flex: 1, paddingVertical: 14, alignItems: 'center', gap: 6, borderRightWidth: 1, borderRightColor: theme.colors.line },
  moodItemLast: { borderRightWidth: 0 },
  moodItemOn:   { backgroundColor: theme.colors.ink },
  moodNum:      { fontFamily: theme.fontFamily.mono, fontSize: 9, color: theme.colors.inkMuted, letterSpacing: 1 },
  moodNumOn:    { color: 'rgba(230,235,242,0.6)' },
  moodLabel:    { fontFamily: theme.fontFamily.display, fontSize: 13, color: theme.colors.ink, letterSpacing: -0.3 },
  moodLabelOn:  { color: theme.colors.invertInk },

  body:            { padding: theme.spacing.lg, gap: theme.spacing.lg },
  questionBlock:   { gap: 6 },
  questionHeader:  { flexDirection: 'row', alignItems: 'flex-start', gap: 14 },
  roman:           { fontFamily: theme.fontFamily.display, fontSize: 36, lineHeight: 36, color: theme.colors.ink, letterSpacing: -1, minWidth: 40, flexShrink: 0 },
  questionText:    { fontFamily: theme.fontFamily.display, fontSize: theme.fontSize.lg, color: theme.colors.ink, lineHeight: theme.fontSize.lg * 1.3, letterSpacing: -0.3, flex: 1, paddingTop: 4 },
  helper:          { fontFamily: theme.fontFamily.mono, fontSize: 9, color: theme.colors.inkMuted, letterSpacing: 1.5, marginLeft: 54 },
  textarea:        { borderTopWidth: 1, borderTopColor: theme.colors.ink, borderBottomWidth: 1, borderBottomColor: theme.colors.line, paddingVertical: 12, fontFamily: theme.fontFamily.display, fontSize: theme.fontSize.md, color: theme.colors.ink, lineHeight: theme.fontSize.md * 1.6, minHeight: 64, textAlignVertical: 'top', backgroundColor: 'transparent' },
  textareaReadOnly:{ borderTopColor: theme.colors.line, color: theme.colors.inkMid },

  error:   { fontFamily: theme.fontFamily.mono, fontSize: theme.fontSize.xs, color: '#C0392B' },
  savedMsg:{ fontFamily: theme.fontFamily.mono, fontSize: theme.fontSize.xs, color: theme.colors.inkSoft, fontStyle: 'italic' },

  btn:         { backgroundColor: theme.colors.ink, padding: theme.spacing.md, alignItems: 'center', minHeight: theme.touchTarget },
  btnDisabled: { opacity: 0.5 },
  btnText:     { fontFamily: theme.fontFamily.mono, fontSize: theme.fontSize.xs, color: theme.colors.invertInk, letterSpacing: 2 },
  btnGhost:    { borderWidth: 1, borderColor: theme.colors.ink, padding: theme.spacing.md, alignItems: 'center', minHeight: theme.touchTarget },
  btnGhostText:{ fontFamily: theme.fontFamily.mono, fontSize: theme.fontSize.xs, color: theme.colors.ink, letterSpacing: 2 },
  signature:   { fontFamily: theme.fontFamily.mono, fontSize: 10, color: theme.colors.inkMuted, letterSpacing: 0.5, textAlign: 'center', lineHeight: 16, marginTop: theme.spacing.sm },

  assiettBlock:    { gap: 10 },
  assiettEyebrow:  { fontFamily: theme.fontFamily.mono, fontSize: 9, color: theme.colors.inkMuted, letterSpacing: 2 },
  assiettDivider:  { height: 1, backgroundColor: theme.colors.ink },
  colorBar:        { flexDirection: 'row', height: 6, gap: 2 },
  colorSeg:        {},
  colorTally:      { flexDirection: 'row', gap: 14 },
  colorTallyItem:  { flexDirection: 'row', alignItems: 'center', gap: 5 },
  colorTallyDot:   { width: 6, height: 6 },
  colorTallyCount: { fontFamily: theme.fontFamily.mono, fontSize: 9, color: theme.colors.inkMuted, letterSpacing: 1 },
  foodChips:       { flexDirection: 'row', flexWrap: 'wrap', gap: 6 },
  foodChip:        { flexDirection: 'row', alignItems: 'center', gap: 5, borderWidth: 1, paddingHorizontal: 8, paddingVertical: 5 },
  foodChipDot:     { width: 5, height: 5, flexShrink: 0 },
  foodChipText:    { fontFamily: theme.fontFamily.mono, fontSize: 9, color: theme.colors.ink, letterSpacing: 0.5 },
  foodChipX:       { fontFamily: theme.fontFamily.mono, fontSize: 13, color: theme.colors.inkMuted, marginLeft: 2 },
  foodSearchRow:   { borderBottomWidth: 1, borderBottomColor: theme.colors.ink },
  foodSearch:      { fontFamily: theme.fontFamily.mono, fontSize: 13, color: theme.colors.ink, paddingVertical: 8 },
  foodResults:     { borderWidth: 1, borderTopWidth: 0, borderColor: theme.colors.line },
  foodResultRow:   { flexDirection: 'row', alignItems: 'center', gap: 10, paddingVertical: 12, paddingHorizontal: 10, borderBottomWidth: 1, borderBottomColor: theme.colors.lineSoft },
  foodResultDot:   { width: 6, height: 6, flexShrink: 0 },
  foodResultName:  { fontFamily: theme.fontFamily.display, fontSize: theme.fontSize.sm, color: theme.colors.ink, flex: 1 },

  histSection:  { borderTopWidth: 1, borderTopColor: theme.colors.line, paddingTop: theme.spacing.xl, gap: theme.spacing.sm },
  histEyebrow:  { fontFamily: theme.fontFamily.mono, fontSize: theme.fontSize.xs, color: theme.colors.inkMuted, letterSpacing: 2 },
  histDivider:  { height: 1, backgroundColor: theme.colors.ink },
  histItem:     { paddingVertical: 12, borderBottomWidth: 1, borderBottomColor: theme.colors.lineSoft, gap: 4 },
  histItemTop:  { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  histDate:     { fontFamily: theme.fontFamily.mono, fontSize: 10, color: theme.colors.inkMuted, letterSpacing: 0.5 },
  histEmoji:    { fontSize: 16 },
  histReussite: { fontFamily: theme.fontFamily.display, fontSize: theme.fontSize.md, color: theme.colors.inkMid, lineHeight: theme.fontSize.md * 1.4 },
});
