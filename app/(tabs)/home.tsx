import { useState, useCallback } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView, ActivityIndicator } from 'react-native';
import { router, useFocusEffect } from 'expo-router';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { getUser, getProfile, signOut } from '../../lib/auth';
import { getTodayEntry as getJournalToday, todayISO } from '../../lib/journal';
import { getTodayEntry as getWeightToday, getLast30Entries, getStreak } from '../../lib/weight';
import { getCurrentPhase, type CurrentPhase } from '../../lib/parcours';
import {
  PREPARATION_DAYS, RESET_DAYS,
  DESTOCKAGE_TRIGGER_PCT,
  isTransitionReady, nextPhase,
  phaseNumberFr, phaseListsFr, orangeRhythmFr,
} from '../../lib/phases';
import { getExams, examStatus, formatNextDate, EXAM_CONFIG, type PreventiveExam } from '../../lib/preventive';
import { theme } from '../../lib/theme';
import { strings } from '../../lib/strings';

function weekISO(): string {
  const d = new Date();
  const day = d.getDay();
  const diff = d.getDate() - day + (day === 0 ? -6 : 1);
  return new Date(d.setDate(diff)).toISOString().split('T')[0];
}

interface HomeData {
  prenom: string;
  phase: CurrentPhase | null;
  hasWeight: boolean;
  hasJournal: boolean;
  poidsInitial: number | null;
  poidsObjectif: number | null;
  poidsActuel: number | null;
  streak: number;
  urgentExams: PreventiveExam[];
}

