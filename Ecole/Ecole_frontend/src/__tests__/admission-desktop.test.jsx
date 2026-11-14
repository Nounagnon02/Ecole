/*
 * Admission dans l'application de bureau (périmètre du 14/11/2026).
 *
 * Le desktop est réservé à l'administration : un parent, un enseignant, un
 * élève ou un étudiant y voit un écran explicite et peut se déconnecter. Ce
 * n'est pas une protection : l'API vérifie les droits de chaque requête, et
 * le même compte garde exactement les mêmes droits sur le web. Dans un
 * navigateur, rien ne change.
 */
import { describe, it, expect, afterEach } from 'vitest';
import { screen, fireEvent, waitFor } from '@testing-library/react';
import ProtectedRoute from '@/shared/components/auth/ProtectedRoute';
import { ROLES_DESKTOP, estDesktop } from '@/shared/lib/plateforme';
import { installHttpMock } from './helpers/http-mock';
import { renderRoute, signIn } from './helpers/render';

const page = <ProtectedRoute><p>CONTENU-PROTEGE</p></ProtectedRoute>;

describe('admission desktop', () => {
  afterEach(() => { delete window.electronAPI; });

  it('n’est active que dans l’application de bureau', () => {
    expect(estDesktop()).toBe(false);
    window.electronAPI = { isElectron: true };
    expect(estDesktop()).toBe(true);
  });

  it.each(['parent', 'enseignant', 'enseignementP', 'professeur', 'eleve', 'etudiant'])(
    'refuse un compte « %s » dans le desktop, avec une déconnexion possible',
    async (role) => {
      window.electronAPI = { isElectron: true };
      const http = installHttpMock();
      http.onPost('/auth/logout').reply(200, {});
      signIn(role);
      renderRoute(page);

      expect(await screen.findByRole('heading', { name: /réservée à l’administration/i })).toBeInTheDocument();
      expect(screen.queryByText('CONTENU-PROTEGE')).not.toBeInTheDocument();
      fireEvent.click(screen.getByRole('button', { name: /se déconnecter/i }));
      await waitFor(() => expect(http.callsTo('post', '/auth/logout').length).toBe(1));
    },
  );

  it.each(['directeur', 'directeurM', 'secretaire', 'comptable', 'bibliothecaire', 'admin', 'super-admin', 'recteur'])(
    'admet un compte « %s » dans le desktop',
    async (role) => {
      window.electronAPI = { isElectron: true };
      signIn(role);
      renderRoute(page);
      expect(await screen.findByText('CONTENU-PROTEGE')).toBeInTheDocument();
    },
  );

  it('ne change rien dans un navigateur', async () => {
    signIn('parent');
    renderRoute(page);
    expect(await screen.findByText('CONTENU-PROTEGE')).toBeInTheDocument();
  });

  it('liste exactement les profils administratifs décidés', () => {
    expect([...ROLES_DESKTOP].sort()).toEqual([
      'admin', 'bibliothecaire', 'censeur', 'comptable', 'directeur', 'directeurM', 'directeurP', 'directeurS',
      'doyen', 'infirmier', 'personnel', 'recteur', 'secretaire', 'super-admin', 'surveillant',
    ]);
  });
});
