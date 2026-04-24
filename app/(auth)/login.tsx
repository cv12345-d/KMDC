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
    <KeyboardAvoidingView style={s.root} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
      <View style={s.inner}>

        {/* ── HEADER ── */}
        <View style={s.header}>
          <Text style={s.eyebrow}>MÉTHODE KMDC</Text>
          <Text style={s.title}>Connexion.</Text>
        </View>

        <View style={s.divider} />

        {/* ── FORM ── */}
        <View style={s.form}>
          <View style={s.field}>
            <Text style={s.label}>{strings.auth.labelEmail.toUpperCase()}</Text>
            <TextInput
              style={s.input}
              value={email}
              onChangeText={setEmail}
              placeholder={strings.auth.placeholderEmail}
              placeholderTextColor={theme.colors.inkMuted}
              keyboardType="email-address"
              autoCapitalize="none"
              autoCorrect={false}
              autoComplete="email"
              textContentType="emailAddress"
              accessibilityLabel={strings.auth.labelEmail}
            />
          </View>

          <View style={s.field}>
            <Text style={s.label}>{strings.auth.labelPassword.toUpperCase()}</Text>
            <TextInput
              style={s.input}
              value={password}
              onChangeText={setPassword}
              placeholder={strings.auth.placeholderPw}
              placeholderTextColor={theme.colors.inkMuted}
              secureTextEntry
              autoComplete="current-password"
              textContentType="password"
              accessibilityLabel={strings.auth.labelPassword}
            />
          </View>

          {error ? <Text style={s.error}>{error}</Text> : null}

          <TouchableOpacity style={[s.btn, loading && s.btnDisabled]} onPress={handleLogin} disabled={loading}>
            <Text style={s.btnText}>{loading ? 'CONNEXION…' : strings.auth.btnLogin.toUpperCase()}</Text>
          </TouchableOpacity>

          <TouchableOpacity style={s.btnGhost} onPress={() => router.push('/(auth)/signup')}>
            <Text style={s.btnGhostText}>CRÉER UN COMPTE</Text>
          </TouchableOpacity>
        </View>

      </View>
    </KeyboardAvoidingView>
  );
}

const s = StyleSheet.create({
  root:  { flex: 1, backgroundColor: theme.colors.app },
  inner: { flex: 1, paddingHorizontal: theme.spacing.lg, justifyContent: 'center' },

  header:  { paddingBottom: theme.spacing.lg },
  eyebrow: { fontFamily: theme.fontFamily.mono, fontSize: theme.fontSize.xs, color: theme.colors.inkMuted, letterSpacing: 2, marginBottom: 14 },
  title:   { fontFamily: theme.fontFamily.display, fontSize: theme.fontSize.display, lineHeight: theme.fontSize.display * 0.9, color: theme.colors.ink, letterSpacing: -2 },

  divider: { height: 1, backgroundColor: theme.colors.ink, marginBottom: theme.spacing.xl },

  form:  { gap: theme.spacing.md },
  field: { gap: 6 },
  label: { fontFamily: theme.fontFamily.mono, fontSize: 9, color: theme.colors.inkMuted, letterSpacing: 2 },
  input: {
    fontFamily: theme.fontFamily.display, fontSize: theme.fontSize.md,
    color: theme.colors.ink,
    borderBottomWidth: 1, borderBottomColor: theme.colors.ink,
    paddingVertical: 10,
    minHeight: theme.touchTarget,
  },

  error: { fontFamily: theme.fontFamily.mono, fontSize: theme.fontSize.xs, color: '#C0392B' },

  btn:         { backgroundColor: theme.colors.ink, padding: theme.spacing.md, alignItems: 'center', minHeight: theme.touchTarget },
  btnDisabled: { opacity: 0.5 },
  btnText:     { fontFamily: theme.fontFamily.mono, fontSize: theme.fontSize.xs, color: theme.colors.invertInk, letterSpacing: 2 },
  btnGhost:    { borderWidth: 1, borderColor: theme.colors.ink, padding: theme.spacing.md, alignItems: 'center', minHeight: theme.touchTarget },
  btnGhostText:{ fontFamily: theme.fontFamily.mono, fontSize: theme.fontSize.xs, color: theme.colors.ink, letterSpacing: 2 },
});
