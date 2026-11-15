/**
 * Plantage relevé sur l'émulateur Android (recette du 15/11/2026) : une icône
 * donnée en chaîne (« 🔑 ») était placée directement dans une View. Android
 * refuse tout texte hors d'un <Text> : l'écran de connexion plantait.
 * Jest ne le signale pas ; on vérifie donc que l'icône est bien dans un Text.
 */
import React from 'react';
import { render, screen } from '@testing-library/react-native';
import EruditButton from '../src/components/EruditButton';
import { ThemeProvider } from '../src/theme';

describe('EruditButton', () => {
  it.each(['left', 'right'])('rend une icône texte dans un Text (position %s)', (position) => {
    render(<ThemeProvider><EruditButton icon="🔑" iconPosition={position} onPress={() => {}}>Se connecter</EruditButton></ThemeProvider>);
    expect(screen.getByText('🔑')).toBeTruthy();
  });

  it('rend une icône texte seule dans un Text', () => {
    render(<ThemeProvider><EruditButton icon="⚙️" onPress={() => {}} /></ThemeProvider>);
    expect(screen.getByText('⚙️')).toBeTruthy();
  });
});
