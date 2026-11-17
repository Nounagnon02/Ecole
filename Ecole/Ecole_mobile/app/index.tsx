/**
 * Index — Connexion Érudit v4
 *
 * Wrapper Expo Router autour de LoginScreen (src/screens/).
 * La traduction noms d'écran → chemins vit dans src/navigation/routerBridge.
 *
 * Une session gardée sur le téléphone mène directement à l'espace du compte :
 * l'application relancée revenait sinon toujours à la connexion, même en
 * ligne, et un enseignant hors réseau perdait l'accès à son brouillon de
 * notes (parcours 9, 16/11/2026). Aucun appel réseau ici : la session vient
 * du stockage local, l'API la vérifie à la première requête.
 */

import { useMemo } from 'react';
import { Redirect, useRouter } from 'expo-router';
import LoginScreen from '../src/screens/LoginScreen';
import { useAuth } from '../src/context/AuthContext';
import { creerNavigationProxy, hrefDashboard } from '../src/navigation/routerBridge';

export default function Index() {
  const router = useRouter();
  const navigation = useMemo(() => creerNavigationProxy(router), [router]);
  const { user, loading } = useAuth();

  // Lecture de la session en cours : rien plutôt qu'un éclair de connexion.
  if (loading) return null;

  const espace = user ? hrefDashboard(user.role) : null;
  if (espace) return <Redirect href={espace} />;

  return <LoginScreen navigation={navigation} />;
}
