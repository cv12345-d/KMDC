import { useState, useCallback } from 'react';
import {
  View, Text, TouchableOpacity, StyleSheet, ScrollView,
  ActivityIndicator, useWindowDimensions,
} from 'react-native';
import { useFocusEffect } from 'expo-router';
import { theme } from '../../lib/theme';
import { getUser, getProfile } from '../../lib/auth';
import { getRandomPuzzle, isBoardSolved, getErrorCells, type SudokuPuzzle } from '../../lib/sudoku';

// ── TIP DATA ────────────────────────────────────────────────

interface Tip {
  id: string;
  icon: string;
  category: string;
  title: string;
  body: string;
  accent: string;
}

const TIPS_STATIC: Tip[] = [
  {
    id: 'soir',
    icon: '🍽',
    category: 'ALIMENTATION',
    title: 'Ce que vous mangez après 18h',
    body: 'Protéines légères et légumes cuits : oui. Glucides même complets : à limiter le soir. Votre métabolisme ralentit en fin de journée — un repas léger facilite le sommeil et la récupération hormonale.',
    accent: theme.colors.inkSoft,
  },
  {
    id: 'calcium',
    icon: '🦴',
    category: 'OS & CALCIUM',
    title: 'Calcium : 1000 mg par jour',
    body: 'Après 45 ans, la chute des œstrogènes accélère la perte osseuse. Objectif : une source de calcium à chaque repas. Fromage (30 g = 250 mg), sardines avec arêtes, brocoli, amandes, yaourt nature. La vitamine D (soleil, poissons gras) est indispensable pour l\'absorber.',
    accent: '#9A8E80',
  },
  {
    id: 'omega3',
    icon: '🐟',
    category: 'CARDIOVASCULAIRE',
    title: 'Oméga-3 : votre protection cardiaque',
    body: 'La ménopause supprime la protection naturelle des œstrogènes sur les artères. Les oméga-3 (sardines, saumon, maquereau, hareng) réduisent l\'inflammation et le cholestérol LDL. Cible : 3 fois par semaine. Bonus : noix, graines de lin, huile de colza au quotidien.',
    accent: '#2A7D5A',
  },
  {
    id: 'phyto',
    icon: '🌱',
    category: 'PHYTOESTROGÈNES',
    title: 'Les œstrogènes naturels de la nature',
    body: 'Les phytoestrogènes imitent doucement les œstrogènes et peuvent atténuer les bouffées de chaleur. Sources liste verte : tofu, soja, graines de lin moulues. Pratique : 1 cuillère à soupe de graines de lin moulues dans votre yaourt chaque matin. Résultats après 4–6 semaines.',
    accent: '#3A7D44',
  },
  {
    id: 'eau',
    icon: '💧',
    category: 'HYDRATATION',
    title: "L'eau, avant tout",
    body: "2 grands verres d'eau dès le réveil, avant le café. L'hydratation matinale active le métabolisme et réduit les fausses faims de mi-matinée. Cible : 1,5 à 2 L par jour, dont la moitié avant 14h.",
    accent: '#2A7D5A',
  },
  {
    id: 'marche',
    icon: '🚶',
    category: 'ACTIVITÉ',
    title: 'Bouger autrement à 45+',
    body: '30 minutes de marche rapide, 5 fois par semaine, stimulent la densité osseuse et le système lymphatique. Pour les os, préférez les activités avec impact au sol (marche, danse) à la natation ou au vélo. Ajoutez 2 séances de renforcement musculaire par semaine pour maintenir la masse maigre.',
    accent: '#3A7D44',
  },
  {
    id: 'sommeil',
    icon: '🌙',
    category: 'SOMMEIL',
    title: 'Dormir, c\'est perdre du poids',
    body: "Chaque heure de sommeil perdue augmente de 15 % la ghréline — l'hormone de la faim. Un coucher avant 22h30 régule le cortisol nocturne et facilite la perte de masse graisseuse abdominale. Limitez caféine et alcool après 16h — ils fragmentent le sommeil profond.",
    accent: '#8B6C3E',
  },
  {
    id: 'cerveau',
    icon: '🧩',
    category: 'CERVEAU',
    title: 'Garder toute sa tête',
    body: 'Le brouillard cérébral est fréquent en périménopause — fluctuations hormonales + manque de sommeil. Remèdes : bonne hydratation, marche (oxygène), 15 min de stimulation intellectuelle par jour. Sudoku, mots croisés, lecture : l\'important est la régularité.',
    accent: theme.colors.inkMid,
  },
  {
    id: 'fringale',
    icon: '🌿',
    category: 'GESTION DES ENVIES',
    title: 'Quand l\'envie surgit',
    body: "La fringale dure en moyenne 7 minutes. Techniques efficaces : 1 grand verre d'eau, 10 respirations profondes, ou 5 minutes de concentration active. Sinon : 1 carré de chocolat >70 % ou 10 amandes — les deux sont liste verte.",
    accent: '#4A8B6C',
  },
];

