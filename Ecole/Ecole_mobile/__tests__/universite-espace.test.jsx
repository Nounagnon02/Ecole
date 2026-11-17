/**
 * Espaces universitaires du mobile (décision du 16/11/2026).
 * API simulée au niveau du client Axios ; écrans et stockage réels.
 */
import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import {
  CopiesDevoir, NotesUniversite, Planning, Releve, RemiseDevoir, etatDevoir, jourIso, libelleDate, statutUe,
} from '../src/espaces/UniversiteEspace';
import { ThemeProvider } from '../src/theme';
import { api } from '../src/services/api';
import { listeBrouillons } from '../src/services/secureStorage';

jest.mock('../src/services/api', () => ({ api: { get: jest.fn(), post: jest.fn(), put: jest.fn() } }));
jest.mock('expo-document-picker', () => ({ getDocumentAsync: jest.fn() }));
jest.mock('expo-file-system', () => ({ readAsStringAsync: jest.fn() }));
jest.mock('../src/context/AuthContext', () => ({ useAuth: () => ({ user: { id: 5, name: 'Hounkpè', role: 'etudiant' }, logout: jest.fn() }) }));

const monter = (element) => render(<ThemeProvider>{element}</ThemeProvider>);

beforeEach(async () => {
  jest.clearAllMocks();
  await AsyncStorage.clear();
});

/* ─── Relevé ───────────────────────────────────────────────────────────── */
const RELEVE = { success: true, data: {
  etudiant: { matricule: 'ETU0001', nom: 'Afi HOUNKPÈ', filiere: 'Informatique', niveau: 'Licence' },
  regles: { poids_examen: 0.6, seuil_validation: 10 },
  provisoire: true,
  semestres: [{
    semestre_id: 3, libelle: 'S1', moyenne: 10.33, credits_total: 9, credits_acquis: 4, complet: false,
    ues: [
      { matiere_id: 1, code: 'UE101', intitule: 'Algorithmique', credit: 4, enseignant: 'Codjo AHOUANSOU', controle_continu: 13, examen: 10, moyenne: 11.2, complete: true, validee: true,
        notes: [{ type: 'CC', note: 12, date: '2026-10-02' }, { type: 'TP', note: 14, date: '2026-10-20' }, { type: 'Examen', note: 10, date: '2026-11-10' }] },
      { matiere_id: 2, code: 'UE102', intitule: 'Statistiques', credit: 2, enseignant: null, controle_continu: 8, examen: 9, moyenne: 8.6, complete: true, validee: false, notes: [{ type: 'CC', note: 8, date: '2026-10-05' }, { type: 'Examen', note: 9, date: '2026-11-11' }] },
      { matiere_id: 3, code: 'UE103', intitule: 'Droit du numérique', credit: 3, enseignant: null, controle_continu: 15, examen: null, moyenne: 15, complete: false, validee: null, notes: [{ type: 'CC', note: 15, date: '2026-10-07' }] },
    ],
  }],
} };

