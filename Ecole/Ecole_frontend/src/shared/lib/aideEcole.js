/**
 * Numéro d'aide affiché sur la page de connexion.
 *
 * Avant l'identification, on ne sait pas de quelle école vient la personne.
 * On garde donc sur l'appareil le nom et le téléphone de la dernière école
 * connectée (donnée publique de l'école, pas de la personne) ; à défaut, un
 * numéro fixé au déploiement (`VITE_AIDE_TELEPHONE`, `VITE_AIDE_NOM`).
 * Rien n'est effacé à la déconnexion : c'est la connexion suivante, celle
 * qui échoue, qui en a besoin.
 */

const CLE = 'ecole.aide';

export function memoriserAide(ecole) {
  if (!ecole?.nom || !ecole?.telephone) return;
  try {
    localStorage.setItem(CLE, JSON.stringify({ nom: ecole.nom, telephone: ecole.telephone }));
  } catch {
    // Stockage indisponible (navigation privée) : le message générique suffit.
  }
}

export function lireAide() {
  try {
    const aide = JSON.parse(localStorage.getItem(CLE) || 'null');
    if (aide?.nom && aide?.telephone) return { nom: aide.nom, telephone: aide.telephone };
  } catch {
    // Valeur illisible : on l'ignore.
  }
  const telephone = import.meta.env.VITE_AIDE_TELEPHONE;
  return telephone ? { nom: import.meta.env.VITE_AIDE_NOM || null, telephone } : null;
}

export function lienTelephone(telephone) {
  return `tel:${String(telephone).replace(/[^\d+]/g, '')}`;
}
