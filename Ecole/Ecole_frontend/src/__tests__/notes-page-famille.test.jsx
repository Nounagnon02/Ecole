/**
 * Page Notes vue par la famille — revue web du 16/11/2026.
 *
 * L'élève voyait la page du personnel : « Consultez et gérez les notes des
 * élèves », taux de réussite et d'échecs, onglets Classement et Bulletins
 * (refusés par l'API à son rôle), colonnes Élève et Classe répétant son nom,
 * colonne Action vide, et la date brute de l'API en UTC
 * (« 2026-11-15T23:00:00.000000Z » pour une note du 16/11).
 */
import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { QueryClientProvider } from '@tanstack/react-query';
import NotesPage from '@/app/features/notes/NotesPage';
import { installHttpMock } from './helpers/http-mock';
import { makeQueryClient, signIn } from './helpers/render';
import { ROLES } from '@/shared/types/roles';

const NOTE = {
  id: 1, note: '15.00', note_sur: '20.00', type_evaluation: 'Devoir2', periode: 'Trimestre 1',
  date_evaluation: '2026-11-15T23:00:00.000000Z', locked: false,
  eleve: { id: 1, user: { name: 'AGBODJAN', prenom: 'Yèhossou' } },
  matiere: { id: 2, nom: 'Mathématiques' }, classe: { id: 3, nom_classe: '3ème' },
};

let http;
beforeEach(() => {
  http = installHttpMock();
  vi.spyOn(console, 'error').mockImplementation(() => {});
  http.onGet('/notes/eleve').reply(200, { success: true, data: { data: [NOTE], current_page: 1, last_page: 1, per_page: 50, total: 1 } });
});
afterEach(() => { http.restore(); vi.restoreAllMocks(); });

const monter = () => render(
  <QueryClientProvider client={makeQueryClient()}><MemoryRouter><NotesPage /></MemoryRouter></QueryClientProvider>,
);

describe('NotesPage — famille', () => {
  it('montre à l’élève ses notes, sans outils du personnel', async () => {
    signIn(ROLES.ELEVE);
    monter();
    expect(await screen.findByText('Devoir2')).toBeInTheDocument();
    expect(screen.getByText('Vos notes, évaluation par évaluation')).toBeInTheDocument();
    expect(screen.queryByText(/gérez les notes/)).not.toBeInTheDocument();
    for (const absent of ['Classement', 'Bulletins', 'Taux de réussite', 'Échecs', 'Moyenne générale', 'Action']) {
      expect(screen.queryByText(absent)).not.toBeInTheDocument();
    }
    // Son propre nom et sa classe ne sont pas répétés à chaque ligne.
    expect(screen.queryByText(/AGBODJAN/)).not.toBeInTheDocument();
    expect(screen.queryByPlaceholderText(/Rechercher un élève/)).not.toBeInTheDocument();
  });

  it('garde le nom de l’enfant pour le parent', async () => {
    signIn(ROLES.PARENT);
    monter();
    expect(await screen.findByText(/AGBODJAN/)).toBeInTheDocument();
    expect(screen.getByText('Les notes de vos enfants, évaluation par évaluation')).toBeInTheDocument();
    expect(screen.queryByText('Classement')).not.toBeInTheDocument();
  });

  it('affiche la date d’évaluation en jour local de Porto-Novo, pour tous', async () => {
    signIn(ROLES.DIRECTEUR);
    monter();
    expect(await screen.findByText('16/11/2026')).toBeInTheDocument();
    expect(screen.queryByText('2026-11-15T23:00:00.000000Z')).not.toBeInTheDocument();
    // Le personnel garde ses outils.
    expect(screen.getByText('Classement')).toBeInTheDocument();
  });
});
