import { useState } from 'react';
import {
  View, Text, TextInput, TouchableOpacity, StyleSheet,
  KeyboardAvoidingView, Platform, ScrollView,
} from 'react-native';
import { router, useLocalSearchParams } from 'expo-router';
import { theme } from '../../lib/theme';
import { strings } from '../../lib/strings';

export default function OnboardingStep2() {
  const { age } = useLocalSearchParams<{ age: string }>();

  const [weight, setWeight] = useState('');
  const [target, setTarget] = useState('');
  const [height, setHeight] = useState('');
  const [waist,  setWaist]  = useState('');
  const [hips,   setHips]   = useState('');
  const [error,  setError]  = useState('');

  function handleNext() {
    setError('');
    const w = parseFloat(weight.replace(',', '.'));
    const t = parseFloat(target.replace(',', '.'));
    const h = parseInt(height, 10);

    if (isNaN(w) || isNaN(t) || isNaN(h) || w <= 0 || t <= 0 || h <= 0) {
      setError(strings.onboarding.errorRequired);
      return;
    }
    if (t >= w) {
      setError('Le poids souhaité doit être inférieur au poids actuel.');
      return;
    }

    router.push({
      pathname: '/(onboarding)/health',
      params: {
        age,
        weight: String(w),
        target: String(t),
        height: String(h),
        waist:  waist ? String(parseInt(waist, 10)) : '',
        hips:   hips  ? String(parseInt(hips, 10))  : '',
      },
    });
  }

  return (
    <KeyboardAvoidingView style={s.root} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
      <ScrollView contentContainerStyle={s.inner} keyboardShouldPersistTaps="handled">

        {/* ── PROGRESS ── */}
        <View style={s.progress}>
          <View style={[s.tick, s.tickDone]} />
          <View style={[s.tick, s.tickOn]} />
          <View style={s.tick} />
          <View style={s.tick} />
        </View>
        <Text style={s.stepLabel}>ÉTAPE 2 / 4</Text>

        {/* ── HEADER ── */}
        <View style={s.header}>
          <Text style={s.title}>{strings.onboarding.step2Title}</Text>
        </View>
        <View style={s.divider} />

        <Text style={s.subtitle}>{strings.onboarding.step2Subtitle}</Text>

        {/* ── FORM ── */}
        <View style={s.form}>
          <Field label={strings.onboarding.labelWeight}       value={weight} onChange={setWeight} placeholder={strings.onboarding.placeholderWeight} unit="kg" />
          <Field label={strings.onboarding.labelTargetWeight} value={target} onChange={setTarget} placeholder={strings.onboarding.placeholderWeight} unit="kg" />
          <Field label={strings.onboarding.labelHeight}       value={height} onChange={setHeight} placeholder={strings.onboarding.placeholderHeight} unit="cm" />
          <Field label={strings.onboarding.labelWaist}        value={waist}  onChange={setWaist}  placeholder={strings.onboarding.placeholderMeasure} unit="cm" optional />
          <Field label={strings.onboarding.labelHips}         value={hips}   onChange={setHips}   placeholder={strings.onboarding.placeholderMeasure} unit="cm" optional />

          {error ? <Text style={s.error}>{error}</Text> : null}

          <TouchableOpacity style={s.btn} onPress={handleNext}>
            <Text style={s.btnText}>{strings.onboarding.btnNext.toUpperCase()}</Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

function Field({
  label, value, onChange, placeholder, unit, optional,
}: {
  label: string; value: string; onChange: (v: string) => void;
  placeholder: string; unit: string; optional?: boolean;
}) {
  return (
    <View style={f.wrapper}>
      <View style={f.labelRow}>
        <Text style={f.label}>{label.toUpperCase()}</Text>
        {optional && <Text style={f.optional}>{strings.onboarding.optionalHint}</Text>}
      </View>
      <View style={f.inputRow}>
        <TextInput
          style={f.input}
          value={value}
          onChangeText={onChange}
          placeholder={placeholder}
          placeholderTextColor={theme.colors.inkMuted}
          keyboardType="decimal-pad"
          accessibilityLabel={label}
        />
        <Text style={f.unit}>{unit}</Text>
      </View>
    </View>
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

  header:  { paddingBottom: theme.spacing.lg },
  title:   { fontFamily: theme.fontFamily.display, fontSize: theme.fontSize.display, lineHeight: theme.fontSize.display * 0.9, color: theme.colors.ink, letterSpacing: -2 },
  divider: { height: 1, backgroundColor: theme.colors.ink, marginBottom: theme.spacing.lg },
  subtitle:{ fontFamily: theme.fontFamily.mono, fontSize: theme.fontSize.xs, color: theme.colors.inkMuted, letterSpacing: 0.5, lineHeight: 18, marginBottom: theme.spacing.xl },

  form:    { gap: theme.spacing.md },
  error:   { fontFamily: theme.fontFamily.mono, fontSize: theme.fontSize.xs, color: '#C0392B' },
  btn:     { backgroundColor: theme.colors.ink, padding: theme.spacing.md, alignItems: 'center', minHeight: theme.touchTarget },
  btnText: { fontFamily: theme.fontFamily.mono, fontSize: theme.fontSize.xs, color: theme.colors.invertInk, letterSpacing: 2 },
});

const f = StyleSheet.create({
  wrapper:  { gap: 6 },
  labelRow: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  label:    { fontFamily: theme.fontFamily.mono, fontSize: 9, color: theme.colors.inkMuted, letterSpacing: 2 },
  optional: { fontFamily: theme.fontFamily.mono, fontSize: 9, color: theme.colors.inkMuted, fontStyle: 'italic' },
  inputRow: { flexDirection: 'row', alignItems: 'flex-end', gap: 8, borderBottomWidth: 1, borderBottomColor: theme.colors.ink, paddingBottom: 6 },
  input:    { flex: 1, fontFamily: theme.fontFamily.display, fontSize: theme.fontSize.md, color: theme.colors.ink, minHeight: theme.touchTarget, paddingVertical: 4 },
  unit:     { fontFamily: theme.fontFamily.mono, fontSize: theme.fontSize.xs, color: theme.colors.inkMuted, paddingBottom: 4 },
});
