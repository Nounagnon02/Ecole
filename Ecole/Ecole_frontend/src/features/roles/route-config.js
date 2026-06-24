/**
 * Route Config — Nouvelle architecture premium
 *
 * Source unique de vérité pour les routes de l'application.
 * Chaque entrée référence les dashboards premium dans features/roles/.
 */

import { ROLES, ROLE_GROUPS } from '@/shared/types/roles';

/* ─── Tous les rôles authentifiés ───────────────────────────────────── */
const ROLES_ALL = Object.values(ROLES);

/* ─── Helpers lazy ──────────────────────────────────────────────────── */
const lazy = (importFn) => importFn;

/* ─── Route config ──────────────────────────────────────────────────── */
export const ROUTE_CONFIG = {
  // ─── PUBLIQUES ────────────────────────────────────────────────────────
  home: {
    path: '/',
    component: lazy(() => import('@/app/landing/LandingPage')),
    roles: null,
  },
  connexion: {
    path: '/connexion',
    component: lazy(() => import('@/shared/components/auth/LoginForm')),
    roles: null,
  },

  // ─── DASHBOARDS PREMIUM ───────────────────────────────────────────────
  directeur: {
    path: '/directeur/dashboard',
    component: lazy(() => import('@/app/dashboards/directeur')),
    roles: [ROLES.DIRECTEUR],
  },
  enseignant: {
    path: '/enseignant/dashboard',
    component: lazy(() => import('@/app/dashboards/enseignant')),
    roles: [ROLES.ENSEIGNANT],
  },
  eleve: {
    path: '/eleve/dashboard',
    component: lazy(() => import('@/app/dashboards/eleve')),
    roles: [ROLES.ELEVE],
  },
  parent: {
    path: '/parent/dashboard',
    component: lazy(() => import('@/app/dashboards/parent')),
    roles: [ROLES.PARENT],
  },

  // ─── ADMIN ────────────────────────────────────────────────────────────
  admin: {
    path: '/admin/dashboard',
    component: lazy(() => import('@/app/dashboards/admin')),
    roles: [ROLES.ADMIN, ROLES.DIRECTEUR, ROLES.SUPER_ADMIN],
  },

  // ─── STAFF ────────────────────────────────────────────────────────────
  comptable: {
    path: '/comptable/dashboard',
    component: lazy(() => import('@/app/dashboards/comptable')),
    roles: [ROLES.COMPTABLE],
  },
  surveillant: {
    path: '/surveillant/dashboard',
    component: lazy(() => import('@/app/dashboards/surveillant')),
    roles: [ROLES.SURVEILLANT],
  },
  censeur: {
    path: '/censeur/dashboard',
    component: lazy(() => import('@/app/dashboards/censeur')),
    roles: [ROLES.CENSEUR],
  },
  infirmier: {
    path: '/infirmier/dashboard',
    component: lazy(() => import('@/app/dashboards/infirmier')),
    roles: [ROLES.INFIRMIER],
  },
  bibliothecaire: {
    path: '/bibliothecaire/dashboard',
    component: lazy(() => import('@/app/dashboards/bibliothecaire')),
    roles: [ROLES.BIBLIOTHECAIRE],
  },
  secretaire: {
    path: '/secretaire/dashboard',
    component: lazy(() => import('@/app/dashboards/secretaire')),
    roles: [ROLES.SECRETAIRE],
  },

  // ─── FEATURES PARTAGÉES ──────────────────────────────────────────────
  eleves: {
    path: '/eleves',
    component: lazy(() => import('@/app/features/eleves/ElevesPage')),
    roles: [
      ...ROLE_GROUPS.DIRECTION,
      ...ROLE_GROUPS.ENSEIGNANTS,
      ...ROLE_GROUPS.STAFF,
      ROLES.PARENT,
    ],
  },
  notes: {
    path: '/notes',
    component: lazy(() => import('@/app/features/notes/NotesPage')),
    roles: ROLES_ALL,
  },
  paiements: {
    path: '/paiements',
    component: lazy(() => import('@/app/features/paiements/PaiementsPage')),
    roles: [
      ...ROLE_GROUPS.DIRECTION,
      ROLES.COMPTABLE,
      ROLES.ELEVE,
      ROLES.PARENT,
      ROLES.SECRETAIRE,
    ],
  },
  communications: {
    path: '/communications',
    component: lazy(() => import('@/app/features/communications/CommunicationsPage')),
    roles: ROLES_ALL,
  },
  emploiDuTemps: {
    path: '/emploi-du-temps',
    component: lazy(() => import('@/app/features/emploi-du-temps/EmploiDuTempsPage')),
    roles: ROLES_ALL,
  },
  parametres: {
    path: '/parametres',
    component: lazy(() => import('@/app/features/parametres/ParametresPage')),
    roles: ROLES_ALL,
  },
  messagerie: {
    path: '/messagerie',
    component: lazy(() => import('@/app/features/messagerie/MessageriePage')),
    roles: ROLES_ALL,
  },

  // ─── FEATURES ENSEIGNANT ─────────────────────────────────────────────
  enseignantClasses: {
    path: '/enseignant/classes',
    component: lazy(() => import('@/app/features/enseignant/ClassesPage')),
    roles: [...ROLE_GROUPS.ENSEIGNANTS],
  },

  // ─── FEATURES PARENT ─────────────────────────────────────────────────
  parentEnfants: {
    path: '/parent/enfants',
    component: lazy(() => import('@/app/features/parent/EnfantsPage')),
    roles: [ROLES.PARENT],
  },

  // ─── FEATURES ÉLÈVE ─────────────────────────────────────────────────
  eleveCours: {
    path: '/eleve/cours',
    component: lazy(() => import('@/app/features/eleve/CoursPage')),
    roles: [ROLES.ELEVE, ROLES.ETUDIANT],
  },

  // ─── STAFF ───────────────────────────────────────────────────────────
  comptableTransactions: {
    path: '/comptable/transactions',
    component: lazy(() => import('@/app/features/comptable/TransactionsPage')),
    roles: [ROLES.COMPTABLE],
  },
  comptableFactures: {
    path: '/comptable/factures',
    component: lazy(() => import('@/app/features/comptable/FacturesPage')),
    roles: [ROLES.COMPTABLE],
  },
  surveillantSurveillance: {
    path: '/surveillant/surveillance',
    component: lazy(() => import('@/app/features/surveillant/SurveillancePage')),
    roles: [ROLES.SURVEILLANT],
  },
  surveillantPresences: {
    path: '/surveillant/presences',
    component: lazy(() => import('@/app/features/surveillant/PresencesPage')),
    roles: [ROLES.SURVEILLANT],
  },
  censeurDiscipline: {
    path: '/censeur/discipline',
    component: lazy(() => import('@/app/features/censeur/DisciplinePage')),
    roles: [ROLES.CENSEUR],
  },
  censeurAbsences: {
    path: '/censeur/absences',
    component: lazy(() => import('@/app/features/censeur/AbsencesPage')),
    roles: [ROLES.CENSEUR],
  },
  infirmierSoins: {
    path: '/infirmier/soins',
    component: lazy(() => import('@/app/features/infirmier/SoinsPage')),
    roles: [ROLES.INFIRMIER],
  },
  infirmierDossiers: {
    path: '/infirmier/dossiers',
    component: lazy(() => import('@/app/features/infirmier/DossiersPage')),
    roles: [ROLES.INFIRMIER],
  },
  bibliothecaireCatalogue: {
    path: '/bibliothecaire/catalogue',
    component: lazy(() => import('@/app/features/bibliothecaire/CataloguePage')),
    roles: [ROLES.BIBLIOTHECAIRE],
  },
  bibliothecaireEmprunts: {
    path: '/bibliothecaire/emprunts',
    component: lazy(() => import('@/app/features/bibliothecaire/EmpruntsPage')),
    roles: [ROLES.BIBLIOTHECAIRE],
  },
  secretaireInscriptions: {
    path: '/secretaire/inscriptions',
    component: lazy(() => import('@/app/features/secretaire/InscriptionsPage')),
    roles: [ROLES.SECRETAIRE],
  },
  secretairePlanning: {
    path: '/secretaire/planning',
    component: lazy(() => import('@/app/features/secretaire/PlanningPage')),
    roles: [ROLES.SECRETAIRE],
  },
  secretaireDocuments: {
    path: '/secretaire/documents',
    component: lazy(() => import('@/app/features/secretaire/DocumentsPage')),
    roles: [ROLES.SECRETAIRE],
  },

  // ─── UNIVERSITÉ ──────────────────────────────────────────────────────
  universiteFacultes: {
    path: '/universite/facultes',
    component: lazy(() => import('@/app/features/universite/FacultesPage')),
    roles: [ROLES.RECTEUR, ROLES.DOYEN],
  },
  universiteDepartements: {
    path: '/universite/departements',
    component: lazy(() => import('@/app/features/universite/DepartementsPage')),
    roles: [ROLES.DOYEN],
  },
  universiteEtudiants: {
    path: '/universite/etudiants',
    component: lazy(() => import('@/app/features/universite/EtudiantsPage')),
    roles: [ROLES.RECTEUR, ROLES.DOYEN, ROLES.PROFESSEUR],
  },
  universiteCours: {
    path: '/universite/cours',
    component: lazy(() => import('@/app/features/universite/CoursPage')),
    roles: [ROLES.RECTEUR, ROLES.DOYEN, ROLES.PROFESSEUR],
  },
  universiteMesCours: {
    path: '/universite/mes-cours',
    component: lazy(() => import('@/app/features/universite/MesCoursPage')),
    roles: [ROLES.PROFESSEUR, ROLES.ETUDIANT],
  },
  universiteNotes: {
    path: '/universite/notes',
    component: lazy(() => import('@/app/features/universite/NotesPage')),
    roles: [ROLES.PROFESSEUR, ROLES.ETUDIANT],
  },
  universiteTaches: {
    path: '/universite/taches',
    component: lazy(() => import('@/app/features/universite/TachesPage')),
    roles: [ROLES.PERSONNEL],
  },
  universitePlanning: {
    path: '/universite/planning',
    component: lazy(() => import('@/app/features/universite/PlanningPage')),
    roles: [ROLES.PERSONNEL],
  },
  universiteDashboard: {
    path: '/universite/dashboard',
    component: lazy(() => import('@/app/dashboards/universite')),
    roles: [ROLES.RECTEUR, ROLES.DOYEN, ROLES.PROFESSEUR, ROLES.ETUDIANT, ROLES.PERSONNEL],
  },

  // ─── ADMIN ───────────────────────────────────────────────────────────
  adminEcoles: {
    path: '/admin/ecoles',
    component: lazy(() => import('@/app/features/admin/EcolesPage')),
    roles: [ROLES.SUPER_ADMIN],
  },
  adminUtilisateurs: {
    path: '/admin/utilisateurs',
    component: lazy(() => import('@/app/features/admin/UtilisateursPage')),
    roles: [ROLES.SUPER_ADMIN, ROLES.ADMIN],
  },
  adminStatistiques: {
    path: '/admin/statistiques',
    component: lazy(() => import('@/app/features/admin/StatistiquesPage')),
    roles: [ROLES.SUPER_ADMIN],
  },
  adminConfiguration: {
    path: '/admin/configuration',
    component: lazy(() => import('@/app/features/admin/ConfigurationPage')),
    roles: [ROLES.SUPER_ADMIN, ROLES.ADMIN],
  },
};

