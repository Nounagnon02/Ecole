/**
 * Activation imposée de la double authentification
 *
 * Directeur, comptable et admin doivent activer la 2FA avant tout. L'API le
 * dit de deux façons : `requires_2fa_setup` à la connexion, puis un 403 du
 * même nom sur chaque appel tant que ce n'est pas fait. L'interface ignorait
 * les deux : ces personnes arrivaient sur un tableau de bord vide, avec un
 * bouton « Réessayer » qui ne pouvait rien résoudre.
 *
 * Vrai store, vrais intercepteurs axios ; seul le transport est simulé.
 */

import { StrictMode } from 'react';
import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { render, screen, waitFor, fireEvent } from '@testing-library/react';
import { MemoryRouter, Routes, Route, useLocation } from 'react-router-dom';
import LoginForm from '@/shared/components/auth/LoginForm';
import ProtectedRoute, { TWO_FACTOR_SETUP_PATH } from '@/shared/components/auth/ProtectedRoute';
import TwoFactorSetupPage from '@/app/features/auth/TwoFactorSetupPage';
import useAuthStore from '@/shared/stores/auth-store';
import { api } from '@/shared/lib/api-client';
import { ROLES } from '@/shared/types/roles';
import { ROLE_REDIRECT_MAP } from '@/features/roles/route-config';
import { installHttpMock } from './helpers/http-mock';
import { resetAuth, signIn } from './helpers/render';

let http;

const SETUP = {
  secret: 'JBSWY3DPEHPK3PXP',
  qr_code_url: 'otpauth://totp/Ecole:directeur?secret=JBSWY3DPEHPK3PXP&issuer=Ecole',
};
const DIRECTEUR = { id: 1, name: 'Kouassi', role: ROLES.DIRECTEUR, two_factor_enabled: false };
const DASHBOARD = ROLE_REDIRECT_MAP[ROLES.DIRECTEUR];

function LocationProbe() {
  const location = useLocation();
  return <div data-testid="url">{location.pathname}</div>;
}
const currentUrl = () => screen.getByTestId('url').textContent;

/** L'application en miniature : connexion, activation, tableau de bord. */
function renderApp(initialPath) {
  return render(
    <MemoryRouter initialEntries={[initialPath]}>
      <LocationProbe />
      <Routes>
        <Route path="/connexion" element={<LoginForm />} />
        <Route path={TWO_FACTOR_SETUP_PATH} element={<ProtectedRoute><TwoFactorSetupPage /></ProtectedRoute>} />
        <Route
          path={DASHBOARD}
          element={<ProtectedRoute allowedRoles={[ROLES.DIRECTEUR]}><div>TABLEAU-DE-BORD</div></ProtectedRoute>}
        />
      </Routes>
    </MemoryRouter>
  );
}

beforeEach(() => {
  http = installHttpMock();
  http.onGet('/sanctum/csrf-cookie').reply(204, '');
  resetAuth();
});

afterEach(() => {
  http.restore();
});

describe('connexion d’un rôle à 2FA obligatoire, pas encore activée', () => {
  it('mène à l’écran d’activation au lieu du tableau de bord', async () => {
    http.onPost('/auth/login').reply(200, {
      requires_2fa_setup: true,
      user: DIRECTEUR,
      message: 'Authentification à deux facteurs obligatoire pour ce rôle',
    });
    // La garde de route revérifie la session juste après la connexion ;
    // l'API laisse passer /auth/me pendant l'enrôlement.
    http.onGet('/auth/me').reply(200, { user: DIRECTEUR });
    http.onPost('/auth/2fa/setup').reply(200, SETUP);

    renderApp('/connexion');
    fireEvent.change(screen.getByLabelText(/^Email ou identifiant/), { target: { value: 'directeur_ecole1' } });
    fireEvent.change(screen.getByLabelText(/^Mot de passe/), { target: { value: 'password' } });
    fireEvent.click(screen.getByRole('button', { name: /Se connecter/i }));

    await waitFor(() => expect(currentUrl()).toBe(TWO_FACTOR_SETUP_PATH));
    expect(await screen.findByRole('heading', { name: /Activez la vérification en deux étapes/i })).toBeInTheDocument();
    expect(screen.queryByText('TABLEAU-DE-BORD')).not.toBeInTheDocument();
    // La personne est bien connectée (elle peut s'enrôler), mais restreinte.
    expect(useAuthStore.getState().isAuthenticated).toBe(true);
    expect(useAuthStore.getState().twoFactorSetupRequired).toBe(true);
  });
});

