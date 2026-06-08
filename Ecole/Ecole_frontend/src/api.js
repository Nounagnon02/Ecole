import axios from 'axios';

// Base URL from environment or fallback to localhost
export const urlBase =  'http://localhost:8000/api';

// Axios instance with baseURL
const api = axios.create({
  baseURL: urlBase,
  headers: {
    'Content-Type': 'application/json',
    'Accept': 'application/json'
  }
});

// Intercepteur pour ajouter le token et ecole_id
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('token');
    const ecoleId = localStorage.getItem('ecole_id');

    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }

    if (ecoleId) {
      config.headers['X-Ecole-Id'] = ecoleId;
    }

    return config;
  },
  (error) => Promise.reject(error)
);

// Intercepteur de réponse pour la gestion centralisée des erreurs
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (!error.response) {
      // Erreur réseau (pas de réponse du serveur)
      const networkError = {
        success: false,
        message: 'Impossible de contacter le serveur. Vérifiez votre connexion internet.',
        networkError: true
      };
      return Promise.reject(networkError);
    }

    const { status } = error.response;

    if (status === 401) {
      // Token expiré ou invalide → déconnexion
      localStorage.removeItem('token');
      localStorage.removeItem('user');
      localStorage.removeItem('userId');
      localStorage.removeItem('userRole');
      if (window.location.pathname !== '/connexion') {
        window.location.href = '/connexion';
      }
    }

    if (status === 429) {
      // Rate limit atteint
      const rateLimitError = {
        success: false,
        message: 'Trop de requêtes. Veuillez réessayer dans quelques instants.',
        rateLimited: true
      };
      return Promise.reject(rateLimitError);
    }

    if (status >= 500) {
      // Erreur serveur
      const serverError = {
        success: false,
        message: 'Une erreur serveur est survenue. Veuillez réessayer plus tard.',
        serverError: true
      };
      return Promise.reject(serverError);
    }

    return Promise.reject(error);
  }
);

export default api;
