/**
 * MotDePasseOublie — Érudit v4
 *
 * Wrapper Expo Router autour de ForgotPasswordScreen
 */

import { useRouter } from 'expo-router';
import ForgotPasswordScreen from '../src/screens/ForgotPasswordScreen';

export default function MotDePasseOublie() {
  const router = useRouter();

  const navigationProxy = {
    navigate: (routeName) => {
      const map = { ForgotPassword: '/MotDePasseOublie', Login: '/' };
      router.push(map[routeName] || `/`);
    },
    replace: (routeName) => {
      const map = { ForgotPassword: '/MotDePasseOublie', Login: '/' };
      router.replace(map[routeName] || `/`);
    },
    goBack: () => router.back(),
  };

  return <ForgotPasswordScreen navigation={navigationProxy} />;
}