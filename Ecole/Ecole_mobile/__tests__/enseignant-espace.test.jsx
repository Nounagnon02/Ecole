/**
 * Espace enseignant mobile — saisie des notes (mission du 14/11/2026).
 * API simulée au niveau du client Axios ; écrans et stockage réels.
 */
import React from 'react';
import { Alert } from 'react-native';
import { render, screen, fireEvent, waitFor } from '@testing-library/react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { NavigationContainer } from '@react-navigation/native';
import EnseignantEspace, { AppelClasse, Notes, confirmerDeconnexion, idEnseignant, lireNote } from '../src/espaces/EnseignantEspace';
import { ThemeProvider } from '../src/theme';
import { api } from '../src/services/api';
import { clearAll, listeBrouillons } from '../src/services/secureStorage';

jest.mock('../src/services/api', () => ({ api: { get: jest.fn(), post: jest.fn(), put: jest.fn() } }));
jest.mock('expo-document-picker', () => ({ getDocumentAsync: jest.fn() }));
jest.mock('expo-file-system', () => ({ readAsStringAsync: jest.fn() }));
const mockLogout = jest.fn();
jest.mock('../src/context/AuthContext', () => ({ useAuth: () => ({ user: { id: 9, name: 'Prof', role: 'enseignant' }, logout: mockLogout }) }));

const GRILLE = { success: true, data: {
  classe: { id: 1 }, matieres: [{ id: 4, nom: 'Mathématiques', coefficient: 4 }],
  eleves: [{ id: 21, nom: 'AHO', prenom: 'Kossi' }, { id: 22, nom: 'DOSSOU', prenom: 'Afi' }],
  notes: [{ eleve_id: 22, note: 14, locked: true }],
} };

const monter = (Ecran) => render(<ThemeProvider><Ecran /></ThemeProvider>);

async function ouvrirGrille() {
  monter(Notes);
  // La classe se choisit dans une liste déroulante (maquette du 15/11/2026).
  fireEvent.press(await screen.findByRole('button', { name: 'Classe : à choisir' }));
  fireEvent.press(await screen.findByRole('menuitem', { name: '3ème' }));
  return screen.findByLabelText('Note de AHO Kossi');
}

describe('espace enseignant — notes', () => {
  beforeEach(async () => {
    jest.clearAllMocks();
    await AsyncStorage.clear();
    api.get.mockImplementation((url) => Promise.resolve({ data: url.startsWith('/notes/grille/1') ? GRILLE
      : url === '/enseignant/classes' ? { success: true, data: [{ id: 1, nom_classe: '3ème', eleves: [] }] } : { success: true, data: [] } }));
  });

  it('lit les notes comme le web (virgule, bornes 0–20)', () => {
    expect(lireNote('12,5')).toBe(12.5);
    expect(lireNote('')).toBeNull();
    expect(Number.isNaN(lireNote('21'))).toBe(true);
  });

  it('enregistre la grille en un envoi, sans toucher une note verrouillée', async () => {
    api.post.mockResolvedValue({ data: { success: true } });
    const champ = await ouvrirGrille();
    expect(screen.getByLabelText('Note de DOSSOU Afi').props.editable).toBe(false);
    fireEvent.changeText(champ, '12,5');
    fireEvent.press(screen.getByText('Enregistrer 1 note(s)'));
    await waitFor(() => expect(api.post).toHaveBeenCalledWith('/notes/bulk', expect.objectContaining({
      classe_id: 1, matiere_id: 4, type_evaluation: 'Devoir1', periode: 'Trimestre 1', notes: [{ eleve_id: 21, note: 12.5, base: null }],
    })));
    expect(await screen.findByText(/1 note\(s\) enregistrée\(s\)/)).toBeTruthy();
    expect(await listeBrouillons()).toEqual([]);
  });

  // R-28 : note modifiée entre-temps sur un autre appareil → rien n'est
  // enregistré, l'enseignant voit le conflit et choisit.
  it('signale un conflit de modification et remplace seulement sur confirmation', async () => {
    const alerte = jest.spyOn(Alert, 'alert').mockImplementation(() => {});
    api.post.mockRejectedValueOnce({ response: { status: 409, data: { conflits: [{ eleve_id: 21, enregistree: 14, envoyee: 12.5 }] } } })
      .mockResolvedValueOnce({ data: { success: true } });
    const champ = await ouvrirGrille();
    fireEvent.changeText(champ, '12,5');
    fireEvent.press(screen.getByText('Enregistrer 1 note(s)'));
    await waitFor(() => expect(alerte).toHaveBeenCalledWith('Notes modifiées sur un autre appareil', expect.stringContaining('AHO Kossi : enregistrée 14/20, la vôtre 12,5/20'), expect.any(Array)));
    expect(screen.queryByText(/note\(s\) enregistrée\(s\)/)).toBeNull();
    alerte.mock.calls[0][2][1].onPress();
    await waitFor(() => expect(api.post).toHaveBeenLastCalledWith('/notes/bulk', expect.objectContaining({ forcer: true })));
  });

  it('bloque l’envoi d’une note hors 0–20', async () => {
    const champ = await ouvrirGrille();
    fireEvent.changeText(champ, '25');
    fireEvent.press(screen.getByText('Enregistrer 0 note(s)'));
    expect(api.post).not.toHaveBeenCalled();
    expect(screen.getByText('Note entre 0 et 20')).toBeTruthy();
  });

  it('hors connexion, garde le brouillon et ne l’annonce pas enregistré', async () => {
    api.post.mockRejectedValue(new Error('Network Error'));
    const champ = await ouvrirGrille();
    fireEvent.changeText(champ, '15');
    fireEvent.press(screen.getByText('Enregistrer 1 note(s)'));
    expect(await screen.findByText(/Hors connexion : notes gardées sur le téléphone, non enregistrées/)).toBeTruthy();
    expect((await listeBrouillons()).length).toBe(1);
  });

  it('prévient avant une déconnexion qui effacerait des notes non enregistrées, et les purge', async () => {
    const alerte = jest.spyOn(Alert, 'alert').mockImplementation(() => {});
    const champ = await ouvrirGrille();
    fireEvent.changeText(champ, '11');
    await waitFor(async () => expect((await listeBrouillons()).length).toBe(1));
    await confirmerDeconnexion(mockLogout);
    await waitFor(() => expect(alerte).toHaveBeenCalledWith('Notes non enregistrées', expect.stringContaining('1 saisie'), expect.any(Array)));
    expect(mockLogout).not.toHaveBeenCalled();
    // Confirmer exécute la déconnexion, qui purge les brouillons.
    alerte.mock.calls[0][2][1].onPress();
    expect(mockLogout).toHaveBeenCalledTimes(1);
    await clearAll();
    expect(await listeBrouillons()).toEqual([]);
  });
});

