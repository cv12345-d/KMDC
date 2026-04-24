import { useState, useCallback } from 'react';
import {
  View, Text, StyleSheet, ScrollView, TouchableOpacity, ActivityIndicator,
} from 'react-native';
import { useFocusEffect, router } from 'expo-router';
import { getUser, getProfile } from '../../lib/auth';
import {
  getPhaseInfo, getMonthPhases, getCycleEntries, toggleCycleEntry,
  PHASE_TIPS, type CyclePhase, type CycleEntry,
} from '../../lib/cycle';
import { theme } from '../../lib/theme';

const PHASE_COLOR: Record<CyclePhase, string> = {
  regles:       '#C0392B',
  folliculaire: '#4A6B9A',
  ovulation:    '#2A7D5A',
  luteale:      '#8B6C3E',
};

const DAYS_FR = ['L', 'M', 'M', 'J', 'V', 'S', 'D'];
const MONTHS_FR = [
  'Janvier','Février','Mars','Avril','Mai','Juin',
  'Juillet','Août','Septembre','Octobre','Novembre','Décembre',
];

function isoDate(y: number, m: number, d: number) {
  return `${y}-${String(m + 1).padStart(2, '0')}-${String(d).padStart(2, '0')}`;
}

export default function CycleScreen() {
  const today = new Date();
  const [loading,     setLoading]     = useState(true);
  const [menopause,   setMenopause]   = useState<string | null>(null);
  const [lastRegles,  setLastRegles]  = useState<string | null>(null);
  const [userId,      setUserId]      = useState<string | null>(null);
  const [viewYear,    setViewYear]    = useState(today.getFullYear());
  const [viewMonth,   setViewMonth]   = useState(today.getMonth());
  const [entries,     setEntries]     = useState<CycleEntry[]>([]);
  const [selectedDay, setSelectedDay] = useState<number | null>(null);

  useFocusEffect(useCallback(() => { load(); }, []));

  async function load() {
    setLoading(true);
    try {
      const user = await getUser();
      if (!user) return;
      setUserId(user.id);
      const profile = await getProfile(user.id);
      setMenopause(profile?.statut_menopause ?? null);
      const regles = profile?.date_dernieres_regles ?? null;
      setLastRegles(regles);
      if (regles) {
        const e = await getCycleEntries(user.id, viewYear, viewMonth);
        setEntries(e);
      }
    } finally {
      setLoading(false);
    }
  }

  async function loadEntries(y: number, m: number) {
    if (!userId || !lastRegles) return;
    const e = await getCycleEntries(userId, y, m);
    setEntries(e);
  }

  function changeMonth(delta: number) {
    let m = viewMonth + delta;
    let y = viewYear;
    if (m > 11) { m = 0; y++; }
    if (m < 0)  { m = 11; y--; }
    setViewMonth(m);
    setViewYear(y);
    setSelectedDay(null);
    loadEntries(y, m);
  }

  async function handleToggle(type: CycleEntry['type']) {
    if (!userId || !selectedDay) return;
    const iso = isoDate(viewYear, viewMonth, selectedDay);
    await toggleCycleEntry(userId, iso, type);
    await loadEntries(viewYear, viewMonth);
  }

  if (loading) {
    return (
      <View style={s.center}>
        <ActivityIndicator color={theme.colors.inkSoft} />
      </View>
    );
  }

  // ── Ménopausée ou périménopause ──────────────────────────────
  if (menopause === 'menopausee' || menopause === 'perimenopaused') {
    return <MenopauseScreen menopause={menopause} />;
  }

  // ── Pas encore renseigné ─────────────────────────────────────
  if (!lastRegles) {
    return (
      <View style={s.center}>
        <Text style={s.emptyText}>Complétez votre profil de santé{'\n'}pour activer le suivi du cycle.</Text>
        <TouchableOpacity style={s.emptyBtn} onPress={() => router.push('/health-edit')}>
          <Text style={s.emptyBtnText}>COMPLÉTER MON PROFIL →</Text>
        </TouchableOpacity>
      </View>
    );
  }

  const phaseInfo  = getPhaseInfo(lastRegles);
  const phases     = getMonthPhases(viewYear, viewMonth, lastRegles);
  const tips       = PHASE_TIPS[phaseInfo.phase];
  const entrySet   = new Set(entries.map(e => `${e.date_jour}:${e.type}`));

  // Calendrier
  const firstDay  = new Date(viewYear, viewMonth, 1).getDay(); // 0=dim
  const startCol  = (firstDay + 6) % 7; // lundi=0
  const daysInMonth = new Date(viewYear, viewMonth + 1, 0).getDate();
  const todayDay  = (today.getFullYear() === viewYear && today.getMonth() === viewMonth)
    ? today.getDate() : null;

  const selISO = selectedDay ? isoDate(viewYear, viewMonth, selectedDay) : null;
  const selHasDebut   = selISO ? entrySet.has(`${selISO}:debut_regles`) : false;
  const selHasFin     = selISO ? entrySet.has(`${selISO}:fin_regles`)   : false;
  const selHasSpot    = selISO ? entrySet.has(`${selISO}:spotting`)      : false;

  return (
    <ScrollView style={s.root} contentContainerStyle={s.inner}>

      {/* ── HEADER ── */}
      <Text style={s.eyebrow}>CYCLE</Text>
      <Text style={s.title}>Votre cycle.</Text>
      <View style={s.divider} />

      {/* ── PHASE ACTUELLE ── */}
      <View style={[s.phaseBlock, { borderLeftColor: PHASE_COLOR[phaseInfo.phase] }]}>
        <Text style={s.phaseLabel}>AUJOURD'HUI — JOUR {phaseInfo.day}</Text>
        <Text style={s.phaseName}>{phaseInfo.label}</Text>
        <Text style={s.phaseNext}>
          {phaseInfo.daysLeft} jour{phaseInfo.daysLeft > 1 ? 's' : ''} restant{phaseInfo.daysLeft > 1 ? 's' : ''} · puis {phaseInfo.nextLabel}
        </Text>
      </View>

      {/* ── CALENDRIER ── */}
      <View style={s.calHeader}>
        <TouchableOpacity onPress={() => changeMonth(-1)} style={s.navBtn}>
          <Text style={s.navText}>←</Text>
        </TouchableOpacity>
        <Text style={s.calTitle}>{MONTHS_FR[viewMonth]} {viewYear}</Text>
        <TouchableOpacity onPress={() => changeMonth(1)} style={s.navBtn}>
          <Text style={s.navText}>→</Text>
        </TouchableOpacity>
      </View>

      <View style={s.calGrid}>
        {DAYS_FR.map((d, i) => (
          <Text key={i} style={s.dayName}>{d}</Text>
        ))}
        {Array.from({ length: startCol }).map((_, i) => (
          <View key={`e${i}`} style={s.dayCell} />
        ))}
        {Array.from({ length: daysInMonth }, (_, i) => i + 1).map(d => {
          const phase   = phases[d];
          const iso     = isoDate(viewYear, viewMonth, d);
          const logged  = entries.some(e => e.date_jour === iso);
          const isToday = d === todayDay;
          const isSel   = d === selectedDay;
          return (
            <TouchableOpacity
              key={d}
              style={[s.dayCell, isToday && s.dayCellToday, isSel && s.dayCellSel]}
              onPress={() => setSelectedDay(d === selectedDay ? null : d)}
            >
              <View style={[s.dayPhase, { backgroundColor: PHASE_COLOR[phase] + (isSel ? 'FF' : '30') }]}>
                <Text style={[s.dayNum, isToday && s.dayNumToday, isSel && s.dayNumSel]}>{d}</Text>
                {logged && <View style={[s.logDot, { backgroundColor: PHASE_COLOR[phase] }]} />}
              </View>
            </TouchableOpacity>
          );
        })}
      </View>

      {/* ── LÉGENDE ── */}
      <View style={s.legend}>
        {(['regles', 'folliculaire', 'ovulation', 'luteale'] as CyclePhase[]).map(p => (
          <View key={p} style={s.legendItem}>
            <View style={[s.legendDot, { backgroundColor: PHASE_COLOR[p] }]} />
            <Text style={s.legendLabel}>{PHASE_TIPS[p] && p === 'regles' ? 'Règles' : p === 'folliculaire' ? 'Folliculaire' : p === 'ovulation' ? 'Ovulation' : 'Lutéale'}</Text>
          </View>
        ))}
      </View>

      {/* ── NOTER UN JOUR ── */}
      {selectedDay && (
        <View style={s.logBlock}>
          <Text style={s.logTitle}>
            {selectedDay} {MONTHS_FR[viewMonth]}
          </Text>
          <View style={s.logBtns}>
            <LogBtn label="Début règles" active={selHasDebut} onPress={() => handleToggle('debut_regles')} color={PHASE_COLOR.regles} />
            <LogBtn label="Fin règles"   active={selHasFin}   onPress={() => handleToggle('fin_regles')}   color={PHASE_COLOR.regles} />
            <LogBtn label="Spotting"     active={selHasSpot}  onPress={() => handleToggle('spotting')}     color={theme.colors.inkMuted} />
          </View>
        </View>
      )}

      {/* ── CONSEILS ── */}
      <View style={s.section}>
        <Text style={s.sectionTitle}>ALIMENTATION — {phaseInfo.label.toUpperCase()}</Text>
        <Text style={s.tipText}>{tips.tip}</Text>

        <Text style={s.tipCat}>À PRIVILÉGIER</Text>
        {tips.foods.map(f => (
          <View key={f} style={s.tipRow}>
            <View style={[s.tipDot, { backgroundColor: PHASE_COLOR[phaseInfo.phase] }]} />
            <Text style={s.tipItem}>{f}</Text>
          </View>
        ))}

        <Text style={s.tipCat}>À ÉVITER</Text>
        {tips.avoid.map(f => (
          <View key={f} style={s.tipRow}>
            <View style={[s.tipDot, { backgroundColor: theme.colors.inkMuted }]} />
            <Text style={s.tipItem}>{f}</Text>
          </View>
        ))}
      </View>

    </ScrollView>
  );
}

