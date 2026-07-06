/**
 * Auth store — Zustand (Sanctum SPA session auth)
 *
 * Gère l'authentification via session httpOnly cookies (Sanctum SPA).
 * Plus de token en localStorage. Les cookies sont automatiquement envoyés
 * avec `withCredentials: true`.
 */

import { create } from 'zustand';
import { devtools } from 'zustand/middleware';
import axios from 'axios';
import apiClient from '@/shared/lib/api-client';

export const SESSION_CHECK_INTERVAL = 5 * 60 * 1000; // 5 min entre vérifications

const initialState = {
  user: null,
  isAuthenticated: false,
  isLoading: true,
  sessionLastVerified: null,
};

/**
 * Récupère l'URL racine (sans /api) pour les appels hors API.
 */
function getBackendOrigin() {
  const apiUrl = import.meta.env.VITE_API_URL || 'http://localhost:8000/api';
  // Supprime /api, /api/v1 ou trailing slash pour obtenir l'origine nue
  return apiUrl.replace(/\/api(\/v1)?$/, '').replace(/\/$/, '');
}

const useAuthStore = create(
  devtools(
    (set, get) => ({
      /* ─── State ─────────────────────────────────────────────────── */
      ...initialState,

      /* ─── Actions ──────────────────────────────────────────────────── */

      /**
       * Initialise la session au démarrage de l'app.
       * Si le cookie de session est valide, charge le profil.
       */
      initialize: async () => {
        try {
          const { data } = await apiClient.get('/auth/me');
          set({
            user: data.user ?? data,
            isAuthenticated: true,
            isLoading: false,
          });
        } catch {
          // Pas de session valide — utilisateur non connecté
          set({ ...initialState, isLoading: false });
        }
      },

      /**
       * Connexion — récupère d'abord le cookie CSRF Sanctum,
       * puis authentifie via session (httpOnly cookie).
       */
      login: async (credentials) => {
        // Étape 1 : Récupérer le cookie CSRF pour Sanctum SPA
        // (route hors du préfixe /api, on appelle l'origine directement)
        const origin = getBackendOrigin();
        await axios.get(`${origin}/sanctum/csrf-cookie`, {
          withCredentials: true,
        });

        // Étape 2 : Authentification
        const { data } = await apiClient.post('/auth/login', credentials);

        set({
          user: data.user,
          isAuthenticated: true,
          isLoading: false,
        });

        return data.user;
      },

      /**
       * Déconnexion — détruit la session côté backend et nettoie le state.
       */
      logout: async () => {
        try {
          await apiClient.post('/auth/logout');
        } catch {
          // Même si la requête échoue, on déconnecte le client
        }

        set({ ...initialState, isLoading: false });
      },

      /**
       * Nettoie la session locale (après 401 par exemple).
       */
      clearSession: () => {
        set({ ...initialState, isLoading: false });
      },

      /**
       * Vérifie que la session backend est toujours valide.
       * Appelée par ProtectedRoute lors des transitions de route.
       * Met à jour isAuthenticated en fonction du résultat.
       */
      checkSession: async () => {
        try {
          const { data } = await apiClient.get('/auth/me');
          set({
            user: data.user ?? data,
            isAuthenticated: true,
            sessionLastVerified: Date.now(),
          });
        } catch {
          set({ ...initialState, isLoading: false });
        }
      },

      /**
       * Met à jour le profil utilisateur localement.
       */
      updateUser: (updates) => {
        const current = get().user;
        if (!current) return;
        set({ user: { ...current, ...updates } });
      },

      /**
       * Vérifie si l'utilisateur connecté a un rôle spécifique.
       */
      hasRole: (role) => {
        const { user } = get();
        return user?.role === role;
      },

      /**
       * Vérifie si l'utilisateur connecté a au moins un des rôles donnés.
       */
      hasAnyRole: (roles) => {
        const { user } = get();
        if (!user?.role) return false;
        return roles.includes(user.role);
      },
    }),
    { name: 'auth-store' }
  )
);

export default useAuthStore;
