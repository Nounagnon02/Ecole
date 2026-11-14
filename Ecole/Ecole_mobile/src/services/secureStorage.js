/**
 * ============================================================================
 * secureStorage — Stockage du jeton d'authentification
 *
 * Le token était conservé dans AsyncStorage, qui n'est pas chiffré : sur un
 * appareil rooté/jailbreaké ou via une sauvegarde locale, il est lisible en
 * clair (cf. audit S19). On utilise désormais le Keychain iOS / Keystore
 * Android via expo-secure-store.
 *
 * SecureStore n'existe pas sur la cible web d'Expo : on y retombe sur
 * AsyncStorage, faute d'équivalent natif dans un navigateur.
 * ============================================================================
 */

import { Platform } from 'react-native';
import * as SecureStore from 'expo-secure-store';
import AsyncStorage from '@react-native-async-storage/async-storage';

const TOKEN_KEY = 'ecole_token';
const USER_KEY = '@ecole_user';

const secureDisponible = Platform.OS === 'ios' || Platform.OS === 'android';

/* ─── Jeton (donnée sensible) ──────────────────────────────────────────── */

export async function setToken(token) {
  if (secureDisponible) {
    return SecureStore.setItemAsync(TOKEN_KEY, token);
  }
  return AsyncStorage.setItem(TOKEN_KEY, token);
}

export async function getToken() {
  if (secureDisponible) {
    return SecureStore.getItemAsync(TOKEN_KEY);
  }
  return AsyncStorage.getItem(TOKEN_KEY);
}

export async function removeToken() {
  if (secureDisponible) {
    return SecureStore.deleteItemAsync(TOKEN_KEY);
  }
  return AsyncStorage.removeItem(TOKEN_KEY);
}

/* ─── Profil (non sensible, mis en cache pour l'affichage) ─────────────── */

export async function setUser(user) {
  return AsyncStorage.setItem(USER_KEY, JSON.stringify(user));
}

export async function getUser() {
  const brut = await AsyncStorage.getItem(USER_KEY);
  if (!brut) return null;
  try {
    return JSON.parse(brut);
  } catch {
    return null;
  }
}

/* ─── Brouillons de saisie (notes) ─────────────────────────────────────── */
// Gardés sur le téléphone tant qu'ils ne sont pas enregistrés par l'API, et
// effacés à la déconnexion : sur un téléphone partagé, l'utilisateur suivant
// ne doit pas les retrouver (même règle que le web, audit N-07).
const PREFIXE_BROUILLON = '@ecole_brouillon:';

export async function setBrouillon(cle, valeur) {
  if (!valeur || Object.keys(valeur).length === 0) return AsyncStorage.removeItem(PREFIXE_BROUILLON + cle);
  return AsyncStorage.setItem(PREFIXE_BROUILLON + cle, JSON.stringify(valeur));
}

export async function getBrouillon(cle) {
  try {
    return JSON.parse((await AsyncStorage.getItem(PREFIXE_BROUILLON + cle)) ?? 'null');
  } catch {
    return null;
  }
}

/** Clés des brouillons non enregistrés (pour prévenir avant une déconnexion). */
export async function listeBrouillons() {
  const cles = await AsyncStorage.getAllKeys();
  return cles.filter((c) => c.startsWith(PREFIXE_BROUILLON)).map((c) => c.slice(PREFIXE_BROUILLON.length));
}

export async function clearAll() {
  const brouillons = (await AsyncStorage.getAllKeys().catch(() => [])).filter((c) => c.startsWith(PREFIXE_BROUILLON));
  await Promise.all([
    removeToken().catch(() => {}),
    AsyncStorage.removeItem(USER_KEY),
    ...brouillons.map((c) => AsyncStorage.removeItem(c)),
    // Purge de l'ancien emplacement non chiffré, pour les mises à jour
    // depuis une version antérieure.
    AsyncStorage.removeItem('@ecole_token'),
  ]);
}

export default { setToken, getToken, removeToken, setUser, getUser, clearAll };
