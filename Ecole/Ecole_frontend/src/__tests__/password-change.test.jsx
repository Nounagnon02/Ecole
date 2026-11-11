/**
 * Mot de passe provisoire : il doit être remplacé à la première connexion.
 *
 * L'API ferme tout le reste tant que ce n'est pas fait. Sans écran dédié, la
 * personne arriverait sur un tableau de bord où chaque appel répond 403.
 */

import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { render, screen, waitFor, fireEvent } from '@testing-library/react';
import { MemoryRouter, Routes, Route, useLocation } from 'react-router-dom';
import ProtectedRoute, { PASSWORD_CHANGE_PATH, TWO_FACTOR_SETUP_PATH } from '@/shared/components/auth/ProtectedRoute';
import PasswordChangePage from '@/app/features/auth/PasswordChangePage';
import useAuthStore from '@/shared/stores/auth-store';
import { api } from '@/shared/lib/api-client';
import { installHttpMock } from './helpers/http-mock';
import { signIn } from './helpers/render';

let http;
const ACCUEIL = '/parent/dashboard';

function Sonde() { return <div data-testid="url">{useLocation().pathname}</div>; }
const url = () => screen.getByTestId('url').textContent;

function monter(chemin = ACCUEIL) {
  return render(
    <MemoryRouter initialEntries={[chemin]}>
      <Sonde />
      <Routes>
        <Route path={PASSWORD_CHANGE_PATH} element={<ProtectedRoute><PasswordChangePage /></ProtectedRoute>} />
        <Route path={TWO_FACTOR_SETUP_PATH} element={<div>ACTIVATION-2FA</div>} />
        <Route path={ACCUEIL} element={<ProtectedRoute><div>TABLEAU-DE-BORD</div></ProtectedRoute>} />
        <Route path="/connexion" element={<div>CONNEXION</div>} />
      </Routes>
    </MemoryRouter>,
  );
}
const saisir = (libelle, valeur) => fireEvent.change(screen.getByLabelText(libelle, { selector: 'input' }), { target: { value: valeur } });
const remplir = (actuel, nouveau, confirmation = nouveau) => {
  saisir(/Mot de passe provisoire/, actuel); saisir(/^Nouveau mot de passe/, nouveau); saisir(/Confirmez/, confirmation);
  fireEvent.click(screen.getByRole('button', { name: /Enregistrer mon mot de passe/ }));
};

beforeEach(() => {
  http = installHttpMock();
  vi.spyOn(console, 'error').mockImplementation(() => {});
});
afterEach(() => { http.restore(); vi.restoreAllMocks(); });

describe('mot de passe provisoire', () => {
  it('mène à l’écran de changement au lieu du tableau de bord', async () => {
    signIn('parent', { password_change_required: true });
    monter();

    await waitFor(() => expect(url()).toBe(PASSWORD_CHANGE_PATH));
    expect(screen.queryByText('TABLEAU-DE-BORD')).not.toBeInTheDocument();
  });

  it('passe avant l’activation de la 2FA', async () => {
    signIn('comptable', { password_change_required: true });
    useAuthStore.setState({ twoFactorSetupRequired: true });
    monter();

    await waitFor(() => expect(url()).toBe(PASSWORD_CHANGE_PATH));
  });

  it('rétablit l’accès une fois le mot de passe remplacé', async () => {
    signIn('parent', { password_change_required: true });
    http.onPost('/auth/change-password').reply(200, { success: true });
    monter();
    await screen.findByLabelText(/Mot de passe provisoire/);

    remplir('KM7PQ2RSTU', 'MonSecret2026');

    await waitFor(() => expect(url()).toBe(ACCUEIL));
    expect(screen.getByText('TABLEAU-DE-BORD')).toBeInTheDocument();
    expect(http.callsTo('post', '/auth/change-password')[0].body).toEqual({
      current_password: 'KM7PQ2RSTU', password: 'MonSecret2026', password_confirmation: 'MonSecret2026',
    });
    expect(useAuthStore.getState().user.password_change_required).toBe(false);
  });

  it('contrôle la saisie sans appeler l’API', async () => {
    signIn('parent', { password_change_required: true });
    monter();
    await screen.findByLabelText(/Mot de passe provisoire/);

    remplir('KM7PQ2RSTU', 'court');
    expect(await screen.findByText(/au moins 8 caractères\.$/)).toBeInTheDocument();

    remplir('KM7PQ2RSTU', 'KM7PQ2RSTU');
    expect(await screen.findByText(/différent du mot de passe provisoire/)).toBeInTheDocument();

    remplir('KM7PQ2RSTU', 'MonSecret2026', 'MonSecret2027');
    expect(await screen.findByText(/ne correspondent pas/)).toBeInTheDocument();
    expect(http.callsTo('post', '/auth/change-password')).toHaveLength(0);
  });

  it('montre le refus de l’API sous le bon champ et reste sur l’écran', async () => {
    signIn('parent', { password_change_required: true });
    http.onPost('/auth/change-password').reply(422, {
      message: 'Le mot de passe actuel est incorrect.', errors: { current_password: ['Le mot de passe actuel est incorrect.'] },
    });
    monter();
    await screen.findByLabelText(/Mot de passe provisoire/);

    remplir('FAUX', 'MonSecret2026');

    expect(await screen.findByText('Le mot de passe actuel est incorrect.')).toBeInTheDocument();
    expect(url()).toBe(PASSWORD_CHANGE_PATH);
  });

  it('un 403 « requires_password_change » en cours de session mène aussi à l’écran', async () => {
    signIn('parent');
    http.onGet('/parent/enfants').reply(403, { message: 'Mot de passe provisoire', requires_password_change: true });
    monter();
    expect(await screen.findByText('TABLEAU-DE-BORD')).toBeInTheDocument();

    await api.get('/parent/enfants').catch(() => {});

    await waitFor(() => expect(url()).toBe(PASSWORD_CHANGE_PATH));
  });

  it('un compte ordinaire n’a rien à faire sur cet écran', async () => {
    signIn('parent');
    monter(PASSWORD_CHANGE_PATH);

    await waitFor(() => expect(url()).toBe(ACCUEIL));
  });
});
