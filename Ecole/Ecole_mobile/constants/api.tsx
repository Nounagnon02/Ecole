export const URL_BASE_API = __DEV__ 
  ? 'http://10.0.2.2:8000/api'
  : 'https://api.production.com/api';

export const POINTS_TERMINAISON_AUTH = {
  CONNEXION: `${URL_BASE_API}/connexion`,
};