describe('import de notes par tableur (parité avec le web)', () => {
  const DocumentPicker = require('expo-document-picker');
  const FileSystem = require('expo-file-system');
  const { lireTableurNotes } = require('../src/espaces/importNotes');
  const eleves = [{ id: 21, matricule: 'M-21', nom: 'AHO', prenom: 'Kossi' }, { id: 22, matricule: 'M-22', nom: 'DOSSOU', prenom: 'Afi' }];
  beforeEach(async () => {
    jest.clearAllMocks();
    await AsyncStorage.clear();
    api.get.mockImplementation((url) => Promise.resolve({ data: url.startsWith('/notes/grille/1') ? GRILLE
      : { success: true, data: [{ id: 1, nom_classe: '3ème', eleves: [] }] } }));
  });

  it('lit le CSV comme le web : séparateur, matricule, note, erreurs', () => {
    const r = lireTableurNotes('﻿matricule;nom;note\nM-21;AHO;12.5\nM-99;X;10\nM-22;DOSSOU;25\n', eleves, lireNote);
    expect(r.saisies).toEqual({ 21: '12,5' });
    expect(r.lues).toBe(1);
    expect(r.erreurs.map((e) => e.message)).toEqual(['inconnu', 'note']);
  });

  it('remplit la grille depuis un fichier choisi, sans rien envoyer', async () => {
    DocumentPicker.getDocumentAsync.mockResolvedValue({ canceled: false, assets: [{ uri: 'file:///notes.csv', name: 'notes.csv' }] });
    // M-22 a une note verrouillée (14) : l'import ne doit pas la remplacer.
    FileSystem.readAsStringAsync.mockResolvedValue('matricule;note\nM-21;15\nM-99;9\nM-22;3\n');
    api.get.mockImplementation((url) => Promise.resolve({ data: url.startsWith('/notes/grille/1')
      ? { success: true, data: { ...GRILLE.data, eleves: GRILLE.data.eleves.map((e) => ({ ...e, matricule: `M-${e.id}` })) } }
      : { success: true, data: [{ id: 1, nom_classe: '3ème', eleves: [] }] } }));
    const champ = await ouvrirGrille();
    fireEvent.press(screen.getByRole('button', { name: 'Importer un tableur (CSV)' }));
    await waitFor(() => expect(champ.props.value).toBe('15'));
    expect(screen.getByLabelText('Note de DOSSOU Afi').props.value).toBe('14');
    expect(await screen.findByText(/1 note\(s\) lue\(s\) · 1 ligne\(s\) ignorée\(s\)/)).toBeTruthy();
    expect(api.post).not.toHaveBeenCalled();
  });

  it('ne fait rien si le choix est annulé', async () => {
    DocumentPicker.getDocumentAsync.mockResolvedValue({ canceled: true, assets: null });
    await ouvrirGrille();
    fireEvent.press(screen.getByRole('button', { name: 'Importer un tableur (CSV)' }));
    await new Promise((r) => setTimeout(r, 50));
    expect(FileSystem.readAsStringAsync).not.toHaveBeenCalled();
  });
});

