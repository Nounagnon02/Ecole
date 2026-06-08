import { Stack } from 'expo-router';
import { AuthProvider } from './AuthContext';

export default function RootLayout() {
  return (
    <AuthProvider>
      <Stack>
        <Stack.Screen name="index" options={{ title: 'Connexion' }} />
      </Stack>
    </AuthProvider>
  );
}
