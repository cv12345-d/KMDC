import { useState } from 'react';
import {
  View, Text, TextInput, TouchableOpacity, StyleSheet,
  KeyboardAvoidingView, Platform, ScrollView, Alert, Modal,
} from 'react-native';
import { router } from 'expo-router';
import { theme } from '../../lib/theme';
import { strings } from '../../lib/strings';

export default function OnboardingStep1() {
  const [age, setAge] = useState('');
  const [disclaimerAccepted, setDisclaimerAccepted] = useState(false);
  const [showDisclaimer, setShowDisclaimer] = useState(false);
  const [error, setError] = useState('');

  function handleNext() {
    setError('');
    const ageNum = parseInt(age, 10);
    if (!age || isNaN(ageNum) || ageNum < 1 || ageNum > 120) {
      setError(strings.onboarding.errorInvalidNumber);
      return;
    }
    if (!disclaimerAccepted) {
      setShowDisclaimer(true);
      return;
    }
    if (ageNum < 45) {
      Alert.alert(
        strings.onboarding.ageAlertTitle,
        strings.onboarding.ageTooYoung,
        [{ text: strings.onboarding.ageAlertConfirm, onPress: () => goNext(ageNum) }],
      );
      return;
    }
    goNext(ageNum);
  }

  function goNext(ageNum: number) {
    router.push({ pathname: '/(onboarding)/step2', params: { age: String(ageNum) } });
  }

  return (
    <KeyboardAvoidingView style={s.root} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
      <ScrollView contentContainerStyle={s.inner} keyboardShouldPersistTaps="handled">

        {/* ── PROGRESS ── */}
        <View style={s.progress}>
          <View style={[s.tick, s.tickOn]} />
          <View style={s.tick} />
          <View style={s.tick} />
          <View style={s.tick} />
        </View>
        <Text style={s.stepLabel}>ÉTAPE 1 / 4</Text>

        {/* ── HEADER ── */}
        <View style={s.header}>
          <Text style={s.title}>{strings.onboarding.step1Title}</Text>
        </View>
        <View style={s.divider} />

        <Text style={s.subtitle}>{strings.onboarding.step1Subtitle}</Text>

        {/* ── FORM ── */}
        <View style={s.form}>
          <View style={s.field}>
            <Text style={s.label}>{strings.onboarding.labelAge.toUpperCase()}</Text>
            <TextInput
              style={s.input}
              value={age}
              onChangeText={setAge}
              placeholder={strings.onboarding.placeholderAge}
              placeholderTextColor={theme.colors.inkMuted}
              keyboardType="number-pad"
              accessibilityLabel={strings.onboarding.labelAge}
            />
          </View>

          <TouchableOpacity
            style={[s.disclaimerRow, disclaimerAccepted && s.disclaimerRowOn]}
            onPress={() => disclaimerAccepted ? setDisclaimerAccepted(false) : setShowDisclaimer(true)}
          >
            <View style={[s.checkbox, disclaimerAccepted && s.checkboxOn]}>
              {disclaimerAccepted && <Text style={s.checkmark}>✓</Text>}
            </View>
            <Text style={s.disclaimerLabel}>{strings.onboarding.disclaimerTitle}</Text>
          </TouchableOpacity>

          {error ? <Text style={s.error}>{error}</Text> : null}

          <TouchableOpacity style={s.btn} onPress={handleNext}>
            <Text style={s.btnText}>{strings.onboarding.btnNext.toUpperCase()}</Text>
          </TouchableOpacity>
        </View>
      </ScrollView>

      <Modal visible={showDisclaimer} transparent animationType="fade">
        <View style={s.modalOverlay}>
          <View style={s.modalCard}>
            <Text style={s.modalTitle}>{strings.onboarding.disclaimerTitle}</Text>
            <Text style={s.modalText}>{strings.onboarding.disclaimerText}</Text>
            <TouchableOpacity
              style={s.modalBtn}
              onPress={() => { setDisclaimerAccepted(true); setShowDisclaimer(false); }}
            >
              <Text style={s.modalBtnText}>{strings.onboarding.disclaimerAccept.toUpperCase()}</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    </KeyboardAvoidingView>
  );
}

