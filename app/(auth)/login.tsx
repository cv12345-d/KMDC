import { useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, StyleSheet, KeyboardAvoidingView, Platform } from 'react-native';
import { router } from 'expo-router';
import { signIn } from '../../lib/auth';
import { theme } from '../../lib/theme';
import { strings } from '../../lib/strings';

export default function LoginScreen() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  async function handleLogin() {
    setError('');
    setLoading(true);
    try {
      await signIn(email, password);
      router.replace('/(tabs)/home');
    } catch {
      setError(strings.errors.networkError);
    } finally {
      setLoading(false);
    }
  }

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
    >
      <View style={styles.inner}>
        <Text style={styles.title}>{strings.auth.loginTitle}</Text>
        <Text style={styles.subtitle}>{strings.auth.loginSubtitle}</Text>

        <View style={styles.form}>
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
            autoComplete="password"
            accessibilityLabel={strings.auth.labelPassword}
          />

          {error ? <Text style={styles.error}>{error}</Text> : null}

          <TouchableOpacity
            style={[styles.btn, loading && styles.btnDisabled]}
            onPress={handleLogin}
            disabled={loading}
            accessibilityLabel={strings.auth.btnLogin}
          >
            <Text style={styles.btnText}>
              {loading ? 'Connexion…' : strings.auth.btnLogin}
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.btnGhost}
            onPress={() => router.push('/(auth)/signup')}
            accessibilityLabel="Créer un compte"
          >
            <Text style={styles.btnGhostText}>Créer un compte</Text>
          </TouchableOpacity>
        </View>
      </View>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: theme.colors.background,
  },
  inner: {
    flex: 1,
    padding: theme.spacing.lg,
    justifyContent: 'center',
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
  btnGhost: {
    borderWidth: 1.5,
    borderColor: theme.colors.accent,
    borderRadius: theme.borderRadius.md,
    padding: theme.spacing.md,
    alignItems: 'center',
    minHeight: theme.touchTarget,
    marginTop: theme.spacing.sm,
  },
  btnGhostText: {
    color: theme.colors.primary,
    fontSize: theme.fontSize.md,
  },
});