describe('session déjà ouverte (rechargement de page)', () => {
  it('un 403 requires_2fa_setup de l’API redirige vers l’activation', async () => {
    signIn(ROLES.DIRECTEUR, { two_factor_enabled: false });
    http.onGet('/dashboard/directeur/data').reply(403, {
      message: 'Authentification à deux facteurs obligatoire pour ce rôle',
      requires_2fa_setup: true,
    });
    http.onPost('/auth/2fa/setup').reply(200, SETUP);

    renderApp(DASHBOARD);
    expect(await screen.findByText('TABLEAU-DE-BORD')).toBeInTheDocument();

    // Le tableau de bord interroge l'API, qui refuse.
    await api.get('/dashboard/directeur/data').catch(() => {});

    await waitFor(() => expect(currentUrl()).toBe(TWO_FACTOR_SETUP_PATH));
    expect(screen.queryByText('TABLEAU-DE-BORD')).not.toBeInTheDocument();
  });

  it('un 403 ordinaire ne déclenche pas l’activation', async () => {
    signIn(ROLES.DIRECTEUR);
    http.onGet('/eleves/99').reply(403, { message: 'Accès refusé' });

    await api.get('/eleves/99').catch(() => {});

    expect(useAuthStore.getState().twoFactorSetupRequired).toBe(false);
  });
});

