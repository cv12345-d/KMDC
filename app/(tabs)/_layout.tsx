import { Tabs } from 'expo-router';
import { theme } from '../../lib/theme';
import { strings } from '../../lib/strings';

export default function TabsLayout() {
  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarActiveTintColor: theme.colors.primary,
        tabBarInactiveTintColor: theme.colors.textMuted,
        tabBarStyle: {
          backgroundColor: theme.colors.card,
          borderTopColor: theme.colors.border,
        },
        tabBarLabelStyle: {
          fontSize: 10,
          fontFamily: theme.fontFamily.serif,
        },
      }}
    >
      <Tabs.Screen name="home" options={{ title: strings.tabs.home }} />
    </Tabs>
  );
}
