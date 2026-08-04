/**
 * reset-password — Érudit v4
 *
 * Wrapper Expo Router autour de ResetPasswordScreen.
 * Le lien de réinitialisation envoyé par l'API porte `token` et `email` en
 * paramètres de requête.
 */

import { useMemo } from 'react';
import { useRouter, useLocalSearchParams } from 'expo-router';
import ResetPasswordScreen from '../src/screens/ResetPasswordScreen';
import { creerNavigationProxy } from '../src/navigation/routerBridge';

/**
 * useLocalSearchParams peut renvoyer un tableau quand un paramètre apparaît
 * plusieurs fois dans l'URL : l'écran attend une chaîne.
 */
function valeurUnique(param: string | string[] | undefined): string {
  if (Array.isArray(param)) return param[0] ?? '';
  return param ?? '';
}

export default function ResetPassword() {
  const router = useRouter();
  const params = useLocalSearchParams<{ token?: string; email?: string }>();
  const navigation = useMemo(() => creerNavigationProxy(router), [router]);

  const route = useMemo(
    () => ({
      params: {
        token: valeurUnique(params.token),
        email: valeurUnique(params.email),
      },
    }),
    [params.token, params.email]
  );

  return <ResetPasswordScreen navigation={navigation} route={route} />;
}
