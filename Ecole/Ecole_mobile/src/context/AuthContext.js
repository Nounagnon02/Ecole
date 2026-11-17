/**
 * ============================================================================
 * AuthContext — Érudit v4 (React Native)
 *
 * Contexte d'authentification amélioré :
 * - Login / Logout / Forgot password / Reset password
 * - Persistance : token en stockage sécurisé, profil en AsyncStorage
 * - Restauration de session au démarrage
 * - Gestion des erreurs réseau
 * ============================================================================
 */

import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { Platform } from 'react-native';
import { api } from '../services/api';
import { setToken, getToken, setUser as persistUser, getUser, clearAll } from '../services/secureStorage';

const AuthContext = createContext();

/**
 * Message d'un échec de connexion. Sans réponse du serveur, le réseau est en
 * cause : dire « identifiants incorrects » ferait croire à un mot de passe
 * faux (constaté sur l'émulateur, 17/11/2026). Trop de tentatives et panne du
 * serveur ont leur propre message, en français.
 */
export function messageConnexion(err) {
  if (err?.code === 'API_NON_CONFIGUREE') return err.message;
  const statut = err?.response?.status;
  if (!err?.response) return 'Pas de connexion au serveur. Vérifiez le réseau puis réessayez.';
  if (statut === 429) return 'Trop de tentatives de connexion. Patientez une minute puis réessayez.';
  if (statut >= 500) return 'Le serveur de l’école ne répond pas correctement. Réessayez plus tard.';
  return err.response.data?.message || err.response.data?.error || 'Identifiants incorrects. Veuillez réessayer.';
}

export const useAuth = () => useContext(AuthContext);

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    checkAuthState();
  }, []);

  /**
   * Restaure la session au démarrage (token chiffré + profil en cache).
   */
  const checkAuthState = useCallback(async () => {
    try {
      const [userData, token] = await Promise.all([getUser(), getToken()]);
      if (userData && token) {
        setUser(userData);
        // Attacher le token à l'instance Axios
        api.defaults.headers.common['Authorization'] = `Bearer ${token}`;
      }
    } catch (err) {
      console.error('Auth check error:', err.message);
    } finally {
      setLoading(false);
    }
  }, []);

  /**
   * Connexion : POST /api/v1/auth/login → stocke user + token
   */
  const login = async (credentials) => {
    setError(null);
    try {
      // `device_name` permet au backend de nommer le token Sanctum émis,
      // et donc de le révoquer appareil par appareil.
      const response = await api.post('/auth/login', {
        ...credentials,
        device_name: Platform.OS === 'ios' ? 'ios' : 'android',
      });
      // Mot de passe provisoire (compte créé par l'école) : l'API refuse tout
      // le reste tant qu'il n'est pas remplacé ; l'espace l'impose d'abord.
      const userData = {
        ...(response.data.user || response.data),
        password_change_required: !!(response.data.requires_password_change || response.data.user?.password_change_required),
      };
      const token = response.data.token || userData.token;

      // Profil en clair (affichage), token en stockage chiffré.
      await persistUser(userData);
      if (token) {
        await setToken(token);
        api.defaults.headers.common['Authorization'] = `Bearer ${token}`;
      }

      setUser(userData);
      return userData;
    } catch (err) {
      const message = messageConnexion(err);
      setError(message);
      throw new Error(message);
    }
  };

  /**
   * Déconnexion : nettoie le storage + headers
   */
  const logout = async () => {
    try {
      await api.post('/auth/logout').catch(() => {});
    } catch (_) {
      // Déconnexion même sans réponse serveur
    }
    await clearAll();
    delete api.defaults.headers.common['Authorization'];
    setUser(null);
    setError(null);
  };

  /**
   * Mot de passe oublié : POST /api/v1/forgot-password
   */
  const forgotPassword = async (email) => {
    setError(null);
    try {
      const response = await api.post('/auth/forgot-password', { email });
      return response.data.message || 'Un email de réinitialisation a été envoyé.';
    } catch (err) {
      const message =
        err.response?.data?.message ||
        'Erreur lors de la demande. Vérifiez votre email.';
      setError(message);
      throw new Error(message);
    }
  };

  /**
   * Réinitialisation mot de passe : POST /api/v1/reset-password
   */
  const resetPassword = async ({ token, email, password, password_confirmation }) => {
    setError(null);
    try {
      const response = await api.post('/auth/reset-password', {
        token,
        email,
        password,
        password_confirmation: password_confirmation || password,
      });
      return response.data.message || 'Mot de passe réinitialisé avec succès.';
    } catch (err) {
      const message =
        err.response?.data?.message ||
        'Erreur lors de la réinitialisation. Le lien est peut-être expiré.';
      setError(message);
      throw new Error(message);
    }
  };

  /**
   * Mise à jour du user dans le contexte (ex: après édition du profil)
   */
  const updateUser = async (updatedData) => {
    const merged = { ...user, ...updatedData };
    setUser(merged);
    await persistUser(merged);
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        loading,
        error,
        login,
        logout,
        forgotPassword,
        resetPassword,
        updateUser,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};