interface ProfileData {
  statut_menopause: string | null;
  nycturie: boolean | null;
  manque_sommeil: boolean | null;
  ths: string | null;
}

function getPersonalizedTips(p: ProfileData): Tip[] {
  const tips: Tip[] = [];

  if (p.nycturie) {
    tips.push({
      id: 'nycturie',
      icon: '🌙',
      category: 'POUR VOUS — SOMMEIL NOCTURNE',
      title: 'Vous vous levez la nuit',
      body: 'Réduisez les liquides après 19h. Le sel, le fromage et les charcuteries retiennent l\'eau dans les tissus et augmentent les mictions nocturnes. Dîner sans sel ajouté, et léger.',
      accent: '#8B6C3E',
    });
  }

  if (p.manque_sommeil) {
    tips.push({
      id: 'manque_sommeil',
      icon: '😴',
      category: 'POUR VOUS — RÉCUPÉRATION',
      title: 'Vous dormez peu',
      body: 'Le manque de sommeil dérègle la leptine et la ghréline, les deux hormones de la satiété. Coucher régulier avant 22h30 en priorité. Le magnésium en fin de repas (amandes, chocolat >70 %) favorise l\'endormissement.',
      accent: theme.colors.inkSoft,
    });
  }

  if (p.statut_menopause === 'menopausee') {
    tips.push({
      id: 'menopause',
      icon: '⚡',
      category: 'POUR VOUS — MÉNOPAUSE',
      title: 'Ménopause et méthode KMDC',
      body: 'Les phytoestrogènes (1 c.s. de graines de lin moulues sur votre yaourt, soja non transformé) peuvent atténuer les bouffées de chaleur. Associez une source de calcium à chaque repas pour protéger votre masse osseuse.',
      accent: '#8B6C3E',
    });
  }

  if (p.statut_menopause === 'perimenopause') {
    tips.push({
      id: 'perimenopause',
      icon: '⚡',
      category: 'POUR VOUS — PÉRIMÉNOPAUSE',
      title: 'En transition',
      body: 'Les fluctuations hormonales amplifient les fringales et la rétention d\'eau. Misez sur la régularité des repas : sauter un repas peut déstabiliser votre glycémie pour toute la journée. Trois repas, pas deux.',
      accent: '#8B6C3E',
    });
  }

  if (p.ths === 'oui') {
    tips.push({
      id: 'ths',
      icon: '💊',
      category: 'POUR VOUS — THS',
      title: 'THS et méthode KMDC',
      body: 'Le traitement hormonal soutient votre métabolisme — la méthode KMDC est parfaitement compatible. Votre perte de poids peut être plus régulière. Profitez-en pour intégrer une activité physique douce.',
      accent: '#2A7D5A',
    });
  }

  return tips;
}

// ── COMPOSANT PRINCIPAL ──────────────────────────────────────

