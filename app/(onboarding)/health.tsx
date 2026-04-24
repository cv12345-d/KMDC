import { useState } from 'react';
import {
  View, Text, TouchableOpacity, StyleSheet,
  ScrollView, TextInput, KeyboardAvoidingView, Platform,
} from 'react-native';
import { router, useLocalSearchParams } from 'expo-router';
import { theme } from '../../lib/theme';
import { strings } from '../../lib/strings';

type Menopause = 'menopausee' | 'perimenopaused' | 'non' | '';
type Ths = 'oui' | 'non' | 'inconnu' | '';

export default function OnboardingHealth() {
  const params = useLocalSearchParams<{
    age: string; weight: string; target: string;
    height: string; waist: string; hips: string;
  }>();

  const [menopause,  setMenopause]  = useState<Menopause>('');
  const [regles,     setRegles]     = useState('');
  const [nycturie,   setNycturie]   = useState<boolean | null>(null);
  const [sommeil,    setSommeil]    = useState<boolean | null>(null);
  const [ths,        setThs]        = useState<Ths>('');
  const [error,      setError]      = useState('');

  function handleNext() {
    setError('');
    if (!menopause) { setError(strings.health.errorMenopause); return; }
    if (menopause === 'non' && !regles.trim()) { setError(strings.health.errorRegles); return; }
    if (nycturie === null)  { setError(strings.health.errorNycturie); return; }
    if (sommeil  === null)  { setError(strings.health.errorSommeil);  return; }
    if (!ths) { setError(strings.health.errorThs); return; }

    if (menopause === 'non' && regles.trim()) {
      const parts = regles.trim().split('/');
      if (parts.length !== 3) { setError(strings.health.errorReglesFormat); return; }
      const [d, m, y] = parts.map(Number);
      if (!d || !m || !y || d < 1 || d > 31 || m < 1 || m > 12 || y < 2010 || y > 2030) {
        setError(strings.health.errorReglesFormat);
        return;
      }
    }

    router.push({
      pathname: '/(onboarding)/step3',
      params: {
        ...params,
        menopause,
        regles: menopause === 'non' ? regles.trim() : '',
        nycturie: nycturie ? '1' : '0',
        sommeil:  sommeil  ? '1' : '0',
        ths,
      },
    });
  }

  const showRegles = menopause === 'non';

  return (
    <KeyboardAvoidingView style={s.root} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
      <ScrollView contentContainerStyle={s.inner} keyboardShouldPersistTaps="handled">

        {/* ── PROGRESS ── */}
        <View style={s.progress}>
          <View style={[s.tick, s.tickDone]} />
          <View style={[s.tick, s.tickDone]} />
          <View style={[s.tick, s.tickOn]} />
          <View style={s.tick} />
        </View>
        <Text style={s.stepLabel}>ÉTAPE 3 / 4</Text>

        {/* ── HEADER ── */}
        <View style={s.header}>
          <Text style={s.title}>{strings.health.title}</Text>
        </View>
        <View style={s.divider} />
        <Text style={s.subtitle}>{strings.health.subtitle}</Text>

        {/* ── Q1 : MÉNOPAUSE ── */}
        <QuestionBlock label={strings.health.qMenopause}>
          <Option label={strings.health.opMenopausee}     selected={menopause === 'menopausee'}     onPress={() => setMenopause('menopausee')} />
          <Option label={strings.health.opNon}            selected={menopause === 'non'}            onPress={() => setMenopause('non')} />
          <Option label={strings.health.opPerimenopause}  selected={menopause === 'perimenopaused'} onPress={() => setMenopause('perimenopaused')} />
        </QuestionBlock>

        {/* ── Q1b : DERNIÈRES RÈGLES ── */}
        {showRegles && (
          <View style={s.reglesBlock}>
            <Text style={s.reglesLabel}>{strings.health.labelRegles.toUpperCase()}</Text>
            <View style={s.reglesInputRow}>
              <TextInput
                style={s.reglesInput}
                value={regles}
                onChangeText={setRegles}
                placeholder={strings.health.placeholderRegles}
                placeholderTextColor={theme.colors.inkMuted}
                keyboardType="numbers-and-punctuation"
              />
            </View>
            <Text style={s.reglesHint}>{strings.health.hintRegles}</Text>
          </View>
        )}

        {/* ── Q2 : NYCTURIE ── */}
        <QuestionBlock label={strings.health.qNycturie}>
          <Option label={strings.health.opOui} selected={nycturie === true}  onPress={() => setNycturie(true)} />
          <Option label={strings.health.opNon2} selected={nycturie === false} onPress={() => setNycturie(false)} />
        </QuestionBlock>

        {/* ── Q3 : SOMMEIL ── */}
        <QuestionBlock label={strings.health.qSommeil}>
          <Option label={strings.health.opOui} selected={sommeil === true}  onPress={() => setSommeil(true)} />
          <Option label={strings.health.opNon2} selected={sommeil === false} onPress={() => setSommeil(false)} />
        </QuestionBlock>

        {/* ── Q4 : THS ── */}
        <QuestionBlock label={strings.health.qThs}>
          <Option label={strings.health.opThsOui}     selected={ths === 'oui'}     onPress={() => setThs('oui')} />
          <Option label={strings.health.opThsNon}     selected={ths === 'non'}     onPress={() => setThs('non')} />
          <Option label={strings.health.opThsInconnu} selected={ths === 'inconnu'} onPress={() => setThs('inconnu')} />
        </QuestionBlock>

        {error ? <Text style={s.error}>{error}</Text> : null}

        <TouchableOpacity style={s.btn} onPress={handleNext}>
          <Text style={s.btnText}>{strings.onboarding.btnNext.toUpperCase()}</Text>
        </TouchableOpacity>

      </ScrollView>
    </KeyboardAvoidingView>
  );
}

