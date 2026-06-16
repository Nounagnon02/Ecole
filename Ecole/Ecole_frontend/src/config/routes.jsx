/**
 * Configuration centralisée des routes
 * Source unique de vérité pour tous les paths, rôles et redirections.
 */

// =============================================================================
// ROLES
// =============================================================================
export const ROLES = {
  DIRECTEUR: 'directeur',
  DIRECTEUR_M: 'directeurM',
  DIRECTEUR_P: 'directeurP',
  DIRECTEUR_S: 'directeurS',
  ENSEIGNANT: 'enseignant',
  ENSEIGNEMENT: 'enseignement',
  ENSEIGNEMENT_M: 'enseignementM',
  ENSEIGNEMENT_P: 'enseignementP',
  ELEVE: 'eleve',
  PARENT: 'parent',
  COMPTABLE: 'comptable',
  SURVEILLANT: 'surveillant',
  CENSEUR: 'censeur',
  INFIRMIER: 'infirmier',
  BIBLIOTHECAIRE: 'bibliothecaire',
  SECRETAIRE: 'secretaire',
  RECTEUR: 'recteur',
  DOYEN: 'doyen',
  PROFESSEUR: 'professeur',
  ETUDIANT: 'etudiant',
  PERSONNEL: 'personnel',
  SUPER_ADMIN: 'super-admin',
  ADMIN: 'admin',
};

const R = ROLES;

// =============================================================================
// GROUPES DE ROLES
// =============================================================================
export const ROLE_GROUPS = {
  DIRECTION: [R.DIRECTEUR, R.DIRECTEUR_M, R.DIRECTEUR_P, R.DIRECTEUR_S],
  ENSEIGNANTS: [R.ENSEIGNANT, R.ENSEIGNEMENT, R.ENSEIGNEMENT_M, R.ENSEIGNEMENT_P],
  STAFF: [R.COMPTABLE, R.SURVEILLANT, R.CENSEUR, R.INFIRMIER, R.BIBLIOTHECAIRE, R.SECRETAIRE],
  UNIV: [R.RECTEUR, R.DOYEN, R.PROFESSEUR, R.ETUDIANT, R.PERSONNEL],
  ADMIN: [R.DIRECTEUR, R.ADMIN, R.SUPER_ADMIN],
  DIRECTION_ENSEIGNANTS: [R.DIRECTEUR, R.DIRECTEUR_M, R.DIRECTEUR_P, R.DIRECTEUR_S, R.ENSEIGNEMENT, R.ENSEIGNEMENT_M, R.ENSEIGNEMENT_P],
};

// =============================================================================
// REDIRECTIONS — les aliases qui pointent vers un path canonique
// =============================================================================
export const REDIRECTS = {
  // Maternelle
  '/dashboard-maternelle': '/maternelle/dashboard',
  '/ecole/maternelle': '/maternelle/dashboard',
  // Primaire
  '/dashboard-primaire': '/primaire/dashboard',
  '/ecole/primaire': '/primaire/dashboard',
  // Secondaire
  '/dashboard-secondaire': '/secondaire/dashboard',
  '/ecole/secondaire': '/secondaire/dashboard',
  // Enseignants
  '/dashboard-enseignant': '/enseignant/secondaire',
  '/dashboard-enseignementM': '/enseignant/maternelle',
  '/dashboard-enseignementP': '/enseignant/primaire',
  '/ecole/enseignant': '/enseignant/dashboard',
  '/ecole/enseignant/secondaire': '/enseignant/secondaire',
  '/ecole/enseignant/primaire': '/enseignant/primaire',
  '/ecole/enseignant/maternelle': '/enseignant/maternelle',
  // Élèves
  '/dashboard-eleve': '/eleve/dashboard',
  // Parents
  '/dashboard-parent': '/parent/dashboard',
  // Staff
  '/dashboard-comptable': '/comptable/dashboard',
  '/dashboard-surveillant': '/surveillant/dashboard',
  '/dashboard-censeur': '/censeur/dashboard',
  '/dashboard-infirmier': '/infirmier/dashboard',
  '/dashboard-bibliothecaire': '/bibliothecaire/dashboard',
  '/dashboard-secretaire': '/secretaire/dashboard',
  // Paiement
  '/payment-success': '/paiement/succes',
  // Fallback
  '*': '/dashboard',
};

// =============================================================================
// Lazy-load helpers — garde le code-splitting par route
// =============================================================================

