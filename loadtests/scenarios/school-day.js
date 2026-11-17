// Une matinée d'école : un mélange pondéré de rôles, chacun suivant son parcours
// réel avec des temps de réflexion humains, montée en charge progressive puis
// palier.
//
//   PEAK_VUS  utilisateurs simultanés au palier (défaut 50)
//   RAMP      durée de montée (défaut 1m)     HOLD  durée du palier (défaut 3m)
//   THINK     multiplicateur des temps de réflexion (défaut 1 ; 0 = enchaîné)
//
// Les élèves et les parents dominent en nombre mais font peu de requêtes ; le
// comptable et le directeur sont rares (un de chaque par école, jamais plus)
// mais chargent les écrans les plus lourds.
import { personas, pick, idle, thresholds, summaryTrendStats } from './lib.js';

export { handleSummary } from './lib.js';

const PEAK = Number(__ENV.PEAK_VUS || 50);
const RAMP = __ENV.RAMP || '1m';
const HOLD = __ENV.HOLD || '3m';

const MIX = { eleve: 0.4, parent: 0.35, enseignant: 0.2, comptable: 0.03, directeur: 0.02 };

const scenarios = {};
for (const [role, weight] of Object.entries(MIX)) {
  const target = Math.max(1, Math.round(PEAK * weight));
  scenarios[role] = {
    executor: 'ramping-vus',
    exec: role,
    startVUs: 0,
    stages: [
      { duration: RAMP, target },
      { duration: HOLD, target },
      { duration: '20s', target: 0 },
    ],
    gracefulRampDown: '10s',
  };
}

export const options = {
  scenarios,
  summaryTrendStats,
  thresholds: thresholds(),
};

// Une itération = une visite d'écran, suivie d'un temps passé dessus.
function visit(role) {
  personas[role](pick(role));
  idle();
}
export function eleve() {
  visit('eleve');
}
export function parent() {
  visit('parent');
}
export function enseignant() {
  visit('enseignant');
}
export function comptable() {
  visit('comptable');
}
export function directeur() {
  visit('directeur');
}