export default function HomeScreen() {
  const [data,       setData]       = useState<HomeData | null>(null);
  const [loading,    setLoading]    = useState(true);
  const [waterCount,    setWaterCount]    = useState(0);
  const [movementCount, setMovementCount] = useState(0);
  const [alcoholCount,  setAlcoholCount]  = useState(0);

  useFocusEffect(useCallback(() => { load(); }, []));

  async function load() {
    setLoading(true);
    try {
      const user = await getUser();
      if (!user) { router.replace('/(auth)/login'); return; }

      const [profile, phase, weightEntry, journalEntry, weightHistory, streak, exams] = await Promise.all([
        getProfile(user.id),
        getCurrentPhase(user.id),
        getWeightToday(user.id),
        getJournalToday(user.id),
        getLast30Entries(user.id),
        getStreak(user.id),
        getExams(user.id),
      ]);

      if (!profile || !profile.poids_initial_kg) {
        router.replace('/(onboarding)/step1');
        return;
      }

      const poidsActuel = weightEntry?.poids_kg
        ?? (weightHistory.length ? weightHistory[weightHistory.length - 1].poids_kg : null);

      const urgentExams = exams.filter(e => {
        const st = examStatus(e);
        return st === 'due' || st === 'soon';
      }).slice(0, 3);

      setData({
        prenom:        profile.prenom,
        phase,
        hasWeight:     !!weightEntry,
        hasJournal:    !!journalEntry,
        poidsInitial:  profile.poids_initial_kg ?? null,
        poidsObjectif: profile.poids_objectif_kg ?? null,
        poidsActuel,
        streak,
        urgentExams,
      });

      const storedWater    = await AsyncStorage.getItem(`water_${todayISO()}`);
      const storedMovement = await AsyncStorage.getItem(`movement_${todayISO()}`);
      const storedAlcohol  = await AsyncStorage.getItem(`alcohol_${weekISO()}`);
      setWaterCount(storedWater       ? parseInt(storedWater,    10) : 0);
      setMovementCount(storedMovement ? parseInt(storedMovement, 10) : 0);
      setAlcoholCount(storedAlcohol   ? parseInt(storedAlcohol,  10) : 0);
    } catch (e) {
      console.error('home load error:', e);
    } finally {
      setLoading(false);
    }
  }

  if (loading) {
    return <View style={s.centered}><ActivityIndicator color={theme.colors.inkSoft} /></View>;
  }

  const thought = strings.home.thoughts[new Date().getDay() % strings.home.thoughts.length];
  const dateLabel = new Date().toLocaleDateString('fr-FR', { weekday: 'long', day: 'numeric', month: 'long' });

  async function handleWaterTap(n: number) {
    const newCount = waterCount === n ? n - 1 : n;
    setWaterCount(newCount);
    await AsyncStorage.setItem(`water_${todayISO()}`, String(newCount));
  }

  async function handleMovementTap(n: number) {
    const newCount = movementCount === n ? n - 1 : n;
    setMovementCount(newCount);
    await AsyncStorage.setItem(`movement_${todayISO()}`, String(newCount));
  }

  async function handleAlcoholTap(n: number) {
    const newCount = alcoholCount === n ? n - 1 : n;
    setAlcoholCount(newCount);
    await AsyncStorage.setItem(`alcohol_${weekISO()}`, String(newCount));
  }

  // Transition logic
  const phase = data?.phase ?? null;
  const poidsInitial  = data?.poidsInitial  ?? null;
  const poidsObjectif = data?.poidsObjectif ?? null;
  const poidsActuel   = data?.poidsActuel   ?? null;

  const weightPct = (poidsInitial && poidsObjectif && poidsActuel && poidsInitial > poidsObjectif)
    ? Math.min(100, Math.max(0, Math.round(((poidsInitial - poidsActuel) / (poidsInitial - poidsObjectif)) * 100)))
    : 0;

  const transitionReady = phase
    ? isTransitionReady(phase.phase, phase.daysDone, weightPct)
    : false;
  const nextPhaseName = phase ? nextPhase(phase.phase) : null;

  return (
    <ScrollView style={s.root} contentContainerStyle={s.scroll}>

      {/* ── HEADER ── */}
      <View style={s.header}>
        <View style={s.headerTopRow}>
          <Text style={s.eyebrow}>{dateLabel.toUpperCase()}</Text>
          <TouchableOpacity onPress={() => router.push('/(tabs)/settings')} hitSlop={12}>
            <Text style={s.settingsIcon}>⚙</Text>
          </TouchableOpacity>
        </View>
        <Text style={s.greeting}>Bonjour,{'\n'}{data?.prenom ?? ''} .</Text>
        <Text style={s.tagline}>{strings.home.tagline}</Text>
      </View>

      <View style={s.divider} />

      {/* ── META BAR ── */}
      <View style={s.metaBar}>
        <Text style={s.metaItem}>
          {phase ? `${phaseNumberFr(phase.phase)} — Jour ${phase.daysDone}` : '—'}
        </Text>
        <Text style={s.metaItem}>
          {`${(data?.hasWeight ? 1 : 0) + (data?.hasJournal ? 1 : 0)}/2 réalisé`}
        </Text>
      </View>

      <View style={s.body}>

        {/* ── PHASE ── */}
        {phase && (
          <View style={s.section}>
            <Text style={s.sectionLabel}>{strings.home.sectionParcours.toUpperCase()}</Text>
            <View style={s.inkDivider} />

            {/* ── Phase 1 — Préparation ── */}
            {phase.phase === 'preparation' && (
              <>
                <View style={s.phaseBlock}>
                  <View>
                    <Text style={s.eyebrowSmall}>PHASE 1 — PRÉPARATION</Text>
                    <Text style={s.bigNumeral}>{String(Math.min(phase.daysDone, PREPARATION_DAYS)).padStart(2, '0')}</Text>
                  </View>
                  <Text style={s.phaseRight}>{`sur\n${PREPARATION_DAYS}\njours`}</Text>
                </View>
                <View style={s.tickRow}>
                  {Array.from({ length: PREPARATION_DAYS }).map((_, i) => (
                    <View key={i} style={[s.tick, i < Math.min(phase.daysDone, PREPARATION_DAYS) ? s.tickDone : s.tickEmpty]} />
                  ))}
                </View>
                <Text style={s.phaseTip}>On ajoute de bonnes habitudes avant toute restriction.</Text>
                <View style={s.todoBlock}>
                  <Text style={s.todoLabel}>À FAIRE AUJOURD'HUI</Text>
                  {['Boire 2 L d\'eau par jour', '3 repas assis, sans écran', 'Observer vos habitudes sans jugement'].map(a => (
                    <View key={a} style={s.todoRow}><View style={s.todoDot} /><Text style={s.todoText}>{a}</Text></View>
                  ))}
                </View>
              </>
            )}

            {/* ── Phase 2 — Reset ── */}
            {phase.phase === 'reset' && (
              <>
                <View style={s.phaseBlock}>
                  <View>
                    <Text style={s.eyebrowSmall}>PHASE 2 — RESET</Text>
                    <Text style={s.bigNumeral}>{String(Math.min(phase.daysDone, RESET_DAYS)).padStart(2, '0')}</Text>
                  </View>
                  <Text style={s.phaseRight}>{`sur\n${RESET_DAYS}\njours`}</Text>
                </View>
                <View style={s.tickRow}>
                  {Array.from({ length: RESET_DAYS }).map((_, i) => (
                    <View key={i} style={[s.tick, i < Math.min(phase.daysDone, RESET_DAYS) ? s.tickDone : s.tickEmpty]} />
                  ))}
                </View>
                <Text style={s.phaseTip}>Liste verte stricte. Glycémie stabilisée, premier élan ressenti.</Text>
                <View style={s.todoBlock}>
                  <Text style={s.todoLabel}>À FAIRE AUJOURD'HUI</Text>
                  {['Eau citronnée le matin à jeun', 'Protéines à chaque repas', 'Légumes verts à volonté — fibres importantes', 'Tofu ou soja autorisés (phytoestrogènes)'].map(a => (
                    <View key={a} style={s.todoRow}><View style={s.todoDot} /><Text style={s.todoText}>{a}</Text></View>
                  ))}
                </View>
              </>
            )}

            {/* ── Phase 3 — Déstockage ── */}
            {phase.phase === 'destockage' && poidsInitial != null && poidsObjectif != null && (
              <>
                <Text style={s.phaseSubLabel}>PHASE 3 — DÉSTOCKAGE ACTIF</Text>
                <View style={s.inkBlock}>
                  <View style={s.progRow}>
                    <View style={s.progStat}>
                      <Text style={s.progVal}>{poidsInitial} kg</Text>
                      <Text style={s.progLbl}>DÉPART</Text>
                    </View>
                    <View style={[s.progStat, s.progStatCenter]}>
                      <Text style={[s.progVal, s.progValBig]}>
                        {poidsActuel != null ? `${poidsActuel} kg` : '—'}
                      </Text>
                      <Text style={s.progLbl}>ACTUEL</Text>
                    </View>
                    <View style={[s.progStat, s.progStatRight]}>
                      <Text style={s.progVal}>{poidsObjectif} kg</Text>
                      <Text style={s.progLbl}>OBJECTIF</Text>
                    </View>
                  </View>
                  <ProgBar initial={poidsInitial} current={poidsActuel} goal={poidsObjectif} />
                  <View style={s.chips}>
                    {poidsActuel != null && poidsActuel < poidsInitial && (
                      <Text style={s.chip}>↓ {+(poidsInitial - poidsActuel).toFixed(1)} kg perdus</Text>
                    )}
                    {poidsActuel != null && poidsActuel > poidsObjectif && (
                      <Text style={s.chip}>{+(poidsActuel - poidsObjectif).toFixed(1)} kg restants</Text>
                    )}
                    {data?.streak != null && data.streak > 0 && (
                      <Text style={s.chip}>🔥 {data.streak} jour{data.streak > 1 ? 's' : ''}</Text>
                    )}
                  </View>
                  <Text style={s.progHint}>Phase 4 à {DESTOCKAGE_TRIGGER_PCT} % de l'objectif · Actuellement {weightPct} %</Text>
                </View>
                <View style={s.todoBlock}>
                  <Text style={s.todoLabel}>À FAIRE AUJOURD'HUI</Text>
                  {['Pesée ce matin, même heure', 'Pas de glucides après 18h', 'Une source de calcium à chaque repas', 'Poisson gras cette semaine ? (sardine, saumon)'].map(a => (
                    <View key={a} style={s.todoRow}><View style={s.todoDot} /><Text style={s.todoText}>{a}</Text></View>
                  ))}
                </View>
              </>
            )}

            {/* ── Phase 4 — Réintroduction ── */}
            {phase.phase === 'reinsertion' && (
              <>
                <Text style={s.phaseSubLabel}>PHASE 4 — RÉINTRODUCTION</Text>
                <View style={s.reintroBlock}>
                  <View style={s.reintroRow}>
                    <Text style={s.reintroWeek}>S{phase.weekNumber}</Text>
                    <View style={s.reintroText}>
                      <Text style={s.reintroLabel}>Semaine {phase.weekNumber}</Text>
                      <Text style={s.reintroSub}>{orangeRhythmFr(phase.daysDone).toUpperCase()}</Text>
                    </View>
                  </View>
                  <View style={s.reintroHintRow}>
                    <View style={s.orangeDot} />
                    <Text style={s.reintroHint}>Orange autorisé les jours de réintroduction</Text>
                  </View>
                  {data?.streak != null && data.streak > 0 && (
                    <View style={s.chips}>
                      <Text style={s.chipDark}>🔥 {data.streak} jour{data.streak > 1 ? 's' : ''}</Text>
                    </View>
                  )}
                </View>
                <View style={s.todoBlock}>
                  <Text style={s.todoLabel}>À FAIRE AUJOURD'HUI</Text>
                  {['Observer les sensations après chaque réintroduction', 'Maintenir la pesée quotidienne'].map(a => (
                    <View key={a} style={s.todoRow}><View style={s.todoDot} /><Text style={s.todoText}>{a}</Text></View>
                  ))}
                </View>
              </>
            )}

            {/* ── Phase 5 — Équilibre ── */}
            {phase.phase === 'equilibre' && (
              <View style={s.stabBlock}>
                <Text style={s.stabTitle}>Votre nouveau rythme.</Text>
                <View style={s.stabRow}>
                  <Text style={s.stabCheck}>✓</Text>
                  <View>
                    <Text style={s.stabLabel}>Phase d'équilibre de vie</Text>
                    <Text style={s.stabSub}>MODE DE VIE DURABLE</Text>
                  </View>
                </View>
                {poidsObjectif != null && poidsActuel != null && (
                  <View style={s.stabMaintien}>
                    <Text style={s.stabMaintienLabel}>
                      {Math.abs(poidsActuel - poidsObjectif) <= 2
                        ? `✓ Dans la fourchette cible (±2 kg)`
                        : `${Math.abs(poidsActuel - poidsObjectif).toFixed(1)} kg de l'objectif`}
                    </Text>
                  </View>
                )}
                {data?.streak != null && data.streak > 0 && (
                  <View style={s.chips}>
                    <Text style={s.chipDark}>🔥 {data.streak} jour{data.streak > 1 ? 's' : ''} de régularité</Text>
                  </View>
                )}
                <View style={s.todoBlock}>
                  <Text style={s.todoLabel}>À FAIRE AUJOURD'HUI</Text>
                  {['Verte et jaune en base quotidienne', 'Pesée 2–3 fois par semaine'].map(a => (
                    <View key={a} style={s.todoRow}><View style={s.todoDot} /><Text style={s.todoText}>{a}</Text></View>
                  ))}
                </View>
              </View>
            )}

            {/* ── Bandeau de transition ── */}
            {transitionReady && nextPhaseName && (
              <TouchableOpacity
                style={s.transitionBanner}
                onPress={() => router.push(`/transition?from=${phase.phase}&to=${nextPhaseName}`)}
                activeOpacity={0.85}
              >
                <View>
                  <Text style={s.transitionEyebrow}>PROCHAINE ÉTAPE DISPONIBLE</Text>
                  <Text style={s.transitionLabel}>{phaseListsFr(nextPhaseName)} →</Text>
                </View>
              </TouchableOpacity>
            )}

            {/* ── Lien méthode ── */}
            <TouchableOpacity style={s.methodeLink} onPress={() => router.push('/methode')}>
              <Text style={s.methodeLinkText}>LA MÉTHODE COMPLÈTE →</Text>
            </TouchableOpacity>
          </View>
        )}

        {/* ── AUJOURD'HUI ── */}
        <View style={s.section}>
          <Text style={s.sectionLabel}>{strings.home.sectionToday.toUpperCase()}</Text>
          <View style={s.inkDivider} />
          <CheckRow
            n="01" label={strings.home.checkinWeight}
            done={data?.hasWeight ?? false}
            onPress={() => router.push('/(tabs)/suivi')}
          />
          <CheckRow
            n="02" label={strings.home.checkinJournal}
            done={data?.hasJournal ?? false}
            onPress={() => router.push('/(tabs)/journal')}
          />
          <View style={s.waterBlock}>
            <Text style={s.waterBlockLabel}>EAU — OBJECTIF 2 L</Text>
            <View style={s.waterGlassRow}>
              {Array.from({ length: 8 }).map((_, i) => (
                <TouchableOpacity
                  key={i}
                  onPress={() => handleWaterTap(i + 1)}
                  style={[s.waterGlass, i < waterCount && s.waterGlassFull]}
                  hitSlop={6}
                />
              ))}
            </View>
            <Text style={s.waterStatus}>
              {waterCount} / 8 verres · {waterCount * 250} mL{waterCount >= 8 ? ' — Objectif atteint ✓' : ''}
            </Text>
          </View>

          <View style={s.waterBlock}>
            <Text style={s.waterBlockLabel}>MOUVEMENT — OBJECTIF 30 MIN</Text>
            <View style={s.waterGlassRow}>
              {Array.from({ length: 4 }).map((_, i) => (
                <TouchableOpacity
                  key={i}
                  onPress={() => handleMovementTap(i + 1)}
                  style={[s.waterGlass, i < movementCount && s.movementBlockFull, i === 1 && movementCount <= 2 && s.movementGoalBorder]}
                  hitSlop={6}
                />
              ))}
            </View>
            <Text style={s.waterStatus}>
              {movementCount * 15} / 30 min{movementCount >= 2 ? ' — Objectif atteint ✓' : ''}{movementCount > 2 ? ` (${movementCount * 15} min au total)` : ''}
            </Text>
          </View>

          <View style={s.waterBlock}>
            <Text style={s.waterBlockLabel}>ALCOOL — CETTE SEMAINE</Text>
            <View style={s.waterGlassRow}>
              {Array.from({ length: 7 }).map((_, i) => (
                <TouchableOpacity
                  key={i}
                  onPress={() => handleAlcoholTap(i + 1)}
                  style={[s.waterGlass, i < alcoholCount && s.alcoholBlockFull]}
                  hitSlop={6}
                />
              ))}
            </View>
            <Text style={s.waterStatus}>
              {alcoholCount === 0
                ? 'Aucun verre cette semaine'
                : alcoholCount <= 7
                ? `${alcoholCount} verre${alcoholCount > 1 ? 's' : ''} · dans les recommandations`
                : `${alcoholCount} verres · au-dessus des recommandations (max 7/sem.)`}
            </Text>
          </View>
        </View>

        {/* ── SANTÉ PRÉVENTIVE ── */}
        {data?.urgentExams && data.urgentExams.length > 0 && (
          <View style={s.section}>
            <Text style={s.sectionLabel}>SANTÉ PRÉVENTIVE</Text>
            <View style={s.inkDivider} />
            {data.urgentExams.map((exam, i) => {
              const st = examStatus(exam);
              const color = st === 'due' ? '#B03030' : '#C07A2A';
              const isLast = i === data.urgentExams.length - 1;
              return (
                <View key={exam.exam_type} style={[examCard.row, isLast && examCard.rowLast]}>
                  <View style={[examCard.dot, { backgroundColor: color }]} />
                  <View style={examCard.mid}>
                    <Text style={examCard.label}>{EXAM_CONFIG[exam.exam_type].label}</Text>
                    <Text style={[examCard.next, { color }]}>{formatNextDate(exam)}</Text>
                  </View>
                </View>
              );
            })}
            <TouchableOpacity style={examCard.link} onPress={() => router.push('/sante')}>
              <Text style={examCard.linkText}>GÉRER MES EXAMENS →</Text>
            </TouchableOpacity>
          </View>
        )}

        {/* ── PENSÉE ── */}
        <View style={s.section}>
          <Text style={s.sectionLabel}>{strings.home.sectionThought.toUpperCase()}</Text>
          <View style={s.inkDivider} />
          <Text style={s.thought}>{thought}</Text>
          <TouchableOpacity style={s.thoughtBtn} onPress={() => router.push('/(tabs)/journal')}>
            <Text style={s.thoughtBtnText}>OUVRIR LE JOURNAL</Text>
          </TouchableOpacity>
        </View>

        {/* ── SIGN OUT ── */}
        <TouchableOpacity style={s.signOutBtn}
          onPress={async () => { await signOut(); router.replace('/(auth)/login'); }}>
          <Text style={s.signOutText}>{strings.home.signOut.toUpperCase()}</Text>
        </TouchableOpacity>

      </View>
    </ScrollView>
  );
}

