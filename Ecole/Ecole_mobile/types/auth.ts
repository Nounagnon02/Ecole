/**
 * Types d'authentification — Érudit v4
 */

export interface LoginCredentials {
  email: string;
  password: string;
  role?: string;
}

export interface EleveCredentials {
  identifiant: string;
  password: string;
}

export interface Utilisateur {
  id: number;
  identifiant: string;
  nom: string;
  prenom: string;
  email: string;
  telephone?: string;
  role: string;
  ecole_id?: number;
  ecole?: { id: number; nom: string };
  actif?: boolean;
}

export interface ReponseAuth {
  token: string | null;
  role: string;
  user?: Utilisateur;
  redirect_to?: string;
  message?: string;
}

export interface ReponseErreur {
  message: string;
  errors?: Record<string, string[]>;
}

export type RoleUtilisateur =
  | 'directeur'
  | 'enseignant'
  | 'eleve'
  | 'parent'
  | 'comptable'
  | 'surveillant'
  | 'censeur'
  | 'infirmier'
  | 'bibliothecaire'
  | 'secretaire'
  | 'universite'
  | 'admin';

export const ROLE_LABELS: Record<RoleUtilisateur, string> = {
  directeur: 'Directeur',
  enseignant: 'Enseignant',
  eleve: 'Élève',
  parent: 'Parent',
  comptable: 'Comptable',
  surveillant: 'Surveillant',
  censeur: 'Censeur',
  infirmier: 'Infirmier',
  bibliothecaire: 'Bibliothécaire',
  secretaire: 'Secrétaire',
  universite: 'Université',
  admin: 'Administrateur',
};

export const ROLE_COLORS: Record<RoleUtilisateur, string> = {
  directeur: '#1A3A3C',
  enseignant: '#5A7A63',
  eleve: '#5A7AAD',
  parent: '#B8562E',
  comptable: '#C4943A',
  surveillant: '#BA4A4A',
  censeur: '#8A5A7A',
  infirmier: '#5A8A8A',
  bibliothecaire: '#7A8A5A',
  secretaire: '#8A7A5A',
  universite: '#1A3A3C',
  admin: '#1A3A3C',
};