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

/**
 * Espaces du mobile, chacun présent dans `app/(app)/`. Périmètre décidé le
 * 14/11/2026 (parents et enseignants), élargi le 16/11/2026 à l'université :
 * professeurs et étudiants. L'administration (école et université) passe par
 * le desktop ou le web, les élèves du secondaire par le web. Les anciens
 * écrans administratifs ont été retirés : un lien profond vers eux ne mène
 * nulle part.
 */
export const DASHBOARDS = ['enseignant', 'parent', 'professeur', 'etudiant'] as const;

export type Dashboard = (typeof DASHBOARDS)[number];

const DASHBOARD_PAR_ROLE: Record<string, Dashboard> = {
  parent: 'parent',
  enseignant: 'enseignant',
  enseignement: 'enseignant',
  enseignementM: 'enseignant',
  enseignementP: 'enseignant',
  professeur: 'professeur',
  etudiant: 'etudiant',
};

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
