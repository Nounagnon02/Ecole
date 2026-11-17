/**
 * ============================================================================
 * DESIGN TOKENS — Érudit v4 (React Native)
 * Transposition exacte de design-tokens.css → mobile
 *
 * Palette chaude, typographie éditoriale, ombres de papier
 * Inspiré : cabinet de lecture, bronze patiné, sceau de cire
 * ============================================================================
 */

import { Platform } from 'react-native';

/* ─── Rayons (border-radius) ─────────────────────────────────────────────── */
export const radius = {
  sm: 4,
  md: 8,
  lg: 12,
  xl: 16,
};

/* ─── Espacement (spacing scale, base 4px) ───────────────────────────────── */
export const spacing = {
  xs: 4,
  sm: 8,
  md: 12,
  lg: 16,
  xl: 20,
  '2xl': 24,
  '3xl': 32,
  '4xl': 40,
  '5xl': 48,
};

/* ─── Palette Lumière (Light Mode) ──────────────────────────────────────── */
/* Proposition C (14/11/2026) : mêmes jetons que le web (design-tokens.css). */
export const light = {
  /* Surface & Texture */
  surface: '#F4F0E8',
  surfaceRaised: '#FFFDF8',
  surfaceHover: '#EEE9DE',
  surfaceSubtle: '#ECE6D8',

  /* Bordures */
  border: '#DDD5C5',
  borderLight: '#E8E1D5',
  borderHeavy: '#8A928D',

  /* Texte */
  textPrimary: '#17302E',
  textSecondary: '#56625D',
  textTertiary: '#657069',
  textDisabled: '#9AA19C',

  /* Accent — Cinabre (sceau de cire) */
  accent: '#0F5C4A',
  accentHover: '#0B4A3B',
  accentActive: '#083B30',
  accentSubtle: '#E4EFE8',       // fond clair (RGBA non supporté partout en RN)
  accentLight: '#E4EFE8',
  accentRing: '#0F5C4A',          // fallback opaque pour RN (RGBA 0.35)

  /* Primary — Teal profond (bronze patiné) */
  primary: '#0F5C4A',
  primaryHover: '#0B4A3B',
  primaryActive: '#083B30',
  primarySubtle: '#E4EFE8',
  primaryLight: '#E4EFE8',

  /* Sémantique */
  green: '#246447',
  greenHover: '#1C5139',
  greenSubtle: '#E4EFE8',
  greenLight: '#E4EFE8',

  red: '#A63D2A',
  redHover: '#8D2F20',
  redSubtle: '#FAE7DF',
  redLight: '#FAE7DF',

  amber: '#795300',
  amberHover: '#634400',
  amberSubtle: '#FBE9BD',
  amberLight: '#FBE9BD',

  blue: '#285C79',
  blueHover: '#3E5E7A',
  blueSubtle: '#E8EEF2',
  blueLight: '#E8EEF2',

  /* Étendues (data viz) */
  emerald: '#4F8A6B',
  emeraldHover: '#437A5E',
  emeraldSubtle: '#E8F0EC',
  emeraldLight: '#E8F0EC',

  sky: '#5B86A6',
  skyHover: '#4E7693',
  skySubtle: '#E9EEF2',
  skyLight: '#E9EEF2',

  purple: '#845E8E',
  purpleHover: '#724F7C',
  purpleSubtle: '#EFE8F1',
  purpleLight: '#EFE8F1',

  violet: '#845E8E',
  violetHover: '#724F7C',
  violetSubtle: '#EFE8F1',
  violetLight: '#EFE8F1',

  /* Aliases */
  info: '#285C79',
  success: '#246447',
  warning: '#795300',
  error: '#A63D2A',

  /* Ombres (en RN on utilise elevation + shadowColor) */
  shadowColor: '#17302E',
  shadowOpacity0: 0,
  shadowOpacity1: 0.04,
  shadowOpacity2: 0.05,
  shadowOpacity3: 0.06,
  shadowOpacity4: 0.07,
  shadowOpacity5: 0.09,
  shadowOpacity6: 0.12,

  /* Élévation Android */
  elevation0: 0,
  elevation1: Platform.OS === 'android' ? 1 : 0,
  elevation2: Platform.OS === 'android' ? 2 : 0,
  elevation3: Platform.OS === 'android' ? 4 : 0,
  elevation4: Platform.OS === 'android' ? 8 : 0,
  elevation5: Platform.OS === 'android' ? 16 : 0,
  elevation6: Platform.OS === 'android' ? 24 : 0,
};