/* ─── Routes protégées (celles qui ont des rôles) ────────────────────── */
export const PROTECTED_ROUTES = Object.fromEntries(
  Object.entries(ROUTE_CONFIG).filter(([, cfg]) => cfg.roles !== null)
);

/* ─── Routes publiques ───────────────────────────────────────────────── */
export const PUBLIC_ROUTES = Object.fromEntries(
  Object.entries(ROUTE_CONFIG).filter(([, cfg]) => cfg.roles === null)
);

/* ─── Redirection par rôle ───────────────────────────────────────────── */
export const ROLE_REDIRECT_MAP = {
  [ROLES.DIRECTEUR]: '/directeur/dashboard',
  [ROLES.ENSEIGNANT]: '/enseignant/dashboard',
  [ROLES.ELEVE]: '/eleve/dashboard',
  [ROLES.PARENT]: '/parent/dashboard',
  [ROLES.COMPTABLE]: '/comptable/dashboard',
  [ROLES.SURVEILLANT]: '/surveillant/dashboard',
  [ROLES.CENSEUR]: '/censeur/dashboard',
  [ROLES.INFIRMIER]: '/infirmier/dashboard',
  [ROLES.BIBLIOTHECAIRE]: '/bibliothecaire/dashboard',
  [ROLES.SECRETAIRE]: '/secretaire/dashboard',
  [ROLES.RECTEUR]: '/universite/dashboard',
  [ROLES.DOYEN]: '/universite/dashboard',
  [ROLES.PROFESSEUR]: '/universite/dashboard',
  [ROLES.ETUDIANT]: '/universite/dashboard',
  [ROLES.PERSONNEL]: '/universite/dashboard',
  [ROLES.SUPER_ADMIN]: '/admin/dashboard',
  [ROLES.ADMIN]: '/admin/dashboard',
};

/* ─── Fallback ───────────────────────────────────────────────────────── */
export const FALLBACK_REDIRECT = '/connexion';
