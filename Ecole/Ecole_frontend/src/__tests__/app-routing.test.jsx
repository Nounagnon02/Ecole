/**
 * Routage applicatif — de l'URL au bon tableau de bord
 *
 * On monte le vrai App (routes, ProtectedRoute, AppShell) sur un routeur
 * mémoire et on observe l'URL sur laquelle l'utilisateur finit, en
 * fonction de ce que renvoie `/auth/me` au démarrage.
 */

import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { render, waitFor } from '@testing-library/react';
import { createMemoryRouter, RouterProvider } from 'react-router-dom';
import { QueryClientProvider } from '@tanstack/react-query';
import App from '@/App';
import useAuthStore from '@/shared/stores/auth-store';
import { ROLES } from '@/shared/types/roles';
import { clearDashboardCache } from '@/shared/lib/dashboard-cache';
import { installHttpMock } from './helpers/http-mock';
import { makeQueryClient, resetAuth } from './helpers/render';

let http;

/** Monte l'App et rend le routeur pour pouvoir lire l'URL courante. */
function renderApp(initialEntries) {
  const router = createMemoryRouter([{ path: '*', element: <App /> }], { initialEntries });
  render(
    <QueryClientProvider client={makeQueryClient()}>
      <RouterProvider router={router} />
    </QueryClientProvider>
  );
  return router;
}

const at = (router) => router.state.location.pathname;

/** Déclare une session valide côté serveur pour le rôle donné. */
function serverSession(role) {
  http.onGet('/auth/me').reply(200, { user: { id: 1, name: 'Test', email: 't@e.bj', role } });
}

beforeEach(() => {
  http = installHttpMock();
  // Les dashboards montés par le routeur appellent leur endpoint : on
  // répond vide pour que le test porte sur l'URL, pas sur le contenu.
  for (const url of [
    '/dashboard/directeur/data',
    '/dashboard/enseignant',
    '/dashboard/eleve',
    '/dashboard/parent',
    '/dashboard/admin',
    '/dashboard/universite',
    '/dashboard/comptable',
    '/dashboard/secretaire',
  ]) {
    http.onGet(url).reply(200, { data: {} });
  }
  http.onGet('/notifications').reply(200, { data: [] });
  clearDashboardCache();
  // `isLoading: true` reproduit un démarrage à froid : App affiche un
  // spinner jusqu'à ce que /auth/me réponde. Partir de `false` ferait
  // trancher AuthRedirect avant la réponse et enverrait tout le monde
  // sur /connexion — l'inverse de ce qu'on veut mesurer.
  resetAuth({ isLoading: true });
  vi.spyOn(console, 'error').mockImplementation(() => {});
  vi.spyOn(console, 'warn').mockImplementation(() => {});
});

afterEach(() => {
  http.restore();
  clearDashboardCache();
  vi.restoreAllMocks();
});

describe('visiteur non authentifié', () => {
  beforeEach(() => {
    http.onGet('/auth/me').reply(401, { message: 'Unauthenticated.' });
  });

  it('est envoyé de / vers /connexion', async () => {
    const router = renderApp(['/']);
    await waitFor(() => expect(at(router)).toBe('/connexion'));
  });

  it('ne peut pas atteindre un dashboard par l’URL', async () => {
    const router = renderApp(['/directeur/dashboard']);
    await waitFor(() => expect(at(router)).toBe('/connexion'));
  });

  it('ne peut pas atteindre les écrans d’administration', async () => {
    const router = renderApp(['/admin/ecoles']);
    await waitFor(() => expect(at(router)).toBe('/connexion'));
  });

  it('atterrit sur /404 pour une route inconnue', async () => {
    const router = renderApp(['/route-qui-nexiste-pas']);
    await waitFor(() => expect(at(router)).toBe('/404'));
  });
});

describe('session restaurée au démarrage', () => {
  it('recharge le profil depuis le cookie et pose l’utilisateur en session', async () => {
    serverSession(ROLES.SECRETAIRE);
    const router = renderApp(['/']);

    await waitFor(() => expect(at(router)).toBe('/secretaire/dashboard'));
    expect(useAuthStore.getState().user).toMatchObject({ role: ROLES.SECRETAIRE });
  });

  it.each([
    [ROLES.DIRECTEUR, '/directeur/dashboard'],
    [ROLES.ENSEIGNANT, '/enseignant/dashboard'],
    [ROLES.ELEVE, '/eleve/dashboard'],
    [ROLES.PARENT, '/parent/dashboard'],
    [ROLES.COMPTABLE, '/comptable/dashboard'],
    [ROLES.ADMIN, '/admin/dashboard'],
    [ROLES.SUPER_ADMIN, '/admin/dashboard'],
    [ROLES.ETUDIANT, '/universite/dashboard'],
  ])('depuis /, le rôle %s arrive sur %s', async (role, expected) => {
    serverSession(role);
    const router = renderApp(['/']);

    await waitFor(() => expect(at(router)).toBe(expected));
  });

  it.each([
    [ROLES.DIRECTEUR_M, '/directeur/dashboard'],
    [ROLES.DIRECTEUR_P, '/directeur/dashboard'],
    [ROLES.DIRECTEUR_S, '/directeur/dashboard'],
    [ROLES.ENSEIGNEMENT, '/enseignant/dashboard'],
    [ROLES.ENSEIGNEMENT_M, '/enseignant/dashboard'],
    [ROLES.ENSEIGNEMENT_P, '/enseignant/dashboard'],
  ])('depuis /, le sous-rôle %s arrive sur %s (et non /connexion)', async (role, expected) => {
    serverSession(role);
    const router = renderApp(['/']);

    await waitFor(() => expect(at(router)).toBe(expected));
  });

  it('un sous-rôle de direction accède directement à /directeur/dashboard par l’URL', async () => {
    serverSession(ROLES.DIRECTEUR_S);
    const router = renderApp(['/directeur/dashboard']);

    await waitFor(() => expect(useAuthStore.getState().isAuthenticated).toBe(true));
    expect(at(router)).toBe('/directeur/dashboard');
  });
});

describe('cloisonnement entre rôles', () => {
  it('un élève ne peut pas ouvrir le dashboard du directeur', async () => {
    serverSession(ROLES.ELEVE);
    const router = renderApp(['/directeur/dashboard']);

    await waitFor(() => expect(at(router)).toBe('/unauthorized'));
  });

  it('un directeur ne peut pas ouvrir les écoles du super-admin', async () => {
    serverSession(ROLES.DIRECTEUR);
    const router = renderApp(['/admin/ecoles']);

    await waitFor(() => expect(at(router)).toBe('/unauthorized'));
  });

  it('un comptable ne peut pas ouvrir les dossiers de l’infirmerie', async () => {
    serverSession(ROLES.COMPTABLE);
    const router = renderApp(['/infirmier/dossiers']);

    await waitFor(() => expect(at(router)).toBe('/unauthorized'));
  });

  it('un enseignant ne peut pas ouvrir la liste des enfants d’un parent', async () => {
    serverSession(ROLES.ENSEIGNANT);
    const router = renderApp(['/parent/enfants']);

    await waitFor(() => expect(at(router)).toBe('/unauthorized'));
  });

  it('un sous-rôle d’enseignement n’hérite pas des droits de la direction', async () => {
    serverSession(ROLES.ENSEIGNEMENT_P);
    const router = renderApp(['/directeur/dashboard']);

    await waitFor(() => expect(at(router)).toBe('/unauthorized'));
  });
});
