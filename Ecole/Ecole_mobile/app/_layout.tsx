import { Stack } from 'expo-router';
import { AuthProvider } from './AuthContext';
import { Link } from 'expo-router';

export default function RootLayout() {
  return (
    <AuthProvider>
      <Stack.Screen name='login' options={{title: 'Connexion'}} />
      <Stack.Screen name='Acceuil' options={{title: 'Acceuil'}} />
      <Stack.Screen name='profile' options={{title: 'Profile'}} />
      <Stack.Screen name='settings' options={{title: 'Paramètres'}} />
      <Stack.Screen name='notfound' options={{title: 'Introuvable'}} />
      <link rel="stylesheet" href="n" />
    </AuthProvider>
  );
}