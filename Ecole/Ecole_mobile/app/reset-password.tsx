/**
 * reset-password — Érudit v4
 *
 * Wrapper Expo Router autour de ResetPasswordScreen
 */

import { useRouter, useLocalSearchParams } from 'expo-router';
import ResetPasswordScreen from '../src/screens/ResetPasswordScreen';

export default function ResetPassword() {
  const router = useRouter();
  const params = useLocalSearchParams();

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

  return (
    <ResetPasswordScreen
      navigation={navigationProxy}
      route={{ params: { token: params.token, email: params.email } }}
    />
  );
}