describe('écran d’activation', () => {
  beforeEach(() => {
    signIn(ROLES.DIRECTEUR, { two_factor_enabled: false });
    useAuthStore.setState({ twoFactorSetupRequired: true });
  });

  it('demande le secret à l’API puis affiche le QR code et le champ de code', async () => {
    http.onPost('/auth/2fa/setup').reply(200, SETUP);

    renderApp(TWO_FACTOR_SETUP_PATH);

    expect(await screen.findByLabelText(/Code de confirmation/i)).toBeInTheDocument();
    expect(http.callsTo('post', '/auth/2fa/setup')).toHaveLength(1);
    // Secret lisible pour qui ne peut pas scanner.
    expect(screen.getByText(SETUP.secret)).toBeInTheDocument();
  });

  it('sur un code valide, lève le blocage et ouvre le tableau de bord', async () => {
    http.onPost('/auth/2fa/setup').reply(200, SETUP);
    http.onPost('/auth/2fa/verify').reply(200, { message: '2FA activée avec succès' });

    renderApp(TWO_FACTOR_SETUP_PATH);
    fireEvent.change(await screen.findByLabelText(/Code de confirmation/i), { target: { value: '654321' } });
    fireEvent.click(screen.getByRole('button', { name: /Confirmer/i }));

    expect(await screen.findByText('TABLEAU-DE-BORD')).toBeInTheDocument();
    expect(http.callsTo('post', '/auth/2fa/verify')[0].body).toEqual({ code: '654321' });
    expect(useAuthStore.getState().twoFactorSetupRequired).toBe(false);
    expect(useAuthStore.getState().user.two_factor_enabled).toBe(true);
  });

  it('sur un code refusé, reste sur l’écran et affiche l’erreur de l’API', async () => {
    http.onPost('/auth/2fa/setup').reply(200, SETUP);
    http.onPost('/auth/2fa/verify').reply(422, { message: 'Code invalide' });

    renderApp(TWO_FACTOR_SETUP_PATH);
    fireEvent.change(await screen.findByLabelText(/Code de confirmation/i), { target: { value: '000000' } });
    fireEvent.click(screen.getByRole('button', { name: /Confirmer/i }));

    expect(await screen.findByText('Code invalide')).toBeInTheDocument();
    expect(currentUrl()).toBe(TWO_FACTOR_SETUP_PATH);
    expect(useAuthStore.getState().twoFactorSetupRequired).toBe(true);
  });

  it('tant que la 2FA n’est pas activée, toute route protégée ramène ici', async () => {
    http.onPost('/auth/2fa/setup').reply(200, SETUP);

    renderApp(DASHBOARD);

    await waitFor(() => expect(currentUrl()).toBe(TWO_FACTOR_SETUP_PATH));
    expect(screen.queryByText('TABLEAU-DE-BORD')).not.toBeInTheDocument();
  });

  it('ne demande le secret qu’une fois, même si les effets sont rejoués (StrictMode)', async () => {
    http.onPost('/auth/2fa/setup').reply(200, SETUP);

    render(
      <StrictMode>
        <MemoryRouter initialEntries={[TWO_FACTOR_SETUP_PATH]}>
          <Routes>
            <Route path={TWO_FACTOR_SETUP_PATH} element={<TwoFactorSetupPage />} />
          </Routes>
        </MemoryRouter>
      </StrictMode>
    );

    expect(await screen.findByLabelText(/Code de confirmation/i)).toBeInTheDocument();
    // Chaque appel remplace le secret côté serveur : deux appels, et le QR
    // affiché peut ne plus correspondre à celui que l'API a retenu.
    expect(http.callsTo('post', '/auth/2fa/setup')).toHaveLength(1);
  });

  it('affiche tel quel un refus métier de l’API', async () => {
    http.onPost('/auth/2fa/setup').reply(422, { message: 'La 2FA est déjà activée' });

    renderApp(TWO_FACTOR_SETUP_PATH);

    expect(await screen.findByRole('alert')).toHaveTextContent('La 2FA est déjà activée');
  });

  it('si l’initialisation échoue, masque le détail technique et propose de réessayer', async () => {
    http.onPost('/auth/2fa/setup').reply(500, {
      message: 'fopen(/var/www/storage/framework/cache/data/3b/de/3bde5a55): Failed to open stream',
    });

    renderApp(TWO_FACTOR_SETUP_PATH);

    const alert = await screen.findByRole('alert');
    expect(alert).toHaveTextContent(/Erreur lors de l'activation de la 2FA/i);
    expect(alert).not.toHaveTextContent('fopen');
    http.onPost('/auth/2fa/setup').reply(200, SETUP);
    fireEvent.click(screen.getByRole('button', { name: /Réessayer/i }));

    expect(await screen.findByLabelText(/Code de confirmation/i)).toBeInTheDocument();
  });

  it('permet de se déconnecter plutôt que d’activer', async () => {
    http.onPost('/auth/2fa/setup').reply(200, SETUP);
    http.onPost('/auth/logout').reply(200, {});

    renderApp(TWO_FACTOR_SETUP_PATH);
    await screen.findByLabelText(/Code de confirmation/i);
    fireEvent.click(screen.getByRole('button', { name: /Se déconnecter/i }));

    await waitFor(() => expect(currentUrl()).toBe('/connexion'));
    expect(useAuthStore.getState().isAuthenticated).toBe(false);
    expect(useAuthStore.getState().twoFactorSetupRequired).toBe(false);
  });
});

describe('codes de secours', () => {
  it('montre les codes après activation et ne rend l’accès qu’une fois notés', async () => {
    signIn(ROLES.DIRECTEUR);
    useAuthStore.setState({ twoFactorSetupRequired: true });
    http.onPost('/auth/2fa/setup').reply(200, { qr_code_url: 'otpauth://totp/x', secret: 'JBSWY3DPEHPK3PXP' });
    http.onPost('/auth/2fa/verify').reply(200, { message: 'ok', codes_secours: ['AAAA-BBBB', 'CCCC-DDDD'] });
    renderApp(TWO_FACTOR_SETUP_PATH);

    const champ = await screen.findByLabelText(/code/i, { selector: 'input' });
    fireEvent.change(champ, { target: { value: '123456' } });
    fireEvent.click(screen.getByRole('button', { name: /Activer|Vérifier|Confirmer/i }));

    expect(await screen.findByTestId('codes-secours')).toHaveTextContent('AAAA-BBBB');
    expect(useAuthStore.getState().twoFactorSetupRequired).toBe(true);
    fireEvent.click(screen.getByRole('button', { name: /J’ai noté mes codes/ }));
    await waitFor(() => expect(useAuthStore.getState().twoFactorSetupRequired).toBe(false));
  });
});
