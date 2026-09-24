// Briques communes aux scénarios k6 : pool de jetons, appel authentifié avec
// vérifications, parcours par rôle, résumé lisible.
import http from 'k6/http';
import { check, sleep } from 'k6';
import { Counter } from 'k6/metrics';
import { SharedArray } from 'k6/data';

export const BASE_URL = __ENV.BASE_URL || 'http://nginx';

// Jetons Bearer générés par `LoadTestSeeder` (voir README). Les comptes ne se
// connectent jamais par mot de passe : `POST /auth/login` est limité à 20
// tentatives/min/IP (limiteur `auth`), volontairement — c'est un garde-fou
// anti-force-brute, pas une capacité à mesurer.
const all = new SharedArray('tokens', () =>
  JSON.parse(open(__ENV.TOKENS_FILE || '/data/tokens.json')).users
);

const byRole = {};
for (let i = 0; i < all.length; i++) {
  const u = all[i];
  (byRole[u.role] = byRole[u.role] || []).push(u);
}

// `__VU` est unique sur tous les scénarios : répartit les VU sur les jetons.
export function pick(role, offset = __VU - 1) {
  const pool = byRole[role];
  return pool[offset % pool.length];
}

// Toute réponse autre que 200 compte comme un échec dans `http_req_failed`.
http.setResponseCallback(http.expectedStatuses(200));

// Une réponse à un utilisateur de l'école N ne doit jamais contenir de donnée
// d'une autre école : `LoadTestSeeder` préfixe tous les noms par `LTS{N}-`.
export const leaks = new Counter('cross_tenant_leaks');
// Le limiteur `api` (300 req/min par utilisateur) ne doit jamais se déclencher
// pour un parcours humain plausible : un 429 ici est une trouvaille.
export const rateLimited = new Counter('rate_limited');

let thinkScale = Number(__ENV.THINK === undefined ? 1 : __ENV.THINK);
export function setThinkScale(scale) {
  thinkScale = scale;
}
// Un humain lit l'écran avant de cliquer : 1 à 3 s entre deux appels d'un même
// écran...
export function think() {
  if (thinkScale > 0) sleep((1 + Math.random() * 2) * thinkScale);
}
// ...et reste 5 à 15 s sur un écran avant d'en ouvrir un autre.
export function idle() {
  if (thinkScale > 0) sleep((5 + Math.random() * 10) * thinkScale);
}

// L'application ne rappelle pas `/auth/me` à chaque écran : une fois par session.
// L'état du module est propre à chaque VU (chacun a son propre runtime JS).
const booted = new Set();
export function boot(u) {
  if (booted.has(u.user_id)) return;
  booted.add(u.user_id);
  call(u, '/api/auth/me', 'auth_me');
}

export function call(user, path, name) {
  const res = http.get(`${BASE_URL}${path}`, {
    headers: { Authorization: `Bearer ${user.token}`, Accept: 'application/json' },
    tags: { name },
  });

  if (res.status === 429) rateLimited.add(1);

  const marks = String(res.body || '').match(/LTS(\d+)-/g) || [];
  let foreign = 0;
  for (const m of marks) {
    if (Number(m.slice(3, -1)) !== user.school) foreign++;
  }
  if (foreign > 0) leaks.add(foreign);

  check(res, { 'status 200': (r) => r.status === 200 }, { name });
  check(res, { 'aucune donnée d’une autre école': () => foreign === 0 }, { name });
  return res;
}

// Parcours par rôle, calqués sur ce que fait réellement le frontend à
// l'ouverture de chaque tableau de bord.
export const personas = {
  eleve(u) {
    boot(u);
    call(u, '/api/dashboard/eleve', 'dashboard_eleve');
    think();
    call(u, '/api/notifications', 'notifications');
  },
  parent(u) {
    boot(u);
    call(u, '/api/dashboard/parent', 'dashboard_parent');
    think();
    call(u, '/api/notifications', 'notifications');
  },
  enseignant(u) {
    boot(u);
    call(u, '/api/dashboard/enseignant', 'dashboard_enseignant');
    think();
    call(u, '/api/classes', 'classes_list');
    think();
    call(u, '/api/matieres', 'matieres_list');
    think();
    call(u, '/api/notifications', 'notifications');
  },
  comptable(u) {
    boot(u);
    call(u, '/api/dashboard/comptable', 'dashboard_comptable');
    think();
    call(u, '/api/comptable/paiements', 'comptable_paiements');
    think();
    call(u, '/api/comptable/finances', 'comptable_finances');
  },
  directeur(u) {
    boot(u);
    call(u, '/api/dashboard/directeur', 'dashboard_directeur');
    think();
    call(u, '/api/eleves', 'eleves_list');
    think();
    call(u, '/api/classes', 'classes_list');
    think();
    call(u, '/api/notifications', 'notifications');
  },
};

