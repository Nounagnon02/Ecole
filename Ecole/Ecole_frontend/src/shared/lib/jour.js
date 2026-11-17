/**
 * Dates « du jour » à l'heure de l'école (audit du 14/11, N-06).
 *
 * `toISOString()` tronqué à dix caractères donne la date UTC : au Bénin
 * (UTC+1), entre minuit et 1 h, l'appel, les soins ou la saisie de notes
 * proposaient la veille. Le serveur, lui, est réglé sur Porto-Novo.
 */
export const FUSEAU_ECOLE = 'Africa/Porto-Novo';

const format = new Intl.DateTimeFormat('en-CA', {
  timeZone: FUSEAU_ECOLE, year: 'numeric', month: '2-digit', day: '2-digit',
});

/** Date AAAA-MM-JJ à l'heure de l'école, `jours` après aujourd'hui. */
export function dansJours(jours, maintenant = new Date()) {
  const parties = Object.fromEntries(
    format.formatToParts(new Date(maintenant.getTime() + jours * 86_400_000)).map((p) => [p.type, p.value]),
  );
  return `${parties.year}-${parties.month}-${parties.day}`;
}

/** Date du jour AAAA-MM-JJ à l'heure de l'école. */
export const aujourdhui = (maintenant = new Date()) => dansJours(0, maintenant);
