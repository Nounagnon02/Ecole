/**
 * Session de l'application desktop (Electron, décision du 15/11/2026).
 *
 * L'interface y est servie par `ecole://app` : l'API est sur un autre site et
 * le cookie de session du web n'est pas transmis. Le desktop s'authentifie
 * donc par jeton Bearer, remis par l'API après le mot de passe (et la 2FA).
 * Le jeton reste EN MÉMOIRE seulement : jamais écrit sur le disque, il
 * disparaît à la fermeture de l'application (reconnexion à chaque ouverture).
 *
 * L'adresse de l'API vient de l'application desktop (`ECOLE_API_URL`, lue au
 * lancement), pas du build : un même installateur sert toutes les écoles.
 */
let jeton = null;

export function estDesktop() {
  return typeof window !== 'undefined' && window.electronAPI?.isElectron === true;
}

/** Base des appels API dans le desktop (`…/api`), ou null hors desktop. */
export function apiDesktop() {
  const url = estDesktop() ? window.electronAPI?.apiUrl : null;
  return url ? `${String(url).replace(/\/+$/, '')}/api` : null;
}

export function jetonDesktop() {
  return jeton;
}

/** Retient le jeton reçu de l'API (desktop seulement) ; null l'efface. */
export function definirJetonDesktop(valeur) {
  jeton = estDesktop() && valeur ? String(valeur) : null;
}
