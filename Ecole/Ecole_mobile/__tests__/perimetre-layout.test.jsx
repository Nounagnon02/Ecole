/**
 * Garde du groupe (app) — périmètre mobile du 14/11/2026.
 *
 * Une session restaurée d'un compte hors périmètre (comptable, élève…) doit
 * être fermée, et un lien profond vers l'espace de l'autre profil renvoie
 * vers le sien.
 */
import React from 'react';
import { render, waitFor } from '@testing-library/react-native';

const mockReplace = jest.fn();
let mockSegments = [];
jest.mock('expo-router', () => {
  const { View: MockView } = require('react-native');
  const Stack = ({ children }) => require('react').createElement(MockView, null, children);
  Stack.displayName = 'Stack';
  const Screen = () => null;
  Screen.displayName = 'Stack.Screen';
  Stack.Screen = Screen;
  return { Stack, useRouter: () => ({ replace: mockReplace }), useSegments: () => mockSegments };
});

const mockLogout = jest.fn(() => Promise.resolve());
let mockAuth = {};
jest.mock('../src/context/AuthContext', () => ({ useAuth: () => mockAuth }));
jest.mock('../src/theme', () => ({ useTheme: () => ({ colors: { surface: '#fff', primary: '#000' } }) }));

import AppLayout from '../app/(app)/_layout';

describe('garde du périmètre mobile', () => {
  beforeEach(() => { jest.clearAllMocks(); mockSegments = []; });

  it.each(['comptable', 'directeur', 'eleve', 'admin'])('ferme la session restaurée d’un compte « %s »', async (role) => {
    mockAuth = { user: { id: 1, role }, loading: false, logout: mockLogout };
    render(<AppLayout />);
    await waitFor(() => expect(mockLogout).toHaveBeenCalled());
    await waitFor(() => expect(mockReplace).toHaveBeenCalledWith('/'));
  });

  it('renvoie un parent qui ouvre l’espace enseignant vers le sien', async () => {
    mockAuth = { user: { id: 2, role: 'parent' }, loading: false, logout: mockLogout };
    mockSegments = ['(app)', 'enseignant'];
    render(<AppLayout />);
    await waitFor(() => expect(mockReplace).toHaveBeenCalledWith('/(app)/parent'));
    expect(mockLogout).not.toHaveBeenCalled();
  });

  it('laisse un parent sur son espace', async () => {
    mockAuth = { user: { id: 2, role: 'parent' }, loading: false, logout: mockLogout };
    mockSegments = ['(app)', 'parent'];
    render(<AppLayout />);
    await new Promise((r) => setTimeout(r, 20));
    expect(mockReplace).not.toHaveBeenCalled();
    expect(mockLogout).not.toHaveBeenCalled();
  });
});
