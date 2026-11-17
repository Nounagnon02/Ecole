/**
 * Page Notes (web et desktop) — lisibilité, constatée sur le desktop le 17/11/2026 :
 * « 13.00/20.00 » au lieu de « 13/20 », moyenne « 12.24/20 », type brut
 * « Devoir1 » (le mobile affiche « Devoir 1 »), et deux cadenas de sens
 * contraires côte à côte (l'état dans « Statut », l'action inverse dans
 * « Action »).
 */
import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { render, screen, within } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { QueryClientProvider } from '@tanstack/react-query';
import NotesPage from '@/app/features/notes/NotesPage';
import { libelleEvaluation, noteSur } from '@/shared/lib/utils';
import { installHttpMock } from './helpers/http-mock';
import { makeQueryClient, signIn } from './helpers/render';
import { ROLES } from '@/shared/types/roles';

let http;
const note = (id, nom, valeur, extra = {}) => ({
  id, note: valeur, note_sur: '20.00', type_evaluation: 'Devoir1', periode: 'Trimestre 1',
  date_evaluation: '2026-11-10T00:00:00.000000Z', locked: false,
  eleve: { id, user: { name: nom, prenom: 'Test' } },
  matiere: { id: 2, nom: 'Mathématiques' }, classe: { id: 3, nom_classe: '4ème A' }, ...extra,
});

beforeEach(() => {
  http = installHttpMock();
  vi.spyOn(console, 'error').mockImplementation(() => {});
  signIn(ROLES.DIRECTEUR);
});
afterEach(() => { http.restore(); vi.restoreAllMocks(); });

const monter = () => render(
  <QueryClientProvider client={makeQueryClient()}><MemoryRouter><NotesPage /></MemoryRouter></QueryClientProvider>,
);

describe('formats partagés', () => {
  it('écrit une note à la française, sans zéros inutiles', () => {
    expect(noteSur('13.00', '20.00')).toBe('13/20');
    expect(noteSur('12.5')).toBe('12,5/20');
    expect(noteSur(12.246)).toBe('12,25/20');
    expect(noteSur(null)).toBe('—');
    expect(noteSur('abc')).toBe('—');
  });

  it('nomme les évaluations comme le mobile', () => {
    expect(libelleEvaluation('Devoir1')).toBe('Devoir 1');
    expect(libelleEvaluation('1ère evaluation')).toBe('1re évaluation');
    expect(libelleEvaluation('3ème evaluation')).toBe('3e évaluation');
    expect(libelleEvaluation('Interrogation')).toBe('Interrogation');
  });
});

describe('NotesPage — lisibilité', () => {
  it('affiche « 13/20 », « Devoir 1 » et une moyenne à virgule', async () => {
    http.onGet('/notes/eleve').reply(200, { success: true, data: {
      data: [note(1, 'AGBODJAN', '13.00'), note(2, 'DOSSOU', '11.50', { locked: true })],
      current_page: 1, last_page: 1, per_page: 50, total: 2,
    }, stats: { total: 2, moyenne: 12.24, taux_reussite: 100 } });
    monter();

    const ligne = (await screen.findByText(/AGBODJAN/)).closest('tr');
    expect(within(ligne).getByText('13/20')).toBeInTheDocument();
    expect(within(ligne).getByText('Devoir 1')).toBeInTheDocument();
    expect(screen.queryByText(/20\.00/)).not.toBeInTheDocument();
    expect(screen.queryByText('Devoir1')).not.toBeInTheDocument();
    expect(screen.getByText('12,24/20')).toBeInTheDocument();
  });

  it('dit l’état en mots et l’action sur le bouton, sans deux cadenas contraires', async () => {
    http.onGet('/notes/eleve').reply(200, { success: true, data: {
      data: [note(1, 'AGBODJAN', '13.00'), note(2, 'DOSSOU', '11.50', { locked: true })],
      current_page: 1, last_page: 1, per_page: 50, total: 2,
    } });
    monter();

    const ouverte = (await screen.findByText(/AGBODJAN/)).closest('tr');
    expect(within(ouverte).getByText('Modifiable')).toBeInTheDocument();
    expect(within(ouverte).getByRole('button', { name: 'Verrouiller' })).toHaveTextContent('Verrouiller');

    const fermee = screen.getByText(/DOSSOU/).closest('tr');
    expect(within(fermee).getByText('Verrouillée')).toBeInTheDocument();
    expect(within(fermee).getByRole('button', { name: 'Déverrouiller' })).toHaveTextContent('Déverrouiller');
  });
});