export default function TipsScreen() {
  const [loading,           setLoading]           = useState(true);
  const [personalizedTips,  setPersonalizedTips]  = useState<Tip[]>([]);
  const [showSudoku,        setShowSudoku]         = useState(false);
  const [sudokuLevel,       setSudokuLevel]        = useState<1 | 2>(1);

  useFocusEffect(useCallback(() => {
    let active = true;
    (async () => {
      try {
        const user = await getUser();
        if (!user || !active) return;
        const profile = await getProfile(user.id);
        if (!active) return;
        setPersonalizedTips(getPersonalizedTips({
          statut_menopause: profile?.statut_menopause ?? null,
          nycturie:         profile?.nycturie         ?? null,
          manque_sommeil:   profile?.manque_sommeil   ?? null,
          ths:              profile?.ths              ?? null,
        }));
      } finally {
        if (active) setLoading(false);
      }
    })();
    return () => { active = false; };
  }, []));

  function startSudoku(level: 1 | 2) {
    setSudokuLevel(level);
    setShowSudoku(true);
  }

  if (loading) {
    return <View style={s.centered}><ActivityIndicator color={theme.colors.inkSoft} /></View>;
  }

  if (showSudoku) {
    return <SudokuGame level={sudokuLevel} onBack={() => setShowSudoku(false)} />;
  }

  return (
    <ScrollView style={s.root} contentContainerStyle={s.scroll}>

      {/* ── HEADER ── */}
      <View style={s.header}>
        <Text style={s.eyebrow}>BIEN-ÊTRE</Text>
        <Text style={s.title}>Conseils.</Text>
      </View>
      <View style={s.divider} />

      <View style={s.body}>

        {/* ── CONSEILS PERSONNALISÉS ── */}
        {personalizedTips.length > 0 && (
          <View style={s.section}>
            <Text style={s.sectionLabel}>POUR VOUS</Text>
            <View style={s.inkDivider} />
            {personalizedTips.map(tip => <TipCard key={tip.id} tip={tip} />)}
          </View>
        )}

        {/* ── ANTI-FRINGALE ── */}
        <View style={s.section}>
          <Text style={s.sectionLabel}>ANTI-FRINGALE</Text>
          <View style={s.inkDivider} />
          <View style={s.sudokuCard}>
            <Text style={s.sudokuEmoji}>🧩</Text>
            <Text style={s.sudokuTitle}>Sudoku</Text>
            <Text style={s.sudokuBody}>
              Une envie de grignoter ? 10 minutes de concentration, et ça passe. Bon pour la tête, aussi.
            </Text>
            <View style={s.sudokuBtns}>
              <TouchableOpacity style={s.sudokuBtn} onPress={() => startSudoku(1)}>
                <Text style={s.sudokuBtnText}>NIVEAU 1 — FACILE</Text>
              </TouchableOpacity>
              <TouchableOpacity style={[s.sudokuBtn, s.sudokuBtnGhost]} onPress={() => startSudoku(2)}>
                <Text style={[s.sudokuBtnText, s.sudokuBtnGhostText]}>NIVEAU 2 — MOYEN</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>

        {/* ── À SAVOIR ── */}
        <View style={s.section}>
          <Text style={s.sectionLabel}>À SAVOIR</Text>
          <View style={s.inkDivider} />
          {TIPS_STATIC.map(tip => <TipCard key={tip.id} tip={tip} />)}
        </View>

      </View>
    </ScrollView>
  );
}

// ── TIP CARD ────────────────────────────────────────────────

function TipCard({ tip }: { tip: Tip }) {
  return (
    <View style={[tc.card, { borderLeftColor: tip.accent }]}>
      <View style={tc.header}>
        <Text style={tc.icon}>{tip.icon}</Text>
        <Text style={tc.category}>{tip.category}</Text>
      </View>
      <Text style={tc.title}>{tip.title}</Text>
      <Text style={tc.body}>{tip.body}</Text>
    </View>
  );
}

const tc = StyleSheet.create({
  card:     { borderLeftWidth: 3, paddingLeft: 14, paddingVertical: 14, borderBottomWidth: 1, borderBottomColor: theme.colors.lineSoft },
  header:   { flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 6 },
  icon:     { fontSize: 16 },
  category: { fontFamily: theme.fontFamily.mono, fontSize: 9, color: theme.colors.inkMuted, letterSpacing: 2 },
  title:    { fontFamily: theme.fontFamily.display, fontSize: theme.fontSize.lg, color: theme.colors.ink, letterSpacing: -0.3, marginBottom: 6 },
  body:     { fontFamily: theme.fontFamily.display, fontSize: theme.fontSize.sm, color: theme.colors.inkMid, lineHeight: theme.fontSize.sm * 1.6 },
});

