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
import { cacheClear } from '@/shared/lib/db';
import { clearDashboardCache } from '@/shared/lib/dashboard-cache';
import { normalizeRole } from '@/shared/types/roles';

export const SESSION_CHECK_INTERVAL = 5 * 60 * 1000; // 5 min entre vérifications

const initialState = {
  user: null,
  isAuthenticated: false,
  isLoading: true,
  sessionLastVerified: null,
  pendingSchools: null, // [{ id, name }] quand le login necessite le choix de l'ecole
  pendingToken: null,   // token temporaire pour finaliser le choix d'ecole
  step: 'initial',      // 'initial' | 'pick-school'
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
       * Connexion — recupere d'abord le cookie CSRF Sanctum,
       * puis authentifie via session (httpOnly cookie).
       * Si l'utilisateur est dans plusieurs ecoles, renvoie la liste
       * pour selection apres le login.
       */
      login: async (credentials) => {
        // Etape 1 : Recuperer le cookie CSRF
        const origin = getBackendOrigin();
        await axios.get(`${origin}/sanctum/csrf-cookie`, {
          withCredentials: true,
        });

        // Etape 2 : Authentification sans ecole_id
        const { data } = await apiClient.post('/auth/login', credentials);

        // Si plusieurs ecoles → l'utilisateur doit choisir
        if (data.schools && Array.isArray(data.schools) && data.schools.length > 0) {
          set({
            pendingSchools: data.schools,
            pendingToken: data.temp_token || data.token || null,
            step: 'pick-school',
            isLoading: false,
          });
          return { requiresSchool: true, schools: data.schools };
        }

        // Connexion directe
        set({
          user: data.user,
          isAuthenticated: true,
          isLoading: false,
          step: 'initial',
          pendingSchools: null,
          pendingToken: null,
        });

        return data.user;
      },

      /**
       * Finalise la connexion en choisissant l'ecole.
       */
      selectSchool: async (ecoleId) => {
        const { pendingToken } = get();

        const { data } = await apiClient.post('/auth/select-school', {
          ecole_id: ecoleId,
          token: pendingToken,
        });

        set({
          user: data.user,
          isAuthenticated: true,
          isLoading: false,
          step: 'initial',
          pendingSchools: null,
          pendingToken: null,
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

        // Le cache offline contient les réponses GET : notes, paiements,
        // dossiers médicaux. Il survivait à la déconnexion et restait lisible
        // par l'utilisateur suivant sur un poste partagé (cf. audit S17).
        await cacheClear().catch(() => {});

        // Même problème pour le cache mémoire des tableaux de bord, indexé
        // par rôle et non par utilisateur : sans purge, l'utilisateur suivant
        // voyait les effectifs et finances du précédent, éventuellement
        // d'un autre établissement.
        clearDashboardCache();

        set({ ...initialState, isLoading: false });
      },

      /**
       * Nettoie la session locale (après 401 par exemple).
       */
      clearSession: () => {
        cacheClear().catch(() => {});
        clearDashboardCache();
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
       *
       * Un sous-rôle satisfait aussi le contrôle de son rôle parent
       * (`directeurP` → `directeur`) : les sous-rôles n'ont pas de
       * dashboard distinct, le serveur cloisonne leurs données par cycle.
       */
      hasRole: (role) => {
        const { user } = get();
        if (!user?.role) return false;
        return user.role === role || normalizeRole(user.role) === role;
      },

      /**
       * Vérifie si l'utilisateur connecté a au moins un des rôles donnés.
       */
      hasAnyRole: (roles) => {
        const { user } = get();
        if (!user?.role || !Array.isArray(roles)) return false;
        return roles.includes(user.role) || roles.includes(normalizeRole(user.role));
      },
    }),
    { name: 'auth-store' }
  )
);

export default useAuthStore;
