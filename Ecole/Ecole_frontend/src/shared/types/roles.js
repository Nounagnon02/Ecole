/**
 * @fileoverview Constantes et helpers partagés pour les rôles utilisateur.
 *
 * Source unique de vérité (SSOT) pour toute la logique
 * liée aux rôles dans l'application.
 *
 * @module shared/types/roles
 */

/**
 * Énumération des rôles utilisateur.
 *
 * Chaque clé est un identifiant constant (PascalCase) et chaque valeur
 * est la chaîne stockée en base de données / API pour ce rôle.
 *
 * @readonly
 * @enum {string}
 */
export const ROLES = Object.freeze({
  /** Direction générale de l'établissement */
  DIRECTEUR: 'directeur',
  /** Direction de la maternelle */
  DIRECTEUR_M: 'directeurM',
  /** Direction du primaire */
  DIRECTEUR_P: 'directeurP',
  /** Direction du secondaire */
  DIRECTEUR_S: 'directeurS',
  /** Enseignant toutes filières confondues */
  ENSEIGNANT: 'enseignant',
  /** Enseignement secondaire général */
  ENSEIGNEMENT: 'enseignement',
  /** Enseignement en maternelle */
  ENSEIGNEMENT_M: 'enseignementM',
  /** Enseignement en primaire */
  ENSEIGNEMENT_P: 'enseignementP',
  /** Élève du préscolaire, primaire ou secondaire */
  ELEVE: 'eleve',
  /** Parent ou tuteur légal d'un ou plusieurs élèves */
  PARENT: 'parent',
  /** Gestionnaire des finances et transactions */
  COMPTABLE: 'comptable',
  /** Agent de surveillance et de sécurité */
  SURVEILLANT: 'surveillant',
  /** Chargé de la discipline et des absences */
  CENSEUR: 'censeur',
  /** Infirmier(e) scolaire */
  INFIRMIER: 'infirmier',
  /** Gestionnaire de la bibliothèque */
  BIBLIOTHECAIRE: 'bibliothecaire',
  /** Agent administratif (inscriptions, planning, documents) */
  SECRETAIRE: 'secretaire',
  /** Recteur d'université */
  RECTEUR: 'recteur',
  /** Doyen de faculté universitaire */
  DOYEN: 'doyen',
  /** Professeur d'université */
  PROFESSEUR: 'professeur',
  /** Étudiant universitaire */
  ETUDIANT: 'etudiant',
  /** Personnel administratif universitaire */
  PERSONNEL: 'personnel',
  /** Super-administrateur technique (accès à toutes les écoles) */
  SUPER_ADMIN: 'super-admin',
  /** Administrateur d'établissement */
  ADMIN: 'admin',
});

const R = ROLES;

/**
 * Regroupements logiques de rôles.
 *
 * Utilisés pour assigner rapidement des permissions à une catégorie
 * entière (ex: `ROLE_GROUPS.DIRECTION` pour tous les directeurs).
 *
 * @readonly
 * @type {Object<string, string[]>}
 */
export const ROLE_GROUPS = Object.freeze({
  /** Directeur général, maternelle, primaire, secondaire */
  DIRECTION: Object.freeze([R.DIRECTEUR, R.DIRECTEUR_M, R.DIRECTEUR_P, R.DIRECTEUR_S]),
  /** Enseignant, enseignement secondaire, maternelle, primaire */
  ENSEIGNANTS: Object.freeze([R.ENSEIGNANT, R.ENSEIGNEMENT, R.ENSEIGNEMENT_M, R.ENSEIGNEMENT_P]),
  /** Comptable, surveillant, censeur, infirmier, bibliothécaire, secrétaire */
  STAFF: Object.freeze([R.COMPTABLE, R.SURVEILLANT, R.CENSEUR, R.INFIRMIER, R.BIBLIOTHECAIRE, R.SECRETAIRE]),
  /** Recteur, doyen, professeur, étudiant, personnel universitaire */
  UNIV: Object.freeze([R.RECTEUR, R.DOYEN, R.PROFESSEUR, R.ETUDIANT, R.PERSONNEL]),
  /** Direction + administration technique */
  ADMIN: Object.freeze([R.DIRECTEUR, R.ADMIN, R.SUPER_ADMIN]),
  /** Direction et enseignants combinés (pour features partagées) */
  DIRECTION_ENSEIGNANTS: Object.freeze([
    R.DIRECTEUR, R.DIRECTEUR_M, R.DIRECTEUR_P, R.DIRECTEUR_S,
    R.ENSEIGNANT, R.ENSEIGNEMENT, R.ENSEIGNEMENT_M, R.ENSEIGNEMENT_P,
  ]),
});

/**
 * Vérifie si un rôle utilisateur est présent dans une liste de rôles autorisés.
 *
 * @param {string|null|undefined} userRole - Le rôle de l'utilisateur (ex: `'directeur'`)
 * @param {string[]} allowedRoles - Liste des rôles autorisés
 * @returns {boolean} `true` si le rôle est autorisé
 *
 * @example
 * hasRole(user.role, [ROLES.DIRECTEUR, ROLES.ADMIN])
 * // => true si l'utilisateur est directeur ou admin
 */
export function hasRole(userRole, allowedRoles) {
  if (!userRole) return false;
  return allowedRoles.includes(userRole);
}

