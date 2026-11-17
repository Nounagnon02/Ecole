/**
 * Relevé de l'étudiant sur le web (17/11/2026) — parité avec le mobile.
 * Constaté : l'étudiant n'avait aucune page de notes sur le web.
 */
import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { render, screen, fireEvent, within } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { QueryClientProvider } from '@tanstack/react-query';
import MesNotesPage from '@/app/features/universite/MesNotesPage';
import { getRoleNavigation } from '@/features/roles/navigation-config';
import { installHttpMock } from './helpers/http-mock';
import { makeQueryClient, signIn } from './helpers/render';

let http;
const RELEVE = { success: true, data: {
  etudiant: { matricule: 'ETU1', nom: 'Euloge TOSSAVI', filiere: 'Licence Informatique', niveau: 'Licence' },
  regles: { poids_examen: 0.6, seuil_validation: 10 }, provisoire: true,
  semestres: [
    { semestre_id: 1, libelle: 'Semestre 1', moyenne: 10.64, credits_total: 12, credits_acquis: 9, complet: true, ues: [
      { matiere_id: 11, code: 'INF101', intitule: 'Algorithmique', credit: 4, enseignant: 'Vincent KODJOGBÉ', controle_continu: 11.85, examen: 11.5, moyenne: 11.64, complete: true, validee: true,
        notes: [{ type: 'CC', note: 11.8, date: '2026-09-22' }, { type: 'Examen', note: 11.5, date: '2026-11-09' }] },
      { matiere_id: 12, code: 'INF102', intitule: 'Architecture', credit: 3, enseignant: null, controle_continu: 5.95, examen: 11.5, moyenne: 9.28, complete: true, validee: false, notes: [] },
    ] },
    { semestre_id: 2, libelle: 'Semestre 2', moyenne: null, credits_total: 4, credits_acquis: 0, complet: false, ues: [
      { matiere_id: 21, code: 'INF201', intitule: 'Réseaux', credit: 4, enseignant: null, controle_continu: 14, examen: null, moyenne: 14, complete: false, validee: null, notes: [{ type: 'TP', note: 14, date: '2026-11-12' }] },
    ] },
  ],
} };

beforeEach(() => { http = installHttpMock(); vi.spyOn(console, 'error').mockImplementation(() => {}); signIn('etudiant'); });
afterEach(() => { http.restore(); vi.restoreAllMocks(); });

const monter = () => render(<QueryClientProvider client={makeQueryClient()}><MemoryRouter><MesNotesPage /></MemoryRouter></QueryClientProvider>);

describe('MesNotesPage', () => {
  it('montre le relevé provisoire du dernier semestre : règles, moyenne partielle, statut', async () => {
    http.onGet('/universite/mes-notes').reply(200, RELEVE);
    monter();
    expect(await screen.findByText('Relevé provisoire')).toBeInTheDocument();
    expect(screen.getByText(/délibération du jury/)).toBeInTheDocument();
    expect(screen.getByText(/40 % contrôle continu \(CC, TP\), 60 % examen · UE validée à 10\/20/)).toBeInTheDocument();
    expect(screen.getByText('INF201 · Réseaux')).toBeInTheDocument();
    expect(screen.getByText('En cours')).toBeInTheDocument();
    expect(screen.getByText('0/4')).toBeInTheDocument();
    expect(screen.getByText(/seules UE dont l’examen est noté/)).toBeInTheDocument();
  });

  it('change de semestre et déplie le détail d’une UE', async () => {
    http.onGet('/universite/mes-notes').reply(200, RELEVE);
    monter();
    fireEvent.click(await screen.findByRole('tab', { name: 'Semestre 1' }));
    expect(screen.getByText('10,64/20')).toBeInTheDocument();
    expect(screen.getByText('9/12')).toBeInTheDocument();
    const ligne = screen.getByText('INF102 · Architecture').closest('tr');
    expect(within(ligne).getByText('Non validée')).toBeInTheDocument();
    expect(within(ligne).getByText('9,28/20')).toBeInTheDocument();
    fireEvent.click(screen.getByRole('button', { name: /Détail de INF101/ }));
    expect(screen.getByText('Enseignant : Vincent KODJOGBÉ')).toBeInTheDocument();
    expect(screen.getByText(/Examen — .* : 11,5\/20/)).toBeInTheDocument();
  });

  it('dit ce qui manque quand aucun dossier étudiant n’est rattaché', async () => {
    http.onGet('/universite/mes-notes').reply(404, { success: false, message: 'Aucun dossier étudiant n’est rattaché à ce compte. Adressez-vous à la scolarité.' });
    monter();
    expect(await screen.findByRole('alert')).toHaveTextContent(/Adressez-vous à la scolarité/);
  });

  it('apparaît dans le menu de l’étudiant seulement', () => {
    expect(getRoleNavigation('etudiant').map((i) => i.path)).toContain('/universite/mes-notes');
    for (const role of ['professeur', 'recteur', 'doyen', 'eleve', 'parent']) {
      expect(getRoleNavigation(role).map((i) => i.path)).not.toContain('/universite/mes-notes');
    }
  });
});
