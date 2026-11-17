/**
 * Consultation hors connexion (17/11/2026).
 *
 * Constaté sur l'émulateur : sans réseau, aucun écran ne montrait ce qui avait
 * déjà été vu (notes, solde, classes de l'enseignant). La dernière réponse
 * de chaque lecture est désormais gardée et affichée, marquée « hors
 * connexion » avec sa date — jamais présentée comme à jour.
 */
import React from 'react';
import { render, screen, waitFor, act } from '@testing-library/react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Ecran, Etat, Texte, liste, useRequete } from '../src/espaces/commun';
import { ThemeProvider } from '../src/theme';
import { api } from '../src/services/api';
import { clearAll, setBrouillon } from '../src/services/secureStorage';

jest.mock('../src/services/api', () => ({ api: { get: jest.fn(), post: jest.fn() } }));

function Section({ chemin }) {
  const req = useRequete(chemin);
  return (
    <>
      <Etat requete={req} />
      {liste(req.donnees).map((x) => <Texte key={x.id}>{x.nom}</Texte>)}
    </>
  );
}

const monter = (chemins) => render(
  <ThemeProvider><Ecran titre="Test">{chemins.map((c) => <Section key={c} chemin={c} />)}</Ecran></ThemeProvider>
);

const reseauCoupe = () => Object.assign(new Error('Network Error'), { code: 'ERR_NETWORK' });

beforeEach(async () => {
  jest.clearAllMocks();
  await AsyncStorage.clear();
});

it('sans réseau, affiche les données déjà vues, marquées hors connexion avec leur date', async () => {
  api.get.mockResolvedValueOnce({ data: { data: [{ id: 1, nom: 'Mathématiques 14/20' }] } });
  const premier = monter(['/notes']);
  expect(await screen.findByText('Mathématiques 14/20')).toBeTruthy();
  expect(screen.queryByText(/Hors connexion/)).toBeNull();
  premier.unmount();

  api.get.mockRejectedValue(reseauCoupe());
  monter(['/notes']);
  expect(await screen.findByText('Mathématiques 14/20')).toBeTruthy();
  expect(screen.getByText(/^Hors connexion : données enregistrées sur ce téléphone le \d\d\/\d\d à \d\d:\d\d\. Elles ont pu changer depuis\.$/)).toBeTruthy();
  expect(screen.queryByText(/Pas de connexion au serveur/)).toBeNull();
});

it('ne répète pas l’avis : une seule mention pour deux sections hors connexion', async () => {
  api.get.mockImplementation((url) => Promise.resolve({ data: { data: [{ id: url, nom: `vu ${url}` }] } }));
  const premier = monter(['/a', '/b']);
  await screen.findByText('vu /b');
  premier.unmount();
  api.get.mockRejectedValue(reseauCoupe());
  monter(['/a', '/b']);
  expect(await screen.findByText('vu /b')).toBeTruthy();
  expect(screen.getAllByText(/^Hors connexion/)).toHaveLength(1);
});

it('sans réseau et sans rien de gardé, dit que le serveur est injoignable', async () => {
  api.get.mockRejectedValue(reseauCoupe());
  monter(['/jamais-vu']);
  expect(await screen.findByText(/Pas de connexion au serveur/)).toBeTruthy();
  expect(screen.queryByText(/^Hors connexion/)).toBeNull();
});

it('un refus de l’API n’affiche jamais les données gardées', async () => {
  api.get.mockResolvedValueOnce({ data: { data: [{ id: 1, nom: 'secret' }] } });
  const premier = monter(['/prive']);
  await screen.findByText('secret');
  premier.unmount();
  api.get.mockRejectedValue({ response: { status: 403, data: { message: 'Accès refusé' } } });
  monter(['/prive']);
  expect(await screen.findByText('Accès refusé')).toBeTruthy();
  expect(screen.queryByText('secret')).toBeNull();
});

it('l’avis disparaît quand le réseau revient', async () => {
  api.get.mockResolvedValueOnce({ data: { data: [{ id: 1, nom: 'v1' }] } });
  const premier = monter(['/x']);
  await screen.findByText('v1');
  premier.unmount();
  api.get.mockRejectedValueOnce(reseauCoupe()).mockResolvedValueOnce({ data: { data: [{ id: 1, nom: 'v2' }] } });
  let recharger;
  function Rechargeable() {
    const req = useRequete('/x');
    recharger = req.recharger;
    return <Texte>{liste(req.donnees)[0]?.nom ?? '…'}</Texte>;
  }
  render(<ThemeProvider><Ecran titre="T"><Rechargeable /></Ecran></ThemeProvider>);
  expect(await screen.findByText(/^Hors connexion/)).toBeTruthy();
  await act(async () => { await recharger(); });
  await waitFor(() => expect(screen.getByText('v2')).toBeTruthy());
  expect(screen.queryByText(/^Hors connexion/)).toBeNull();
});

it('la déconnexion efface les données gardées comme les brouillons', async () => {
  api.get.mockResolvedValueOnce({ data: { data: [{ id: 1, nom: 'du compte précédent' }] } });
  const premier = monter(['/notes']);
  await screen.findByText('du compte précédent');
  premier.unmount();
  await setBrouillon('cle', { 1: '12' });
  await waitFor(async () => expect((await AsyncStorage.getAllKeys()).some((c) => c.includes('cache'))).toBe(true));
  await clearAll();
  const restantes = (await AsyncStorage.getAllKeys()).filter((c) => c.includes('cache') || c.includes('brouillon'));
  expect(restantes).toEqual([]);
  api.get.mockRejectedValue(reseauCoupe());
  monter(['/notes']);
  expect(await screen.findByText(/Pas de connexion au serveur/)).toBeTruthy();
  expect(screen.queryByText('du compte précédent')).toBeNull();
});
