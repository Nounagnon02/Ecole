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

export default api;