// ── SUDOKU GAME ──────────────────────────────────────────────

function SudokuGame({ level, onBack }: { level: 1 | 2; onBack: () => void }) {
  const { width } = useWindowDimensions();
  const boardSize = width - theme.spacing.lg * 2;
  const cellSize  = Math.floor((boardSize - 2) / 9); // -2 for grid's left border

  const [puzzle]   = useState<SudokuPuzzle>(() => getRandomPuzzle(level));
  const [board,    setBoard]    = useState<number[]>(() => [...puzzle.puzzle]);
  const [selected, setSelected] = useState<number | null>(null);
  const [errors,   setErrors]   = useState<Set<number>>(new Set());
  const [solved,   setSolved]   = useState(false);
  const [checked,  setChecked]  = useState(false);

  function handleCellPress(idx: number) {
    if (puzzle.puzzle[idx] !== 0) return; // fixed cell
    setSelected(idx === selected ? null : idx);
  }

  function handleNumber(n: number) {
    if (selected === null) return;
    const next = [...board];
    next[selected] = n;
    setBoard(next);
    setChecked(false);
    setErrors(new Set());
    if (isBoardSolved(next, puzzle.solution)) {
      setSolved(true);
      setSelected(null);
    }
  }

  function handleVerify() {
    const errs = getErrorCells(board, puzzle.solution);
    setErrors(errs);
    setChecked(true);
    if (errs.size === 0 && isBoardSolved(board, puzzle.solution)) setSolved(true);
  }

  function handleNew() {
    const p = getRandomPuzzle(level);
    setBoard([...p.puzzle]);
    setSelected(null);
    setErrors(new Set());
    setSolved(false);
    setChecked(false);
  }

  return (
    <View style={sg.root}>

      {/* Header */}
      <View style={sg.header}>
        <TouchableOpacity onPress={onBack} style={sg.backBtn}>
          <Text style={sg.backText}>← RETOUR</Text>
        </TouchableOpacity>
        <Text style={sg.levelLabel}>NIVEAU {level} — {level === 1 ? 'FACILE' : 'MOYEN'}</Text>
      </View>

      <View style={sg.inkLine} />

      <ScrollView contentContainerStyle={sg.scroll}>

        {solved ? (
          <View style={sg.solvedBanner}>
            <Text style={sg.solvedText}>Bravo. Puzzle complété.</Text>
            <Text style={sg.solvedSub}>La fringale est passée ?</Text>
          </View>
        ) : null}

        {/* Grille 9×9 */}
        <View style={[sg.grid, { width: cellSize * 9 + 2 }]}>
          {board.map((val, idx) => {
            const row  = Math.floor(idx / 9);
            const col  = idx % 9;
            const isFixed    = puzzle.puzzle[idx] !== 0;
            const isSelected = selected === idx;
            const isError    = errors.has(idx);
            const isSameNum  = selected !== null && !isSelected && val !== 0 && val === board[selected];
            const borderRightW  = (col + 1) % 3 === 0 && col < 8 ? 2   : 0.5;
            const borderBottomW = (row + 1) % 3 === 0 && row < 8 ? 2   : 0.5;
            const borderRightC  = (col + 1) % 3 === 0 && col < 8 ? theme.colors.ink : theme.colors.line;
            const borderBottomC = (row + 1) % 3 === 0 && row < 8 ? theme.colors.ink : theme.colors.line;

            let bg = 'transparent';
            if (isSelected) bg = '#4A6B9A22';
            else if (isError) bg = '#C0392B12';
            else if (isSameNum) bg = '#4A6B9A0F';

            return (
              <TouchableOpacity
                key={idx}
                onPress={() => handleCellPress(idx)}
                style={{
                  width: cellSize, height: cellSize,
                  alignItems: 'center', justifyContent: 'center',
                  backgroundColor: bg,
                  borderRightWidth:   borderRightW,
                  borderBottomWidth:  borderBottomW,
                  borderRightColor:   borderRightC,
                  borderBottomColor:  borderBottomC,
                  borderTopWidth:  row === 0 ? 0.5 : 0,
                  borderLeftWidth: col === 0 ? 0.5 : 0,
                  borderTopColor:  theme.colors.line,
                  borderLeftColor: theme.colors.line,
                }}
              >
                <Text style={{
                  fontFamily: theme.fontFamily.display,
                  fontSize: cellSize * 0.46,
                  color: isFixed
                    ? theme.colors.ink
                    : isError ? '#C0392B' : theme.colors.inkSoft,
                  fontWeight: isFixed ? '600' : '400',
                }}>
                  {val === 0 ? '' : String(val)}
                </Text>
              </TouchableOpacity>
            );
          })}
        </View>

        {/* Pavé numérique */}
        <View style={[sg.pad, { width: cellSize * 9 + 2 }]}>
          {[1,2,3,4,5,6,7,8,9].map(n => (
            <TouchableOpacity key={n} style={sg.padBtn} onPress={() => handleNumber(n)}>
              <Text style={sg.padNum}>{n}</Text>
            </TouchableOpacity>
          ))}
          <TouchableOpacity style={[sg.padBtn, sg.padBtnErase]} onPress={() => handleNumber(0)}>
            <Text style={sg.padErase}>✕</Text>
          </TouchableOpacity>
        </View>

        {/* Boutons actions */}
        <View style={sg.actions}>
          {!solved && (
            <TouchableOpacity style={sg.btnVerify} onPress={handleVerify}>
              <Text style={sg.btnVerifyText}>
                {checked && errors.size === 0 ? 'CORRECT ✓' : 'VÉRIFIER'}
              </Text>
            </TouchableOpacity>
          )}
          <TouchableOpacity style={sg.btnNew} onPress={handleNew}>
            <Text style={sg.btnNewText}>NOUVEAU PUZZLE</Text>
          </TouchableOpacity>
        </View>

        {checked && errors.size > 0 && (
          <Text style={sg.errorMsg}>
            {errors.size} erreur{errors.size > 1 ? 's' : ''} — continuez, vous y êtes presque.
          </Text>
        )}

      </ScrollView>
    </View>
  );
}

