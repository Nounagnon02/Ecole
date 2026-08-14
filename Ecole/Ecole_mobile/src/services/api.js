/**
 * ============================================================================
 * api — Érudit v4 (React Native)
 *
 * Instance Axios améliorée :
 * - Token depuis le stockage sécurisé (Keychain / Keystore)
 * - Intercepteur d'authentification
 * - Gestion 401 (déconnexion automatique)
 * - Retry (3 tentatives) sur erreur réseau 5xx
 * - Base URL et timeout pilotés par EXPO_PUBLIC_API_URL /
 *   EXPO_PUBLIC_API_TIMEOUT (cf. constants/api)
 * ============================================================================
 */

import axios from 'axios';
import { getToken, clearAll } from './secureStorage';
import { URL_BASE_API, API_TIMEOUT } from '../../constants/api';

export const api = axios.create({
  baseURL: URL_BASE_API,
  timeout: API_TIMEOUT,
  headers: {
    'Content-Type': 'application/json',
    Accept: 'application/json',
  },
});

/**
 * Intercepteur requête : attache le token JWT
 */
api.interceptors.request.use(
  async (config) => {
    const token = await getToken();
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    if (__DEV__) {
      console.log(`[API] ${config.method?.toUpperCase()} ${config.url}`);
    }
    return config;
  },
  (error) => Promise.reject(error)
);

/**
 * Intercepteur réponse :
 * - 401 → déconnexion automatique
 * - 5xx → retry (jusqu'à 3 tentatives)
 * - Logs dev
 */
api.interceptors.response.use(
  (response) => {
    if (__DEV__) {
      console.log(`[API] ${response.status} ${response.config.url}`);
    }
    return response;
  },
  async (error) => {
    const originalRequest = error.config;

    // 401 → token invalide → déconnexion
    if (error.response?.status === 401 && !originalRequest._retry) {
      originalRequest._retry = true;
      await clearAll();
      delete api.defaults.headers.common['Authorization'];
      return Promise.reject(error);
    }

    // Retry sur erreur réseau ou 5xx (max 3)
    if (
      (!error.response || error.response.status >= 500) &&
      (!originalRequest._retryCount || originalRequest._retryCount < 3)
    ) {
      originalRequest._retryCount = (originalRequest._retryCount || 0) + 1;
      const delay = originalRequest._retryCount * 1000;
      if (__DEV__) {
        console.log(`[API] Retry ${originalRequest._retryCount}/3 after ${delay}ms: ${originalRequest.url}`);
      }
      await new Promise((resolve) => setTimeout(resolve, delay));
      return api(originalRequest);
    }

    if (__DEV__) {
      console.error(`[API] Error ${error.response?.status || 'NETWORK'} ${originalRequest?.url}`, error.message);
    }

    return Promise.reject(error);
  }
);