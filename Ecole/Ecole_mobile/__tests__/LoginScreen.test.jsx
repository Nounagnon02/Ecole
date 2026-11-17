/**
 * Tests de fumée — écran de connexion Érudit v4
 *
 * Vérifie que l'écran d'entrée de l'application se rend réellement, et que le
 * flux d'authentification mobile (token Bearer Sanctum + stockage sécurisé)
 * reste branché : appel API, persistance du jeton, redirection vers le
 * dashboard du rôle renvoyé par l'API.
 */

import React from 'react';
import { Alert } from 'react-native';
import { act, render, screen, fireEvent, waitFor } from '@testing-library/react-native';

import LoginScreen from '../src/screens/LoginScreen';
import { AuthProvider } from '../src/context/AuthContext';
import { ThemeProvider } from '../src/theme';
import { api } from '../src/services/api';
import { getToken, getUser, clearAll } from '../src/services/secureStorage';

// Le client Axios est la seule frontière réseau : on la remplace.
jest.mock('../src/services/api', () => ({
  api: {
    post: jest.fn(),
    defaults: { headers: { common: {} } },
  },
}));

async function afficherConnexion(navigation = {}) {
  const rendu = render(
    <ThemeProvider>
      <AuthProvider>
        <LoginScreen navigation={navigation} />
      </AuthProvider>
    </ThemeProvider>
  );

  // AuthProvider restaure la session au montage (lecture asynchrone du
  // stockage) et l'écran joue une animation d'entrée de 600 ms : on laisse les
  // deux se terminer avant d'agir, comme au démarrage réel de l'application.
  await act(async () => {
    jest.advanceTimersByTime(700);
  });

  return rendu;
}

// Budget de temps des machines de la CI : `testTimeout` dans jest.config.js.

