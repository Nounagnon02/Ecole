/**
 * Parcours d'authentification — de la saisie au tableau de bord
 *
 * On monte le vrai LoginForm, le vrai store Zustand et les vrais
 * intercepteurs axios ; seul le transport HTTP est simulé. Ce qui est
 * vérifié est ce que l'utilisateur voit : le message d'erreur, l'écran
 * de choix d'école, et l'URL sur laquelle il atterrit.
 */

import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { render, screen, waitFor, fireEvent } from '@testing-library/react';
import { MemoryRouter, Routes, Route, useLocation } from 'react-router-dom';
import LoginForm from '@/shared/components/auth/LoginForm';
import useAuthStore from '@/shared/stores/auth-store';
import { ROLES } from '@/shared/types/roles';
import { ROLE_REDIRECT_MAP } from '@/features/roles/route-config';
import { installHttpMock } from './helpers/http-mock';
import { resetAuth } from './helpers/render';

let http;

/** Sonde l'URL courante pour observer les redirections. */
function LocationProbe() {
  const location = useLocation();
  return <div data-testid="url">{location.pathname}</div>;
}

function renderLogin() {
  return render(
    <MemoryRouter initialEntries={['/connexion']}>
      <LocationProbe />
      <Routes>
        <Route path="/connexion" element={<LoginForm />} />
        <Route path="*" element={<div>AUTRE-ECRAN</div>} />
      </Routes>
    </MemoryRouter>
  );
}

// `^Mot de passe` : sans l'ancre, le bouton « Afficher le mot de passe »
// du composant Input matche aussi et la requête devient ambiguë.
const passwordField = () => screen.getByLabelText(/^Mot de passe/);
const emailField = () => screen.getByLabelText(/^Email ou identifiant/);

function fillCredentials({ email = 'directeur@ecole.bj', password = 'secret123' } = {}) {
  fireEvent.change(emailField(), { target: { value: email } });
  fireEvent.change(passwordField(), { target: { value: password } });
}

function submit() {
  fireEvent.click(screen.getByRole('button', { name: /Se connecter/i }));
}

const currentUrl = () => screen.getByTestId('url').textContent;

beforeEach(() => {
  http = installHttpMock();
  http.onGet('/sanctum/csrf-cookie').reply(204, '');
  resetAuth();
});

afterEach(() => {
  http.restore();
});

describe('validation côté client', () => {
  it('refuse de soumettre un formulaire vide et signale les deux champs', async () => {
    renderLogin();
    submit();

    await waitFor(() => {
      expect(screen.getByText(/Veuillez entrer votre identifiant ou email/i)).toBeInTheDocument();
    });
    expect(screen.getByText(/Veuillez entrer votre mot de passe/i)).toBeInTheDocument();
    // Aucun appel réseau : la garde locale a bien coupé court.
    expect(http.callsTo('post', '/auth/login')).toHaveLength(0);
  });

  it('signale le mot de passe manquant seul', async () => {
    renderLogin();
    fireEvent.change(emailField(), { target: { value: 'directeur@ecole.bj' } });
    submit();

    await waitFor(() => {
      expect(screen.getByText(/Veuillez entrer votre mot de passe/i)).toBeInTheDocument();
    });
    expect(screen.queryByText(/Veuillez entrer votre identifiant/i)).not.toBeInTheDocument();
    expect(http.callsTo('post', '/auth/login')).toHaveLength(0);
  });

  it('efface l’erreur d’un champ dès qu’on le corrige', async () => {
    renderLogin();
    submit();
    await waitFor(() => expect(screen.getByText(/Veuillez entrer votre mot de passe/i)).toBeInTheDocument());

    fireEvent.change(passwordField(), { target: { value: 'x' } });

    await waitFor(() =>
      expect(screen.queryByText(/Veuillez entrer votre mot de passe/i)).not.toBeInTheDocument()
    );
  });
});

