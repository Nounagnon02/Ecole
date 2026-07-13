/**
 * ============================================================================
 * TYPOGRAPHIE — Érudit v4 (React Native)
 *
 * Transposition de l'échelle typographique web vers React Native.
 * Sur mobile, Fraunces et Inter ne sont pas disponibles nativement.
 * On utilise les meilleures polices système qui s'en rapprochent :
 *
 *   Fraunces → Platform serif (Georgia sur iOS, Noto Serif sur Android)
 *   Inter    → Platform sans-serif (SF Pro sur iOS, Roboto sur Android)
 *   JetBrains Mono → Platform monospace (SF Mono, Roboto Mono)
 *
 * Pour les titres, on peut charger Fraunces via expo-font si désiré.
 * Les styles ci-dessous fonctionnent immédiatement avec les polices système.
 * ============================================================================
 */

import { Platform } from 'react-native';

/* ─── Familles de polices ────────────────────────────────────────────────── */
export const fonts = {
  heading: Platform.select({
    ios: 'Georgia',
    android: 'serif',
    default: 'serif',
  }),
  body: Platform.select({
    ios: 'System',
    android: 'sans-serif',
    default: 'System',
  }),
  mono: Platform.select({
    ios: 'Menlo',
    android: 'monospace',
    default: 'monospace',
  }),
};

/* ─── Échelle des tailles (en points — le RN gère le scaling) ───────────── */
export const fontSize = {
  xs: 11,
  sm: 13,
  base: 15,
  lg: 17,
  xl: 20,
  '2xl': 24,
  '3xl': 32,
  '4xl': 40,
  '5xl': 48,
};

/* ─── Hauteurs de ligne (leading) ────────────────────────────────────────── */
export const leading = {
  none: 1,
  tight: 1.15,
  snug: 1.3,
  normal: 1.5,
  relaxed: 1.625,
  display: 1.05,
};

/* ─── Letter spacing (tracking) ──────────────────────────────────────────── */
export const tracking = {
  tight: -0.5,
  normal: 0,
  wide: 0.5,
};

/* ─── Graisses ───────────────────────────────────────────────────────────── */
export const weight = {
  normal: '400',
  medium: '500',
  semibold: '600',
  bold: '700',
};

/* ─── Mappings heading sémantiques ──────────────────────────────────────────
   Ces fonctions retournent un TextStyle complet pour chaque niveau de titre
   et pour le corps de texte commun.
   Usage : <Text style={headingStyles.h1}>Mon Titre</Text> ───────────────── */

const headingBase = {
  fontFamily: fonts.heading,
  fontWeight: '600',
};

export const headingStyles = {
  h1: { ...headingBase, fontSize: fontSize['4xl'], lineHeight: fontSize['4xl'] * leading.tight },
  h2: { ...headingBase, fontSize: fontSize['3xl'], lineHeight: fontSize['3xl'] * leading.tight },
  h3: { ...headingBase, fontSize: fontSize['2xl'], lineHeight: fontSize['2xl'] * leading.tight },
  h4: { ...headingBase, fontSize: fontSize.xl, lineHeight: fontSize.xl * leading.tight },
  h5: { ...headingBase, fontSize: fontSize.lg, lineHeight: fontSize.lg * leading.tight },
  h6: { ...headingBase, fontSize: fontSize.base, lineHeight: fontSize.base * leading.tight },
  display: {
    fontFamily: fonts.heading,
    fontWeight: '700',
    fontSize: fontSize['5xl'],
    lineHeight: fontSize['5xl'] * leading.display,
  },
};

/* ─── Style corps de texte ───────────────────────────────────────────────── */
export const bodyStyles = {
  base: {
    fontFamily: fonts.body,
    fontSize: fontSize.base,
    fontWeight: '400',
    lineHeight: fontSize.base * leading.normal,
  },
  sm: {
    fontFamily: fonts.body,
    fontSize: fontSize.sm,
    fontWeight: '400',
    lineHeight: fontSize.sm * leading.normal,
  },
  lg: {
    fontFamily: fonts.body,
    fontSize: fontSize.lg,
    fontWeight: '400',
    lineHeight: fontSize.lg * leading.normal,
  },
  caption: {
    fontFamily: fonts.body,
    fontSize: fontSize.xs,
    fontWeight: '500',
    lineHeight: fontSize.xs * leading.snug,
    letterSpacing: tracking.wide,
    textTransform: 'uppercase',
  },
};

/* ─── Style nombres / data ───────────────────────────────────────────────── */
export const numberStyles = {
  fontFamily: fonts.mono,
  fontWeight: '700',
  fontVariant: ['tabular-nums'],
};

/* ─── Presets texte utilitaires ──────────────────────────────────────────── */
export const textPresets = {
  heading1: headingStyles.h1,
  heading2: headingStyles.h2,
  heading3: headingStyles.h3,
  heading4: headingStyles.h4,
  heading5: headingStyles.h5,
  heading6: headingStyles.h6,
  display: headingStyles.display,
  body: bodyStyles.base,
  bodySm: bodyStyles.sm,
  bodyLg: bodyStyles.lg,
  caption: bodyStyles.caption,
  number: numberStyles,
};

export default {
  fonts,
  fontSize,
  leading,
  tracking,
  weight,
  headingStyles,
  bodyStyles,
  numberStyles,
  textPresets,
};