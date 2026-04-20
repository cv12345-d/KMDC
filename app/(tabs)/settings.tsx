import { useState, useEffect } from 'react';
import { View, Text, Switch, StyleSheet, ScrollView, ActivityIndicator } from 'react-native';
import * as Notifications from 'expo-notifications';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { theme } from '../../lib/theme';
import {
  requestNotificationPermissions,
  scheduleWeightReminder,
  scheduleJournalReminder,
  cancelWeightReminder,
  cancelJournalReminder,
} from '../../lib/notifications';

const KEY_WEIGHT  = 'notif_weight';
const KEY_JOURNAL = 'notif_journal';

export default function SettingsScreen() {
  const [weightOn,  setWeightOn]  = useState(false);
  const [journalOn, setJournalOn] = useState(false);
  const [permitted, setPermitted] = useState(false);
  const [loading,   setLoading]   = useState(true);

  useEffect(() => {
    async function init() {
      const { status } = await Notifications.getPermissionsAsync();
      setPermitted(status === 'granted');
      const w = await AsyncStorage.getItem(KEY_WEIGHT);
      const j = await AsyncStorage.getItem(KEY_JOURNAL);
      setWeightOn(w === 'true');
      setJournalOn(j === 'true');
      setLoading(false);
    }
    init();
  }, []);

  async function toggleWeight(value: boolean) {
    if (value && !permitted) {
      const granted = await requestNotificationPermissions();
      if (!granted) return;
      setPermitted(true);
    }
    setWeightOn(value);
    await AsyncStorage.setItem(KEY_WEIGHT, String(value));
    if (value) await scheduleWeightReminder(7, 30);
    else       await cancelWeightReminder();
  }

  async function toggleJournal(value: boolean) {
    if (value && !permitted) {
      const granted = await requestNotificationPermissions();
      if (!granted) return;
      setPermitted(true);
    }
    setJournalOn(value);
    await AsyncStorage.setItem(KEY_JOURNAL, String(value));
    if (value) await scheduleJournalReminder(20, 0);
    else       await cancelJournalReminder();
  }

  if (loading) {
    return <View style={styles.centered}><ActivityIndicator color={theme.colors.primary} /></View>;
  }

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.scroll}>
      <View style={styles.header}>
        <Text style={styles.title}>Réglages</Text>
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionLabel}>RAPPELS</Text>
        <View style={styles.card}>
          <Row
            label="Pesée du matin"
            sublabel="Rappel à 7h30"
            value={weightOn}
            onToggle={toggleWeight}
          />
          <Row
            label="Journal du soir"
            sublabel="Rappel à 20h00"
            value={journalOn}
            onToggle={toggleJournal}
            last
          />
        </View>
        {!permitted && (weightOn || journalOn) && (
          <Text style={styles.hint}>
            Autorisez les notifications dans les réglages de votre téléphone pour recevoir les rappels.
          </Text>
        )}
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionLabel}>INFORMATIONS</Text>
        <View style={styles.card}>
          <View style={styles.infoRow}>
            <Text style={styles.infoLabel}>Version</Text>
            <Text style={styles.infoValue}>1.0.0</Text>
          </View>
        </View>
      </View>
    </ScrollView>
  );
}

function Row({
  label, sublabel, value, onToggle, last,
}: {
  label: string; sublabel: string; value: boolean;
  onToggle: (v: boolean) => void; last?: boolean;
}) {
  return (
    <View style={[styles.row, last && styles.rowLast]}>
      <View style={styles.rowText}>
        <Text style={styles.rowLabel}>{label}</Text>
        <Text style={styles.rowSub}>{sublabel}</Text>
      </View>
      <Switch
        value={value}
        onValueChange={onToggle}
        trackColor={{ false: theme.colors.border, true: theme.colors.primary }}
        thumbColor="#FFF"
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: theme.colors.background },
  centered:  { flex: 1, alignItems: 'center', justifyContent: 'center' },
  scroll:    { flexGrow: 1 },
  header: {
    backgroundColor: theme.colors.backgroundHeader,
    paddingTop: theme.spacing.xxl,
    paddingHorizontal: theme.spacing.lg,
    paddingBottom: theme.spacing.lg,
  },
  title: { fontSize: theme.fontSize.xl, color: theme.colors.textDark },
  section: { padding: theme.spacing.lg, gap: theme.spacing.sm },
  sectionLabel: {
    fontSize: theme.fontSize.xs, color: theme.colors.textMuted,
    textTransform: 'uppercase', letterSpacing: 1.5,
  },
  card: {
    backgroundColor: theme.colors.card, borderRadius: theme.borderRadius.lg,
    borderWidth: 1, borderColor: theme.colors.border,
  },
  row: {
    flexDirection: 'row', alignItems: 'center',
    paddingHorizontal: theme.spacing.md, paddingVertical: theme.spacing.sm,
    borderBottomWidth: 1, borderBottomColor: theme.colors.border,
    minHeight: theme.touchTarget,
  },
  rowLast:  { borderBottomWidth: 0 },
  rowText:  { flex: 1 },
  rowLabel: { fontSize: theme.fontSize.md, color: theme.colors.textDark },
  rowSub:   { fontSize: theme.fontSize.xs, color: theme.colors.textMuted, marginTop: 2 },
  hint: {
    fontSize: theme.fontSize.xs, color: theme.colors.textMuted,
    fontStyle: 'italic', paddingHorizontal: theme.spacing.sm,
  },
  infoRow: {
    flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
    paddingHorizontal: theme.spacing.md, paddingVertical: theme.spacing.sm,
    minHeight: theme.touchTarget,
  },
  infoLabel: { fontSize: theme.fontSize.md, color: theme.colors.textDark },
  infoValue: { fontSize: theme.fontSize.md, color: theme.colors.textMuted },
});