// ── STYLES ──────────────────────────────────────────────────

const s = StyleSheet.create({
  root:    { flex: 1, backgroundColor: theme.colors.app },
  centered:{ flex: 1, alignItems: 'center', justifyContent: 'center' },
  scroll:  { flexGrow: 1 },
  header:  { paddingTop: theme.spacing.xxl, paddingHorizontal: theme.spacing.lg, paddingBottom: theme.spacing.lg },
  eyebrow: { fontFamily: theme.fontFamily.mono, fontSize: theme.fontSize.xs, color: theme.colors.inkMuted, letterSpacing: 2, marginBottom: 14 },
  title:   { fontFamily: theme.fontFamily.display, fontSize: theme.fontSize.display, lineHeight: theme.fontSize.display * 0.9, color: theme.colors.ink, letterSpacing: -2 },
  divider: { height: 1, backgroundColor: theme.colors.ink, marginHorizontal: theme.spacing.lg },
  body:    { paddingHorizontal: theme.spacing.lg, paddingBottom: theme.spacing.xl },
  section: { paddingTop: theme.spacing.xl, gap: 0 },
  sectionLabel: { fontFamily: theme.fontFamily.mono, fontSize: theme.fontSize.xs, color: theme.colors.inkMuted, letterSpacing: 2, marginBottom: 10 },
  inkDivider:   { height: 1, backgroundColor: theme.colors.ink, marginBottom: 0 },

  sudokuCard:     { backgroundColor: theme.colors.surface, padding: theme.spacing.lg, marginTop: 1, borderBottomWidth: 1, borderBottomColor: theme.colors.line },
  sudokuEmoji:    { fontSize: 28, marginBottom: 8 },
  sudokuTitle:    { fontFamily: theme.fontFamily.display, fontSize: theme.fontSize.xl, color: theme.colors.ink, letterSpacing: -0.5, marginBottom: 6 },
  sudokuBody:     { fontFamily: theme.fontFamily.display, fontSize: theme.fontSize.sm, color: theme.colors.inkMid, lineHeight: theme.fontSize.sm * 1.6, marginBottom: 16 },
  sudokuBtns:     { gap: theme.spacing.sm },
  sudokuBtn:      { backgroundColor: theme.colors.ink, padding: theme.spacing.md, alignItems: 'center', minHeight: theme.touchTarget },
  sudokuBtnText:  { fontFamily: theme.fontFamily.mono, fontSize: theme.fontSize.xs, color: theme.colors.invertInk, letterSpacing: 2 },
  sudokuBtnGhost: { backgroundColor: 'transparent', borderWidth: 1, borderColor: theme.colors.ink },
  sudokuBtnGhostText: { color: theme.colors.ink },
});

