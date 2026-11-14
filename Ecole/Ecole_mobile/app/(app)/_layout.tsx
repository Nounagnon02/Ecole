/**
 * (app) Layout — routes authentifiées du mobile.
 *
 * Périmètre (14/11/2026) : parents et enseignants seulement. Un compte d'un
 * autre rôle est déconnecté (jeton révoqué, stockage purgé) ; un parent qui
 * ouvrirait l'espace enseignant par lien profond, ou l'inverse, est renvoyé
 * vers le sien. Les droits réels restent vérifiés par l'API à chaque appel.
 */

import { useEffect } from 'react';
import { View, ActivityIndicator } from 'react-native';
import { Stack, useRouter, useSegments } from 'expo-router';
import { useAuth } from '../../src/context/AuthContext';
import { useTheme } from '../../src/theme';
import { DASHBOARDS, hrefDashboard } from '../../src/navigation/routerBridge';

export default function AppLayout() {
  const { user, loading, logout } = useAuth();
  const router = useRouter();
  const segments = useSegments();
  const { colors } = useTheme();
  const espace = hrefDashboard(user?.role);

  useEffect(() => {
    if (loading) return;
    if (!user) {
      router.replace('/');
      return;
    }
    if (!espace) {
      // Session restaurée d'un compte hors périmètre : on la ferme.
      logout().finally(() => router.replace('/'));
      return;
    }
    const ecran = segments[segments.length - 1];
    if (ecran && `/(app)/${ecran}` !== espace) {
      router.replace(espace);
    }
  }, [user, loading, espace, segments]);

  if (loading) {
    return (
      <View style={{
        flex: 1, justifyContent: 'center', alignItems: 'center',
        backgroundColor: colors.surface,
      }}>
        <View style={{
          width: 64, height: 64, borderRadius: 16, marginBottom: 16,
          backgroundColor: colors.primary,
          alignItems: 'center', justifyContent: 'center',
          shadowColor: colors.primary, shadowOffset: { width: 0, height: 4 },
          shadowOpacity: 0.3, shadowRadius: 8, elevation: 6,
        }}>
          <ActivityIndicator size="large" color="#FFFFFF" />
        </View>
      </View>
    );
  }

  if (!user || !espace) return null;

  return (
    <Stack screenOptions={{ headerShown: false }}>
      {DASHBOARDS.map((nom) => (
        <Stack.Screen
          key={nom}
          name={nom}
          options={{ title: nom === 'parent' ? 'Parent' : 'Enseignant' }}
        />
      ))}
    </Stack>
  );
}