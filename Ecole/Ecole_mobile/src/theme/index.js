/**
 * ============================================================================
 * THÈME UNIFIÉ — Érudit v4 (React Native)
 *
 * Point d'entrée du design system mobile.
 * Fournit :
 *   - ThemeContext + ThemeProvider pour le dark mode
 *   - useTheme() hook : retourne la palette active + typo + ombres + utilitaires
 *   - useRoleTheme(role) : retourne les couleurs spécifiques au rôle
 *
 * Usage :
 *   const theme = useTheme();
 *   <View style={{ backgroundColor: theme.colors.surface }} />
 *
 *   const roleTheme = useRoleTheme('directeur');
 *   <View style={{ backgroundColor: roleTheme.subtle }} />
 * ============================================================================
 */

import React, { createContext, useContext, useState, useEffect, useMemo, useCallback } from 'react';
import { useColorScheme } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';

import { radius, spacing, light, dark, roleColors, roleSubtleColors, roleDarkColors, roleDarkSubtleColors, durations } from './designTokens';
import { fonts, fontSize, leading, tracking, weight, headingStyles, bodyStyles, numberStyles, textPresets } from './typography';
import { lightShadows, darkShadows } from './shadows';

/* ─── Theme Context ────────────────────────────────────────────────────────── */

const ThemeContext = createContext({
  isDark: false,
  toggleTheme: () => {},
  setDarkMode: (_dark) => {},
  colors: light,
  shadows: lightShadows,
  typography: textPresets,
  radius,
  spacing,
  durations,
});

/* ─── Theme Provider ───────────────────────────────────────────────────────── */

const STORAGE_KEY = '@ecole_theme_mode';

export function ThemeProvider({ children }) {
  const systemScheme = useColorScheme();
  const [isDark, setIsDark] = useState(null); // null = loading
  const [ready, setReady] = useState(false);

  useEffect(() => {
    (async () => {
      try {
        const stored = await AsyncStorage.getItem(STORAGE_KEY);
        if (stored !== null) {
          setIsDark(stored === 'dark');
        } else {
          setIsDark(systemScheme === 'dark');
        }
      } catch {
        setIsDark(systemScheme === 'dark');
      } finally {
        setReady(true);
      }
    })();
  }, [systemScheme]);

  useEffect(() => {
    if (ready) {
      AsyncStorage.setItem(STORAGE_KEY, isDark ? 'dark' : 'light').catch(() => {});
    }
  }, [isDark, ready]);

  const toggleTheme = useCallback(() => setIsDark((prev) => !prev), []);
  const setDarkMode = useCallback((dark) => setIsDark(dark), []);

  const theme = useMemo(() => ({
    isDark: isDark ?? false,
    toggleTheme,
    setDarkMode,
    colors: isDark ? dark : light,
    shadows: isDark ? darkShadows : lightShadows,
    typography: textPresets,
    radius,
    spacing,
    durations,
  }), [isDark]);

  // Afficher un écran vide pendant le chargement du thème
  if (!ready) {
    return <>{children}</>;
  }

  return (
    <ThemeContext.Provider value={theme}>
      {children}
    </ThemeContext.Provider>
  );
}

/* ─── Hook : useTheme() ──────────────────────────────────────────────────── */

export function useTheme() {
  return useContext(ThemeContext);
}

/* ─── Hook : useRoleTheme(role) ──────────────────────────────────────────── */

export function useRoleTheme(role) {
  const { isDark } = useTheme();

  return useMemo(() => {
    const normalizedRole = (role || '').toLowerCase();
    const mainColor = isDark
      ? (roleDarkColors[normalizedRole] || roleDarkColors.admin)
      : (roleColors[normalizedRole] || roleColors.admin);
    const subtleColor = isDark
      ? (roleDarkSubtleColors[normalizedRole] || roleDarkSubtleColors.admin)
      : (roleSubtleColors[normalizedRole] || roleSubtleColors.admin);

    return {
      main: mainColor,
      subtle: subtleColor,
      role: normalizedRole,
    };
  }, [role, isDark]);
}

/* ─── Ré-exports pratiques ────────────────────────────────────────────────── */

export { radius, spacing, durations } from './designTokens';
export { fonts, fontSize, leading, tracking, weight, headingStyles, bodyStyles, numberStyles, textPresets } from './typography';
export { lightShadows, darkShadows } from './shadows';
export { light, dark, roleColors, roleSubtleColors, roleDarkColors, roleDarkSubtleColors } from './designTokens';