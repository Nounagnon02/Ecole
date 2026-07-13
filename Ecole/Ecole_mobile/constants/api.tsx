/**
 * Configuration API — Érudit v4
 *
 * Utilise EXPO_PUBLIC_API_URL des variables d'environnement.
 * Fallback automatique en développement.
 */

export const URL_BASE_API = process.env.EXPO_PUBLIC_API_URL ||
  (__DEV__
    ? 'http://localhost:8000/api'
    : 'https://api.erudit.bj/api');

export const API_TIMEOUT = parseInt(process.env.EXPO_PUBLIC_API_TIMEOUT || '15000', 10);

export const POINTS_TERMINAISON_AUTH = {
  CONNEXION: `${URL_BASE_API}/auth/login`,
  INSCRIPTION: `${URL_BASE_API}/auth/register`,
  FORGOT_PASSWORD: `${URL_BASE_API}/auth/forgot-password`,
  RESET_PASSWORD: `${URL_BASE_API}/auth/reset-password`,
  LOGOUT: `${URL_BASE_API}/auth/logout`,
};

export const POINTS_TERMINAISON_API = {
  UTILISATEURS: `${URL_BASE_API}/utilisateurs`,
  ECOLES: `${URL_BASE_API}/ecoles`,
  CLASSES: `${URL_BASE_API}/classes`,
  ELEVES: `${URL_BASE_API}/eleves`,
  ENSEIGNANTS: `${URL_BASE_API}/enseignants`,
};