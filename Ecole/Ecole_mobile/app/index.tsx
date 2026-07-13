/**
 * Index — Connexion Érudit v4
 *
 * Wrapper Expo Router autour de LoginScreen (src/screens/)
 * Fournit un pont navigation → expo-router
 */

import { useRouter } from 'expo-router';
import LoginScreen from '../src/screens/LoginScreen';

export default function Index() {
  const router = useRouter();

  const navigationProxy = {
    navigate: (routeName) => {
      // Route absolue commençant par / → route Expo Router
      if (routeName.startsWith('/')) {
        router.push(routeName);
      } else {
        const map = {
          ForgotPassword: '/MotDePasseOublie',
          Login: '/',
        };
        router.push(map[routeName] || `/`);
      }
    },
    replace: (routeName) => {
      if (routeName.startsWith('/')) {
        router.replace(routeName);
      } else {
        const map = {
          ForgotPassword: '/MotDePasseOublie',
          Login: '/',
        };
        router.replace(map[routeName] || `/`);
      }
    },
    goBack: () => router.back(),
  };

  return <LoginScreen navigation={navigationProxy} />;
}