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

export default api;
