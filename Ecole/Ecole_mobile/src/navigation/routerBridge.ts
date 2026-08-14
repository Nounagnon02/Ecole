/**
 * ============================================================================
 * routerBridge — Pont react-navigation → expo-router (Érudit v4)
 *
 * Les écrans de `src/screens/` ont été écrits pour react-navigation : ils
 * reçoivent une prop `navigation` et appellent `navigate`/`replace`/`goBack`
 * avec des noms d'écran. Le routeur réel est expo-router (répertoire `app/`),
 * qui travaille avec des chemins de fichiers.
 *
 * Ce module fait la traduction en un seul endroit, au lieu d'être recopié
 * dans chaque fichier de route.
 * ============================================================================
 */

import type { Router } from 'expo-router';

/** Noms d'écran react-navigation encore utilisés dans `src/screens/`. */
const HREFS_ECRANS: Record<string, string> = {
  Login: '/',
  ForgotPassword: '/MotDePasseOublie',
  ResetPassword: '/reset-password',
};

/** Dashboards réellement présents dans `app/(app)/`. */
export const DASHBOARDS = [
  'admin',
  'bibliothecaire',
  'censeur',
  'comptable',
  'directeur',
  'eleve',
  'enseignant',
  'infirmier',
  'parent',
  'secretaire',
  'surveillant',
  'universite',
] as const;

export type Dashboard = (typeof DASHBOARDS)[number];

/**
 * Rôles émis par l'API Laravel → dashboard mobile.
 *
 * Les rôles universitaires (doyen, recteur, professeur, etudiant) partagent
 * l'espace « universite » : c'est le seul écran mobile qui couvre ce domaine.
 * `super-admin` retombe sur l'espace admin.
 */
const DASHBOARD_PAR_ROLE: Record<string, Dashboard> = {
  admin: 'admin',
  'super-admin': 'admin',
  bibliothecaire: 'bibliothecaire',
  censeur: 'censeur',
  comptable: 'comptable',
  directeur: 'directeur',
  eleve: 'eleve',
  enseignant: 'enseignant',
  infirmier: 'infirmier',
  parent: 'parent',
  secretaire: 'secretaire',
  surveillant: 'surveillant',
  doyen: 'universite',
  etudiant: 'universite',
  professeur: 'universite',
  recteur: 'universite',
  universite: 'universite',
};

/**
 * Chemin expo-router du dashboard d'un rôle, ou `null` si l'application
 * mobile n'expose aucun écran pour ce rôle (ex. « personnel »).
 *
 * Renvoyer `null` plutôt qu'un chemin deviné évite d'envoyer l'utilisateur
 * sur l'écran « Unmatched Route » du routeur après une connexion réussie.
 */
export function hrefDashboard(role?: string | null): string | null {
  if (!role) return null;
  const dashboard = DASHBOARD_PAR_ROLE[role];
  return dashboard ? `/(app)/${dashboard}` : null;
}

export interface NavigationProxy {
  navigate: (cible: string) => void;
  replace: (cible: string) => void;
  goBack: () => void;
}

/**
 * Résout une cible de navigation : un chemin absolu est passé tel quel, un
 * nom d'écran react-navigation est traduit, tout le reste retombe sur la
 * connexion.
 */
export function resoudreHref(cible: string): string {
  if (cible.startsWith('/')) return cible;
  return HREFS_ECRANS[cible] ?? '/';
}

/** Adapte le routeur expo-router à l'API `navigation` de react-navigation. */
export function creerNavigationProxy(router: Router): NavigationProxy {
  return {
    navigate: (cible) => router.push(resoudreHref(cible)),
    replace: (cible) => router.replace(resoudreHref(cible)),
    goBack: () => router.back(),
  };
}
