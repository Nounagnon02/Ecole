/**
 * Reprise de session au lancement (parcours 9, émulateur, 16/11/2026).
 *
 * L'application tuée puis relancée revenait toujours à l'écran de connexion,
 * en ligne comme hors ligne : la session était bien gardée sur le téléphone,
 * mais la route « / » affichait la connexion sans rien regarder. Un
 * enseignant coupé du réseau ne retrouvait donc plus son brouillon de notes.
 */
import React from 'react';
import { render, screen } from '@testing-library/react-native';

let mockAuth = {};
jest.mock('../src/context/AuthContext', () => ({ useAuth: () => mockAuth }));
jest.mock('expo-router', () => {
  const { Text: MockText } = require('react-native');
  const Redirect = ({ href }) => require('react').createElement(MockText, null, `REDIRECTION ${href}`);
  return { Redirect, useRouter: () => ({ replace: jest.fn(), push: jest.fn() }) };
});
jest.mock('../src/screens/LoginScreen', () => {
  const { Text: MockText } = require('react-native');
  const Login = () => require('react').createElement(MockText, null, 'ÉCRAN DE CONNEXION');
  return Login;
});

import Index from '../app/index';

describe('route « / » au lancement', () => {
  it('renvoie un parent dont la session est restaurée vers son espace', () => {
    mockAuth = { user: { id: 2, role: 'parent' }, loading: false };
    render(<Index />);
    expect(screen.getByText('REDIRECTION /(app)/parent')).toBeTruthy();
    expect(screen.queryByText('ÉCRAN DE CONNEXION')).toBeNull();
  });

  it('renvoie un enseignant vers son espace, même sans réseau (aucun appel)', () => {
    mockAuth = { user: { id: 9, role: 'enseignant' }, loading: false };
    render(<Index />);
    expect(screen.getByText('REDIRECTION /(app)/enseignant')).toBeTruthy();
  });

  it('montre la connexion sans session', () => {
    mockAuth = { user: null, loading: false };
    render(<Index />);
    expect(screen.getByText('ÉCRAN DE CONNEXION')).toBeTruthy();
  });

  it('n’affiche pas la connexion pendant la lecture de la session', () => {
    mockAuth = { user: null, loading: true };
    render(<Index />);
    expect(screen.queryByText('ÉCRAN DE CONNEXION')).toBeNull();
  });

  it('laisse la connexion à un compte hors du périmètre mobile', () => {
    mockAuth = { user: { id: 5, role: 'comptable' }, loading: false };
    render(<Index />);
    expect(screen.getByText('ÉCRAN DE CONNEXION')).toBeTruthy();
  });
});