/* ─── Palette Sombre (Dark Mode) ────────────────────────────────────────── */
export const dark = {
  surface: '#101E19',
  surfaceRaised: '#192A23',
  surfaceHover: '#24392F',
  surfaceSubtle: '#22362C',

  border: '#3C5145',
  borderLight: '#30483A',
  borderHeavy: '#789484',

  textPrimary: '#F4F0E8',
  textSecondary: '#BCCBC0',
  textTertiary: '#A8BCAE',
  textDisabled: '#4A443E',

  accent: '#8BD4B5',
  accentHover: '#A4E4C8',
  accentActive: '#B9EBD5',
  accentSubtle: '#223E30',
  accentLight: '#223E30',
  accentRing: '#8BD4B5',

  primary: '#8BD4B5',
  primaryHover: '#A4E4C8',
  primaryActive: '#B9EBD5',
  primarySubtle: '#223E30',
  primaryLight: '#223E30',

  green: '#9BD4AC',
  greenHover: '#5A8A63',
  greenSubtle: '#203B2B',
  greenLight: '#203B2B',

  red: '#FFAF99',
  redHover: '#FFC3B2',
  redSubtle: '#43281F',
  redLight: '#43281F',

  amber: '#F1C66A',
  amberHover: '#F7D890',
  amberSubtle: '#3C321C',
  amberLight: '#3C321C',

  blue: '#A1CCE1',
  blueHover: '#4A7A9A',
  blueSubtle: '#203740',
  blueLight: '#203740',

  emerald: '#6A9A7B',
  emeraldHover: '#5A8A6B',
  emeraldSubtle: '#16221A',
  emeraldLight: '#16221A',

  sky: '#6E9AB8',
  skyHover: '#5E8AA8',
  skySubtle: '#16222E',
  skyLight: '#16222E',

  purple: '#A882B0',
  purpleHover: '#9872A0',
  purpleSubtle: '#241A28',
  purpleLight: '#241A28',

  violet: '#A882B0',
  violetHover: '#9872A0',
  violetSubtle: '#241A28',
  violetLight: '#241A28',

  info: '#5A8AAA',
  success: '#6A9A73',
  warning: '#D4A44A',
  error: '#CC5A5A',

  shadowColor: '#000000',
  shadowOpacity1: 0.24,
  shadowOpacity2: 0.28,
  shadowOpacity3: 0.32,
  shadowOpacity4: 0.36,
  shadowOpacity5: 0.40,
  shadowOpacity6: 0.44,

  elevation1: Platform.OS === 'android' ? 2 : 0,
  elevation2: Platform.OS === 'android' ? 4 : 0,
  elevation3: Platform.OS === 'android' ? 6 : 0,
  elevation4: Platform.OS === 'android' ? 10 : 0,
  elevation5: Platform.OS === 'android' ? 18 : 0,
  elevation6: Platform.OS === 'android' ? 26 : 0,
};

/* ─── Couleurs par Rôle ──────────────────────────────────────────────────── */
export const roleColors = {
  directeur: '#1A3A3C',        // primary
  enseignant: '#5A7A63',        // green
  eleve: '#5A7AAD',             // warm slate
  parent: '#B8562E',            // accent
  comptable: '#C4943A',         // amber
  surveillant: '#BA4A4A',       // red
  censeur: '#8A5A7A',           // prune doux
  infirmier: '#5A8A8A',         // teal clair
  bibliothecaire: '#7A8A5A',    // olive
  secretaire: '#8A7A5A',        // bronze
  admin: '#1A3A3C',             // primary
  universite: '#1A3A3C',        // primary
};

/* ─── Couleurs par Rôle — Subtle backgrounds ────────────────────────────── */
export const roleSubtleColors = {
  directeur: '#E8EDEA',
  enseignant: '#EAF0EA',
  eleve: '#E8EDF2',
  parent: '#F5E6DE',
  comptable: '#F5F0E0',
  surveillant: '#F5E8E6',
  censeur: '#EFE8F1',
  infirmier: '#E8F0F0',
  bibliothecaire: '#F0F2E8',
  secretaire: '#F2EDE8',
  admin: '#E8EDEA',
  universite: '#E8EDEA',
};

/* ─── Couleurs par Rôle — Dark mode ──────────────────────────────────────── */
export const roleDarkColors = {
  directeur: '#2A5A5C',
  enseignant: '#6A9A73',
  eleve: '#7A9ABD',
  parent: '#D46A3E',
  comptable: '#D4A44A',
  surveillant: '#CC5A5A',
  censeur: '#A882B0',
  infirmier: '#7AAA9A',
  bibliothecaire: '#9AAA7A',
  secretaire: '#AA9A7A',
  admin: '#2A5A5C',
  universite: '#2A5A5C',
};

/* ─── Couleurs par Rôle — Subtle dark mode ──────────────────────────────── */
export const roleDarkSubtleColors = {
  directeur: '#1A2A28',
  enseignant: '#1A2A1E',
  eleve: '#16222E',
  parent: '#2E1E16',
  comptable: '#2E2816',
  surveillant: '#2E1A1A',
  censeur: '#241A28',
  infirmier: '#162A28',
  bibliothecaire: '#1A2A16',
  secretaire: '#2A2416',
  admin: '#1A2A28',
  universite: '#1A2A28',
};

/* ─── Transitions ────────────────────────────────────────────────────────── */
export const durations = {
  _100: 100,
  _200: 200,
  _300: 300,
  _400: 400,
  _500: 500,
};

/* ─── Layout ──────────────────────────────────────────────────────────────── */
export const layout = {
  headerHeight: 56,
  sidebarWidth: 280,
  sidebarCollapsed: 64,
};

/* ─── Export complet par défaut ──────────────────────────────────────────── */
export default {
  radius,
  spacing,
  light,
  dark,
  roleColors,
  roleSubtleColors,
  roleDarkColors,
  roleDarkSubtleColors,
  durations,
  layout,
};