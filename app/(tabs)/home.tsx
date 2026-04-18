import { useEffect, useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { router } from 'expo-router';
import { getUser, getProfile, signOut } from '../../lib/auth';
import { theme } from '../../lib/theme';
import { strings } from '../../lib/strings';

export default function HomeScreen() {
  const [prenom, setPrenom] = useState('');

  useEffect(() => {
    async function loadProfile() {
      const user = await getUser();
      if (!user) { router.replace('/(auth)/login'); return; }
      const profile = await getProfile(user.id);
      setPrenom(profile.prenom);
      if (!profile.poids_initial_kg) {
        router.replace('/(onboarding)/step1');
      }
    }
    loadProfile();
  }, []);

  async function handleSignOut() {
    await signOut();
    router.replace('/(auth)/login');
  }

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.greeting}>{strings.home.greeting(prenom)}</Text>
        <Text style={styles.tagline}>{strings.home.tagline}</Text>
      </View>

      <TouchableOpacity
        style={styles.signOutBtn}
        onPress={handleSignOut}
        accessibilityLabel="Se déconnecter"
      >
        <Text style={styles.signOutText}>Se déconnecter</Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: theme.colors.background,
  },
  header: {
    flex: 1,
    backgroundColor: theme.colors.backgroundHeader,
    alignItems: 'center',
    justifyContent: 'center',
    padding: theme.spacing.lg,
  },
  greeting: {
    fontSize: theme.fontSize.xxl,
    color: theme.colors.textDark,
    textAlign: 'center',
    marginBottom: theme.spacing.sm,
  },
  tagline: {
    fontSize: theme.fontSize.md,
    color: theme.colors.textSoft,
    fontStyle: 'italic',
    textAlign: 'center',
    lineHeight: 24,
  },
  signOutBtn: {
    margin: theme.spacing.lg,
    padding: theme.spacing.md,
    alignItems: 'center',
    borderWidth: 1.5,
    borderColor: theme.colors.border,
    borderRadius: theme.borderRadius.md,
    minHeight: theme.touchTarget,
    justifyContent: 'center',
  },
  signOutText: {
    fontSize: theme.fontSize.sm,
    color: theme.colors.textMuted,
  },
});