// =============================================================================
// CONFIG DES ROUTES
// =============================================================================
export const ROUTE_CONFIG = {
  // ─── PUBLIQUES ───────────────────────────────────────────────────────────
  home:         { path: '/',                   component: () => import('../home/home'),                             roles: null },
  connexion:    { path: '/connexion',           component: () => import('../components/LoginForm'),                  roles: null },
  connexionE:   { path: '/connexionE',          component: () => import('../Ecoliers/Connexion').then(m => ({ default: m.Connexion })), roles: null },
  connexionU:   { path: '/connexionU',          component: () => import('../Universite/Auth/Connexion').then(m => ({ default: m.ConnexionU })), roles: null },
  inscription:  { path: '/inscription',         component: () => import('../Ecoliers/Inscription').then(m => ({ default: m.InscriptionE })), roles: null },
  dashboard:    { path: '/dashboard',           type: 'redirect',                                        roles: null },

  // ─── PAIEMENTS ───────────────────────────────────────────────────────────
  paiement:     { path: '/paiement',            component: () => import('../paiements/paiement'),                    roles: [R.ELEVE, R.PARENT, R.COMPTABLE, R.DIRECTEUR] },
  paiementOk:   { path: '/paiement/succes',     component: () => import('../paiements/paiementSucces'),               roles: [R.ELEVE, R.PARENT, R.COMPTABLE, R.DIRECTEUR] },

  // ─── DASHBOARDS ──────────────────────────────────────────────────────────
  directeur:    { path: '/directeur/dashboard',   component: () => import('../Directeurs/dash'),   roles: [R.DIRECTEUR] },
  adminDash:    { path: '/admin/dashboard',       component: () => import('../Directeurs/dash'),   roles: [R.DIRECTEUR, R.ADMIN] },
  maternelle:   { path: '/maternelle/dashboard',  component: () => import('../DirecteursM/dash'),  roles: [R.DIRECTEUR_M] },
  primaire:     { path: '/primaire/dashboard',    component: () => import('../DirecteursP/dash'),  roles: [R.DIRECTEUR_P] },
  secondaire:   { path: '/secondaire/dashboard',  component: () => import('../DirecteursS/dash'),  roles: [R.DIRECTEUR_S] },

  enseignant:   { path: '/enseignant/dashboard',       component: () => import('../Enseignants/DashboardEnseignant'),           roles: [R.ENSEIGNANT] },
  ensSecondaire:{ path: '/enseignant/secondaire',       component: () => import('../Enseignants_secondaire/DashboardEnseignantSecondaire'), roles: [R.ENSEIGNEMENT] },
  ensMaternelle:{ path: '/enseignant/maternelle',       component: () => import('../Enseignants_primaire/DashboardEnseignantPrimaire'),   roles: [R.ENSEIGNEMENT_M] },
  ensPrimaire:  { path: '/enseignant/primaire',         component: () => import('../Enseignants_primaire/DashboardEnseignantPrimaire'),   roles: [R.ENSEIGNEMENT_P] },

  eleve:        { path: '/eleve/dashboard',       component: () => import('../Eleves/DashboardEleve'),     roles: [R.ELEVE] },
  parent:       { path: '/parent/dashboard',      component: () => import('../Parents/dash'),              roles: [R.PARENT] },
  ecolier:      { path: '/ecolier/dashboard',     component: () => import('../Ecoliers/dash'),             roles: [R.ELEVE] },

  comptable:    { path: '/comptable/dashboard',      component: () => import('../Comptable/DashboardComptable'),        roles: [R.COMPTABLE] },
  surveillant:  { path: '/surveillant/dashboard',    component: () => import('../Surveillant/DashboardSurveillant'),    roles: [R.SURVEILLANT] },
  censeur:      { path: '/censeur/dashboard',        component: () => import('../Censeur/DashboardCenseur'),            roles: [R.CENSEUR] },
  infirmier:    { path: '/infirmier/dashboard',      component: () => import('../Infirmier/DashboardInfirmier'),        roles: [R.INFIRMIER] },
  biblio:       { path: '/bibliothecaire/dashboard', component: () => import('../Bibliothecaire/DashboardBibliothecaire'), roles: [R.BIBLIOTHECAIRE] },
  secretaire:   { path: '/secretaire/dashboard',     component: () => import('../Secretaire/DashboardSecretaire'),      roles: [R.SECRETAIRE] },

  // ─── ROUTES DIRECTION ÉLARGIE ────────────────────────────────────────────
  ecoleComptable:   { path: '/ecole/comptable',      component: () => import('../Comptable/DashboardComptable'),        roles: [R.COMPTABLE, R.DIRECTEUR] },
  ecoleSurveillant: { path: '/ecole/surveillant',    component: () => import('../Surveillant/DashboardSurveillant'),    roles: [R.SURVEILLANT, R.DIRECTEUR] },
  ecoleCenseur:     { path: '/ecole/censeur',        component: () => import('../Censeur/DashboardCenseur'),            roles: [R.CENSEUR, R.DIRECTEUR] },
  ecoleInfirmier:   { path: '/ecole/infirmier',      component: () => import('../Infirmier/DashboardInfirmier'),        roles: [R.INFIRMIER, R.DIRECTEUR] },
  ecoleBiblio:      { path: '/ecole/bibliothecaire', component: () => import('../Bibliothecaire/DashboardBibliothecaire'), roles: [R.BIBLIOTHECAIRE, R.DIRECTEUR] },
  ecoleSecretaire:  { path: '/ecole/secretaire',     component: () => import('../Secretaire/DashboardSecretaire'),      roles: [R.SECRETAIRE, R.DIRECTEUR] },

  // ─── GESTION SCOLAIRE ────────────────────────────────────────────────────
  matieres:     { path: '/matieres',     component: () => import('../Directeurs/Matieres'),          roles: ROLE_GROUPS.DIRECTION_ENSEIGNANTS },
  exercices:    { path: '/exercices',    component: () => import('../components/GestionExercices'),  roles: ROLE_GROUPS.DIRECTION_ENSEIGNANTS },
  cahierTexte:  { path: '/cahier-texte', component: () => import('../components/CahierTexte'),       roles: ROLE_GROUPS.DIRECTION_ENSEIGNANTS },

  // ─── ADMIN ───────────────────────────────────────────────────────────────
  adminEcoles:  { path: '/admin/ecoles',   component: () => import('../components/SuperAdminDashboard'), roles: [R.DIRECTEUR] },
  ecoleAdmin:   { path: '/ecole/admin',    component: () => import('../Directeurs/dash'),               roles: [R.DIRECTEUR, R.ADMIN] },

  // ─── UNIVERSITÉ ──────────────────────────────────────────────────────────
  universite: { path: '/universite/*', component: () => import('../Universite/UniversiteRoutes'), roles: [...ROLE_GROUPS.UNIV, R.DIRECTEUR, R.SUPER_ADMIN, R.ADMIN] },
};

