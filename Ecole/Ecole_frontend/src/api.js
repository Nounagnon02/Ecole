/**
 * API entry point — Ré-export de l'instance Axios centralisée
 *
 * Point d'entrée public pour les appels API.
 * L'instance Axios configurée (intercepteurs, baseURL, timeout)
 * est définie dans shared/lib/api-client.js.
 *
 * @module api
 */

export { api } from '@/shared/lib/api-client';
export { default } from '@/shared/lib/api-client';
