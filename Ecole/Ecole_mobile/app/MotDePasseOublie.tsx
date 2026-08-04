/**
 * MotDePasseOublie — Érudit v4
 *
 * Wrapper Expo Router autour de ForgotPasswordScreen.
 */

import { useMemo } from 'react';
import { useRouter } from 'expo-router';
import ForgotPasswordScreen from '../src/screens/ForgotPasswordScreen';
import { creerNavigationProxy } from '../src/navigation/routerBridge';

export default function MotDePasseOublie() {
  const router = useRouter();
  const navigation = useMemo(() => creerNavigationProxy(router), [router]);

  return <ForgotPasswordScreen navigation={navigation} />;
}
