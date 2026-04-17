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
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
    >
      <ScrollView contentContainerStyle={styles.inner} keyboardShouldPersistTaps="handled">
        <View style={styles.progress}>
          <View style={[styles.dot, styles.dotActive]} />
          <View style={styles.dot} />
          <View style={styles.dot} />
        </View>

        <Text style={styles.title}>{strings.onboarding.step1Title}</Text>
        <Text style={styles.subtitle}>{strings.onboarding.step1Subtitle}</Text>

        <View style={styles.form}>
          <Text style={styles.label}>{strings.onboarding.labelAge}</Text>
          <TextInput
            style={styles.input}
            value={age}
            onChangeText={setAge}
            placeholder={strings.onboarding.placeholderAge}
            placeholderTextColor={theme.colors.textMuted}
            keyboardType="number-pad"
            accessibilityLabel={strings.onboarding.labelAge}
          />

          <TouchableOpacity
            style={[styles.disclaimerRow, disclaimerAccepted && styles.disclaimerRowAccepted]}
            onPress={() => disclaimerAccepted ? setDisclaimerAccepted(false) : setShowDisclaimer(true)}
            accessibilityLabel={strings.onboarding.disclaimerTitle}
          >
            <View style={[styles.checkbox, disclaimerAccepted && styles.checkboxChecked]}>
              {disclaimerAccepted && <Text style={styles.checkmark}>✓</Text>}
            </View>
            <Text style={styles.disclaimerLabel}>{strings.onboarding.disclaimerTitle}</Text>
          </TouchableOpacity>

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

      <Modal visible={showDisclaimer} transparent animationType="fade">
        <View style={styles.modalOverlay}>
          <View style={styles.modalCard}>
            <Text style={styles.modalTitle}>{strings.onboarding.disclaimerTitle}</Text>
            <Text style={styles.modalText}>{strings.onboarding.disclaimerText}</Text>
            <TouchableOpacity
              style={styles.modalBtn}
              onPress={() => { setDisclaimerAccepted(true); setShowDisclaimer(false); }}
              accessibilityLabel={strings.onboarding.disclaimerAccept}
            >
              <Text style={styles.modalBtnText}>{strings.onboarding.disclaimerAccept}</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: theme.colors.background },
  inner: { padding: theme.spacing.lg, paddingTop: theme.spacing.xxl },
  progress: { flexDirection: 'row', gap: 8, marginBottom: theme.spacing.xl },
  dot: {
    width: 8, height: 8, borderRadius: 4,
    backgroundColor: theme.colors.border,
  },
  dotActive: { backgroundColor: theme.colors.primary, width: 24 },
  title: { fontSize: theme.fontSize.xxl, color: theme.colors.textDark, marginBottom: theme.spacing.sm },
  subtitle: {
    fontSize: theme.fontSize.sm, color: theme.colors.textMuted,
    fontStyle: 'italic', lineHeight: 22, marginBottom: theme.spacing.xl,
  },
  form: { gap: theme.spacing.sm },
  label: { fontSize: theme.fontSize.sm, color: theme.colors.textSoft, marginBottom: 2 },
  input: {
    backgroundColor: theme.colors.inputBg,
    borderWidth: 1.5, borderColor: theme.colors.border,
    borderRadius: theme.borderRadius.md,
    padding: theme.spacing.md, fontSize: theme.fontSize.md,
    color: theme.colors.textDark, marginBottom: theme.spacing.sm,
    minHeight: theme.touchTarget,
  },
  disclaimerRow: {
    flexDirection: 'row', alignItems: 'center', gap: theme.spacing.sm,
    padding: theme.spacing.md, borderWidth: 1.5, borderColor: theme.colors.border,
    borderRadius: theme.borderRadius.md, marginBottom: theme.spacing.sm,
  },
  disclaimerRowAccepted: { borderColor: theme.colors.primary, backgroundColor: theme.colors.backgroundHeader },
  checkbox: {
    width: 22, height: 22, borderRadius: 6,
    borderWidth: 1.5, borderColor: theme.colors.border,
    alignItems: 'center', justifyContent: 'center',
  },
  checkboxChecked: { backgroundColor: theme.colors.primary, borderColor: theme.colors.primary },
  checkmark: { color: '#FFF', fontSize: 13 },
  disclaimerLabel: { flex: 1, fontSize: theme.fontSize.sm, color: theme.colors.textSoft },
  error: { fontSize: theme.fontSize.sm, color: '#C0392B', marginBottom: theme.spacing.sm },
  btn: {
    backgroundColor: theme.colors.primary, borderRadius: theme.borderRadius.md,
    padding: theme.spacing.md, alignItems: 'center',
    minHeight: theme.touchTarget, marginTop: theme.spacing.sm,
  },
  btnText: { color: '#FFF', fontSize: theme.fontSize.md },
  modalOverlay: {
    flex: 1, backgroundColor: 'rgba(0,0,0,0.45)',
    alignItems: 'center', justifyContent: 'center', padding: theme.spacing.lg,
  },
  modalCard: {
    backgroundColor: theme.colors.background, borderRadius: theme.borderRadius.lg,
    padding: theme.spacing.xl, gap: theme.spacing.md,
  },
  modalTitle: { fontSize: theme.fontSize.lg, color: theme.colors.textDark },
  modalText: { fontSize: theme.fontSize.sm, color: theme.colors.textSoft, lineHeight: 22 },
  modalBtn: {
    backgroundColor: theme.colors.primary, borderRadius: theme.borderRadius.md,
    padding: theme.spacing.md, alignItems: 'center', minHeight: theme.touchTarget,
  },
  modalBtnText: { color: '#FFF', fontSize: theme.fontSize.md },
});