function LogBtn({ label, active, onPress, color }: {
  label: string; active: boolean; onPress: () => void; color: string;
}) {
  return (
    <TouchableOpacity
      style={[lb.btn, active && { backgroundColor: color, borderColor: color }]}
      onPress={onPress}
    >
      <Text style={[lb.text, active && lb.textOn]}>{label}</Text>
    </TouchableOpacity>
  );
}

function MenopauseScreen({ menopause }: { menopause: string }) {
  const tips = menopause === 'perimenopaused' ? PERI_TIPS : MENO_TIPS;
  return (
    <ScrollView style={s.root} contentContainerStyle={s.inner}>
      <Text style={s.eyebrow}>BIEN-ÊTRE</Text>
      <Text style={s.title}>{menopause === 'perimenopaused' ? 'Périménopause.' : 'Ménopause.'}</Text>
      <View style={s.divider} />
      {tips.map((t, i) => (
        <View key={i} style={s.menoBlock}>
          <Text style={s.menoLabel}>{t.label.toUpperCase()}</Text>
          <Text style={s.menoText}>{t.text}</Text>
        </View>
      ))}
    </ScrollView>
  );
}

const PERI_TIPS = [
  { label: 'Cycles irréguliers',   text: 'Les variations hormonales peuvent provoquer des sautes d\'humeur et des fringales. Favorisez les aliments à IG bas pour stabiliser la glycémie.' },
  { label: 'Chaleurs & sommeil',   text: 'Évitez la caféine après 14h, l\'alcool et les épices le soir. Le magnésium (amandes, épinards) aide à la qualité du sommeil.' },
  { label: 'Poids & métabolisme',  text: 'Le ralentissement métabolique commence. Les phases offensives de la méthode sont particulièrement efficaces à cette période.' },
  { label: 'À privilégier',        text: 'Phytoestrogènes naturels : lin, soja non transformé, pois chiches. Calcium : sardines, amandes, légumes verts.' },
];