describe('LoginScreen', () => {
  // Une seule horloge simulée pour tout le fichier : basculer entre temps réel
  // et simulé à chaque cas laissait, sous Node 20 (CI), des animations du
  // premier rendu attachées à une horloge abandonnée — deux cas restaient
  // bloqués jusqu'au délai (R-47, 16/11/2026).
  beforeAll(() => { jest.useFakeTimers(); });
  afterAll(() => { jest.useRealTimers(); });

  beforeEach(async () => {
    jest.clearAllMocks();
    await clearAll();
  });

  afterEach(() => {
    act(() => { jest.runOnlyPendingTimers(); });
  });

  it('se rend avec le titre, les champs et le bouton de connexion', async () => {
    await afficherConnexion();

    expect(screen.getByText('École')).toBeTruthy();
    expect(screen.queryByText('Érudit')).toBeNull();
    expect(screen.getByText('Connexion')).toBeTruthy();
    expect(screen.getByText('Identifiant ou e-mail')).toBeTruthy();
    // Même marque que le web : logo et nom réunis en une image accessible.
    expect(screen.getByRole('image', { name: 'École' })).toBeTruthy();
    expect(screen.getByText('Mot de passe')).toBeTruthy();
    expect(screen.getByText('Se connecter')).toBeTruthy();
    expect(screen.getByText('Mot de passe oublié ?')).toBeTruthy();
  });

  it('ne fait pas choisir de rôle : il vient du serveur', async () => {
    await afficherConnexion();

    expect(screen.queryByLabelText('Directeur')).toBeNull();
    expect(screen.queryByLabelText('Comptable')).toBeNull();
    expect(screen.queryByLabelText('Élève')).toBeNull();
  });

  it('refuse de soumettre un formulaire vide et n’appelle pas l’API', async () => {
    const alerte = jest.spyOn(Alert, 'alert').mockImplementation(() => {});
    await afficherConnexion();

    fireEvent.press(screen.getByText('Se connecter'));

    await waitFor(() => expect(alerte).toHaveBeenCalledWith('Erreur', 'Veuillez remplir tous les champs'));
    expect(api.post).not.toHaveBeenCalled();
  });

  it('connecte l’utilisateur, stocke le jeton Bearer et redirige vers son dashboard', async () => {
    api.post.mockResolvedValue({
      data: {
        token: 'jeton-sanctum-123',
        user: { id: 7, nom: 'Kangbode', role: 'enseignant' },
      },
    });
    const navigation = { replace: jest.fn() };
    await afficherConnexion(navigation);

    fireEvent.changeText(screen.getByPlaceholderText('exemple@ecole.bj'), ' compta@ecole.bj ');
    fireEvent.changeText(screen.getByPlaceholderText('••••••••'), 'secret123');
    fireEvent.press(screen.getByText('Se connecter'));

    await waitFor(() => expect(navigation.replace).toHaveBeenCalledWith('/(app)/enseignant'));

    // L'email est trimé et device_name accompagne la demande de token Sanctum.
    expect(api.post).toHaveBeenCalledWith(
      '/auth/login',
      expect.objectContaining({
        email: 'compta@ecole.bj',
        password: 'secret123',
        device_name: expect.any(String),
      })
    );

    // Le jeton part dans le stockage sécurisé et dans l'en-tête Authorization.
    await waitFor(async () => expect(await getToken()).toBe('jeton-sanctum-123'));
    expect(api.defaults.headers.common.Authorization).toBe('Bearer jeton-sanctum-123');
  });

  it('affiche l’erreur de l’API et ne redirige pas quand les identifiants sont refusés', async () => {
    const alerte = jest.spyOn(Alert, 'alert').mockImplementation(() => {});
    api.post.mockRejectedValue({ response: { status: 401, data: { message: 'Identifiants invalides' } } });
    const navigation = { replace: jest.fn() };
    await afficherConnexion(navigation);

    fireEvent.changeText(screen.getByPlaceholderText('exemple@ecole.bj'), 'x@ecole.bj');
    fireEvent.changeText(screen.getByPlaceholderText('••••••••'), 'mauvais');
    fireEvent.press(screen.getByText('Se connecter'));

    await waitFor(() => expect(alerte).toHaveBeenCalledWith('Erreur', 'Identifiants invalides'));
    expect(navigation.replace).not.toHaveBeenCalled();
    expect(await getToken()).toBeNull();
  });

  // Constaté sur l'émulateur (17/11/2026) : sans réponse du serveur, l'écran
  // disait « Identifiants incorrects » — l'utilisateur croit son mot de passe
  // faux alors que le réseau est en cause.
  it('sans réseau, dit que le serveur est injoignable, pas que les identifiants sont faux', async () => {
    const alerte = jest.spyOn(Alert, 'alert').mockImplementation(() => {});
    api.post.mockRejectedValue(Object.assign(new Error('Network Error'), { code: 'ERR_NETWORK' }));
    await afficherConnexion({ replace: jest.fn() });
    fireEvent.changeText(screen.getByPlaceholderText('exemple@ecole.bj'), 'p@ecole.bj');
    fireEvent.changeText(screen.getByPlaceholderText('••••••••'), 'secret123');
    fireEvent.press(screen.getByText('Se connecter'));
    await waitFor(() => expect(alerte).toHaveBeenCalledWith('Erreur', expect.stringContaining('Pas de connexion au serveur')));
    expect(alerte).not.toHaveBeenCalledWith('Erreur', expect.stringContaining('Identifiants'));
  });

  it('traduit les refus sans message utile : trop de tentatives, panne du serveur', () => {
    const { messageConnexion } = require('../src/context/AuthContext');
    expect(messageConnexion({ response: { status: 429, data: { message: 'Too Many Attempts.' } } })).toBe('Trop de tentatives de connexion. Patientez une minute puis réessayez.');
    expect(messageConnexion({ response: { status: 500, data: { message: 'Server Error' } } })).toMatch(/ne répond pas correctement/);
    expect(messageConnexion({ response: { status: 401, data: { message: 'Identifiants incorrects' } } })).toBe('Identifiants incorrects');
    expect(messageConnexion({ response: { status: 403, data: { message: 'Votre compte est désactivé' } } })).toBe('Votre compte est désactivé');
  });

  it('retient qu’un mot de passe provisoire doit être changé', async () => {
    api.post.mockResolvedValue({ data: { token: 't', requires_password_change: true, user: { id: 4, role: 'parent' } } });
    const navigation = { replace: jest.fn() };
    await afficherConnexion(navigation);
    fireEvent.changeText(screen.getByPlaceholderText('exemple@ecole.bj'), '0190000101');
    fireEvent.changeText(screen.getByPlaceholderText('••••••••'), 'Provisoire1');
    fireEvent.press(screen.getByText('Se connecter'));
    await waitFor(() => expect(navigation.replace).toHaveBeenCalledWith('/(app)/parent'));
    expect((await getUser()).password_change_required).toBe(true);
  });

  // Décision du 16/11/2026 : l'université entre dans l'application.
  it.each([['professeur', '/(app)/professeur'], ['etudiant', '/(app)/etudiant']])(
    'ouvre au compte « %s » son espace universitaire',
    async (role, espace) => {
      api.post.mockResolvedValue({ data: { token: 'jeton', user: { id: 11, role } } });
      const navigation = { replace: jest.fn() };
      await afficherConnexion(navigation);
      fireEvent.changeText(screen.getByPlaceholderText('exemple@ecole.bj'), 'u@univ.bj');
      fireEvent.changeText(screen.getByPlaceholderText('••••••••'), 'secret123');
      fireEvent.press(screen.getByText('Se connecter'));
      await waitFor(() => expect(navigation.replace).toHaveBeenCalledWith(espace));
    }
  );

  it.each(['comptable', 'directeur', 'eleve', 'personnel', 'recteur'])(
    'refuse un compte « %s » : avertit, ne redirige pas et purge la session',
    async (role) => {
      const alerte = jest.spyOn(Alert, 'alert').mockImplementation(() => {});
      api.post.mockResolvedValue({ data: { token: 'jeton', user: { id: 9, role } } });
      const navigation = { replace: jest.fn() };
      await afficherConnexion(navigation);

      fireEvent.changeText(screen.getByPlaceholderText('exemple@ecole.bj'), 'p@ecole.bj');
      fireEvent.changeText(screen.getByPlaceholderText('••••••••'), 'secret123');
      fireEvent.press(screen.getByText('Se connecter'));

      await waitFor(() =>
        expect(alerte).toHaveBeenCalledWith('Application réservée', expect.stringContaining('L’administration utilise l’application de bureau'))
      );
      expect(navigation.replace).not.toHaveBeenCalled();
      // Le jeton émis ne doit pas rester sur le téléphone.
      await waitFor(async () => expect(await getToken()).toBeNull());
      expect(api.post).toHaveBeenCalledWith('/auth/logout');
    }
  );
});
