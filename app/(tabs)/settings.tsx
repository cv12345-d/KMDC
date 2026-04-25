import { useState, useEffect } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, ScrollView, ActivityIndicator } from 'react-native';
import * as Notifications from 'expo-notifications';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { router } from 'expo-router';
import { theme } from '../../lib/theme';
import { getUser, getProfile } from '../../lib/auth';
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
  const [isPremium, setIsPremium] = useState(false);

  useEffect(() => {
    async function init() {
      const { status } = await Notifications.getPermissionsAsync();
      setPermitted(status === 'granted');
      const w = await AsyncStorage.getItem(KEY_WEIGHT);
      const j = await AsyncStorage.getItem(KEY_JOURNAL);
      setWeightOn(w === 'true');
      setJournalOn(j === 'true');
      const user = await getUser();
      if (user) {
        const profile = await getProfile(user.id);
        setIsPremium(profile?.is_premium ?? false);
      }
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
    return <View style={s.centered}><ActivityIndicator color={theme.colors.inkSoft} /></View>;
  }

  return (
    <ScrollView style={s.root} contentContainerStyle={s.scroll}>

      {/* ── HEADER ── */}
      <View style={s.header}>
        <Text style={s.eyebrow}>RÉGLAGES</Text>
        <Text style={s.title}>Préférences.</Text>
      </View>

      <View style={s.divider} />

      <View style={s.body}>

        {/* ── ABONNEMENT ── */}
        <View style={s.section}>
          <Text style={s.sectionLabel}>ABONNEMENT</Text>
          <View style={s.inkDivider} />
          {isPremium ? (
            <View style={s.row}>
              <Text style={s.rowNum}>✓</Text>
              <View style={s.rowText}>
                <Text style={s.rowLabel}>Version Premium active</Text>
                <Text style={s.rowSub}>TOUTES LES FONCTIONNALITÉS</Text>
              </View>
            </View>
          ) : (
            <TouchableOpacity style={s.row} onPress={() => router.push('/paywall')}>
              <Text style={s.rowNum}>→</Text>
              <View style={s.rowText}>
                <Text style={s.rowLabel}>Passer à la version Premium</Text>
                <Text style={s.rowSub}>HISTORIQUE · EXPORT PDF · RECETTES · 7 JOURS GRATUITS PUIS 24,99 € À VIE</Text>
              </View>
            </TouchableOpacity>
          )}
        </View>

        {/* ── EXPORT ── */}
        <View style={s.section}>
          <Text style={s.sectionLabel}>EXPORT</Text>
          <View style={s.inkDivider} />
          <TouchableOpacity style={[s.row, s.rowLast]} onPress={() => router.push('/export')}>
            <Text style={s.rowNum}>→</Text>
            <View style={s.rowText}>
              <Text style={s.rowLabel}>Rapport PDF médecin</Text>
              <Text style={s.rowSub}>POIDS · MESURES · HUMEUR · {isPremium ? 'PREMIUM ACTIF' : 'INCLUS PREMIUM'}</Text>
            </View>
          </TouchableOpacity>
        </View>

        {/* ── SANTÉ PRÉVENTIVE ── */}
        <View style={s.section}>
          <Text style={s.sectionLabel}>SANTÉ PRÉVENTIVE</Text>
          <View style={s.inkDivider} />
          <TouchableOpacity style={[s.row, s.rowLast]} onPress={() => router.push('/sante')}>
            <Text style={s.rowNum}>→</Text>
            <View style={s.rowText}>
              <Text style={s.rowLabel}>Suivi des examens</Text>
              <Text style={s.rowSub}>MAMMOGRAPHIE · FROTTIS · DENSITOMÉTRIE · +5</Text>
            </View>
          </TouchableOpacity>
        </View>

        {/* ── PROFIL DE SANTÉ ── */}
        <View style={s.section}>
          <Text style={s.sectionLabel}>PROFIL DE SANTÉ</Text>
          <View style={s.inkDivider} />
          <TouchableOpacity style={[s.row, s.rowLast]} onPress={() => router.push('/health-edit')}>
            <Text style={s.rowNum}>→</Text>
            <View style={s.rowText}>
              <Text style={s.rowLabel}>Modifier mon profil hormonal</Text>
              <Text style={s.rowSub}>MÉNOPAUSE · RÈGLES · SOMMEIL · THS</Text>
            </View>
          </TouchableOpacity>
        </View>

        {/* ── RAPPELS ── */}
        <View style={s.section}>
          <Text style={s.sectionLabel}>RAPPELS</Text>
          <View style={s.inkDivider} />

          <ToggleRow
            n="01"
            label="Pesée du matin"
            sublabel="7H30"
            value={weightOn}
            onToggle={toggleWeight}
          />
          <ToggleRow
            n="02"
            label="Journal du soir"
            sublabel="20H00"
            value={journalOn}
            onToggle={toggleJournal}
            last
          />

          {!permitted && (weightOn || journalOn) && (
            <Text style={s.hint}>
              Autorisez les notifications dans les réglages de votre téléphone.
            </Text>
          )}
        </View>

        {/* ── INFOS ── */}
        <View style={s.section}>
          <Text style={s.sectionLabel}>INFORMATIONS</Text>
          <View style={s.inkDivider} />
          <View style={s.infoRow}>
            <Text style={s.infoLabel}>VERSION</Text>
            <Text style={s.infoValue}>1.0.0</Text>
          </View>
        </View>

      </View>
    </ScrollView>
  );
}

function ToggleRow({
  n, label, sublabel, value, onToggle, last,
}: {
  n: string; label: string; sublabel: string; value: boolean;
  onToggle: (v: boolean) => void; last?: boolean;
}) {
  return (
    <TouchableOpacity
      style={[s.row, last && s.rowLast]}
      onPress={() => onToggle(!value)}
      activeOpacity={0.7}
    >
      <Text style={s.rowNum}>{n}</Text>
      <View style={s.rowText}>
        <Text style={s.rowLabel}>{label}</Text>
        <Text style={s.rowSub}>{sublabel}</Text>
      </View>
      <View style={[s.toggle, value && s.toggleOn]}>
        <View style={[s.toggleThumb, value && s.toggleThumbOn]} />
      </View>
    </TouchableOpacity>
  );
}

const s = StyleSheet.create({
  root:    { flex: 1, backgroundColor: theme.colors.app },
  centered:{ flex: 1, alignItems: 'center', justifyContent: 'center' },
  scroll:  { flexGrow: 1 },

  header:  { paddingTop: theme.spacing.xxl, paddingHorizontal: theme.spacing.lg, paddingBottom: theme.spacing.lg },
  eyebrow: { fontFamily: theme.fontFamily.mono, fontSize: theme.fontSize.xs, color: theme.colors.inkMuted, letterSpacing: 2, marginBottom: 14 },
  title:   { fontFamily: theme.fontFamily.display, fontSize: theme.fontSize.display, lineHeight: theme.fontSize.display * 0.9, color: theme.colors.ink, letterSpacing: -2 },

  divider:    { height: 1, backgroundColor: theme.colors.ink, marginHorizontal: theme.spacing.lg },
  body:       { paddingHorizontal: theme.spacing.lg, paddingBottom: theme.spacing.xl },
  section:    { paddingTop: theme.spacing.xl, gap: 0 },
  sectionLabel: { fontFamily: theme.fontFamily.mono, fontSize: theme.fontSize.xs, color: theme.colors.inkMuted, letterSpacing: 2, marginBottom: 10 },
  inkDivider: { height: 1, backgroundColor: theme.colors.ink },

  row: {
    flexDirection: 'row', alignItems: 'center', gap: 14,
    paddingVertical: 16, borderBottomWidth: 1, borderBottomColor: theme.colors.line,
    minHeight: theme.touchTarget,
  },
  rowLast:  { borderBottomWidth: 0 },
  rowNum:   { fontFamily: theme.fontFamily.mono, fontSize: 10, color: theme.colors.inkMuted, width: 24, letterSpacing: 1 },
  rowText:  { flex: 1 },
  rowLabel: { fontFamily: theme.fontFamily.display, fontSize: theme.fontSize.md, color: theme.colors.ink },
  rowSub:   { fontFamily: theme.fontFamily.mono, fontSize: 9, color: theme.colors.inkMuted, letterSpacing: 1.5, marginTop: 3 },

  toggle: {
    width: 40, height: 22,
    borderWidth: 1, borderColor: theme.colors.line,
    justifyContent: 'center', paddingHorizontal: 3,
  },
  toggleOn:    { borderColor: theme.colors.ink, backgroundColor: theme.colors.ink },
  toggleThumb: { width: 14, height: 14, backgroundColor: theme.colors.line },
  toggleThumbOn: { backgroundColor: theme.colors.invertInk, alignSelf: 'flex-end' },

  hint: {
    fontFamily: theme.fontFamily.mono, fontSize: theme.fontSize.xs,
    color: theme.colors.inkMuted, fontStyle: 'italic', letterSpacing: 0.5,
    paddingTop: theme.spacing.sm,
  },

  infoRow: {
    flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
    paddingVertical: 16, borderBottomWidth: 0, minHeight: theme.touchTarget,
  },
  infoLabel: { fontFamily: theme.fontFamily.mono, fontSize: theme.fontSize.xs, color: theme.colors.inkMuted, letterSpacing: 2 },
  infoValue: { fontFamily: theme.fontFamily.mono, fontSize: theme.fontSize.xs, color: theme.colors.inkSoft, letterSpacing: 1 },
});