describe('connexion réussie', () => {
  it('récupère le cookie CSRF avant de poster les identifiants', async () => {
    http.onPost('/auth/login').reply(200, { user: { id: 1, name: 'D', role: ROLES.DIRECTEUR } });

    renderLogin();
    fillCredentials();
    submit();

    await waitFor(() => expect(currentUrl()).toBe('/directeur/dashboard'));
    // Sanctum SPA exige le cookie CSRF avant tout POST authentifiant.
    expect(http.callsTo('get', '/sanctum/csrf-cookie')).toHaveLength(1);
    expect(http.callsTo('post', '/auth/login')[0].body).toEqual({
      email: 'directeur@ecole.bj',
      password: 'secret123',
    });
  });

  it('place l’utilisateur en session et le redirige sur son dashboard', async () => {
    http.onPost('/auth/login').reply(200, {
      user: { id: 7, name: 'Aline', email: 'aline@ecole.bj', role: ROLES.ELEVE },
    });

    renderLogin();
    fillCredentials({ email: 'aline@ecole.bj' });
    submit();

    await waitFor(() => expect(currentUrl()).toBe('/eleve/dashboard'));
    const state = useAuthStore.getState();
    expect(state.isAuthenticated).toBe(true);
    expect(state.user).toMatchObject({ id: 7, role: ROLES.ELEVE });
  });

  it.each([
    [ROLES.DIRECTEUR, '/directeur/dashboard'],
    [ROLES.ENSEIGNANT, '/enseignant/dashboard'],
    [ROLES.ELEVE, '/eleve/dashboard'],
    [ROLES.PARENT, '/parent/dashboard'],
    [ROLES.COMPTABLE, '/comptable/dashboard'],
    [ROLES.SURVEILLANT, '/surveillant/dashboard'],
    [ROLES.CENSEUR, '/censeur/dashboard'],
    [ROLES.INFIRMIER, '/infirmier/dashboard'],
    [ROLES.BIBLIOTHECAIRE, '/bibliothecaire/dashboard'],
    [ROLES.SECRETAIRE, '/secretaire/dashboard'],
    [ROLES.RECTEUR, '/universite/dashboard'],
    [ROLES.DOYEN, '/universite/dashboard'],
    [ROLES.PROFESSEUR, '/universite/dashboard'],
    [ROLES.ETUDIANT, '/universite/dashboard'],
    [ROLES.PERSONNEL, '/universite/dashboard'],
    [ROLES.ADMIN, '/admin/dashboard'],
    [ROLES.SUPER_ADMIN, '/admin/dashboard'],
  ])('le rôle %s atterrit sur %s', async (role, expected) => {
    http.onPost('/auth/login').reply(200, { user: { id: 1, name: 'X', role } });

    renderLogin();
    fillCredentials();
    submit();

    await waitFor(() => expect(currentUrl()).toBe(expected));
  });

  it.each([
    [ROLES.DIRECTEUR_M, '/directeur/dashboard'],
    [ROLES.DIRECTEUR_P, '/directeur/dashboard'],
    [ROLES.DIRECTEUR_S, '/directeur/dashboard'],
    [ROLES.ENSEIGNEMENT, '/enseignant/dashboard'],
    [ROLES.ENSEIGNEMENT_M, '/enseignant/dashboard'],
    [ROLES.ENSEIGNEMENT_P, '/enseignant/dashboard'],
  ])('le sous-rôle %s atterrit sur %s et non sur /connexion', async (role, expected) => {
    // Régression protégée : sans entrée dans ROLE_REDIRECT_MAP, ces
    // rôles étaient renvoyés sur l'écran de connexion après un login
    // pourtant réussi — l'utilisateur ne pouvait jamais entrer.
    http.onPost('/auth/login').reply(200, { user: { id: 1, name: 'X', role } });

    renderLogin();
    fillCredentials();
    submit();

    await waitFor(() => expect(currentUrl()).toBe(expected));
    expect(currentUrl()).not.toBe('/connexion');
  });

  it('n’envoie nulle part un rôle inconnu du client, sauf sur la connexion', async () => {
    http.onPost('/auth/login').reply(200, { user: { id: 1, name: 'X', role: 'role-inexistant' } });

    renderLogin();
    fillCredentials();
    submit();

    await waitFor(() => expect(http.callsTo('post', '/auth/login')).toHaveLength(1));
    expect(ROLE_REDIRECT_MAP['role-inexistant']).toBeUndefined();
    expect(currentUrl()).toBe('/connexion');
  });
});

describe('échec d’identifiants', () => {
  it('affiche le message du serveur et ne redirige pas', async () => {
    http.onPost('/auth/login').reply(401, { message: 'Identifiants incorrects.' });

    renderLogin();
    fillCredentials({ password: 'mauvais' });
    submit();

    await waitFor(() => {
      expect(screen.getByText('Identifiants incorrects.')).toBeInTheDocument();
    });
    expect(currentUrl()).toBe('/connexion');
    expect(useAuthStore.getState().isAuthenticated).toBe(false);
  });

  it('rend l’erreur dans une région d’alerte accessible', async () => {
    http.onPost('/auth/login').reply(401, { message: 'Identifiants incorrects.' });

    renderLogin();
    fillCredentials();
    submit();

    await waitFor(() => {
      const alerts = screen.getAllByRole('alert');
      expect(alerts.some((el) => el.textContent.includes('Identifiants incorrects.'))).toBe(true);
    });
  });

  it('affiche les erreurs de validation champ par champ sur un 422', async () => {
    http.onPost('/auth/login').reply(422, {
      message: 'Les données fournies sont invalides.',
      errors: { email: ['Cet identifiant est inconnu.'] },
    });

    renderLogin();
    fillCredentials({ email: 'inconnu@ecole.bj' });
    submit();

    await waitFor(() => {
      expect(screen.getByText('Cet identifiant est inconnu.')).toBeInTheDocument();
    });
    expect(currentUrl()).toBe('/connexion');
  });

  it('affiche un message lisible sur erreur réseau', async () => {
    http.onPost('/auth/login').networkError('Network Error');

    renderLogin();
    fillCredentials();
    submit();

    await waitFor(() => {
      const alerts = screen.getAllByRole('alert');
      expect(alerts.some((el) => el.textContent.trim().length > 0)).toBe(true);
    });
    expect(currentUrl()).toBe('/connexion');
    expect(useAuthStore.getState().isAuthenticated).toBe(false);
  });

  it('affiche un message sur 500 et laisse réessayer', async () => {
    http.onPost('/auth/login').reply(500, { message: 'Service momentanément indisponible.' });

    renderLogin();
    fillCredentials();
    submit();

    await waitFor(() =>
      expect(screen.getByText('Service momentanément indisponible.')).toBeInTheDocument()
    );

    // Le bouton doit être de nouveau actionnable (loading remis à false).
    http.onPost('/auth/login').reply(200, { user: { id: 1, name: 'D', role: ROLES.DIRECTEUR } });
    fillCredentials();
    submit();

    await waitFor(() => expect(currentUrl()).toBe('/directeur/dashboard'));
  });
});

