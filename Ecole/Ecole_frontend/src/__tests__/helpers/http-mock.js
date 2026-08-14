/**
 * http-mock — Adaptateur Axios contrôlé pour les tests
 *
 * Pourquoi un adaptateur et non un `vi.mock('axios')` :
 * l'essentiel du comportement à protéger vit dans les *intercepteurs*
 * de `shared/lib/api-client.js` (normalisation des erreurs, purge de
 * session sur 401, repli sur le cache). Remplacer axios entier les
 * court-circuiterait et les tests ne prouveraient plus rien.
 *
 * On remplace donc uniquement la couche transport : les intercepteurs
 * réels tournent, seul le réseau est simulé.
 *
 * Usage :
 *   const http = installHttpMock();
 *   http.onGet('/eleves').reply(200, [{ id: 1 }]);
 *   http.onGet('/eleves').reply(500, { message: 'Boom' });   // remplace
 *   http.onPost('/auth/login').networkError();
 *   http.restore();
 */

import axios from 'axios';
import apiClient from '@/shared/lib/api-client';

/** Normalise une URL (absolue ou relative) en chemin comparable. */
function toPath(url = '') {
  try {
    if (/^https?:\/\//.test(url)) return new URL(url).pathname;
  } catch {
    /* ignore */
  }
  return url.split('?')[0];
}

function buildAxiosError(config, { status, data, headers }) {
  const error = new Error(
    (data && (data.message || data?.error?.message)) || `Request failed with status code ${status}`
  );
  error.isAxiosError = true;
  error.config = config;
  error.request = {};
  error.response = {
    status,
    statusText: String(status),
    data: data ?? {},
    headers: headers ?? {},
    config,
  };
  return error;
}

function buildNetworkError(config, message = 'Network Error') {
  const error = new Error(message);
  error.isAxiosError = true;
  error.config = config;
  error.request = {};
  error.response = undefined;
  error.code = 'ERR_NETWORK';
  return error;
}

export function installHttpMock() {
  /** @type {{method: string, path: string, handler: Function}[]} */
  const routes = [];
  /** @type {{method: string, url: string, path: string, body: unknown}[]} */
  const calls = [];

  const previousInstanceAdapter = apiClient.defaults.adapter;
  const previousGlobalAdapter = axios.defaults.adapter;

  function register(method, path, handler) {
    const key = `${method} ${toPath(path)}`;
    const existing = routes.findIndex((r) => `${r.method} ${r.path}` === key);
    const entry = { method, path: toPath(path), handler };
    if (existing >= 0) routes[existing] = entry;
    else routes.push(entry);
  }

  function parseBody(raw) {
    if (typeof raw !== 'string') return raw;
    try {
      return JSON.parse(raw);
    } catch {
      return raw;
    }
  }

  const adapter = (config) => {
    const method = String(config.method || 'get').toLowerCase();
    const path = toPath(config.url || '');
    calls.push({ method, url: config.url, path, body: parseBody(config.data) });

    const route = routes.find((r) => r.method === method && r.path === path);

    if (!route) {
      // Un appel non déclaré est une erreur de test, pas un 404 métier :
      // on le rend visible plutôt que de le laisser passer silencieusement.
      return Promise.reject(
        buildAxiosError(config, {
          status: 501,
          data: { message: `[http-mock] route non simulée : ${method.toUpperCase()} ${path}` },
        })
      );
    }

    const result = route.handler(config);

    if (result.kind === 'network') return Promise.reject(buildNetworkError(config, result.message));

    if (result.status >= 400) {
      return Promise.reject(
        buildAxiosError(config, { status: result.status, data: result.data, headers: result.headers })
      );
    }

    return Promise.resolve({
      data: result.data,
      status: result.status,
      statusText: 'OK',
      headers: result.headers ?? {},
      config,
    });
  };

  apiClient.defaults.adapter = adapter;
  axios.defaults.adapter = adapter;

  const builder = (method) => (path) => ({
    reply: (status, data, headers) => {
      register(method, path, () => ({ kind: 'http', status, data, headers }));
      return api;
    },
    replyOnce: (status, data, headers) => {
      let used = false;
      register(method, path, () => {
        if (used) return { kind: 'http', status: 200, data: {} };
        used = true;
        return { kind: 'http', status, data, headers };
      });
      return api;
    },
    networkError: (message) => {
      register(method, path, () => ({ kind: 'network', message }));
      return api;
    },
  });

  const api = {
    onGet: builder('get'),
    onPost: builder('post'),
    onPut: builder('put'),
    onPatch: builder('patch'),
    onDelete: builder('delete'),
    calls,
    callsTo: (method, path) =>
      calls.filter((c) => c.method === method.toLowerCase() && c.path === toPath(path)),
    reset: () => {
      routes.length = 0;
      calls.length = 0;
    },
    restore: () => {
      apiClient.defaults.adapter = previousInstanceAdapter;
      axios.defaults.adapter = previousGlobalAdapter;
      routes.length = 0;
      calls.length = 0;
    },
  };

  return api;
}

export default installHttpMock;
