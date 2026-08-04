/**
 * Index — Connexion Érudit v4
 *
 * Wrapper Expo Router autour de LoginScreen (src/screens/).
 * La traduction noms d'écran → chemins vit dans src/navigation/routerBridge.
 */

import { useMemo } from 'react';
import { useRouter } from 'expo-router';
import LoginScreen from '../src/screens/LoginScreen';
import { creerNavigationProxy } from '../src/navigation/routerBridge';

export default function Index() {
  const router = useRouter();
  const navigation = useMemo(() => creerNavigationProxy(router), [router]);

  return <LoginScreen navigation={navigation} />;
}
