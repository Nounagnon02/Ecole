/**
 * Plateforme d'exécution du web : navigateur ou application de bureau.
 *
 * Périmètre décidé le 14/11/2026 : le desktop est réservé à l'administration
 * (direction, secrétariat, comptabilité, vie scolaire, santé, bibliothèque,
 * administration d'école et de plateforme, direction universitaire). Les
 * parents et enseignants utilisent le mobile, élèves et étudiants le web.
 *
 * Ce n'est PAS une protection : `window.electronAPI` est exposé par le
 * preload du desktop et n'apporte aucune preuve au serveur. Chaque compte
 * garde exactement ses droits, vérifiés par l'API à chaque requête ; un
 * parent n'obtient rien de plus sur le desktop que sur le web. L'admission
 * évite seulement de présenter un produit qui n'est pas fait pour lui.
 */

export const ROLES_DESKTOP = Object.freeze([
  'directeur', 'directeurM', 'directeurP', 'directeurS',
  'secretaire', 'comptable', 'censeur', 'surveillant', 'infirmier', 'bibliothecaire',
  'admin', 'super-admin',
  'recteur', 'doyen', 'personnel',
]);

/** Vrai dans l'application de bureau (preload Electron). */
export function estDesktop() {
  return typeof window !== 'undefined' && window.electronAPI?.isElectron === true;
}

/** Le compte peut-il utiliser l'application dans laquelle il s'exécute ? */
export function admisSurCettePlateforme(role) {
  return !estDesktop() || ROLES_DESKTOP.includes(role);
}
