import axios from 'axios';

// Base URL from environment or fallback to localhost
export const urlBase = process.env.REACT_APP_API_URL || 'http://localhost:8000';

// Axios instance with baseURL
const api = axios.create({
  baseURL: urlBase,
  headers: {
    'Content-Type': 'application/json',
    'Accept': 'application/json'
  }
});

export default api;
