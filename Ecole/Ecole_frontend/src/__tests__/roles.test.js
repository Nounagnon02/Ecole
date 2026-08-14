/**
 * roles — SSOT des rôles, normalisation des sous-rôles, table de redirection
 *
 * Les sous-rôles (`directeurM/P/S`, `enseignement/M/P`) n'ont pas de
 * tableau de bord propre : le serveur cloisonne leurs données par cycle
 * et le client doit les faire atterrir sur le dashboard du rôle parent.
 * Si cette normalisation lâche, l'utilisateur s'authentifie correctement
 * puis se retrouve renvoyé sur l'écran de connexion.
 */

import { describe, it, expect } from 'vitest';
import {
  ROLES,
  ROLE_GROUPS,
  ROLE_LABELS,
  ROLE_ICONS,
  ROLE_NORMALIZATION,
  normalizeRole,
  hasRole,
  hasAnyRole,
} from '@/shared/types/roles';
import { ROLE_REDIRECT_MAP, ROUTE_CONFIG, PROTECTED_ROUTES, PUBLIC_ROUTES } from '@/features/roles/route-config';

const SUB_ROLES = Object.keys(ROLE_NORMALIZATION);

describe('ROLES', () => {
  it('déclare 23 rôles distincts, sans doublon de valeur', () => {
    const values = Object.values(ROLES);
    expect(new Set(values).size).toBe(values.length);
    expect(values).toHaveLength(23);
  });

  it('donne un libellé et une icône à chaque rôle', () => {
    for (const role of Object.values(ROLES)) {
      expect(ROLE_LABELS[role], `libellé manquant pour ${role}`).toBeTruthy();
      expect(ROLE_ICONS[role], `icône manquante pour ${role}`).toBeTruthy();
    }
  });

  it('ne place que des rôles connus dans les groupes', () => {
    const known = new Set(Object.values(ROLES));
    for (const [name, group] of Object.entries(ROLE_GROUPS)) {
      for (const role of group) {
        expect(known.has(role), `${name} référence un rôle inconnu : ${role}`).toBe(true);
      }
    }
  });
});

describe('normalizeRole()', () => {
  it('mappe les trois sous-rôles de direction vers directeur', () => {
    expect(normalizeRole(ROLES.DIRECTEUR_M)).toBe(ROLES.DIRECTEUR);
    expect(normalizeRole(ROLES.DIRECTEUR_P)).toBe(ROLES.DIRECTEUR);
    expect(normalizeRole(ROLES.DIRECTEUR_S)).toBe(ROLES.DIRECTEUR);
  });

  it('mappe les sous-rôles d’enseignement vers enseignant', () => {
    expect(normalizeRole(ROLES.ENSEIGNEMENT)).toBe(ROLES.ENSEIGNANT);
    expect(normalizeRole(ROLES.ENSEIGNEMENT_M)).toBe(ROLES.ENSEIGNANT);
    expect(normalizeRole(ROLES.ENSEIGNEMENT_P)).toBe(ROLES.ENSEIGNANT);
  });

  it('laisse intact un rôle qui n’est pas un sous-rôle', () => {
    expect(normalizeRole(ROLES.ELEVE)).toBe(ROLES.ELEVE);
    expect(normalizeRole(ROLES.SUPER_ADMIN)).toBe(ROLES.SUPER_ADMIN);
    expect(normalizeRole('role-inconnu')).toBe('role-inconnu');
  });

  it('tolère null et undefined sans jeter', () => {
    expect(normalizeRole(null)).toBeNull();
    expect(normalizeRole(undefined)).toBeUndefined();
  });

  it('ne se normalise pas en cascade (le parent reste le parent)', () => {
    for (const sub of SUB_ROLES) {
      const parent = normalizeRole(sub);
      expect(normalizeRole(parent)).toBe(parent);
    }
  });
});

describe('hasRole() / hasAnyRole()', () => {
  it('refuse un rôle absent ou vide', () => {
    expect(hasRole(null, [ROLES.DIRECTEUR])).toBe(false);
    expect(hasRole(undefined, [ROLES.DIRECTEUR])).toBe(false);
    expect(hasRole('', [ROLES.DIRECTEUR])).toBe(false);
    expect(hasAnyRole(null, ROLE_GROUPS.DIRECTION)).toBe(false);
  });

  it('accepte la correspondance exacte', () => {
    expect(hasRole(ROLES.DIRECTEUR, [ROLES.DIRECTEUR, ROLES.ADMIN])).toBe(true);
    expect(hasRole(ROLES.ELEVE, [ROLES.DIRECTEUR, ROLES.ADMIN])).toBe(false);
  });

  it('accepte un sous-rôle là où le rôle parent est autorisé', () => {
    expect(hasRole(ROLES.DIRECTEUR_P, [ROLES.DIRECTEUR])).toBe(true);
    expect(hasRole(ROLES.ENSEIGNEMENT_M, [ROLES.ENSEIGNANT])).toBe(true);
  });

  it('n’élargit pas les droits au-delà du parent', () => {
    // directeurP normalise vers directeur, pas vers admin ni super-admin.
    expect(hasRole(ROLES.DIRECTEUR_P, [ROLES.SUPER_ADMIN])).toBe(false);
    expect(hasRole(ROLES.ENSEIGNEMENT_P, [ROLES.DIRECTEUR])).toBe(false);
    expect(hasAnyRole(ROLES.DIRECTEUR_P, [ROLES.ELEVE], [ROLES.PARENT])).toBe(false);
  });

  it('cherche dans plusieurs ensembles avec hasAnyRole', () => {
    expect(hasAnyRole(ROLES.COMPTABLE, ROLE_GROUPS.DIRECTION, ROLE_GROUPS.STAFF)).toBe(true);
    expect(hasAnyRole(ROLES.ETUDIANT, ROLE_GROUPS.DIRECTION, ROLE_GROUPS.STAFF)).toBe(false);
  });
});