describe('relevé de l’étudiant', () => {
  it('affiche le relevé provisoire : règles, moyenne du semestre, crédits et statut de chaque UE', async () => {
    api.get.mockResolvedValue({ data: RELEVE });
    monter(<Releve />);

    expect(await screen.findByText('Relevé provisoire')).toBeTruthy();
    expect(api.get).toHaveBeenCalledWith('/universite/mes-notes');
    expect(screen.getByText(/délibération du jury/)).toBeTruthy();
    expect(screen.getByText(/40 % contrôle continu \(CC, TP\), 60 % examen · UE validée à 10\/20/)).toBeTruthy();
    expect(screen.getByText('10,33/20')).toBeTruthy();
    expect(screen.getByText('4/9')).toBeTruthy();
    expect(screen.getByText('UE101 · Algorithmique')).toBeTruthy();
    expect(screen.getByText('Validée')).toBeTruthy();
    expect(screen.getByText('Non validée')).toBeTruthy();
    expect(screen.getByText('En cours')).toBeTruthy();
    expect(screen.getByText('4 crédits · CC 13 · Examen 10')).toBeTruthy();
  });

  it('déplie le détail des notes d’une UE', async () => {
    api.get.mockResolvedValue({ data: RELEVE });
    monter(<Releve />);
    fireEvent.press(await screen.findByLabelText('UE101 Algorithmique : 11,2/20, Validée'));
    expect(screen.getByText('Enseignant : Codjo AHOUANSOU')).toBeTruthy();
    expect(screen.getByText('TP du 20/10/2026 : 14/20')).toBeTruthy();
  });

  it('montre le message de l’API quand aucun dossier étudiant n’est rattaché', async () => {
    api.get.mockRejectedValue({ response: { status: 404, data: { message: 'Aucun dossier étudiant n’est rattaché à ce compte. Adressez-vous à la scolarité.' } } });
    monter(<Releve />);
    expect(await screen.findByText(/Adressez-vous à la scolarité/)).toBeTruthy();
    expect(screen.queryByText('Relevé provisoire')).toBeNull();
  });

  it('classe une UE : validée, non validée, en cours ou sans note', () => {
    expect(statutUe({ validee: true, notes: [] }).texte).toBe('Validée');
    expect(statutUe({ validee: false, notes: [] }).texte).toBe('Non validée');
    expect(statutUe({ validee: null, notes: [{}] }).texte).toBe('En cours');
    expect(statutUe({ validee: null, notes: [] }).texte).toBe('Pas de note');
  });
});

/* ─── Saisie des notes du professeur ───────────────────────────────────── */
const COURS_PROF = { success: true, data: [{ id: 7, code: 'UE201', intitule: 'Bases de données', credit: 4, filiere: 'Informatique', etudiants: 2 }] };
const GRILLE = { success: true, data: {
  matiere: { id: 7, code: 'UE201' },
  etudiants: [{ id: 41, matricule: 'ETU41', nom: 'AGOSSOU', prenom: 'Rémi' }, { id: 42, matricule: 'ETU42', nom: 'ZINSOU', prenom: 'Bella' }],
  notes: [{ etudiant_id: 42, note: 11 }],
} };

function apiProfesseur() {
  api.get.mockImplementation((url) => Promise.resolve({ data: url === '/universite/mes-cours' ? COURS_PROF : url.startsWith('/universite/matieres/7/grille') ? GRILLE : { data: [] } }));
}

describe('saisie des notes du professeur', () => {
  it('charge la grille de l’évaluation et n’envoie que les notes nouvelles ou changées, en un envoi', async () => {
    apiProfesseur();
    api.post.mockResolvedValue({ data: { success: true, enregistrees: 1 } });
    monter(<NotesUniversite />);

    const champ = await screen.findByLabelText('Note de AGOSSOU Rémi');
    expect(api.get).toHaveBeenCalledWith(`/universite/matieres/7/grille?type=CC&date=${jourIso(0)}`);
    expect(screen.getByText('Enregistrée : 11/20')).toBeTruthy();
    fireEvent.changeText(champ, '14,5');
    fireEvent.press(screen.getByText('Enregistrer 1 note(s)'));

    await waitFor(() => expect(api.post).toHaveBeenCalledWith('/universite/notes/lot', {
      matiere_id: 7, type: 'CC', date_evaluation: jourIso(0), notes: [{ etudiant_id: 41, note: 14.5 }],
    }));
    expect(await screen.findByText('1 note(s) enregistrée(s).')).toBeTruthy();
    expect(await listeBrouillons()).toEqual([]);
  });

  it('change d’évaluation : l’examen a sa propre grille', async () => {
    apiProfesseur();
    monter(<NotesUniversite />);
    await screen.findByLabelText('Note de AGOSSOU Rémi');
    fireEvent.press(screen.getByRole('tab', { name: 'Examen' }));
    await waitFor(() => expect(api.get).toHaveBeenCalledWith(`/universite/matieres/7/grille?type=Examen&date=${jourIso(0)}`));
  });

  it('hors connexion, garde le brouillon et ne l’annonce pas enregistré', async () => {
    apiProfesseur();
    api.post.mockRejectedValue(new Error('Network Error'));
    monter(<NotesUniversite />);
    fireEvent.changeText(await screen.findByLabelText('Note de AGOSSOU Rémi'), '9');
    fireEvent.press(screen.getByText('Enregistrer 1 note(s)'));
    expect(await screen.findByText(/Hors connexion : notes gardées sur le téléphone, non enregistrées/)).toBeTruthy();
    expect(screen.queryByText(/note\(s\) enregistrée\(s\)\./)).toBeNull();
    expect((await listeBrouillons()).length).toBe(1);
  });

  it('bloque une note hors de 0 à 20 sans rien envoyer', async () => {
    apiProfesseur();
    monter(<NotesUniversite />);
    fireEvent.changeText(await screen.findByLabelText('Note de AGOSSOU Rémi'), '21');
    expect(screen.getByText('Note entre 0 et 20')).toBeTruthy();
    fireEvent.press(screen.getByText('Enregistrer 0 note(s)'));
    expect(api.post).not.toHaveBeenCalled();
  });
});

