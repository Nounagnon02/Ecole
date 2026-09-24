// Recette de l'image de production : un passage de chaque rôle sur tous ses
// écrans, sans temps de réflexion. Un 500 sur un tableau de bord, une donnée
// d'une autre école, un 429 : le test échoue. À lancer avant toute mesure de
// charge — inutile de charger une pile qui ne répond pas correctement à un seul
// utilisateur (c'est ainsi qu'a été trouvée l'extension `calendar` absente de
// l'image, qui faisait répondre 500 au tableau de bord parent).
import { personas, pick, setThinkScale, thresholds, summaryTrendStats } from './lib.js';

export { handleSummary } from './lib.js';

setThinkScale(0);

export const options = {
  vus: 1,
  iterations: 1,
  summaryTrendStats,
  thresholds: { ...thresholds(5000), checks: ['rate==1'], http_req_failed: ['rate==0'] },
};

export default function () {
  for (const role of Object.keys(personas)) {
    personas[role](pick(role, 0));
  }
}