describe('ROLE_REDIRECT_MAP', () => {
  it('donne une destination à chaque rôle applicatif', () => {
    // Le seul rôle sans dashboard dédié est le sous-rôle : il doit
    // hériter de celui de son parent, pas retomber sur /connexion.
    for (const role of Object.values(ROLES)) {
      expect(ROLE_REDIRECT_MAP[role], `aucune redirection pour le rôle ${role}`).toBeTruthy();
    }
  });

  it('fait atterrir les sous-rôles de direction sur le dashboard directeur', () => {
    expect(ROLE_REDIRECT_MAP[ROLES.DIRECTEUR_M]).toBe(ROLE_REDIRECT_MAP[ROLES.DIRECTEUR]);
    expect(ROLE_REDIRECT_MAP[ROLES.DIRECTEUR_P]).toBe(ROLE_REDIRECT_MAP[ROLES.DIRECTEUR]);
    expect(ROLE_REDIRECT_MAP[ROLES.DIRECTEUR_S]).toBe(ROLE_REDIRECT_MAP[ROLES.DIRECTEUR]);
    expect(ROLE_REDIRECT_MAP[ROLES.DIRECTEUR]).toBe('/directeur/dashboard');
  });

  it('fait atterrir les sous-rôles d’enseignement sur le dashboard enseignant', () => {
    for (const sub of [ROLES.ENSEIGNEMENT, ROLES.ENSEIGNEMENT_M, ROLES.ENSEIGNEMENT_P]) {
      expect(ROLE_REDIRECT_MAP[sub]).toBe('/enseignant/dashboard');
    }
  });

  it('n’envoie personne vers un chemin qui n’existe pas dans ROUTE_CONFIG', () => {
    const known = new Set(Object.values(ROUTE_CONFIG).map((c) => c.path));
    for (const [role, path] of Object.entries(ROLE_REDIRECT_MAP)) {
      expect(known.has(path), `${role} pointe vers ${path}, absent de ROUTE_CONFIG`).toBe(true);
    }
  });

  it('envoie les rôles universitaires sur le dashboard université', () => {
    for (const role of ROLE_GROUPS.UNIV) {
      expect(ROLE_REDIRECT_MAP[role]).toBe('/universite/dashboard');
    }
  });
});

describe('ROUTE_CONFIG', () => {
  it('sépare routes publiques et protégées sans recouvrement', () => {
    const pub = Object.keys(PUBLIC_ROUTES);
    const priv = Object.keys(PROTECTED_ROUTES);
    expect(pub.length + priv.length).toBe(Object.keys(ROUTE_CONFIG).length);
    expect(pub.filter((k) => priv.includes(k))).toEqual([]);
  });

  it('laisse /connexion et / publiques', () => {
    expect(ROUTE_CONFIG.connexion.roles).toBeNull();
    expect(ROUTE_CONFIG.home.roles).toBeNull();
  });

  it('protège tout dashboard par au moins un rôle', () => {
    const dashboards = Object.entries(ROUTE_CONFIG).filter(([, c]) => c.path.endsWith('/dashboard'));
    expect(dashboards.length).toBeGreaterThan(0);
    for (const [key, cfg] of dashboards) {
      expect(Array.isArray(cfg.roles), `${key} n'est pas protégé`).toBe(true);
      expect(cfg.roles.length).toBeGreaterThan(0);
    }
  });

  it('ne réserve les routes /admin/* qu’aux rôles d’administration', () => {
    const allowed = new Set([ROLES.SUPER_ADMIN, ROLES.ADMIN, ROLES.DIRECTEUR]);
    for (const [key, cfg] of Object.entries(ROUTE_CONFIG)) {
      if (!cfg.path.startsWith('/admin/')) continue;
      for (const role of cfg.roles ?? []) {
        expect(allowed.has(role), `${key} ouvre /admin/* au rôle ${role}`).toBe(true);
      }
    }
  });

  it('n’expose pas les routes élève aux rôles du personnel', () => {
    expect(ROUTE_CONFIG.eleveCours.roles).not.toContain(ROLES.COMPTABLE);
    expect(ROUTE_CONFIG.parentEnfants.roles).toEqual([ROLES.PARENT]);
  });

  it('déclare des chemins uniques', () => {
    const paths = Object.values(ROUTE_CONFIG).map((c) => c.path);
    const dupes = paths.filter((p, i) => paths.indexOf(p) !== i);
    expect(dupes).toEqual([]);
  });
});
