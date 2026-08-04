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
import { getToken, clearAll } from '../src/services/secureStorage';

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

describe('LoginScreen', () => {
  beforeEach(async () => {
    jest.useFakeTimers();
    jest.clearAllMocks();
    await clearAll();
  });

  afterEach(() => {
    jest.useRealTimers();
  });

  it('se rend avec le titre, les champs et le bouton de connexion', async () => {
    await afficherConnexion();

    expect(screen.getByText('Érudit')).toBeTruthy();
    expect(screen.getByText('Connexion')).toBeTruthy();
    expect(screen.getByText('Email')).toBeTruthy();
    expect(screen.getByText('Mot de passe')).toBeTruthy();
    expect(screen.getByText('Se connecter')).toBeTruthy();
    expect(screen.getByText('Mot de passe oublié ?')).toBeTruthy();
  });

  it('propose un badge par rôle disposant d’un dashboard mobile', async () => {
    await afficherConnexion();

    // 12 rôles = 12 dashboards présents dans app/(app)/.
    expect(screen.getAllByRole('button', { name: /.+/ }).length).toBeGreaterThanOrEqual(12);
    expect(screen.getByLabelText('Directeur')).toBeTruthy();
    expect(screen.getByLabelText('Élève')).toBeTruthy();
    expect(screen.getByLabelText('Bibliothécaire')).toBeTruthy();
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
        user: { id: 7, nom: 'Kangbode', role: 'comptable' },
      },
    });
    const navigation = { replace: jest.fn() };
    await afficherConnexion(navigation);

    fireEvent.changeText(screen.getByPlaceholderText('exemple@ecole.bj'), ' compta@ecole.bj ');
    fireEvent.changeText(screen.getByPlaceholderText('••••••••'), 'secret123');
    fireEvent.press(screen.getByText('Se connecter'));

    await waitFor(() => expect(navigation.replace).toHaveBeenCalledWith('/(app)/comptable'));

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

  it('avertit sans rediriger quand le rôle renvoyé n’a pas de dashboard mobile', async () => {
    const alerte = jest.spyOn(Alert, 'alert').mockImplementation(() => {});
    api.post.mockResolvedValue({
      data: { token: 'jeton', user: { id: 9, role: 'personnel' } },
    });
    const navigation = { replace: jest.fn() };
    await afficherConnexion(navigation);

    fireEvent.changeText(screen.getByPlaceholderText('exemple@ecole.bj'), 'p@ecole.bj');
    fireEvent.changeText(screen.getByPlaceholderText('••••••••'), 'secret123');
    fireEvent.press(screen.getByText('Se connecter'));

    await waitFor(() =>
      expect(alerte).toHaveBeenCalledWith('Espace indisponible', expect.stringContaining('personnel'))
    );
    expect(navigation.replace).not.toHaveBeenCalled();
  });
});