/* ─── Devoirs ──────────────────────────────────────────────────────────── */
describe('devoirs universitaires', () => {
  const devoir = { id: 9, titre: 'Modéliser une bibliothèque', description: 'Diagramme entité-association.', cours: { code: 'UE201' }, date_limite: '2026-11-30T23:59:00+01:00', ma_soumission: null };

  it('l’étudiant rend une réponse écrite ; « rendu » n’apparaît qu’après la réponse du serveur', async () => {
    let repondre;
    api.post.mockImplementation(() => new Promise((r) => { repondre = r; }));
    monter(<RemiseDevoir devoir={devoir} onRetour={() => {}} />);
    expect(screen.getByRole('button', { name: 'Rendre le devoir' }).props.accessibilityState?.disabled).toBe(true);
    fireEvent.changeText(screen.getByLabelText('Votre réponse'), 'Voir le schéma joint.');
    fireEvent.press(screen.getByRole('button', { name: 'Rendre le devoir' }));
    expect(api.post).toHaveBeenCalledWith('/universite/devoirs/9/soumettre', { reponse: 'Voir le schéma joint.' });
    expect(screen.queryByText(/Devoir rendu/)).toBeNull();
    repondre({ data: { success: true } });
    expect(await screen.findByText(/Devoir rendu/)).toBeTruthy();
  });

  it('hors connexion, dit que le devoir n’a pas été rendu', async () => {
    api.post.mockRejectedValue(new Error('Network Error'));
    monter(<RemiseDevoir devoir={devoir} onRetour={() => {}} />);
    fireEvent.changeText(screen.getByLabelText('Votre réponse'), 'Réponse');
    fireEvent.press(screen.getByRole('button', { name: 'Rendre le devoir' }));
    expect(await screen.findByText(/Hors connexion : le devoir n’a pas été rendu/)).toBeTruthy();
  });

  it('un devoir noté montre la note et ferme la remise', () => {
    monter(<RemiseDevoir devoir={{ ...devoir, ma_soumission: { rendu: true, note: 15, commentaire: 'Bon travail.' } }} onRetour={() => {}} />);
    expect(screen.getByText('Note : 15/20')).toBeTruthy();
    expect(screen.getByText('Bon travail.')).toBeTruthy();
    expect(screen.queryByRole('button', { name: 'Rendre le devoir' })).toBeNull();
  });

  it('classe un devoir : noté, rendu, en retard, à rendre', () => {
    const maintenant = new Date('2026-11-20T10:00:00Z').getTime();
    expect(etatDevoir({ ma_soumission: { rendu: true, note: 12 } }, maintenant).texte).toBe('Noté 12/20');
    expect(etatDevoir({ ma_soumission: { rendu: true, note: null } }, maintenant).texte).toBe('Rendu');
    expect(etatDevoir({ date_limite: '2026-11-19T23:59:00Z', ma_soumission: null }, maintenant).texte).toBe('En retard');
    expect(etatDevoir({ date_limite: '2026-11-30T23:59:00Z', ma_soumission: null }, maintenant).texte).toBe('À rendre');
  });

  it('un détail sans liste de copies affiche un état vide, pas un écran blanc', async () => {
    api.get.mockResolvedValue({ data: { success: true, data: { id: 9, soumissions: 1, total_etudiants: 2 } } });
    monter(<CopiesDevoir devoir={devoir} onRetour={() => {}} />);
    expect(await screen.findByText('Aucun étudiant concerné par ce devoir.')).toBeTruthy();
  });

  it('le professeur note une copie rendue', async () => {
    api.get.mockResolvedValue({ data: { success: true, data: { id: 9, soumissions: 1, total_etudiants: 2, copies: [
      { etudiant_id: 41, nom: 'Rémi AGOSSOU', rendu: true, note: null, date_remise: '2026-11-18T09:00:00Z' },
      { etudiant_id: 42, nom: 'Bella ZINSOU', rendu: false, note: null, date_remise: null },
    ] } } });
    api.post.mockResolvedValue({ data: { success: true } });
    monter(<CopiesDevoir devoir={devoir} onRetour={() => {}} />);

    fireEvent.changeText(await screen.findByLabelText('Note de Rémi AGOSSOU'), '16');
    // Constaté sur l'émulateur : « 1/2 copies rendue ».
    expect(screen.getByText('1 copie rendue sur 2')).toBeTruthy();
    expect(screen.queryByLabelText('Note de Bella ZINSOU')).toBeNull();
    fireEvent.press(screen.getByRole('button', { name: 'Noter Rémi AGOSSOU' }));
    await waitFor(() => expect(api.post).toHaveBeenCalledWith('/universite/devoirs/9/etudiants/41/noter', { note: 16 }));
  });
});

