/**
 * ProtectedRoute — Garde d'accès
 *
 * C'est le seul rempart côté client entre une URL tapée à la main et
 * un écran qui n'appartient pas à l'utilisateur. Trois comportements
 * doivent tenir : non authentifié → connexion, mauvais rôle → refus,
 * bon rôle (y compris sous-rôle) → passage.
 */

import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { screen, waitFor } from '@testing-library/react';
import ProtectedRoute from '@/shared/components/auth/ProtectedRoute';
import useAuthStore from '@/shared/stores/auth-store';
import { ROLES } from '@/shared/types/roles';
import { PROTECTED_ROUTES } from '@/features/roles/route-config';
import { installHttpMock } from './helpers/http-mock';
import { renderRoute, resetAuth, signIn } from './helpers/render';

const Dashboard = () => <div>CONTENU-PROTEGE</div>;

let http;

beforeEach(() => {
  http = installHttpMock();
  http.onGet('/auth/me').reply(200, { user: { id: 1, name: 'Test', role: ROLES.DIRECTEUR } });
  resetAuth();
});

afterEach(() => {
  http.restore();
  vi.restoreAllMocks();
});

function renderGuard(allowedRoles, { role } = {}) {
  return renderRoute(
    <ProtectedRoute allowedRoles={allowedRoles}>
      <Dashboard />
    </ProtectedRoute>,
    { path: '/directeur/dashboard', extraRoutes: [{ path: '/x', label: 'X' }] }
  );
}

describe('utilisateur non authentifié', () => {
  it('est renvoyé sur l’écran de connexion', async () => {
    renderGuard([ROLES.DIRECTEUR]);

    await waitFor(() => expect(screen.getByText('ECRAN-CONNEXION')).toBeInTheDocument());
    expect(screen.queryByText('CONTENU-PROTEGE')).not.toBeInTheDocument();
  });

  it('n’affiche jamais le contenu, même une fraction de rendu', () => {
    const { container } = renderGuard([ROLES.DIRECTEUR]);
    expect(container.textContent).not.toContain('CONTENU-PROTEGE');
  });
});

describe('session en cours de vérification', () => {
  it('affiche un état de chargement plutôt que de rediriger trop tôt', () => {
    // Rediriger pendant isLoading enverrait tout rechargement de page
    // vers /connexion avant même que /auth/me ait répondu.
    resetAuth({ isLoading: true });
    renderGuard([ROLES.DIRECTEUR]);

    expect(screen.queryByText('ECRAN-CONNEXION')).not.toBeInTheDocument();
    expect(screen.queryByText('CONTENU-PROTEGE')).not.toBeInTheDocument();
    expect(screen.getByText(/Vérification des permissions/i)).toBeInTheDocument();
  });
});

describe('utilisateur authentifié', () => {
  it('laisse passer le rôle autorisé', async () => {
    signIn(ROLES.DIRECTEUR);
    renderGuard([ROLES.DIRECTEUR]);

    await waitFor(() => expect(screen.getByText('CONTENU-PROTEGE')).toBeInTheDocument());
  });

  it('refuse un rôle non autorisé et l’envoie sur /unauthorized', async () => {
    signIn(ROLES.ELEVE);
    renderGuard([ROLES.DIRECTEUR]);

    await waitFor(() => expect(screen.getByText('ECRAN-NON-AUTORISE')).toBeInTheDocument());
    expect(screen.queryByText('CONTENU-PROTEGE')).not.toBeInTheDocument();
  });

  it('refuse un élève sur un dashboard comptable', async () => {
    signIn(ROLES.ELEVE);
    renderGuard(PROTECTED_ROUTES.comptable.roles);

    await waitFor(() => expect(screen.getByText('ECRAN-NON-AUTORISE')).toBeInTheDocument());
  });

  it('refuse un directeur sur les routes réservées au super-admin', async () => {
    signIn(ROLES.DIRECTEUR);
    renderGuard(PROTECTED_ROUTES.adminEcoles.roles);

    await waitFor(() => expect(screen.getByText('ECRAN-NON-AUTORISE')).toBeInTheDocument());
  });

  it('accepte la forme `role` (chaîne) autant que `allowedRoles`', async () => {
    signIn(ROLES.PARENT);
    renderRoute(
      <ProtectedRoute role={ROLES.PARENT}>
        <Dashboard />
      </ProtectedRoute>,
      { path: '/parent/dashboard' }
    );

    await waitFor(() => expect(screen.getByText('CONTENU-PROTEGE')).toBeInTheDocument());
  });

  it('laisse passer sans restriction quand aucun rôle n’est exigé', async () => {
    signIn('role-exotique');
    renderRoute(
      <ProtectedRoute>
        <Dashboard />
      </ProtectedRoute>,
      { path: '/parametres' }
    );

    await waitFor(() => expect(screen.getByText('CONTENU-PROTEGE')).toBeInTheDocument());
  });
});