const s = StyleSheet.create({
  root:  { flex: 1, backgroundColor: theme.colors.app },
  inner: { paddingHorizontal: theme.spacing.lg, paddingTop: theme.spacing.xxl, paddingBottom: theme.spacing.xl },

  progress:  { flexDirection: 'row', gap: 6, marginBottom: 8 },
  tick:      { flex: 1, height: 3, backgroundColor: theme.colors.line },
  tickOn:    { backgroundColor: theme.colors.ink },
  stepLabel: { fontFamily: theme.fontFamily.mono, fontSize: 9, color: theme.colors.inkMuted, letterSpacing: 2, marginBottom: theme.spacing.lg },

  header:  { paddingBottom: theme.spacing.lg },
  title:   { fontFamily: theme.fontFamily.display, fontSize: theme.fontSize.display, lineHeight: theme.fontSize.display * 0.9, color: theme.colors.ink, letterSpacing: -2 },
  divider: { height: 1, backgroundColor: theme.colors.ink, marginBottom: theme.spacing.lg },
  subtitle:{ fontFamily: theme.fontFamily.mono, fontSize: theme.fontSize.xs, color: theme.colors.inkMuted, letterSpacing: 0.5, lineHeight: 18, marginBottom: theme.spacing.xl },

  form:  { gap: theme.spacing.md },
  field: { gap: 6 },
  label: { fontFamily: theme.fontFamily.mono, fontSize: 9, color: theme.colors.inkMuted, letterSpacing: 2 },
  input: {
    fontFamily: theme.fontFamily.display, fontSize: theme.fontSize.md,
    color: theme.colors.ink,
    borderBottomWidth: 1, borderBottomColor: theme.colors.ink,
    paddingVertical: 10, minHeight: theme.touchTarget,
  },

  disclaimerRow:   { flexDirection: 'row', alignItems: 'center', gap: 12, paddingVertical: 14, borderTopWidth: 1, borderBottomWidth: 1, borderColor: theme.colors.line },
  disclaimerRowOn: { borderColor: theme.colors.ink },
  checkbox:    { width: 22, height: 22, borderWidth: 1.5, borderColor: theme.colors.line, alignItems: 'center', justifyContent: 'center', flexShrink: 0 },
  checkboxOn:  { backgroundColor: theme.colors.ink, borderColor: theme.colors.ink },
  checkmark:   { color: theme.colors.invertInk, fontSize: 13 },
  disclaimerLabel: { flex: 1, fontFamily: theme.fontFamily.display, fontSize: theme.fontSize.sm, color: theme.colors.inkMid },

  error:       { fontFamily: theme.fontFamily.mono, fontSize: theme.fontSize.xs, color: '#C0392B' },
  btn:         { backgroundColor: theme.colors.ink, padding: theme.spacing.md, alignItems: 'center', minHeight: theme.touchTarget },
  btnText:     { fontFamily: theme.fontFamily.mono, fontSize: theme.fontSize.xs, color: theme.colors.invertInk, letterSpacing: 2 },

  modalOverlay: { flex: 1, backgroundColor: 'rgba(18,30,48,0.6)', alignItems: 'center', justifyContent: 'center', padding: theme.spacing.lg },
  modalCard:    { backgroundColor: theme.colors.app, padding: theme.spacing.xl, gap: theme.spacing.md, width: '100%' },
  modalTitle:   { fontFamily: theme.fontFamily.display, fontSize: theme.fontSize.xl, color: theme.colors.ink, letterSpacing: -0.5 },
  modalText:    { fontFamily: theme.fontFamily.mono, fontSize: theme.fontSize.xs, color: theme.colors.inkMuted, lineHeight: 18, letterSpacing: 0.3 },
  modalBtn:     { backgroundColor: theme.colors.ink, padding: theme.spacing.md, alignItems: 'center', minHeight: theme.touchTarget },
  modalBtnText: { fontFamily: theme.fontFamily.mono, fontSize: theme.fontSize.xs, color: theme.colors.invertInk, letterSpacing: 2 },
});
