/**
 * ============================================================================
 * api — Érudit v4 (React Native)
 *
 * Instance Axios améliorée :
 * - Token depuis AsyncStorage (@ecole_token)
 * - Intercepteur d'authentification
 * - Gestion 401 (déconnexion automatique)
 * - Retry (3 tentatives) sur erreur réseau 5xx
 * - Timeout 15s
 * - Base URL configurable via variable d'env
 * ============================================================================
 */

import axios from 'axios';
import AsyncStorage from '@react-native-async-storage/async-storage';

const API_BASE_URL = process.env.EXPO_PUBLIC_API_URL || 'http://localhost:8000/api';

export const api = axios.create({
  baseURL: API_BASE_URL,
  timeout: 15000,
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
    const token = await AsyncStorage.getItem('@ecole_token');
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
      await AsyncStorage.multiRemove(['@ecole_user', '@ecole_token']);
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