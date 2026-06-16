import React, { createContext, useContext, useState, useEffect } from 'react';
import api from '../api';

const AuthContext = createContext();

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [token, setToken] = useState(localStorage.getItem('token'));

  useEffect(() => {
    if (token) {
      validateToken();
    } else {
      setLoading(false);
    }
  }, [token]);

  const validateToken = async () => {
    try {
      const response = await api.get('/user/profile', {
        headers: { Authorization: `Bearer ${token}` }
      });
      
      if (response.data.success) {
        setUser(response.data.user);
      } else {
        logout();
      }
    } catch (error) {
      console.error('Token validation failed:', error);
      logout();
    } finally {
      setLoading(false);
    }
  };

  const login = async (credentials) => {
    try {
      const response = await api.post('/connexion', credentials);
      const data = response.data;

      // Supporte les deux formats de réponse backend :
      // 1) { token, role, user, redirect_to } (format principal)
      // 2) { success: true, token, user, ecole_id } (format alternatif)
      if (data.token || data.role) {
        const userData = data.user || {
          ecole_id: credentials.ecole_id,
          identifiant: credentials.identifiant,
          nom: 'Utilisateur',
          prenom: '',
          role: data.role,
        };

        if (data.token) localStorage.setItem('token', data.token);
        localStorage.setItem('user', JSON.stringify(userData));
        if (userData.id) localStorage.setItem('userId', userData.id);
        localStorage.setItem('userRole', userData.role);

        const ecoleId = userData.ecole_id || credentials.ecole_id;
        if (ecoleId) localStorage.setItem('ecole_id', ecoleId);

        setToken(data.token || null);
        setUser(userData);

        return {
          success: true,
          user: userData,
          redirect_to: data.redirect_to,
        };
      }

      return {
        success: false,
        message: data.message || 'Réponse inattendue du serveur',
      };
    } catch (error) {
      return {
        success: false,
        message: error.response?.data?.message || error.message || 'Erreur de connexion',
      };
    }
  };

  const logout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    localStorage.removeItem('userId');
    localStorage.removeItem('userRole');
    localStorage.removeItem('ecole_id');
    setToken(null);
    setUser(null);
  };

  const hasRole = (requiredRole) => {
    return user?.role === requiredRole;
  };

  const hasAnyRole = (roles) => {
    return roles.includes(user?.role);
  };

  const value = {
    user,
    token,
    loading,
    login,
    logout,
    hasRole,
    hasAnyRole,
    isAuthenticated: !!user
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};