// =============================================================================
// MAP DE REDIRECTION PAR RÔLE (pour RoleBasedRedirect)
// =============================================================================
export const ROLE_REDIRECT_MAP = {
  [R.DIRECTEUR]:        '/directeur/dashboard',
  [R.DIRECTEUR_M]:      '/maternelle/dashboard',
  [R.DIRECTEUR_P]:      '/primaire/dashboard',
  [R.DIRECTEUR_S]:      '/secondaire/dashboard',
  [R.ENSEIGNANT]:       '/enseignant/dashboard',
  [R.ENSEIGNEMENT]:     '/enseignant/secondaire',
  [R.ENSEIGNEMENT_M]:   '/enseignant/maternelle',
  [R.ENSEIGNEMENT_P]:   '/enseignant/primaire',
  [R.ELEVE]:            '/eleve/dashboard',
  [R.PARENT]:           '/parent/dashboard',
  [R.COMPTABLE]:        '/comptable/dashboard',
  [R.SURVEILLANT]:      '/surveillant/dashboard',
  [R.CENSEUR]:          '/censeur/dashboard',
  [R.INFIRMIER]:        '/infirmier/dashboard',
  [R.BIBLIOTHECAIRE]:   '/bibliothecaire/dashboard',
  [R.SECRETAIRE]:       '/secretaire/dashboard',
  [R.RECTEUR]:          '/universite/dashboard',
  [R.DOYEN]:            '/universite/dashboard',
  [R.PROFESSEUR]:       '/universite/dashboard',
  [R.ETUDIANT]:         '/universite/dashboard',
  [R.PERSONNEL]:        '/universite/dashboard',
  [R.SUPER_ADMIN]:      '/admin/ecoles',
  [R.ADMIN]:            '/admin/dashboard',
};
