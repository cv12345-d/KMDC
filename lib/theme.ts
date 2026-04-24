export const theme = {
  colors: {
    // Ardoise flat — no gradients, no shadows
    app:         '#F2EDE3',   // page background (crème)
    surface:     '#FAF7F2',   // card / input background
    ink:         '#121E30',   // primary text, borders, filled buttons
    inkMid:      '#2A3D58',   // secondary text
    inkSoft:     '#4A6B9A',   // tertiary text, labels
    inkMuted:    '#9A8E80',   // placeholders, helpers
    line:        '#D4C8B8',   // dividers, inactive borders
    lineSoft:    '#E8E0D4',   // very light dividers
    invertInk:   '#F2EDE3',   // text on ink background
    // Legacy aliases (used in existing screens — kept for compatibility)
    background:       '#F2EDE3',
    backgroundHeader: '#E8E0D4',
    primary:          '#4A6B9A',
    primaryDark:      '#2A3D58',
    accent:           '#9A8E80',
    card:             '#FAF7F2',
    border:           '#D4C8B8',
    badge:            '#E8E0D4',
    inputBg:          '#FAF7F2',
    textDark:         '#121E30',
    textMid:          '#2A3D58',
    textSoft:         '#4A6B9A',
    textMuted:        '#9A8E80',
    journalBg:        '#E8E0D4',
    journalAccent:    '#4A6B9A',
    journalText:      '#4A6B9A',
  },
  spacing: {
    xs:  4,
    sm:  8,
    md:  16,
    lg:  22,
    xl:  32,
    xxl: 60,
  },
  fontSize: {
    xs:   12,
    sm:   15,
    md:   17,
    lg:   20,
    xl:   24,
    xxl:  36,
    display: 52,
  },
  fontFamily: {
    display: 'Newsreader_400Regular',
    mono:    'WorkSans_500Medium',
    serif:   'Newsreader_400Regular',
  },
  borderRadius: {
    sm:   0,
    md:   0,
    lg:   0,
    full: 0,
  },
  touchTarget: 44,
} as const;
