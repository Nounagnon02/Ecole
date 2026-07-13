/**
 * ============================================================================
 * App — Érudit v4 (React Native) — ⚠️ LEGACY ⚠️
 *
 * ATTENTION : Ce fichier est potentiellement du CODE MORT.
 * Le point d'entrée réel est "expo-router/entry" (package.json).
 * La navigation est gérée par Expo Router dans app/ (app/_layout.tsx).
 *
 * Ce fichier est conservé uniquement comme fallback ou référence.
 * Ne pas modifier sauf si le système de navigation est migré.
 *
 * Providers importés : ThemeProvider, AuthProvider
 * Dashboards importés : les 12 rôles
 * ============================================================================
 *
 * TODO: Supprimer ce fichier une fois la migration Expo Router validée.
 */

import React, { useEffect } from 'react';
import { StatusBar, LogBox } from 'react-native';
import { NavigationContainer } from '@react-navigation/native';
import { createStackNavigator } from '@react-navigation/stack';
import { ThemeProvider, useTheme } from './src/theme';
import { AuthProvider, useAuth } from './src/context/AuthContext';

// Auth screens
import LoginScreen from './src/screens/LoginScreen';
import ForgotPasswordScreen from './src/screens/ForgotPasswordScreen';
import ResetPasswordScreen from './src/screens/ResetPasswordScreen';

// Dashboard screens
import DirecteurDashboard from './src/screens/DirecteurDashboard';
import EnseignantDashboard from './src/screens/EnseignantDashboard';
import EleveDashboard from './src/screens/EleveDashboard';
import ParentDashboard from './src/screens/ParentDashboard';
import ComptableDashboard from './src/screens/ComptableDashboard';
import SurveillantDashboard from './src/screens/SurveillantDashboard';
import CenseurDashboard from './src/screens/CenseurDashboard';
import InfirmierDashboard from './src/screens/InfirmierDashboard';
import BibliothecaireDashboard from './src/screens/BibliothecaireDashboard';
import SecretaireDashboard from './src/screens/SecretaireDashboard';
import UniversiteDashboard from './src/screens/UniversiteDashboard';
import AdminDashboard from './src/screens/AdminDashboard';

// Ignorer certains warnings non-bloquants
LogBox.ignoreLogs([
  'Non-serializable values were found in the navigation state',
  'VirtualizedLists should never be nested',
]);

const Stack = createStackNavigator();

/* Configuration de transition card par défaut */
const screenOptions = {
  headerShown: false,
  cardStyle: { backgroundColor: 'transparent' },
  cardStyleInterpolator: ({ current: { progress } }) => ({
    cardStyle: {
      opacity: progress.interpolate({
        inputRange: [0, 1],
        outputRange: [0, 1],
      }),
      transform: [
        {
          translateY: progress.interpolate({
            inputRange: [0, 1],
            outputRange: [20, 0],
          }),
        },
      ],
    },
  }),
  transitionSpec: {
    open: { animation: 'timing', config: { duration: 300 } },
    close: { animation: 'timing', config: { duration: 250 } },
  },
};

/* Carte de navigation route → composant dashboard */
const DASHBOARD_ROUTES = {
  directeur: 'DirecteurDashboard',
  enseignant: 'EnseignantDashboard',
  eleve: 'EleveDashboard',
  parent: 'ParentDashboard',
  comptable: 'ComptableDashboard',
  surveillant: 'SurveillantDashboard',
  censeur: 'CenseurDashboard',
  infirmier: 'InfirmierDashboard',
  bibliothecaire: 'BibliothecaireDashboard',
  secretaire: 'SecretaireDashboard',
  universite: 'UniversiteDashboard',
  admin: 'AdminDashboard',
};

/* =========================================================================
   Navigation principale
   ========================================================================= */

function MainNavigator() {
  const { user, loading } = useAuth();
  const { colors, isDark } = useTheme();

  // StatusBar adaptative
  useEffect(() => {
    StatusBar.setBarStyle(isDark ? 'light-content' : 'dark-content');
    StatusBar.setBackgroundColor(colors.surface);
  }, [isDark, colors]);

  if (loading) {
    return null; // Splash géré par ThemeProvider
  }

  const initialRoute = user ? DASHBOARD_ROUTES[user.role] || 'Login' : 'Login';

  return (
    <NavigationContainer
      theme={{
        dark: isDark,
        colors: {
          primary: colors.accent,
          background: colors.surface,
          card: colors.surfaceRaised,
          text: colors.textPrimary,
          border: colors.border,
          notification: colors.red,
        },
      }}
    >
      <Stack.Navigator initialRouteName={initialRoute} screenOptions={screenOptions}>
        {/* Auth */}
        <Stack.Screen name="Login" component={LoginScreen} />
        <Stack.Screen name="ForgotPassword" component={ForgotPasswordScreen} />
        <Stack.Screen name="ResetPassword" component={ResetPasswordScreen} />

        {/* Dashboards */}
        <Stack.Screen name="DirecteurDashboard" component={DirecteurDashboard} />
        <Stack.Screen name="EnseignantDashboard" component={EnseignantDashboard} />
        <Stack.Screen name="EleveDashboard" component={EleveDashboard} />
        <Stack.Screen name="ParentDashboard" component={ParentDashboard} />
        <Stack.Screen name="ComptableDashboard" component={ComptableDashboard} />
        <Stack.Screen name="SurveillantDashboard" component={SurveillantDashboard} />
        <Stack.Screen name="CenseurDashboard" component={CenseurDashboard} />
        <Stack.Screen name="InfirmierDashboard" component={InfirmierDashboard} />
        <Stack.Screen name="BibliothecaireDashboard" component={BibliothecaireDashboard} />
        <Stack.Screen name="SecretaireDashboard" component={SecretaireDashboard} />
        <Stack.Screen name="UniversiteDashboard" component={UniversiteDashboard} />
        <Stack.Screen name="AdminDashboard" component={AdminDashboard} />
      </Stack.Navigator>
    </NavigationContainer>
  );
}

/* =========================================================================
   App — Wraps providers
   ========================================================================= */

export default function App() {
  return (
    <ThemeProvider>
      <AuthProvider>
        <MainNavigator />
      </AuthProvider>
    </ThemeProvider>
  );
}