import { useEffect, useState } from 'react';
import { View, ActivityIndicator } from 'react-native';
import { Redirect } from 'expo-router';
import { supabase } from '../lib/supabase';
import { theme } from '../lib/theme';

export default function Index() {
  const [ready, setReady] = useState(false);
  const [destination, setDestination] = useState<
    '/(auth)/login' | '/(tabs)/home' | '/(onboarding)/step1'
  >('/(auth)/login');

  useEffect(() => {
    // onAuthStateChange fires INITIAL_SESSION after AsyncStorage is read —
    // more reliable than getSession() which can return null before storage loads.
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        if (event !== 'INITIAL_SESSION') return;

        if (!session) {
          setDestination('/(auth)/login');
          setReady(true);
          return;
        }

        const { data } = await supabase
          .from('profiles')
          .select('date_debut_parcours')
          .eq('id', session.user.id)
          .maybeSingle();

        setDestination(
          data?.date_debut_parcours ? '/(tabs)/home' : '/(onboarding)/step1'
        );
        setReady(true);
      }
    );

    return () => subscription.unsubscribe();
  }, []);

  if (!ready) {
    return (
      <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center', backgroundColor: theme.colors.app }}>
        <ActivityIndicator color={theme.colors.inkSoft} />
      </View>
    );
  }

  return <Redirect href={destination} />;
}