/* ─── Planning ─────────────────────────────────────────────────────────── */
describe('planning universitaire', () => {
  it('demande les séances du professeur seul et les regroupe par date', async () => {
    const demain = jourIso(1);
    api.get.mockResolvedValue({ data: { success: true, data: [
      { id: 1, date: demain, heure_debut: '08:00', heure_fin: '10:00', salle: 'Amphi A', type: 'cours', statut: 'planifie', matiere: { code: 'UE201' }, filiere: { nom: 'Informatique' } },
      { id: 2, date: demain, heure_debut: '14:00', heure_fin: '16:00', salle: null, type: 'td', statut: 'annule', matiere: { code: 'UE202' }, filiere: { nom: 'Informatique' } },
    ] } });
    monter(<Planning perso />);

    const libelle = libelleDate(demain);
    expect(await screen.findByText(libelle.charAt(0).toUpperCase() + libelle.slice(1))).toBeTruthy();
    expect(api.get.mock.calls[0][0]).toContain('perso=1');
    expect(api.get.mock.calls[0][0]).toContain(`date_debut=${jourIso(0)}`);
    expect(screen.getByText('Cours · UE201 · Informatique')).toBeTruthy();
    expect(screen.getByText('Annulé · TD · UE202 · Informatique')).toBeTruthy();
  });

  it('l’étudiant voit le planning de sa filière, sans le filtre du professeur', async () => {
    api.get.mockResolvedValue({ data: { success: true, data: [] } });
    monter(<Planning />);
    expect(await screen.findByText('Aucune séance programmée pour votre filière dans les deux prochaines semaines.')).toBeTruthy();
    expect(api.get.mock.calls[0][0]).not.toContain('perso');
  });
});