// Constaté le 15/11/2026 : sans filtre, l'API renvoie l'emploi du temps de
// toute l'école, et l'enseignant voyait les cours de ses collègues.
describe('ma semaine — seulement les cours de l’enseignant', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    api.get.mockImplementation((url) => Promise.resolve({ data: url === '/enseignant/classes'
      ? { success: true, data: [{ id: 1, nom_classe: '3ème', eleves: [], pivot: { enseignant_id: 4, classe_id: 1 } }] }
      : url === '/emploi-du-temps?enseignant_id=4'
        ? { data: [{ id: 9, jour: 'lundi', heure_debut: '08:00', heure_fin: '10:00', salle: 'Salle 8', classe: { nom_classe: '3ème' }, matiere: { nom: 'Mathématiques' } }] }
        : { success: true, data: [] } }));
  });

  it('lit l’identifiant enseignant dans les affectations', () => {
    expect(idEnseignant({ data: [{ pivot: { enseignant_id: 4 } }] })).toBe(4);
    expect(idEnseignant({ data: [] })).toBeNull();
  });

  it('demande l’emploi du temps filtré sur l’enseignant, jamais celui de toute l’école', async () => {
    render(<ThemeProvider><NavigationContainer><EnseignantEspace /></NavigationContainer></ThemeProvider>);
    expect(await screen.findByText('3ème · Mathématiques')).toBeTruthy();
    expect(screen.getByText('Salle 8')).toBeTruthy();
    expect(api.get).toHaveBeenCalledWith('/emploi-du-temps?enseignant_id=4');
    expect(api.get).not.toHaveBeenCalledWith('/emploi-du-temps');
  });
});

// Décision du 16/11/2026 : l'enseignant fait l'appel de ses classes sur le mobile.
describe('appel d’une classe', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    api.get.mockResolvedValue({ data: { success: true, data: { classe: { id: 1, nom_classe: '3ème' }, date: '2026-11-16',
      eleves: [{ id: 21, nom: 'AHO', prenom: 'Kossi', statut: 'present' }, { id: 22, nom: 'DOSSOU', prenom: 'Afi', statut: 'present' }] } } });
    api.post.mockResolvedValue({ data: { success: true } });
  });

  it('marque un absent, enregistre l’appel de la classe et le confirme seulement après la réponse', async () => {
    render(<ThemeProvider><AppelClasse classe={{ id: 1, nom_classe: '3ème' }} onRetour={() => {}} /></ThemeProvider>);
    expect(await screen.findByText('AHO Kossi')).toBeTruthy();
    expect(api.get).toHaveBeenCalledWith('/enseignant/appel/1');
    fireEvent.press(screen.getAllByRole('tab', { name: 'Absent' })[0]);
    expect(screen.getByText('1 absent(s) · 0 retard(s) · 1 présent(s)')).toBeTruthy();
    fireEvent.press(screen.getByRole('button', { name: 'Enregistrer l’appel' }));
    await waitFor(() => expect(api.post).toHaveBeenCalledWith('/enseignant/appel', {
      classe_id: 1, date: '2026-11-16', eleves: [{ eleve_id: 21, statut: 'absent' }, { eleve_id: 22, statut: 'present' }],
    }));
    expect(await screen.findByText('Appel enregistré : 1 absent(s), 0 retard(s).')).toBeTruthy();
  });

  it('hors connexion, ne dit pas « enregistré »', async () => {
    api.post.mockRejectedValue(new Error('Network Error'));
    render(<ThemeProvider><AppelClasse classe={{ id: 1, nom_classe: '3ème' }} onRetour={() => {}} /></ThemeProvider>);
    await screen.findByText('AHO Kossi');
    fireEvent.press(screen.getByRole('button', { name: 'Enregistrer l’appel' }));
    expect(await screen.findByText(/Hors connexion : l’appel n’a pas été enregistré/)).toBeTruthy();
    expect(screen.queryByText(/Appel enregistré/)).toBeNull();
  });
});
