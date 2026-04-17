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

  const [weight, setWeight]     = useState('');
  const [target, setTarget]     = useState('');
  const [height, setHeight]     = useState('');
  const [waist, setWaist]       = useState('');
  const [hips, setHips]         = useState('');
  const [error, setError]       = useState('');

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
      pathname: '/(onboarding)/step3',
      params: {
        age,
        weight: String(w),
        target: String(t),
        height: String(h),
        waist:  waist  ? String(parseInt(waist, 10))  : '',
        hips:   hips   ? String(parseInt(hips, 10))   : '',
      },
    });
  }

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
    >
      <ScrollView contentContainerStyle={styles.inner} keyboardShouldPersistTaps="handled">
        <View style={styles.progress}>
          <View style={[styles.dot, styles.dotDone]} />
          <View style={[styles.dot, styles.dotActive]} />
          <View style={styles.dot} />
        </View>

        <Text style={styles.title}>{strings.onboarding.step2Title}</Text>
        <Text style={styles.subtitle}>{strings.onboarding.step2Subtitle}</Text>

        <View style={styles.form}>
          <Field
            label={strings.onboarding.labelWeight}
            value={weight}
            onChange={setWeight}
            placeholder={strings.onboarding.placeholderWeight}
            unit="kg"
          />
          <Field
            label={strings.onboarding.labelTargetWeight}
            value={target}
            onChange={setTarget}
            placeholder={strings.onboarding.placeholderWeight}
            unit="kg"
          />
          <Field
            label={strings.onboarding.labelHeight}
            value={height}
            onChange={setHeight}
            placeholder={strings.onboarding.placeholderHeight}
            unit="cm"
          />
          <Field
            label={strings.onboarding.labelWaist}
            value={waist}
            onChange={setWaist}
            placeholder={strings.onboarding.placeholderMeasure}
            unit="cm"
            optional
          />
          <Field
            label={strings.onboarding.labelHips}
            value={hips}
            onChange={setHips}
            placeholder={strings.onboarding.placeholderMeasure}
            unit="cm"
            optional
          />

          {error ? <Text style={styles.error}>{error}</Text> : null}

          <TouchableOpacity
            style={styles.btn}
            onPress={handleNext}
            accessibilityLabel={strings.onboarding.btnNext}
          >
            <Text style={styles.btnText}>{strings.onboarding.btnNext}</Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

function Field({
  label, value, onChange, placeholder, unit, optional,
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  placeholder: string;
  unit: string;
  optional?: boolean;
}) {
  return (
    <View style={fieldStyles.wrapper}>
      <View style={fieldStyles.labelRow}>
        <Text style={fieldStyles.label}>{label}</Text>
        {optional && <Text style={fieldStyles.optional}>{strings.onboarding.optionalHint}</Text>}
      </View>
      <View style={fieldStyles.inputRow}>
        <TextInput
          style={fieldStyles.input}
          value={value}
          onChangeText={onChange}
          placeholder={placeholder}
          placeholderTextColor={theme.colors.textMuted}
          keyboardType="decimal-pad"
          accessibilityLabel={label}
        />
        <Text style={fieldStyles.unit}>{unit}</Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: theme.colors.background },
  inner: { padding: theme.spacing.lg, paddingTop: theme.spacing.xxl },
  progress: { flexDirection: 'row', gap: 8, marginBottom: theme.spacing.xl },
  dot: { width: 8, height: 8, borderRadius: 4, backgroundColor: theme.colors.border },
  dotActive: { backgroundColor: theme.colors.primary, width: 24 },
  dotDone:   { backgroundColor: theme.colors.accent },
  title:    { fontSize: theme.fontSize.xxl, color: theme.colors.textDark, marginBottom: theme.spacing.sm },
  subtitle: { fontSize: theme.fontSize.sm, color: theme.colors.textMuted, fontStyle: 'italic', lineHeight: 22, marginBottom: theme.spacing.xl },
  form:     { gap: theme.spacing.xs },
  error:    { fontSize: theme.fontSize.sm, color: '#C0392B', marginTop: theme.spacing.sm },
  btn: {
    backgroundColor: theme.colors.primary, borderRadius: theme.borderRadius.md,
    padding: theme.spacing.md, alignItems: 'center',
    minHeight: theme.touchTarget, marginTop: theme.spacing.md,
  },
  btnText: { color: '#FFF', fontSize: theme.fontSize.md },
});

const fieldStyles = StyleSheet.create({
  wrapper:   { marginBottom: theme.spacing.sm },
  labelRow:  { flexDirection: 'row', alignItems: 'center', marginBottom: 6, gap: 8 },
  label:     { fontSize: theme.fontSize.sm, color: theme.colors.textSoft },
  optional:  { fontSize: theme.fontSize.xs, color: theme.colors.textMuted, fontStyle: 'italic' },
  inputRow:  { flexDirection: 'row', alignItems: 'center', gap: theme.spacing.sm },
  input: {
    flex: 1, backgroundColor: theme.colors.inputBg,
    borderWidth: 1.5, borderColor: theme.colors.border,
    borderRadius: theme.borderRadius.md,
    padding: theme.spacing.md, fontSize: theme.fontSize.md,
    color: theme.colors.textDark, minHeight: theme.touchTarget,
  },
  unit: { fontSize: theme.fontSize.sm, color: theme.colors.textMuted, width: 28 },
});
