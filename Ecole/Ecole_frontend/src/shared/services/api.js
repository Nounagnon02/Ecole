/**
 * API service — Couche d'accès HTTP centralisée
 *
 * Ré-exporte l'instance Axios configurée depuis src/api.js.
 * Tous les composants importent via @/shared/services/api.
 */

import api from '@/api';

export { api };
export default api;