const MENO_TIPS = [
  { label: 'Densité osseuse',      text: 'La chute des œstrogènes accélère la perte osseuse. Calcium (sardines, amandes) + vitamine D (exposition solaire 20 min/jour) sont essentiels.' },
  { label: 'Poids & ventre',       text: 'La graisse migre vers l\'abdomen après la ménopause. La méthode KMDC est particulièrement adaptée à ce profil.' },
  { label: 'Sommeil & nuit',       text: 'Évitez sucres rapides, alcool et caféine après 15h. La tisane de valériane ou de camomille favorise l\'endormissement.' },
  { label: 'Cœur & cholestérol',   text: 'Le risque cardiovasculaire augmente. Privilégiez oméga-3 (sardines, noix), légumes verts, et réduisez les graisses saturées.' },
];

const s = StyleSheet.create({
  root:   { flex: 1, backgroundColor: theme.colors.app },
  inner:  { paddingHorizontal: theme.spacing.lg, paddingTop: theme.spacing.xxl, paddingBottom: theme.spacing.xl },
  center: { flex: 1, backgroundColor: theme.colors.app, alignItems: 'center', justifyContent: 'center', padding: theme.spacing.xl },
  emptyText:    { fontFamily: theme.fontFamily.mono, fontSize: theme.fontSize.xs, color: theme.colors.inkMuted, textAlign: 'center', lineHeight: 20, marginBottom: theme.spacing.lg },
  emptyBtn:     { borderWidth: 1, borderColor: theme.colors.ink, paddingVertical: 14, paddingHorizontal: theme.spacing.lg, minHeight: theme.touchTarget, alignItems: 'center', justifyContent: 'center' },
  emptyBtnText: { fontFamily: theme.fontFamily.mono, fontSize: theme.fontSize.xs, color: theme.colors.ink, letterSpacing: 2 },

  eyebrow: { fontFamily: theme.fontFamily.mono, fontSize: 9, color: theme.colors.inkMuted, letterSpacing: 2, marginBottom: 8 },
  title:   { fontFamily: theme.fontFamily.display, fontSize: theme.fontSize.display, lineHeight: theme.fontSize.display * 0.9, color: theme.colors.ink, letterSpacing: -2, marginBottom: theme.spacing.lg },
  divider: { height: 1, backgroundColor: theme.colors.ink, marginBottom: theme.spacing.xl },

  phaseBlock: { borderLeftWidth: 3, paddingLeft: 14, marginBottom: theme.spacing.xl, gap: 4 },
  phaseLabel: { fontFamily: theme.fontFamily.mono, fontSize: 9, color: theme.colors.inkMuted, letterSpacing: 2 },
  phaseName:  { fontFamily: theme.fontFamily.display, fontSize: theme.fontSize.xl, color: theme.colors.ink, letterSpacing: -0.5 },
  phaseNext:  { fontFamily: theme.fontFamily.mono, fontSize: theme.fontSize.xs, color: theme.colors.inkMuted },

  calHeader: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: theme.spacing.md },
  calTitle:  { fontFamily: theme.fontFamily.display, fontSize: theme.fontSize.lg, color: theme.colors.ink },
  navBtn:    { padding: theme.spacing.sm, minWidth: 36, alignItems: 'center' },
  navText:   { fontFamily: theme.fontFamily.mono, fontSize: theme.fontSize.md, color: theme.colors.ink },

  calGrid:    { flexDirection: 'row', flexWrap: 'wrap', marginBottom: theme.spacing.md },
  dayName:    { width: '14.28%', textAlign: 'center', fontFamily: theme.fontFamily.mono, fontSize: 9, color: theme.colors.inkMuted, letterSpacing: 1, paddingBottom: 6 },
  dayCell:    { width: '14.28%', aspectRatio: 1, padding: 2 },
  dayCellToday: {},
  dayCellSel:   {},
  dayPhase:   { flex: 1, alignItems: 'center', justifyContent: 'center', gap: 2 },
  dayNum:     { fontFamily: theme.fontFamily.mono, fontSize: 11, color: theme.colors.ink },
  dayNumToday:{ fontFamily: theme.fontFamily.mono, fontSize: 11, color: theme.colors.ink, textDecorationLine: 'underline' },
  dayNumSel:  { color: theme.colors.ink, fontFamily: theme.fontFamily.mono, fontSize: 11 },
  logDot:     { width: 4, height: 4, borderRadius: 2 },

  legend:      { flexDirection: 'row', flexWrap: 'wrap', gap: 12, marginBottom: theme.spacing.xl },
  legendItem:  { flexDirection: 'row', alignItems: 'center', gap: 6 },
  legendDot:   { width: 8, height: 8 },
  legendLabel: { fontFamily: theme.fontFamily.mono, fontSize: 9, color: theme.colors.inkMuted, letterSpacing: 0.5 },

  logBlock: { borderTopWidth: 1, borderTopColor: theme.colors.ink, paddingTop: theme.spacing.md, marginBottom: theme.spacing.xl, gap: theme.spacing.sm },
  logTitle: { fontFamily: theme.fontFamily.display, fontSize: theme.fontSize.md, color: theme.colors.ink },
  logBtns:  { flexDirection: 'row', gap: theme.spacing.sm, flexWrap: 'wrap' },

  section:      { borderTopWidth: 1, borderTopColor: theme.colors.ink, paddingTop: theme.spacing.md },
  sectionTitle: { fontFamily: theme.fontFamily.mono, fontSize: 9, color: theme.colors.inkMuted, letterSpacing: 2, marginBottom: theme.spacing.md },
  tipText:      { fontFamily: theme.fontFamily.display, fontSize: theme.fontSize.sm, color: theme.colors.inkMid, lineHeight: 20, marginBottom: theme.spacing.md },
  tipCat:       { fontFamily: theme.fontFamily.mono, fontSize: 9, color: theme.colors.inkMuted, letterSpacing: 2, marginTop: theme.spacing.sm, marginBottom: 6 },
  tipRow:       { flexDirection: 'row', alignItems: 'center', gap: 10, paddingVertical: 4 },
  tipDot:       { width: 6, height: 6 },
  tipItem:      { fontFamily: theme.fontFamily.display, fontSize: theme.fontSize.sm, color: theme.colors.ink },

  menoBlock: { borderTopWidth: 1, borderTopColor: theme.colors.line, paddingVertical: theme.spacing.md, gap: 6 },
  menoLabel: { fontFamily: theme.fontFamily.mono, fontSize: 9, color: theme.colors.inkMuted, letterSpacing: 2 },
  menoText:  { fontFamily: theme.fontFamily.display, fontSize: theme.fontSize.sm, color: theme.colors.inkMid, lineHeight: 20 },
});

const lb = StyleSheet.create({
  btn:    { borderWidth: 1, borderColor: theme.colors.line, paddingHorizontal: 12, paddingVertical: 8, minHeight: theme.touchTarget, justifyContent: 'center' },
  text:   { fontFamily: theme.fontFamily.mono, fontSize: 9, color: theme.colors.inkMuted, letterSpacing: 1 },
  textOn: { color: theme.colors.invertInk },
});