const sg = StyleSheet.create({
  root:   { flex: 1, backgroundColor: theme.colors.app },
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingTop: theme.spacing.xxl, paddingHorizontal: theme.spacing.lg, paddingBottom: theme.spacing.lg },
  backBtn:    { paddingVertical: 8 },
  backText:   { fontFamily: theme.fontFamily.mono, fontSize: theme.fontSize.xs, color: theme.colors.inkSoft, letterSpacing: 1.5 },
  levelLabel: { fontFamily: theme.fontFamily.mono, fontSize: theme.fontSize.xs, color: theme.colors.inkMuted, letterSpacing: 1.5 },
  inkLine:    { height: 1, backgroundColor: theme.colors.ink, marginHorizontal: theme.spacing.lg },
  scroll:     { alignItems: 'center', paddingVertical: theme.spacing.xl, paddingBottom: theme.spacing.xxl },

  grid: { borderTopWidth: 2, borderLeftWidth: 2, borderColor: theme.colors.ink, flexDirection: 'row', flexWrap: 'wrap' },

  pad:       { flexDirection: 'row', marginTop: theme.spacing.xl, gap: 2 },
  padBtn:    { flex: 1, height: 44, alignItems: 'center', justifyContent: 'center', borderWidth: 1, borderColor: theme.colors.line },
  padBtnErase: { borderColor: theme.colors.inkMuted },
  padNum:    { fontFamily: theme.fontFamily.display, fontSize: 20, color: theme.colors.ink },
  padErase:  { fontFamily: theme.fontFamily.mono, fontSize: 12, color: theme.colors.inkMuted },

  actions:      { flexDirection: 'row', gap: theme.spacing.sm, marginTop: theme.spacing.lg, paddingHorizontal: theme.spacing.lg },
  btnVerify:    { flex: 1, backgroundColor: theme.colors.ink, padding: theme.spacing.md, alignItems: 'center', minHeight: theme.touchTarget },
  btnVerifyText:{ fontFamily: theme.fontFamily.mono, fontSize: theme.fontSize.xs, color: theme.colors.invertInk, letterSpacing: 2 },
  btnNew:       { flex: 1, borderWidth: 1, borderColor: theme.colors.line, padding: theme.spacing.md, alignItems: 'center', minHeight: theme.touchTarget },
  btnNewText:   { fontFamily: theme.fontFamily.mono, fontSize: theme.fontSize.xs, color: theme.colors.inkMuted, letterSpacing: 2 },

  solvedBanner: { backgroundColor: '#2A7D5A', padding: theme.spacing.lg, marginBottom: theme.spacing.lg, alignItems: 'center', width: '100%', paddingHorizontal: theme.spacing.xl },
  solvedText:   { fontFamily: theme.fontFamily.display, fontSize: theme.fontSize.xl, color: '#F2EDE3', letterSpacing: -0.5 },
  solvedSub:    { fontFamily: theme.fontFamily.mono, fontSize: theme.fontSize.xs, color: 'rgba(242,237,227,0.7)', letterSpacing: 1, marginTop: 4 },
  errorMsg:     { fontFamily: theme.fontFamily.mono, fontSize: theme.fontSize.xs, color: theme.colors.inkMuted, fontStyle: 'italic', letterSpacing: 0.5, marginTop: theme.spacing.sm },
});