describe('utilisateur rattaché à plusieurs écoles', () => {
  it('affiche le sélecteur d’école au lieu de rediriger', async () => {
    http.onPost('/auth/login').reply(200, {
      temp_token: 'tmp-123',
      schools: [
        { id: 1, name: 'Collège Saint-Michel' },
        { id: 2, name: 'Lycée Béhanzin' },
      ],
    });

    renderLogin();
    fillCredentials();
    submit();

    await waitFor(() => expect(screen.getByText('Collège Saint-Michel')).toBeInTheDocument());
    expect(screen.getByText('Lycée Béhanzin')).toBeInTheDocument();
    expect(currentUrl()).toBe('/connexion');
    expect(useAuthStore.getState().isAuthenticated).toBe(false);
  });

  it('finalise la connexion sur choix d’école et redirige selon le rôle', async () => {
    http.onPost('/auth/login').reply(200, {
      temp_token: 'tmp-123',
      schools: [{ id: 42, name: 'Collège Saint-Michel' }],
    });
    http.onPost('/auth/select-school').reply(200, {
      user: { id: 3, name: 'Comptable', role: ROLES.COMPTABLE },
    });

    renderLogin();
    fillCredentials();
    submit();

    await waitFor(() => expect(screen.getByText('Collège Saint-Michel')).toBeInTheDocument());
    fireEvent.click(screen.getByText('Collège Saint-Michel'));

    await waitFor(() => expect(currentUrl()).toBe('/comptable/dashboard'));
    expect(http.callsTo('post', '/auth/select-school')[0].body).toEqual({
      ecole_id: 42,
      token: 'tmp-123',
    });
    expect(useAuthStore.getState().isAuthenticated).toBe(true);
  });

  it('affiche l’erreur si le choix d’école échoue, sans quitter l’écran', async () => {
    http.onPost('/auth/login').reply(200, {
      temp_token: 'tmp-123',
      schools: [{ id: 42, name: 'Collège Saint-Michel' }],
    });
    http.onPost('/auth/select-school').reply(403, { message: 'Accès refusé à cet établissement.' });

    renderLogin();
    fillCredentials();
    submit();
    await waitFor(() => expect(screen.getByText('Collège Saint-Michel')).toBeInTheDocument());

    fireEvent.click(screen.getByText('Collège Saint-Michel'));

    await waitFor(() =>
      expect(screen.getByText('Accès refusé à cet établissement.')).toBeInTheDocument()
    );
    expect(currentUrl()).toBe('/connexion');
    expect(useAuthStore.getState().isAuthenticated).toBe(false);
  });
});

describe('store — initialize / logout', () => {
  it('initialize() restaure la session depuis le cookie', async () => {
    http.onGet('/auth/me').reply(200, { user: { id: 5, name: 'Rose', role: ROLES.SECRETAIRE } });

    await useAuthStore.getState().initialize();

    const state = useAuthStore.getState();
    expect(state.isAuthenticated).toBe(true);
    expect(state.user).toMatchObject({ id: 5, role: ROLES.SECRETAIRE });
    expect(state.isLoading).toBe(false);
  });

  it('initialize() accepte aussi un profil renvoyé à plat', async () => {
    http.onGet('/auth/me').reply(200, { id: 9, name: 'Plat', role: ROLES.PARENT });

    await useAuthStore.getState().initialize();

    expect(useAuthStore.getState().user).toMatchObject({ id: 9, role: ROLES.PARENT });
  });

  it('initialize() laisse l’utilisateur déconnecté sans session valide', async () => {
    http.onGet('/auth/me').reply(401, { message: 'Unauthenticated.' });

    await useAuthStore.getState().initialize();

    const state = useAuthStore.getState();
    expect(state.isAuthenticated).toBe(false);
    expect(state.user).toBeNull();
    // isLoading doit retomber, sinon l'app reste bloquée sur le spinner.
    expect(state.isLoading).toBe(false);
  });

  it('logout() vide la session même si le backend échoue', async () => {
    useAuthStore.setState({
      user: { id: 1, name: 'D', role: ROLES.DIRECTEUR },
      isAuthenticated: true,
      isLoading: false,
    });
    http.onPost('/auth/logout').reply(500, { message: 'Boom' });

    await useAuthStore.getState().logout();

    expect(useAuthStore.getState().isAuthenticated).toBe(false);
    expect(useAuthStore.getState().user).toBeNull();
  });
});
