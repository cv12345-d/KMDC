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
    if (password.length < 8) { setError(strings.auth.errorWeakPassword); return; }
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
    <KeyboardAvoidingView style={s.root} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
      <ScrollView contentContainerStyle={s.inner} keyboardShouldPersistTaps="handled">

        <TouchableOpacity onPress={() => router.back()} style={s.back}>
          <Text style={s.backText}>← {strings.auth.btnBack.toUpperCase()}</Text>
        </TouchableOpacity>

        {/* ── HEADER ── */}
        <View style={s.header}>
          <Text style={s.eyebrow}>MA SAISON</Text>
          <Text style={s.title}>Créer{'\n'}un compte.</Text>
        </View>

        <View style={s.divider} />

        {/* ── FORM ── */}
        <View style={s.form}>
          <View style={s.field}>
            <Text style={s.label}>{strings.auth.labelFirstName.toUpperCase()}</Text>
            <TextInput
              style={s.input}
              value={prenom}
              onChangeText={setPrenom}
              placeholder="Caroline"
              placeholderTextColor={theme.colors.inkMuted}
              autoCapitalize="words"
              accessibilityLabel={strings.auth.labelFirstName}
            />
          </View>

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
              autoComplete="email"
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
              accessibilityLabel={strings.auth.labelPassword}
            />
            <Text style={s.hint}>{strings.auth.hintPassword}</Text>
          </View>

          {error ? <Text style={s.error}>{error}</Text> : null}

          <TouchableOpacity style={[s.btn, loading && s.btnDisabled]} onPress={handleSignup} disabled={loading}>
            <Text style={s.btnText}>{loading ? 'CRÉATION…' : strings.auth.btnCreateAccount.toUpperCase()}</Text>
          </TouchableOpacity>

          <Text style={s.legal}>{strings.auth.legalNotice}</Text>
        </View>

      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const s = StyleSheet.create({
  root:  { flex: 1, backgroundColor: theme.colors.app },
  inner: { paddingHorizontal: theme.spacing.lg, paddingTop: theme.spacing.xxl, paddingBottom: theme.spacing.xl },

  back:     { minHeight: theme.touchTarget, justifyContent: 'center', marginBottom: theme.spacing.lg },
  backText: { fontFamily: theme.fontFamily.mono, fontSize: theme.fontSize.xs, color: theme.colors.inkMuted, letterSpacing: 2 },

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
  hint:  { fontFamily: theme.fontFamily.mono, fontSize: 9, color: theme.colors.inkMuted, letterSpacing: 0.5, fontStyle: 'italic' },
  error: { fontFamily: theme.fontFamily.mono, fontSize: theme.fontSize.xs, color: '#C0392B' },

  btn:         { backgroundColor: theme.colors.ink, padding: theme.spacing.md, alignItems: 'center', minHeight: theme.touchTarget },
  btnDisabled: { opacity: 0.5 },
  btnText:     { fontFamily: theme.fontFamily.mono, fontSize: theme.fontSize.xs, color: theme.colors.invertInk, letterSpacing: 2 },

  legal: { fontFamily: theme.fontFamily.mono, fontSize: 9, color: theme.colors.inkMuted, textAlign: 'center', lineHeight: 16, marginTop: theme.spacing.md, letterSpacing: 0.5 },
});
