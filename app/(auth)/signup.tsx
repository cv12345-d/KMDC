import { useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, StyleSheet, KeyboardAvoidingView, Platform, ScrollView } from 'react-native';
import { router } from 'expo-router';
import { signUp } from '../../lib/auth';
import { theme } from '../../lib/theme';
import { strings } from '../../lib/strings';

export default function SignupScreen() {
  const [prenom, setPrenom] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  async function handleSignup() {
    setError('');
    if (password.length < 8) {
      setError(strings.auth.errorWeakPassword);
      return;
    }
    setLoading(true);
    try {
      await signUp(email, password, prenom);
      router.replace('/(tabs)/home');
    } catch {
      setError(strings.auth.errorGeneric);
    } finally {
      setLoading(false);
    }
  }

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
    >
      <ScrollView contentContainerStyle={styles.inner} keyboardShouldPersistTaps="handled">
        <TouchableOpacity onPress={() => router.back()} style={styles.back}>
          <Text style={styles.backText}>{strings.auth.btnBack}</Text>
        </TouchableOpacity>

        <Text style={styles.title}>{strings.auth.signupTitle}</Text>
        <Text style={styles.subtitle}>{strings.auth.signupSubtitle}</Text>

        <View style={styles.form}>
          <Text style={styles.label}>{strings.auth.labelFirstName}</Text>
          <TextInput
            style={styles.input}
            value={prenom}
            onChangeText={setPrenom}
            placeholder="Caroline"
            placeholderTextColor={theme.colors.textMuted}
            autoCapitalize="words"
            accessibilityLabel={strings.auth.labelFirstName}
          />

          <Text style={styles.label}>{strings.auth.labelEmail}</Text>
          <TextInput
            style={styles.input}
            value={email}
            onChangeText={setEmail}
            placeholder={strings.auth.placeholderEmail}
            placeholderTextColor={theme.colors.textMuted}
            keyboardType="email-address"
            autoCapitalize="none"
            autoComplete="email"
            accessibilityLabel={strings.auth.labelEmail}
          />

          <Text style={styles.label}>{strings.auth.labelPassword}</Text>
          <TextInput
            style={styles.input}
            value={password}
            onChangeText={setPassword}
            placeholder={strings.auth.placeholderPw}
            placeholderTextColor={theme.colors.textMuted}
            secureTextEntry
            accessibilityLabel={strings.auth.labelPassword}
          />
          <Text style={styles.hint}>{strings.auth.hintPassword}</Text>

          {error ? <Text style={styles.error}>{error}</Text> : null}

          <TouchableOpacity
            style={[styles.btn, loading && styles.btnDisabled]}
            onPress={handleSignup}
            disabled={loading}
            accessibilityLabel={strings.auth.btnCreateAccount}
          >
            <Text style={styles.btnText}>
              {loading ? 'Création…' : strings.auth.btnCreateAccount}
            </Text>
          </TouchableOpacity>

          <Text style={styles.legal}>{strings.auth.legalNotice}</Text>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: theme.colors.background,
  },
  inner: {
    padding: theme.spacing.lg,
    paddingTop: theme.spacing.xxl,
  },
  back: {
    marginBottom: theme.spacing.lg,
    minHeight: theme.touchTarget,
    justifyContent: 'center',
  },
  backText: {
    fontSize: theme.fontSize.sm,
    color: theme.colors.textSoft,
  },
  title: {
    fontSize: theme.fontSize.xxl,
    color: theme.colors.textDark,
    marginBottom: theme.spacing.sm,
  },
  subtitle: {
    fontSize: theme.fontSize.sm,
    color: theme.colors.textMuted,
    fontStyle: 'italic',
    lineHeight: 22,
    marginBottom: theme.spacing.xl,
  },
  form: {
    gap: theme.spacing.sm,
  },
  label: {
    fontSize: theme.fontSize.sm,
    color: theme.colors.textSoft,
    marginBottom: 2,
  },
  input: {
    backgroundColor: theme.colors.inputBg,
    borderWidth: 1.5,
    borderColor: theme.colors.border,
    borderRadius: theme.borderRadius.md,
    padding: theme.spacing.md,
    fontSize: theme.fontSize.md,
    color: theme.colors.textDark,
    marginBottom: theme.spacing.sm,
    minHeight: theme.touchTarget,
  },
  hint: {
    fontSize: theme.fontSize.xs,
    color: theme.colors.textMuted,
    fontStyle: 'italic',
    marginTop: -theme.spacing.sm,
    marginBottom: theme.spacing.sm,
  },
  error: {
    fontSize: theme.fontSize.sm,
    color: '#C0392B',
    marginBottom: theme.spacing.sm,
  },
  btn: {
    backgroundColor: theme.colors.primary,
    borderRadius: theme.borderRadius.md,
    padding: theme.spacing.md,
    alignItems: 'center',
    minHeight: theme.touchTarget,
    marginTop: theme.spacing.sm,
  },
  btnDisabled: {
    opacity: 0.6,
  },
  btnText: {
    color: '#FFFFFF',
    fontSize: theme.fontSize.md,
  },
  legal: {
    fontSize: theme.fontSize.xs,
    color: theme.colors.textMuted,
    textAlign: 'center',
    lineHeight: 18,
    marginTop: theme.spacing.md,
  },
});
