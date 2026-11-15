/**
 * Espace parent mobile — parité avec le web (mission du 14/11/2026).
 * API simulée au niveau du client Axios ; les écrans sont les vrais.
 */
import React from 'react';
import { Alert, Linking } from 'react-native';
import { NavigationContainer } from '@react-navigation/native';
import { render, screen, fireEvent, waitFor } from '@testing-library/react-native';
import ParentEspace, { bulletinHtml, libelleSalle, nomCompte } from '../src/espaces/ParentEspace';
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
    expect(await screen.findByLabelText('Voir la scolarité de AHO Kossi')).toBeTruthy();
    expect(screen.getAllByText('AHO Kossi').length).toBeGreaterThan(0);
    expect(await screen.findByText('Aucun bulletin arrêté pour l’instant.')).toBeTruthy();
    expect(screen.queryByText(/0\/20/)).toBeNull();
    // Le compteur de l'API mêle absences et retards : le libellé le dit.
    expect(screen.getByLabelText('Absences et retards enregistrés : 2')).toBeTruthy();
  });

  it('montre la moyenne du dernier bulletin avec sa période, jamais la moyenne brute de l’API', async () => {
    api.get.mockImplementation((url) => Promise.resolve({ data: url === '/parent/enfants'
      ? { success: true, data: [{ ...REPONSES['/parent/enfants'].data[0], moyenne_generale: 9.5, rang: 12 }] }
      : url === '/bulletins'
        ? { success: true, data: [
          { id: 1, eleve_id: 7, periode: 'Trimestre 1', annee_scolaire: '2026-2027', moyenne_generale: '11.00', rang: 9, total_eleves: 30 },
          { id: 2, eleve_id: 7, periode: 'Trimestre 2', annee_scolaire: '2026-2027', moyenne_generale: '13.40', rang: 4, total_eleves: 30 },
          { id: 3, eleve_id: 99, periode: 'Trimestre 3', annee_scolaire: '2026-2027', moyenne_generale: '18.00', rang: 1, total_eleves: 30 },
        ] }
        : REPONSES[url] ?? { success: true, data: [] } }));
    monter();
    expect(await screen.findByLabelText('Moyenne · Trimestre 2 : 13,4/20')).toBeTruthy();
    expect(screen.getByLabelText('Rang : 4/30')).toBeTruthy();
    expect(screen.queryByText('9,5/20')).toBeNull();
    expect(screen.queryByText('18/20')).toBeNull();
  });

  it('présente quatre onglets ; le compte s’ouvre par la pastille d’initiales', async () => {
    monter();
    await screen.findByLabelText('Voir la scolarité de AHO Kossi');
    for (const nom of ['Accueil', 'Scolarité', 'Paiements', 'Messages']) expect(screen.getByRole('tab', { name: nom })).toBeTruthy();
    expect(screen.queryByRole('tab', { name: 'Compte' })).toBeNull();
    fireEvent.press(screen.getByRole('button', { name: 'Mon compte' }));
    expect(await screen.findByText('Avis par SMS')).toBeTruthy();
    // Le compte n'a ni pastille ni barre d'onglets : on en revient par la flèche.
    expect(screen.queryByRole('tab', { name: 'Accueil' })).toBeNull();
    fireEvent.press(screen.getByRole('button', { name: 'Retour à l’accueil' }));
    expect(await screen.findByRole('tab', { name: 'Accueil' })).toBeTruthy();
  });

  // Onglets maison (15/11/2026) : l'écran visité reste monté, son état est gardé.
  it('garde la vue choisie dans Scolarité quand on change d’onglet', async () => {
    monter();
    await screen.findByLabelText('Voir la scolarité de AHO Kossi');
    fireEvent.press(screen.getByRole('tab', { name: 'Scolarité' }));
    fireEvent.press(await screen.findByRole('tab', { name: 'Absences' }));
    fireEvent.press(screen.getByRole('tab', { name: 'Accueil' }));
    fireEvent.press(screen.getByRole('tab', { name: 'Scolarité' }));
    expect(screen.getByRole('tab', { name: 'Absences' }).props.accessibilityState.selected).toBe(true);
  });

  it('annonce sur l’accueil le reste total à payer, sans inventer d’échéance, et mène au paiement', async () => {
    monter();
    expect(await screen.findByLabelText('Reste à payer pour AHO Kossi : 50 000 FCFA')).toBeTruthy();
    // `date` est la date du dernier versement : la présenter comme une échéance serait faux.
    expect(screen.queryByText(/Échéance/)).toBeNull();
    expect(screen.getByText(/Dernier versement le/)).toBeTruthy();
    fireEvent.press(screen.getByRole('button', { name: 'Voir et payer les frais de AHO Kossi' }));
    expect(await screen.findByLabelText('Montant à payer pour Scolarité T1')).toBeTruthy();
    expect(screen.getByText('Payé 10 000 FCFA sur 60 000 FCFA · reste 50 000 FCFA')).toBeTruthy();
  });

  it('désigne les contacts par leur fonction et les regroupe', async () => {
    api.get.mockImplementation((url) => Promise.resolve({ data: url === '/messages/contacts'
      ? { success: true, data: [{ id: 12, name: 'Mme DOSSOU', role: 'enseignant' }, { id: 13, name: 'M. KIKI', role: 'directeurM' }] }
      : REPONSES[url] ?? { success: true, data: [] } }));
    monter();
    await screen.findByLabelText('Voir la scolarité de AHO Kossi');
    fireEvent.press(screen.getByRole('tab', { name: 'Messages' }));
    expect(await screen.findByText('Direction (maternelle)')).toBeTruthy();
    expect(screen.queryByText('directeurM')).toBeNull();
    expect(screen.getByText('Administration et services')).toBeTruthy();
    expect(screen.getByText('Enseignants')).toBeTruthy();
  });

  // Vu sur l'émulateur (15/11/2026) : élèves et parents rangés dans « Administration ».
  it('ne range ni élève ni parent dans l’administration', () => {
    const { groupeContact } = require('../src/espaces/commun');
    expect(groupeContact('directeurM')).toBe('Administration et services');
    expect(groupeContact('enseignementP')).toBe('Enseignants');
    expect(groupeContact('parent')).toBe('Parents');
    expect(groupeContact('eleve')).toBe('Élèves et étudiants');
    expect(groupeContact('etudiant')).toBe('Élèves et étudiants');
  });

  it('ouvre le paiement en ligne depuis le mobile, retour dans l’application', async () => {
    const ouvrir = jest.spyOn(Linking, 'openURL').mockResolvedValue(true);
    monter();
    await screen.findByLabelText('Voir la scolarité de AHO Kossi');
    fireEvent.press(screen.getByRole('tab', { name: 'Paiements' }));
    fireEvent.changeText(await screen.findByLabelText('Montant à payer pour Scolarité T1'), '20000');
    fireEvent.press(screen.getByRole('button', { name: 'Payer en ligne' }));
    await waitFor(() => expect(api.post).toHaveBeenCalledWith('/payments/initialize', expect.objectContaining({
      eleve_id: 7, paiement_eleve_id: 3, amount: 20000, client: 'mobile',
    })));
    await waitFor(() => expect(ouvrir).toHaveBeenCalledWith('https://sandbox-process.fedapay.com/pay/x'));
    expect(screen.getByLabelText('Reste à payer : 50 000 FCFA')).toBeTruthy();
  });

  it('refuse un montant supérieur au reste sans appeler l’API', async () => {
    const alerte = jest.spyOn(Alert, 'alert').mockImplementation(() => {});
    monter();
    await screen.findByLabelText('Voir la scolarité de AHO Kossi');
    fireEvent.press(screen.getByRole('tab', { name: 'Paiements' }));
    fireEvent.changeText(await screen.findByLabelText('Montant à payer pour Scolarité T1'), '90000');
    fireEvent.press(screen.getByRole('button', { name: 'Payer en ligne' }));
    expect(alerte).toHaveBeenCalledWith('Montant', expect.stringContaining('50 000 FCFA'));
    expect(api.post).not.toHaveBeenCalled();
  });

  it('écrit à un contact autorisé', async () => {
    monter();
    await screen.findByLabelText('Voir la scolarité de AHO Kossi');
    fireEvent.press(screen.getByRole('tab', { name: 'Messages' }));
    fireEvent.press(await screen.findByLabelText('Écrire à Mme DOSSOU'));
    fireEvent.changeText(await screen.findByLabelText('Votre message'), 'Bonjour madame');
    fireEvent.press(screen.getByRole('button', { name: 'Envoyer' }));
    await waitFor(() => expect(api.post).toHaveBeenCalledWith('/messages', { destinataire: '12', contenu: 'Bonjour madame' }));
  });

  it('enregistre une préférence d’avis et refuse un mot de passe non confirmé', async () => {
    const alerte = jest.spyOn(Alert, 'alert').mockImplementation(() => {});
    monter();
    await screen.findByLabelText('Voir la scolarité de AHO Kossi');
    fireEvent.press(screen.getByRole('button', { name: 'Mon compte' }));
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

  // Vu sur l'émulateur avec les données de recette (15/11/2026).
  it('n’écrit ni « salle Salle 8 » ni un prénom en double', () => {
    expect(libelleSalle('Salle 8')).toBe('Salle 8');
    expect(libelleSalle('8')).toBe('salle 8');
    expect(libelleSalle(null)).toBe('');
    expect(nomCompte({ prenom: 'Enseignant', name: 'Enseignant Complexe Scolaire' })).toBe('Enseignant Complexe Scolaire');
    expect(nomCompte({ prenom: 'Afi', name: 'AHO' })).toBe('Afi AHO');
  });
});
