/**
 * Droits des pages — alignés sur ce que l'API sert (audit BUG-006).
 *
 * L'audit a trouvé 44 couples (rôle, page) que le menu ouvrait et que l'API
 * refusait. Ce test fige les cas corrigés : rouvrir une page à un rôle que
 * l'API refuse doit le faire échouer.
 */

import { describe, it, expect } from 'vitest';
import { ROUTE_CONFIG } from '@/features/roles/route-config';
import { hasRole } from '@/shared/types/roles';

const peut = (cle, role) => hasRole(role, ROUTE_CONFIG[cle].roles);

describe('droits des pages', () => {
  it.each([
    ['eleves', ['parent', 'infirmier', 'bibliothecaire', 'eleve']],
    ['notes', ['comptable', 'infirmier', 'bibliothecaire', 'secretaire', 'surveillant', 'admin', 'recteur', 'etudiant']],
    ['paiements', ['parent', 'eleve', 'secretaire']],
    ['emploiDuTemps', ['comptable', 'infirmier', 'bibliothecaire', 'admin', 'recteur', 'etudiant']],
    ['adminUtilisateurs', ['admin']],
    ['universiteEnseignants', ['professeur']],
    ['universiteNotes', ['etudiant']],
    ['eleveCours', ['etudiant']],
  ])('%s est fermée aux rôles que l’API refuse', (cle, roles) => {
    expect(roles.filter((role) => peut(cle, role))).toEqual([]);
  });

  it.each([
    ['eleves', ['directeur', 'directeurP', 'enseignant', 'secretaire', 'comptable', 'surveillant', 'censeur']],
    ['notes', ['directeur', 'enseignant', 'censeur', 'eleve', 'parent']],
    ['paiements', ['directeur', 'comptable']],
    ['emploiDuTemps', ['directeur', 'enseignant', 'censeur', 'surveillant', 'secretaire', 'eleve', 'parent']],
  ])('%s reste ouverte aux rôles dont c’est le travail', (cle, roles) => {
    expect(roles.filter((role) => !peut(cle, role))).toEqual([]);
  });
});
