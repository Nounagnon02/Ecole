/**
 * Espace enseignant mobile — saisie des notes (mission du 14/11/2026).
 * API simulée au niveau du client Axios ; écrans et stockage réels.
 */
import React from 'react';
import { Alert } from 'react-native';
import { render, screen, fireEvent, waitFor } from '@testing-library/react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Notes, confirmerDeconnexion, lireNote } from '../src/espaces/EnseignantEspace';
import { ThemeProvider } from '../src/theme';
import { api } from '../src/services/api';
import { clearAll, listeBrouillons } from '../src/services/secureStorage';

jest.mock('../src/services/api', () => ({ api: { get: jest.fn(), post: jest.fn(), put: jest.fn() } }));
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
  fireEvent.press(await screen.findByRole('tab', { name: '3ème' }));
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
      classe_id: 1, matiere_id: 4, type_evaluation: 'Devoir1', periode: 'Trimestre 1', notes: [{ eleve_id: 21, note: 12.5 }],
    })));
    expect(await screen.findByText(/1 note\(s\) enregistrée\(s\)/)).toBeTruthy();
    expect(await listeBrouillons()).toEqual([]);
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