const ENDPOINTS = [
  'auth_me', 'notifications', 'classes_list', 'matieres_list', 'eleves_list',
  'dashboard_eleve', 'dashboard_parent', 'dashboard_enseignant',
  'dashboard_comptable', 'dashboard_directeur',
  'comptable_paiements', 'comptable_finances',
];

// Un seuil par endpoint : k6 ne crée un sous-indicateur `{name:...}` (donc ne
// le rapporte) que si un seuil le référence.
export function thresholds(p95Ms = 1500) {
  const t = {
    http_req_failed: ['rate<0.01'],
    cross_tenant_leaks: ['count==0'],
    rate_limited: ['count==0'],
    checks: ['rate>0.99'],
  };
  for (const name of ENDPOINTS) {
    t[`http_req_duration{name:${name}}`] = [`p(95)<${p95Ms}`];
    t[`http_reqs{name:${name}}`] = ['count>=0']; // seulement pour rapporter le volume
  }
  return t;
}

export const summaryTrendStats = ['avg', 'med', 'p(90)', 'p(95)', 'p(99)', 'max'];

const pad = (v, n) => String(v).padEnd(n);
const ms = (v) => (v === undefined ? '-' : `${v.toFixed(0)}`);

export function handleSummary(data) {
  const m = data.metrics;
  const val = (k, f) => (m[k] && m[k].values ? m[k].values[f] : undefined);
  const lines = [];
  lines.push('');
  lines.push(`requêtes        : ${val('http_reqs', 'count')}  (${(val('http_reqs', 'rate') || 0).toFixed(1)} req/s)`);
  lines.push(`échecs          : ${((val('http_req_failed', 'rate') || 0) * 100).toFixed(2)} %`);
  lines.push(`checks OK       : ${((val('checks', 'rate') || 0) * 100).toFixed(2)} %`);
  lines.push(`fuites inter-écoles : ${val('cross_tenant_leaks', 'count') || 0}`);
  lines.push(`429 (limiteur)  : ${val('rate_limited', 'count') || 0}`);
  lines.push(`VU max          : ${val('vus_max', 'max')}`);
  lines.push('');
  lines.push(`${pad('endpoint', 24)}${pad('n', 8)}${pad('med', 7)}${pad('p90', 7)}${pad('p95', 7)}${pad('p99', 7)}max   (ms)`);
  const names = Object.keys(m)
    .map((k) => (k.match(/^http_req_duration\{name:(.+)\}$/) || [])[1])
    .filter(Boolean)
    .sort();
  for (const name of names) {
    const k = `http_req_duration{name:${name}}`;
    const n = m[`http_reqs{name:${name}}`] ? m[`http_reqs{name:${name}}`].values.count : '';
    lines.push(
      `${pad(name, 24)}${pad(n, 8)}${pad(ms(val(k, 'med')), 7)}${pad(ms(val(k, 'p(90)')), 7)}` +
        `${pad(ms(val(k, 'p(95)')), 7)}${pad(ms(val(k, 'p(99)')), 7)}${ms(val(k, 'max'))}`
    );
  }
  lines.push(`${pad('TOUS', 24)}${pad('', 8)}${pad(ms(val('http_req_duration', 'med')), 7)}${pad(ms(val('http_req_duration', 'p(90)')), 7)}` +
    `${pad(ms(val('http_req_duration', 'p(95)')), 7)}${pad(ms(val('http_req_duration', 'p(99)')), 7)}${ms(val('http_req_duration', 'max'))}`);
  lines.push('');
  return { stdout: lines.join('\n') + '\n' };
}
