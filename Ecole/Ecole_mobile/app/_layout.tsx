/**
 * Root Layout — Érudit v4 (Expo Router)
 *
 * Wraps l'application avec :
 * - SplashScreen (géré programmatiquement)
 * - ThemeProvider (dark/light mode Érudit)
 * - AuthProvider (connexion, déconnexion, session)
 * - Stack navigation pour les écrans d'auth
 */

import { useEffect } from 'react';
import { Stack, SplashScreen } from 'expo-router';
import { StatusBar } from 'react-native';
import { ThemeProvider, useTheme } from '../src/theme';
import { AuthProvider } from '../src/context/AuthContext';

// Empêche le splash de se cacher automatiquement
SplashScreen.preventAutoHideAsync();

function RootLayoutInner() {
  const { isDark, colors } = useTheme();

  useEffect(() => {
    // Met à jour la StatusBar selon le thème
    StatusBar.setBarStyle(isDark ? 'light-content' : 'dark-content');
    StatusBar.setBackgroundColor(colors.surface);

    // Cache le splash screen une fois le thème prêt
    SplashScreen.hideAsync().catch(() => {});
  }, [isDark, colors]);

  return (
    <Stack
      screenOptions={{
        headerShown: false,
        contentStyle: { backgroundColor: colors.surface },
        animation: 'slide_from_right',
      }}
    >
      <Stack.Screen name="index" options={{ title: 'Connexion' }} />
      <Stack.Screen
        name="MotDePasseOublie"
        options={{ title: 'Mot de passe oublié', animation: 'slide_from_bottom' }}
      />
      <Stack.Screen
        name="reset-password"
        options={{ title: 'Réinitialisation', animation: 'slide_from_bottom' }}
      />
      <Stack.Screen name="(app)" options={{ headerShown: false }} />
    </Stack>
  );
}

export default function RootLayout() {
  return (
    <ThemeProvider>
      <AuthProvider>
        <RootLayoutInner />
      </AuthProvider>
    </ThemeProvider>
  );
}