function QuestionBlock({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <View style={q.block}>
      <Text style={q.label}>{label}</Text>
      <View style={q.options}>{children}</View>
    </View>
  );
}

function Option({ label, selected, onPress }: { label: string; selected: boolean; onPress: () => void }) {
  return (
    <TouchableOpacity style={[o.row, selected && o.rowOn]} onPress={onPress}>
      <View style={[o.radio, selected && o.radioOn]}>
        {selected && <View style={o.dot} />}
      </View>
      <Text style={[o.label, selected && o.labelOn]}>{label}</Text>
    </TouchableOpacity>
  );
}

const s = StyleSheet.create({
  root:  { flex: 1, backgroundColor: theme.colors.app },
  inner: { paddingHorizontal: theme.spacing.lg, paddingTop: theme.spacing.xxl, paddingBottom: theme.spacing.xl },

  progress:  { flexDirection: 'row', gap: 6, marginBottom: 8 },
  tick:      { flex: 1, height: 3, backgroundColor: theme.colors.line },
  tickOn:    { backgroundColor: theme.colors.ink },
  tickDone:  { backgroundColor: theme.colors.inkSoft },
  stepLabel: { fontFamily: theme.fontFamily.mono, fontSize: 9, color: theme.colors.inkMuted, letterSpacing: 2, marginBottom: theme.spacing.lg },

  header:   { paddingBottom: theme.spacing.lg },
  title:    { fontFamily: theme.fontFamily.display, fontSize: theme.fontSize.display, lineHeight: theme.fontSize.display * 0.9, color: theme.colors.ink, letterSpacing: -2 },
  divider:  { height: 1, backgroundColor: theme.colors.ink, marginBottom: theme.spacing.lg },
  subtitle: { fontFamily: theme.fontFamily.mono, fontSize: theme.fontSize.xs, color: theme.colors.inkMuted, letterSpacing: 0.5, lineHeight: 18, marginBottom: theme.spacing.xl },

  reglesBlock:    { borderTopWidth: 1, borderTopColor: theme.colors.line, paddingTop: theme.spacing.md, marginBottom: theme.spacing.md, gap: 6 },
  reglesLabel:    { fontFamily: theme.fontFamily.mono, fontSize: 9, color: theme.colors.inkMuted, letterSpacing: 2 },
  reglesInputRow: { flexDirection: 'row', borderBottomWidth: 1, borderBottomColor: theme.colors.ink, paddingBottom: 6 },
  reglesInput:    { flex: 1, fontFamily: theme.fontFamily.display, fontSize: theme.fontSize.md, color: theme.colors.ink, minHeight: theme.touchTarget, paddingVertical: 4 },
  reglesHint:     { fontFamily: theme.fontFamily.mono, fontSize: 9, color: theme.colors.inkMuted, letterSpacing: 0.3 },

  error:   { fontFamily: theme.fontFamily.mono, fontSize: theme.fontSize.xs, color: '#C0392B', marginBottom: theme.spacing.md },
  btn:     { backgroundColor: theme.colors.ink, padding: theme.spacing.md, alignItems: 'center', minHeight: theme.touchTarget },
  btnText: { fontFamily: theme.fontFamily.mono, fontSize: theme.fontSize.xs, color: theme.colors.invertInk, letterSpacing: 2 },
});

const q = StyleSheet.create({
  block:   { borderTopWidth: 1, borderTopColor: theme.colors.ink, paddingTop: theme.spacing.md, marginBottom: theme.spacing.md },
  label:   { fontFamily: theme.fontFamily.mono, fontSize: theme.fontSize.xs, color: theme.colors.inkMid, letterSpacing: 0.5, lineHeight: 18, marginBottom: theme.spacing.sm },
  options: { gap: 0 },
});

const o = StyleSheet.create({
  row:     { flexDirection: 'row', alignItems: 'center', gap: 14, paddingVertical: 12, borderBottomWidth: 1, borderBottomColor: theme.colors.lineSoft },
  rowOn:   { borderBottomColor: theme.colors.line },
  radio:   { width: 18, height: 18, borderWidth: 1.5, borderColor: theme.colors.line, alignItems: 'center', justifyContent: 'center', flexShrink: 0 },
  radioOn: { borderColor: theme.colors.ink },
  dot:     { width: 8, height: 8, backgroundColor: theme.colors.ink },
  label:   { flex: 1, fontFamily: theme.fontFamily.display, fontSize: theme.fontSize.sm, color: theme.colors.inkMuted },
  labelOn: { color: theme.colors.ink },
});
