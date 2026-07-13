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
export const light = {
  /* Surface & Texture */
  surface: '#F6F3EE',
  surfaceRaised: '#FCFAF6',
  surfaceHover: '#F2EDE6',
  surfaceSubtle: '#EDE8E0',

  /* Bordures */
  border: '#E5DFD4',
  borderLight: '#EDE8E0',
  borderHeavy: '#D0C8BA',

  /* Texte */
  textPrimary: '#1F1C19',
  textSecondary: '#787066',
  textTertiary: '#AAA096',
  textDisabled: '#C8C0B6',

  /* Accent — Cinabre (sceau de cire) */
  accent: '#B8562E',
  accentHover: '#A64A24',
  accentActive: '#943E1E',
  accentSubtle: '#F5E6DE',       // fond clair (RGBA non supporté partout en RN)
  accentLight: '#F5E6DE',
  accentRing: '#B8562E',          // fallback opaque pour RN (RGBA 0.35)

  /* Primary — Teal profond (bronze patiné) */
  primary: '#1A3A3C',
  primaryHover: '#152E30',
  primaryActive: '#102426',
  primarySubtle: '#E8EDEA',
  primaryLight: '#E8EDEA',

  /* Sémantique */
  green: '#5A7A63',
  greenHover: '#4D6A56',
  greenSubtle: '#EAF0EA',
  greenLight: '#EAF0EA',

  red: '#BA4A4A',
  redHover: '#A63E3E',
  redSubtle: '#F5E8E6',
  redLight: '#F5E8E6',

  amber: '#C4943A',
  amberHover: '#B08430',
  amberSubtle: '#F5F0E0',
  amberLight: '#F5F0E0',

  blue: '#4A6A8A',
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
  info: '#4A6A8A',
  success: '#5A7A63',
  warning: '#C4943A',
  error: '#BA4A4A',

  /* Ombres (en RN on utilise elevation + shadowColor) */
  shadowColor: '#1F1C19',
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
  surface: '#131518',
  surfaceRaised: '#1B1D23',
  surfaceHover: '#23252B',
  surfaceSubtle: '#2B2D33',

  border: '#2A2C33',
  borderLight: '#32343B',
  borderHeavy: '#3E4048',

  textPrimary: '#EBE7E2',
  textSecondary: '#88827A',
  textTertiary: '#6A645C',
  textDisabled: '#4A443E',

  accent: '#D46A3E',
  accentHover: '#C85A2E',
  accentActive: '#B84E22',
  accentSubtle: '#2E1E16',
  accentLight: '#2E1E16',
  accentRing: '#D46A3E',

  primary: '#2A5A5C',
  primaryHover: '#1E4A4C',
  primaryActive: '#163A3C',
  primarySubtle: '#1A2A28',
  primaryLight: '#1A2A28',

  green: '#6A9A73',
  greenHover: '#5A8A63',
  greenSubtle: '#1A2A1E',
  greenLight: '#1A2A1E',

  red: '#CC5A5A',
  redHover: '#BA4A4A',
  redSubtle: '#2E1A1A',
  redLight: '#2E1A1A',

  amber: '#D4A44A',
  amberHover: '#C4943A',
  amberSubtle: '#2E2816',
  amberLight: '#2E2816',

  blue: '#5A8AAA',
  blueHover: '#4A7A9A',
  blueSubtle: '#16222E',
  blueLight: '#16222E',

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