function ProgBar({ initial, current, goal }: { initial: number; current: number | null; goal: number }) {
  const total = initial - goal;
  const pct = current != null && total > 0
    ? Math.min(100, Math.max(0, Math.round(((initial - current) / total) * 100)))
    : 0;
  return (
    <>
      <View style={pb.bg}><View style={[pb.fill, { width: `${pct}%` as unknown as number }]} /></View>
      <Text style={pb.label}>{pct} %</Text>
    </>
  );
}

function CheckRow({ n, label, done, onPress, last }: {
  n: string; label: string; done: boolean; onPress: () => void; last?: boolean;
}) {
  return (
    <TouchableOpacity style={[cr.row, last && cr.rowLast]} onPress={onPress}>
      <Text style={cr.num}>{n}</Text>
      <View style={[cr.box, done && cr.boxDone]}>
        {done && <Text style={cr.check}>✓</Text>}
      </View>
      <Text style={[cr.label, done && cr.labelDone]}>{label}</Text>
    </TouchableOpacity>
  );
}

const s = StyleSheet.create({
  root:      { flex: 1, backgroundColor: theme.colors.app },
  centered:  { flex: 1, alignItems: 'center', justifyContent: 'center' },
  scroll:    { flexGrow: 1 },
  header: {
    paddingTop: theme.spacing.xxl,
    paddingHorizontal: theme.spacing.lg,
    paddingBottom: theme.spacing.lg,
    backgroundColor: theme.colors.app,
  },
  headerTopRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 18 },
  settingsIcon: { fontFamily: theme.fontFamily.mono, fontSize: 18, color: theme.colors.inkMuted },
  eyebrow: {
    fontFamily: theme.fontFamily.mono,
    fontSize: theme.fontSize.xs,
    color: theme.colors.inkMuted,
    letterSpacing: 2,
  },
  greeting: {
    fontFamily: theme.fontFamily.display,
    fontSize: theme.fontSize.display,
    lineHeight: theme.fontSize.display * 0.9,
    color: theme.colors.ink,
    letterSpacing: -2,
    marginBottom: 14,
  },
  tagline: {
    fontFamily: theme.fontFamily.mono,
    fontSize: theme.fontSize.xs,
    color: theme.colors.inkSoft,
    letterSpacing: 1,
    fontStyle: 'italic',
  },
  divider:  { height: 1, backgroundColor: theme.colors.ink, marginHorizontal: theme.spacing.lg },
  metaBar: {
    flexDirection: 'row', justifyContent: 'space-between',
    paddingHorizontal: theme.spacing.lg, paddingVertical: 10,
    borderBottomWidth: 1, borderBottomColor: theme.colors.line,
  },
  metaItem: {
    fontFamily: theme.fontFamily.mono,
    fontSize: theme.fontSize.xs,
    color: theme.colors.inkMuted,
    letterSpacing: 1,
    textTransform: 'uppercase',
  },
  body:    { paddingHorizontal: theme.spacing.lg, paddingBottom: theme.spacing.xl },
  section: { paddingTop: theme.spacing.xl, gap: 0 },
  sectionLabel: {
    fontFamily: theme.fontFamily.mono,
    fontSize: theme.fontSize.xs,
    color: theme.colors.inkMuted,
    letterSpacing: 2,
    marginBottom: 10,
  },
  inkDivider: { height: 1, backgroundColor: theme.colors.ink, marginBottom: 0 },

  // Phases 1 & 2 — compteur avec ticks
  phaseBlock: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-end', paddingTop: 16 },
  eyebrowSmall: {
    fontFamily: theme.fontFamily.mono, fontSize: theme.fontSize.xs,
    color: theme.colors.inkMuted, letterSpacing: 2, marginBottom: 4,
  },
  bigNumeral: {
    fontFamily: theme.fontFamily.display,
    fontSize: 96,
    lineHeight: 96 * 0.85,
    color: theme.colors.ink,
    letterSpacing: -4,
  },
  phaseRight: {
    fontFamily: theme.fontFamily.mono, fontSize: theme.fontSize.xs,
    color: theme.colors.inkMuted, letterSpacing: 1, textAlign: 'right',
    textTransform: 'uppercase', paddingBottom: 8,
  },
  tickRow:   { flexDirection: 'row', gap: 2, marginTop: 14, height: 20, alignItems: 'flex-end' },
  tick:      { flex: 1, borderRadius: 0 },
  tickDone:  { height: 20, backgroundColor: theme.colors.ink },
  tickEmpty: { height: 6,  backgroundColor: theme.colors.line },
  phaseTip: {
    fontFamily: theme.fontFamily.mono, fontSize: 9,
    color: theme.colors.inkMuted, letterSpacing: 0.5, lineHeight: 14,
    marginTop: 10, fontStyle: 'italic',
  },

  phaseSubLabel: {
    fontFamily: theme.fontFamily.mono, fontSize: theme.fontSize.xs,
    color: theme.colors.inkMuted, letterSpacing: 2, paddingTop: 14, paddingBottom: 10,
  },

  // Phase 3 — ink block progression
  inkBlock: {
    backgroundColor: theme.colors.ink,
    padding: theme.spacing.md,
  },
  progRow:        { flexDirection: 'row', marginBottom: 14 },
  progStat:       { flex: 1 },
  progStatCenter: { alignItems: 'center' },
  progStatRight:  { alignItems: 'flex-end' },
  progVal:        { fontFamily: theme.fontFamily.display, fontSize: theme.fontSize.lg, color: theme.colors.invertInk, letterSpacing: -0.5 },
  progValBig:     { fontSize: theme.fontSize.xl },
  progLbl:        { fontFamily: theme.fontFamily.mono, fontSize: 9, color: 'rgba(230,235,242,0.5)', letterSpacing: 1.5, marginTop: 3 },
  chips:          { flexDirection: 'row', flexWrap: 'wrap', gap: 6, marginTop: 12 },
  chip: {
    fontFamily: theme.fontFamily.mono, fontSize: 10,
    color: 'rgba(230,235,242,0.7)',
    borderWidth: 1, borderColor: 'rgba(230,235,242,0.25)',
    paddingHorizontal: 10, paddingVertical: 3,
    letterSpacing: 0.5,
  },
  progHint: {
    fontFamily: theme.fontFamily.mono, fontSize: 8,
    color: 'rgba(230,235,242,0.4)',
    letterSpacing: 0.5, marginTop: 10, fontStyle: 'italic',
  },

  // Phase 4 — réintroduction
  reintroBlock: {
    paddingTop: 14, paddingBottom: 4,
    borderTopWidth: 1, borderTopColor: theme.colors.line,
  },
  reintroRow:  { flexDirection: 'row', alignItems: 'center', gap: 16, marginBottom: 12 },
  reintroWeek: {
    fontFamily: theme.fontFamily.display, fontSize: 52,
    lineHeight: 52 * 0.85, color: theme.colors.ink, letterSpacing: -2,
  },
  reintroText:  { flex: 1 },
  reintroLabel: { fontFamily: theme.fontFamily.display, fontSize: theme.fontSize.lg, color: theme.colors.ink },
  reintroSub:   { fontFamily: theme.fontFamily.mono, fontSize: 9, color: theme.colors.inkSoft, letterSpacing: 1.5, marginTop: 3 },
  reintroHintRow: { flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 8 },
  orangeDot:    { width: 8, height: 8, backgroundColor: '#C07A2A', flexShrink: 0 },
  reintroHint:  { fontFamily: theme.fontFamily.mono, fontSize: 9, color: theme.colors.inkMuted, letterSpacing: 0.5, flex: 1 },
  chipDark: {
    fontFamily: theme.fontFamily.mono, fontSize: 10,
    color: theme.colors.inkMuted,
    borderWidth: 1, borderColor: theme.colors.line,
    paddingHorizontal: 10, paddingVertical: 3,
    letterSpacing: 0.5,
  },

  // Phase 5 — équilibre
  stabBlock: { paddingTop: 16 },
  stabTitle: {
    fontFamily: theme.fontFamily.display, fontSize: theme.fontSize.xl,
    color: theme.colors.ink, letterSpacing: -0.5, marginBottom: 14,
  },
  stabRow:  { flexDirection: 'row', alignItems: 'center', gap: 14, paddingVertical: 12, borderTopWidth: 1, borderTopColor: theme.colors.line },
  stabCheck:{ fontFamily: theme.fontFamily.display, fontSize: 24, color: '#3A7D44' },
  stabLabel:{ fontFamily: theme.fontFamily.display, fontSize: theme.fontSize.md, color: theme.colors.ink },
  stabSub:  { fontFamily: theme.fontFamily.mono, fontSize: 9, color: theme.colors.inkMuted, letterSpacing: 1.5, marginTop: 3 },
  stabMaintien: { paddingVertical: 8, borderTopWidth: 1, borderTopColor: theme.colors.line },
  stabMaintienLabel: { fontFamily: theme.fontFamily.mono, fontSize: 9, color: theme.colors.inkSoft, letterSpacing: 1 },

  // Transition banner
  transitionBanner: {
    marginTop: 14,
    borderWidth: 1, borderColor: theme.colors.ink,
    padding: theme.spacing.md,
    backgroundColor: theme.colors.surface,
  },
  transitionEyebrow: {
    fontFamily: theme.fontFamily.mono, fontSize: 9,
    color: theme.colors.inkMuted, letterSpacing: 2, marginBottom: 4,
  },
  transitionLabel: {
    fontFamily: theme.fontFamily.display, fontSize: theme.fontSize.md,
    color: theme.colors.ink,
  },

  // Thought
  thought: {
    fontFamily: theme.fontFamily.display,
    fontSize: theme.fontSize.xl,
    color: theme.colors.ink,
    lineHeight: theme.fontSize.xl * 1.2,
    letterSpacing: -0.5,
    paddingVertical: theme.spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: theme.colors.line,
  },
  thoughtBtn: {
    paddingVertical: 14,
    borderBottomWidth: 1,
    borderBottomColor: theme.colors.ink,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  thoughtBtnText: {
    fontFamily: theme.fontFamily.mono,
    fontSize: theme.fontSize.xs,
    color: theme.colors.ink,
    letterSpacing: 2,
  },

  // À faire
  todoBlock: { marginTop: 14, borderTopWidth: 1, borderTopColor: theme.colors.lineSoft, paddingTop: 10, gap: 6 },
  todoLabel: { fontFamily: theme.fontFamily.mono, fontSize: 9, color: theme.colors.inkMuted, letterSpacing: 2, marginBottom: 4 },
  todoRow:   { flexDirection: 'row', alignItems: 'flex-start', gap: 10 },
  todoDot:   { width: 4, height: 4, backgroundColor: theme.colors.inkSoft, marginTop: 6, flexShrink: 0 },
  todoText:  { flex: 1, fontFamily: theme.fontFamily.display, fontSize: theme.fontSize.sm, color: theme.colors.ink, lineHeight: 20 },

  // Méthode link
  methodeLink: { marginTop: 14, paddingVertical: 14, borderTopWidth: 1, borderTopColor: theme.colors.line, borderBottomWidth: 1, borderBottomColor: theme.colors.ink, alignItems: 'flex-end' },
  methodeLinkText: { fontFamily: theme.fontFamily.mono, fontSize: theme.fontSize.xs, color: theme.colors.ink, letterSpacing: 2 },

  // Water counter
  waterBlock:      { paddingTop: 14, borderTopWidth: 1, borderTopColor: theme.colors.lineSoft, gap: 8 },
  waterBlockLabel: { fontFamily: theme.fontFamily.mono, fontSize: 9, color: theme.colors.inkMuted, letterSpacing: 2 },
  waterGlassRow:   { flexDirection: 'row', gap: 5 },
  waterGlass:      { flex: 1, height: 28, borderWidth: 1.5, borderColor: theme.colors.line },
  waterGlassFull:      { backgroundColor: theme.colors.inkSoft, borderColor: theme.colors.inkSoft },
  movementBlockFull:   { backgroundColor: '#3A7D44', borderColor: '#3A7D44' },
  movementGoalBorder:  { borderRightWidth: 3, borderRightColor: theme.colors.ink },
  alcoholBlockFull:    { backgroundColor: '#7A3050', borderColor: '#7A3050' },
  waterStatus:         { fontFamily: theme.fontFamily.mono, fontSize: 9, color: theme.colors.inkMuted, letterSpacing: 1 },

  // Sign out
  signOutBtn: {
    marginTop: theme.spacing.xl,
    paddingVertical: 16,
    borderWidth: 1,
    borderColor: theme.colors.line,
    alignItems: 'center',
  },
  signOutText: {
    fontFamily: theme.fontFamily.mono,
    fontSize: theme.fontSize.xs,
    color: theme.colors.inkMuted,
    letterSpacing: 2,
  },
});

