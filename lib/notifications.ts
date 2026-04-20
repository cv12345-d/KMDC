import * as Notifications from 'expo-notifications';
import { Platform } from 'react-native';

Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldPlaySound: false,
    shouldSetBadge: false,
  }),
});

export async function requestNotificationPermissions(): Promise<boolean> {
  if (Platform.OS === 'web') return false;
  const { status } = await Notifications.requestPermissionsAsync();
  return status === 'granted';
}

export async function scheduleWeightReminder(hour = 7, minute = 30): Promise<void> {
  await Notifications.cancelScheduledNotificationAsync('weight-reminder').catch(() => {});
  await Notifications.scheduleNotificationAsync({
    identifier: 'weight-reminder',
    content: {
      title: 'Pesée du matin',
      body: 'Pensez à vous peser avant de manger ou de boire.',
    },
    trigger: {
      type: Notifications.SchedulableTriggerInputTypes.DAILY,
      hour,
      minute,
    },
  });
}

export async function scheduleJournalReminder(hour = 20, minute = 0): Promise<void> {
  await Notifications.cancelScheduledNotificationAsync('journal-reminder').catch(() => {});
  await Notifications.scheduleNotificationAsync({
    identifier: 'journal-reminder',
    content: {
      title: 'Journal du soir',
      body: 'Prenez un moment pour écrire dans votre journal.',
    },
    trigger: {
      type: Notifications.SchedulableTriggerInputTypes.DAILY,
      hour,
      minute,
    },
  });
}

export async function cancelWeightReminder(): Promise<void> {
  await Notifications.cancelScheduledNotificationAsync('weight-reminder').catch(() => {});
}

export async function cancelJournalReminder(): Promise<void> {
  await Notifications.cancelScheduledNotificationAsync('journal-reminder').catch(() => {});
}
