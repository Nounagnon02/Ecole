/**
 * Espace parent mobile — parité avec le web (mission du 14/11/2026).
 * API simulée au niveau du client Axios ; les écrans sont les vrais.
 */
import React from 'react';
import { Alert, Linking } from 'react-native';
import { NavigationContainer } from '@react-navigation/native';
import { render, screen, fireEvent, waitFor } from '@testing-library/react-native';
import ParentEspace, { bulletinHtml } from '../src/espaces/ParentEspace';
import { ThemeProvider } from '../src/theme';
import { api } from '../src/services/api';

jest.mock('../src/services/api', () => ({ api: { get: jest.fn(), post: jest.fn(), put: jest.fn() } }));
jest.mock('expo-print', () => ({ printToFileAsync: jest.fn(() => Promise.resolve({ uri: 'file:///bulletin.pdf' })) }));
jest.mock('expo-sharing', () => ({ isAvailableAsync: jest.fn(() => Promise.resolve(true)), shareAsync: jest.fn(() => Promise.resolve()) }));
const mockLogout = jest.fn();
jest.mock('../src/context/AuthContext', () => ({ useAuth: () => ({ user: { id: 50, name: 'Parent', role: 'parent' }, logout: mockLogout }) }));

const REPONSES = {
  '/parent/enfants': { success: true, data: [{ id: 7, nom: 'AHO', prenom: 'Kossi', matricule: 'M-7', classe: { nom: '6ème' }, moyenne_generale: null, rang: null, absences_count: 2 }] },
  '/communications': { success: true, data: [] },
  '/parent/enfants/7/paiements': { success: true, data: [{ id: 3, libelle: 'Scolarité T1', reference: 'R-3', montant_total: 60000, montant_paye: 10000, reste: 50000, date: '2026-11-30', statut: 'PARTIEL', paiement_en_cours: null }], meta: { total_du: 60000, total_paye: 10000, solde: 50000 } },
  '/messages/conversations': { success: true, data: [] },
  '/messages/contacts': { success: true, data: [{ id: 12, name: 'Mme DOSSOU', role: 'enseignant' }] },
  '/messages/conversation/12': { success: true, data: { data: [] } },
  '/parent/preferences': { success: true, data: { absences: true, notes: true, echeances: true, recus: true, convocations: true, langue: 'fr' } },
};

function monter() {
  return render(<ThemeProvider><NavigationContainer><ParentEspace /></NavigationContainer></ThemeProvider>);
}

describe('espace parent', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    api.get.mockImplementation((url) => Promise.resolve({ data: REPONSES[url] ?? { success: true, data: [] } }));
    api.post.mockResolvedValue({ data: { success: true, data: { checkout_url: 'https://sandbox-process.fedapay.com/pay/x' } } });
    api.put.mockResolvedValue({ data: { success: true } });
  });

  it('montre l’enfant et ne transforme pas une moyenne inconnue en 0', async () => {
    monter();
    expect(await screen.findByText(/AHO Kossi/)).toBeTruthy();
    expect(screen.getByText(/Moyenne : —/)).toBeTruthy();
    expect(screen.queryByText(/0\/20/)).toBeNull();
  });

  it('ouvre le paiement en ligne depuis le mobile, retour dans l’application', async () => {
    const ouvrir = jest.spyOn(Linking, 'openURL').mockResolvedValue(true);
    monter();
    await screen.findByText(/AHO Kossi/);
    fireEvent.press(screen.getByText('Paiements'));
    fireEvent.changeText(await screen.findByLabelText('Montant à payer pour Scolarité T1'), '20000');
    fireEvent.press(screen.getByText('Payer en ligne'));
    await waitFor(() => expect(api.post).toHaveBeenCalledWith('/payments/initialize', expect.objectContaining({
      eleve_id: 7, paiement_eleve_id: 3, amount: 20000, client: 'mobile',
    })));
    await waitFor(() => expect(ouvrir).toHaveBeenCalledWith('https://sandbox-process.fedapay.com/pay/x'));
    expect(screen.getByText(/Reste : 50 000 FCFA/)).toBeTruthy();
  });

  it('refuse un montant supérieur au reste sans appeler l’API', async () => {
    const alerte = jest.spyOn(Alert, 'alert').mockImplementation(() => {});
    monter();
    await screen.findByText(/AHO Kossi/);
    fireEvent.press(screen.getByText('Paiements'));
    fireEvent.changeText(await screen.findByLabelText('Montant à payer pour Scolarité T1'), '90000');
    fireEvent.press(screen.getByText('Payer en ligne'));
    expect(alerte).toHaveBeenCalledWith('Montant', expect.stringContaining('50 000 FCFA'));
    expect(api.post).not.toHaveBeenCalled();
  });

  it('écrit à un contact autorisé', async () => {
    monter();
    await screen.findByText(/AHO Kossi/);
    fireEvent.press(screen.getByText('Messages'));
    fireEvent.press(await screen.findByLabelText('Écrire à Mme DOSSOU'));
    fireEvent.changeText(await screen.findByLabelText('Votre message'), 'Bonjour madame');
    fireEvent.press(screen.getByText('Envoyer'));
    await waitFor(() => expect(api.post).toHaveBeenCalledWith('/messages', { destinataire: '12', contenu: 'Bonjour madame' }));
  });

  it('enregistre une préférence d’avis et refuse un mot de passe non confirmé', async () => {
    const alerte = jest.spyOn(Alert, 'alert').mockImplementation(() => {});
    monter();
    await screen.findByText(/AHO Kossi/);
    fireEvent.press(screen.getByText('Compte'));
    fireEvent(await screen.findByLabelText('Absences et retards'), 'valueChange', false);
    await waitFor(() => expect(api.put).toHaveBeenCalledWith('/parent/preferences', expect.objectContaining({ absences: false })));
    fireEvent.changeText(screen.getByLabelText('Nouveau mot de passe'), 'motdepasse1');
    fireEvent.changeText(screen.getByLabelText('Confirmer le nouveau mot de passe'), 'autrechose');
    fireEvent.press(screen.getByText('Changer le mot de passe'));
    expect(alerte).toHaveBeenCalledWith('Mot de passe', expect.any(String));
    expect(api.post).not.toHaveBeenCalledWith('/auth/change-password', expect.anything());
  });

  it('dit clairement qu’aucun enfant n’est rattaché', async () => {
    api.get.mockImplementation((url) => Promise.resolve({ data: url === '/parent/enfants' ? { success: true, data: [] } : { success: true, data: [] } }));
    monter();
    expect(await screen.findByText(/Aucun enfant n’est rattaché/)).toBeTruthy();
  });

  it('échappe les noms dans le bulletin imprimé', () => {
    const html = bulletinHtml({ periode: 'T1', data: [], rang: null }, '<script>x</script>', '6ème');
    expect(html).not.toContain('<script>x</script>');
    expect(html).toContain('&lt;script&gt;');
    expect(html).toContain('Aucune matière notée');
  });

  it('reprend tel quel le bulletin arrêté du web : même moyenne, coefficients et rang', () => {
    const html = bulletinHtml({ periode: 'Trimestre 2', moyenne_generale: '15.50', rang: 3, total_eleves: 6, mention: 'Bien',
      data: [{ matiere: 'Mathématiques', moyenne: 15.5, coefficient: 5, rang: 3 }] }, 'AHO Kossi', '6ème');
    expect(html).toContain('15,5/20');
    expect(html).toContain('<td>5</td>');
    expect(html).toContain('3/6');
  });
});
