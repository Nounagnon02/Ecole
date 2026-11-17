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
import { useFonts } from 'expo-font';
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
      <Stack.Screen name="paiement-retour" options={{ title: 'Paiement' }} />
      <Stack.Screen name="(app)" options={{ headerShown: false }} />
    </Stack>
  );
}

/* Proposition C : Figtree, livrée avec l'application (assets/fonts, OFL). */
const POLICES = {
  'Figtree-Regular': require('../assets/fonts/Figtree-Regular.ttf'),
  'Figtree-Medium': require('../assets/fonts/Figtree-Medium.ttf'),
  'Figtree-SemiBold': require('../assets/fonts/Figtree-SemiBold.ttf'),
  'Figtree-Bold': require('../assets/fonts/Figtree-Bold.ttf'),
};

export default function RootLayout() {
  // Sans police chargée, le texte s'afficherait dans la police système puis
  // basculerait : l'écran de démarrage reste affiché jusqu'au chargement
  // (ou jusqu'à l'échec, auquel cas la police système prend le relais).
  const [policesPretes, erreurPolices] = useFonts(POLICES);
  if (!policesPretes && !erreurPolices) return null;

  return (
    <ThemeProvider>
      <AuthProvider>
        <RootLayoutInner />
      </AuthProvider>
    </ThemeProvider>
  );
}