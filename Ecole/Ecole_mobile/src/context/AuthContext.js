/**
 * ============================================================================
 * AuthContext — Érudit v4 (React Native)
 *
 * Contexte d'authentification amélioré :
 * - Login / Logout / Forgot password / Reset password
 * - Persistance AsyncStorage (user + token + role)
 * - Restauration de session au démarrage
 * - Gestion des erreurs réseau
 * ============================================================================
 */

import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { api } from '../services/api';

const AuthContext = createContext();

export const useAuth = () => useContext(AuthContext);

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    checkAuthState();
  }, []);

  /**
   * Restaure la session depuis AsyncStorage au démarrage.
   */
  const checkAuthState = useCallback(async () => {
    try {
      const [userData, token] = await Promise.all([
        AsyncStorage.getItem('@ecole_user'),
        AsyncStorage.getItem('@ecole_token'),
      ]);
      if (userData && token) {
        const parsed = JSON.parse(userData);
        setUser(parsed);
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
      const response = await api.post('/auth/login', credentials);
      const userData = response.data.user || response.data;
      const token = response.data.token || userData.token;

      // Stockage persistant
      await AsyncStorage.setItem('@ecole_user', JSON.stringify(userData));
      if (token) {
        await AsyncStorage.setItem('@ecole_token', token);
        api.defaults.headers.common['Authorization'] = `Bearer ${token}`;
      }

      setUser(userData);
      return userData;
    } catch (err) {
      const message =
        err.response?.data?.message ||
        err.response?.data?.error ||
        'Identifiants incorrects. Veuillez réessayer.';
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
    await AsyncStorage.multiRemove(['@ecole_user', '@ecole_token']);
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
    await AsyncStorage.setItem('@ecole_user', JSON.stringify(merged));
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