const examCard = StyleSheet.create({
  row: {
    flexDirection: 'row', alignItems: 'center', gap: 14,
    paddingVertical: 14, borderBottomWidth: 1, borderBottomColor: theme.colors.line,
    minHeight: theme.touchTarget,
  },
  rowLast: { borderBottomWidth: 0 },
  dot:     { width: 8, height: 8, flexShrink: 0 },
  mid:     { flex: 1 },
  label:   { fontFamily: theme.fontFamily.display, fontSize: theme.fontSize.md, color: theme.colors.ink },
  next:    { fontFamily: theme.fontFamily.mono, fontSize: 9, letterSpacing: 1.5, marginTop: 3 },
  link: {
    paddingVertical: 14,
    borderBottomWidth: 1, borderBottomColor: theme.colors.ink,
    alignItems: 'flex-end',
  },
  linkText: { fontFamily: theme.fontFamily.mono, fontSize: theme.fontSize.xs, color: theme.colors.ink, letterSpacing: 2 },
});

const pb = StyleSheet.create({
  bg:    { height: 3, backgroundColor: 'rgba(230,235,242,0.2)' },
  fill:  { height: 3, backgroundColor: theme.colors.invertInk },
  label: { fontFamily: theme.fontFamily.mono, fontSize: 9, color: 'rgba(230,235,242,0.5)', textAlign: 'right', marginTop: 4, letterSpacing: 1 },
});

const cr = StyleSheet.create({
  row: {
    flexDirection: 'row', alignItems: 'center', gap: 14,
    paddingVertical: 16,
    borderBottomWidth: 1, borderBottomColor: theme.colors.line,
    minHeight: theme.touchTarget,
  },
  rowLast: { borderBottomWidth: 0 },
  num:  { fontFamily: theme.fontFamily.mono, fontSize: 10, color: theme.colors.inkMuted, width: 24, letterSpacing: 1 },
  box: {
    width: 22, height: 22,
    borderWidth: 1.5, borderColor: theme.colors.ink,
    alignItems: 'center', justifyContent: 'center', flexShrink: 0,
  },
  boxDone:   { backgroundColor: theme.colors.ink },
  check:     { color: theme.colors.invertInk, fontSize: 12 },
  label:     { fontFamily: theme.fontFamily.display, fontSize: theme.fontSize.md, color: theme.colors.ink, flex: 1 },
  labelDone: { color: theme.colors.inkMuted, textDecorationLine: 'line-through' },
});