describe('sous-rôles — le point sensible', () => {
  it.each([ROLES.DIRECTEUR_M, ROLES.DIRECTEUR_P, ROLES.DIRECTEUR_S])(
    '%s atteint le dashboard directeur',
    async (role) => {
      signIn(role);
      renderGuard(PROTECTED_ROUTES.directeur.roles);

      await waitFor(() => expect(screen.getByText('CONTENU-PROTEGE')).toBeInTheDocument());
      expect(screen.queryByText('ECRAN-NON-AUTORISE')).not.toBeInTheDocument();
    }
  );

  it.each([ROLES.ENSEIGNEMENT, ROLES.ENSEIGNEMENT_M, ROLES.ENSEIGNEMENT_P])(
    '%s atteint le dashboard enseignant',
    async (role) => {
      signIn(role);
      renderGuard(PROTECTED_ROUTES.enseignant.roles);

      await waitFor(() => expect(screen.getByText('CONTENU-PROTEGE')).toBeInTheDocument());
    }
  );

  it('un sous-rôle de direction n’atteint pas pour autant les écrans super-admin', async () => {
    signIn(ROLES.DIRECTEUR_S);
    renderGuard(PROTECTED_ROUTES.adminEcoles.roles);

    await waitFor(() => expect(screen.getByText('ECRAN-NON-AUTORISE')).toBeInTheDocument());
  });

  it('un sous-rôle d’enseignement n’atteint pas le dashboard directeur', async () => {
    signIn(ROLES.ENSEIGNEMENT_P);
    renderGuard(PROTECTED_ROUTES.directeur.roles);

    await waitFor(() => expect(screen.getByText('ECRAN-NON-AUTORISE')).toBeInTheDocument());
  });
});

describe('revalidation silencieuse de la session', () => {
  it('interroge /auth/me quand la dernière vérification est ancienne', async () => {
    signIn(ROLES.DIRECTEUR);
    useAuthStore.setState({ sessionLastVerified: Date.now() - 10 * 60 * 1000 });

    renderGuard([ROLES.DIRECTEUR]);

    await waitFor(() => expect(http.callsTo('get', '/auth/me').length).toBeGreaterThan(0));
    expect(screen.getByText('CONTENU-PROTEGE')).toBeInTheDocument();
  });

  it('ne réinterroge pas /auth/me quand la session vient d’être vérifiée', async () => {
    signIn(ROLES.DIRECTEUR);

    renderGuard([ROLES.DIRECTEUR]);

    await waitFor(() => expect(screen.getByText('CONTENU-PROTEGE')).toBeInTheDocument());
    expect(http.callsTo('get', '/auth/me')).toHaveLength(0);
  });

  it('déconnecte et redirige quand la revalidation renvoie 401', async () => {
    signIn(ROLES.DIRECTEUR);
    useAuthStore.setState({ sessionLastVerified: Date.now() - 10 * 60 * 1000 });
    http.onGet('/auth/me').reply(401, { message: 'Unauthenticated.' });

    renderGuard([ROLES.DIRECTEUR]);

    await waitFor(() => expect(screen.getByText('ECRAN-CONNEXION')).toBeInTheDocument());
    expect(useAuthStore.getState().isAuthenticated).toBe(false);
  });
});
