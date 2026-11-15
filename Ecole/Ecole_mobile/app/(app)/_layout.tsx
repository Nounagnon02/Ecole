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
import MotDePasseImpose from '../../src/espaces/MotDePasseImpose';
import { Logo } from '../../src/espaces/Icone';

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
        <Logo taille={72} couleur={colors.accent} reliure={colors.surface} />
        <ActivityIndicator size="large" color={colors.accent} style={{ marginTop: 16 }} accessibilityLabel="Chargement" />
      </View>
    );
  }

  if (!user || !espace) return null;

  // Mot de passe provisoire : à remplacer avant tout écran (l'API refuse le reste).
  if (user.password_change_required) return <MotDePasseImpose />;

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