/**
 * Breadcrumb — chaque lien du fil d'Ariane mène à une page qui existe.
 *
 * Le niveau « rôle » pointait vers `/parent`, `/directeur`, `/admin`… :
 * 13 adresses qui ne sont pas des routes et renvoyaient vers la page 404
 * (audit BUG-031).
 */

import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import Breadcrumb from '@/shared/components/ui/Breadcrumb';
import { ROUTE_CONFIG, PROTECTED_ROUTES } from '@/features/roles/route-config';
import { signIn } from './helpers/render';
import { ROLES, hasRole } from '@/shared/types/roles';

const ROUTES = new Set(Object.values(ROUTE_CONFIG).map((r) => r.path));

function liens(chemin) {
  const { unmount } = render(<MemoryRouter initialEntries={[chemin]}><Breadcrumb /></MemoryRouter>);
  const hrefs = screen.queryAllByRole('link').map((a) => a.getAttribute('href'));
  unmount();
  return hrefs;
}

describe('Breadcrumb', () => {
  it('ne contient aucun lien vers une adresse inexistante, sur toutes les pages', () => {
    signIn('directeur');
    const casses = [];
    for (const { path } of Object.values(PROTECTED_ROUTES)) {
      for (const href of liens(path)) if (!ROUTES.has(href)) casses.push(`${path} → ${href}`);
    }
    expect(casses).toEqual([]);
  });

  // Constaté sur le web le 17/11/2026 : l'étudiant voyait « Université »
  // pointer vers le tableau de bord universitaire, qui lui est fermé.
  it('ne propose jamais un lien vers une page que le rôle connecté ne peut pas ouvrir', () => {
    const roles = Object.fromEntries(Object.values(PROTECTED_ROUTES).map((r) => [r.path, r.roles]));
    const interdits = [];
    for (const role of Object.values(ROLES)) {
      signIn(role);
      for (const { path, roles: ouverts } of Object.values(PROTECTED_ROUTES)) {
        if (!hasRole(role, ouverts)) continue;
        for (const href of liens(path)) {
          if (roles[href] && !hasRole(role, roles[href])) interdits.push(`${role} : ${path} → ${href}`);
        }
      }
    }
    expect(interdits).toEqual([]);
  });

  it('laisse « Université » en texte pour l’étudiant', () => {
    signIn('etudiant');
    expect(liens('/universite/mes-cours')).not.toContain('/universite/dashboard');
  });

  it('fait pointer le groupe vers son tableau de bord', () => {
    signIn('parent');
    expect(liens('/parent/enfants')).toContain('/parent/dashboard');
  });
});
