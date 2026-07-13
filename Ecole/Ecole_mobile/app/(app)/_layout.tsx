/**
 * (app) Layout — Protected routes Érudit v4
 *
 * Groupe de routes authentifiées.
 * Redirige vers la connexion si non authentifié.
 * Chaque dashboard de rôle est une route Stack.
 */

import { useEffect } from 'react';
import { View, ActivityIndicator } from 'react-native';
import { Stack, useRouter } from 'expo-router';
import { useAuth } from '../../src/context/AuthContext';
import { useTheme } from '../../src/theme';

const DASHBOARD_ROUTES = [
  { name: 'directeur', title: 'Directeur' },
  { name: 'enseignant', title: 'Enseignant' },
  { name: 'eleve', title: 'Élève' },
  { name: 'parent', title: 'Parent' },
  { name: 'comptable', title: 'Comptable' },
  { name: 'surveillant', title: 'Surveillant' },
  { name: 'censeur', title: 'Censeur' },
  { name: 'infirmier', title: 'Infirmier' },
  { name: 'bibliothecaire', title: 'Bibliothécaire' },
  { name: 'secretaire', title: 'Secrétaire' },
  { name: 'universite', title: 'Université' },
  { name: 'admin', title: 'Admin' },
];

export default function AppLayout() {
  const { user, loading } = useAuth();
  const router = useRouter();
  const { colors } = useTheme();

  // Garde : pas d'accès sans auth
  useEffect(() => {
    if (!loading && !user) {
      router.replace('/');
    }
  }, [user, loading]);

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

  if (!user) return null;

  return (
    <Stack screenOptions={{ headerShown: false }}>
      {DASHBOARD_ROUTES.map((screen) => (
        <Stack.Screen
          key={screen.name}
          name={screen.name}
          options={{ title: screen.title }}
        />
      ))}
    </Stack>
  );
}