/**
 * Vérifie si un rôle utilisateur appartient à au moins un des ensembles
 * de rôles fournis.
 *
 * @param {string|null|undefined} userRole - Le rôle de l'utilisateur
 * @param {...string[]} roleSets - Un ou plusieurs tableaux de rôles (ex: `ROLE_GROUPS.DIRECTION`)
 * @returns {boolean} `true` si le rôle est présent dans au moins un ensemble
 *
 * @example
 * hasAnyRole(user.role, ROLE_GROUPS.DIRECTION, ROLE_GROUPS.ADMIN)
 * // => true si l'utilisateur fait partie de la direction OU des admins
 */
export function hasAnyRole(userRole, ...roleSets) {
  if (!userRole) return false;
  return roleSets.some((set) => set.includes(userRole));
}

/**
 * Normalisation des sous-rôles vers leur parent.
 *
 * Les sous-rôles (DIRECTEUR_M/P/S, ENSEIGNEMENT/M/P) n'ont pas de
 * dashboard ou de menu distinct — cette map permet d'afficher le menu
 * du rôle parent pour tout utilisateur ayant un sous-rôle.
 *
 * @readonly
 * @type {Object<string, string>}
 */
export const ROLE_NORMALIZATION = Object.freeze({
  [R.DIRECTEUR_M]: R.DIRECTEUR,
  [R.DIRECTEUR_P]: R.DIRECTEUR,
  [R.DIRECTEUR_S]: R.DIRECTEUR,
  [R.ENSEIGNEMENT]: R.ENSEIGNANT,
  [R.ENSEIGNEMENT_M]: R.ENSEIGNANT,
  [R.ENSEIGNEMENT_P]: R.ENSEIGNANT,
});

/**
 * Libellés d'affichage pour chaque rôle (français).
 *
 * À utiliser dans l'interface utilisateur (header, sidebar,
 * badges de profil) pour afficher le rôle en toutes lettres
 * plutôt que sa valeur technique.
 *
 * @readonly
 * @type {Object<string, string>}
 *
 * @example
 * ROLE_LABELS['directeurM']
 * // => 'Directeur Maternelle'
 */
export const ROLE_LABELS = Object.freeze({
  [R.DIRECTEUR]: 'Directeur',
  [R.DIRECTEUR_M]: 'Directeur Maternelle',
  [R.DIRECTEUR_P]: 'Directeur Primaire',
  [R.DIRECTEUR_S]: 'Directeur Secondaire',
  [R.ENSEIGNANT]: 'Enseignant',
  [R.ENSEIGNEMENT]: 'Enseignement Secondaire',
  [R.ENSEIGNEMENT_M]: 'Enseignement Maternelle',
  [R.ENSEIGNEMENT_P]: 'Enseignement Primaire',
  [R.ELEVE]: 'Élève',
  [R.PARENT]: 'Parent',
  [R.COMPTABLE]: 'Comptable',
  [R.SURVEILLANT]: 'Surveillant',
  [R.CENSEUR]: 'Censeur',
  [R.INFIRMIER]: 'Infirmier',
  [R.BIBLIOTHECAIRE]: 'Bibliothécaire',
  [R.SECRETAIRE]: 'Secrétaire',
  [R.RECTEUR]: 'Recteur',
  [R.DOYEN]: 'Doyen',
  [R.PROFESSEUR]: 'Professeur',
  [R.ETUDIANT]: 'Étudiant',
  [R.PERSONNEL]: 'Personnel',
  [R.SUPER_ADMIN]: 'Super Admin',
  [R.ADMIN]: 'Admin',
});

/* ─── Note: ROLE_REDIRECT_MAP est défini dans features/roles/route-config.js (SSOT) ── */

/**
 * Icônes Lucide associées à chaque rôle.
 *
 * Utilisées pour afficher une icône représentative du rôle
 * dans les menus, profils et tableaux de bord.
 *
 * @readonly
 * @type {Object<string, string>}
 *
 * @example
 * ROLE_ICONS['directeur']
 * // => 'GraduationCap'
 */
export const ROLE_ICONS = Object.freeze({
  [R.DIRECTEUR]: 'GraduationCap',
  [R.DIRECTEUR_M]: 'Heart',
  [R.DIRECTEUR_P]: 'BookOpen',
  [R.DIRECTEUR_S]: 'BookMarked',
  [R.ENSEIGNANT]: 'ChalkboardTeacher',
  [R.ENSEIGNEMENT]: 'Chalkboard',
  [R.ENSEIGNEMENT_M]: 'Smile',
  [R.ENSEIGNEMENT_P]: 'Book',
  [R.ELEVE]: 'User',
  [R.PARENT]: 'Users',
  [R.COMPTABLE]: 'Calculator',
  [R.SURVEILLANT]: 'Shield',
  [R.CENSEUR]: 'ClipboardCheck',
  [R.INFIRMIER]: 'Stethoscope',
  [R.BIBLIOTHECAIRE]: 'Library',
  [R.SECRETAIRE]: 'FileText',
  [R.RECTEUR]: 'University',
  [R.DOYEN]: 'Scroll',
  [R.PROFESSEUR]: 'Presentation',
  [R.ETUDIANT]: 'Backpack',
  [R.PERSONNEL]: 'IdCard',
  [R.SUPER_ADMIN]: 'ShieldCheck',
  [R.ADMIN]: 'Settings',
});
