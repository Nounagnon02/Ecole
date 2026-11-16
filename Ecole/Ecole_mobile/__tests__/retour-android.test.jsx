/**
 * Bouton Retour d'Android dans un espace à onglets (constaté sur l'émulateur
 * le 16/11/2026) : depuis un sous-écran (classe ouverte, appel…), Retour doit
 * fermer ce sous-écran, pas renvoyer au premier onglet.
 */
import React, { useState } from 'react';
import { BackHandler, Text } from 'react-native';
import { act, fireEvent, render, screen } from '@testing-library/react-native';
import { Bouton, Ecran, Onglets } from '../src/espaces/commun';
import { ThemeProvider } from '../src/theme';

function Semaine() {
  return <Ecran titre="Ma semaine"><Text>Cours du jour</Text></Ecran>;
}

function Classes() {
  const [ouverte, setOuverte] = useState(null);
  const [appel, setAppel] = useState(false);
  if (appel) return <Ecran titre="Appel · 3ème" onRetour={() => setAppel(false)}><Text>Liste d’appel</Text></Ecran>;
  if (ouverte) {
    return (
      <Ecran titre="Classe 3ème" onRetour={() => setOuverte(null)}>
        <Bouton titre="Faire l’appel" onPress={() => setAppel(true)} />
      </Ecran>
    );
  }
  return <Ecran titre="Mes classes"><Bouton titre="Ouvrir la 3ème" onPress={() => setOuverte('3ème')} /></Ecran>;
}

const ECRANS = [
  { nom: 'Semaine', icone: 'calendrier', composant: Semaine },
  { nom: 'Classes', icone: 'groupe', composant: Classes },
];

let gestionnaire;
beforeEach(() => {
  gestionnaire = null;
  jest.spyOn(BackHandler, 'addEventListener').mockImplementation((_evt, fn) => {
    gestionnaire = fn;
    return { remove: () => { if (gestionnaire === fn) gestionnaire = null; } };
  });
});
afterEach(() => jest.restoreAllMocks());

const retour = () => { let traite; act(() => { traite = gestionnaire(); }); return traite; };

it('ferme les sous-écrans un à un, puis revient au premier onglet, puis laisse sortir', async () => {
  render(<ThemeProvider><Onglets ecrans={ECRANS} /></ThemeProvider>);
  fireEvent.press(screen.getByRole('tab', { name: /Classes/ }));
  fireEvent.press(await screen.findByText('Ouvrir la 3ème'));
  fireEvent.press(await screen.findByText('Faire l’appel'));
  expect(await screen.findByText('Liste d’appel')).toBeTruthy();

  expect(retour()).toBe(true);
  expect(await screen.findByText('Faire l’appel')).toBeTruthy();

  expect(retour()).toBe(true);
  expect(await screen.findByText('Ouvrir la 3ème')).toBeTruthy();

  expect(retour()).toBe(true);
  expect(await screen.findByText('Cours du jour')).toBeTruthy();

  // Premier onglet, rien d'ouvert : Android reprend la main (sortie).
  expect(retour()).toBe(false);
});
