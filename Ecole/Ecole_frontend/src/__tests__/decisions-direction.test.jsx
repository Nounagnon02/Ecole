/**
 * Tableau de bord de la direction — « À décider » (recommandation D8).
 *
 * Trois listes qui appellent une action, chacune avec « Relancer » :
 * impayés par classe, notes non saisies, absences non justifiées.
 */

import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { render, screen, fireEvent, waitFor, within } from '@testing-library/react';
import { QueryClientProvider } from '@tanstack/react-query';
import ADecider from '@/app/dashboards/directeur/ADecider';
import { installHttpMock } from './helpers/http-mock';
import { makeQueryClient } from './helpers/render';

const PATH = '/directeur/decisions';
const DONNEES = {
  impayes: [{ classe_id: 3, classe: '6e A', eleves: 4, montant_du: 120000 }],
  notes_manquantes: [{ affectation_id: 9, enseignant: 'Paul AGBO', classe: '5e B', matiere: 'Mathématiques', derniere_note: null }],
  absences: [{ eleve_id: 21, eleve: 'Rose ADJOVI', classe: '4e C', absences: 3, depuis: '2026-11-02' }],
};

let http;

beforeEach(() => {
  http = installHttpMock();
  vi.spyOn(console, 'error').mockImplementation(() => {});
});

afterEach(() => {
  http.restore();
  vi.restoreAllMocks();
});

function monter() {
  return render(
    <QueryClientProvider client={makeQueryClient()}>
      <ADecider />
    </QueryClientProvider>,
  );
}

describe('À décider', () => {
  it('montre les trois listes avec ce qu’il faut savoir pour agir', async () => {
    http.onGet(PATH).reply(200, DONNEES);
    monter();

    expect(await screen.findByText('6e A')).toBeInTheDocument();
    expect(screen.getByText(/4 élèves/)).toBeInTheDocument();
    expect(screen.getByText(/120\s000/)).toBeInTheDocument();
    expect(screen.getByText(/Mathématiques/)).toBeInTheDocument();
    expect(screen.getByText(/Paul AGBO/)).toBeInTheDocument();
    expect(screen.getByText('Rose ADJOVI')).toBeInTheDocument();
    expect(screen.getByText(/3 absences/)).toBeInTheDocument();
  });

  it('relance la cible choisie et le dit sur la ligne', async () => {
    http.onGet(PATH).reply(200, DONNEES);
    http.onPost(`${PATH}/relancer`).reply(200, { envoyes: 4, message: 'Relance envoyée.' });
    monter();

    const ligne = (await screen.findByText('6e A')).closest('li');
    fireEvent.click(within(ligne).getByRole('button', { name: /Relancer/ }));

    await waitFor(() => expect(within(ligne).getByRole('status')).toHaveTextContent('Relance envoyée'));
    expect(http.callsTo('post', `${PATH}/relancer`)[0].body).toEqual({ type: 'impayes', id: 3 });
  });

  it('dit qu’une relance a déjà été faite aujourd’hui', async () => {
    http.onGet(PATH).reply(200, DONNEES);
    http.onPost(`${PATH}/relancer`).reply(409, { message: 'Déjà relancé aujourd’hui.' });
    monter();

    const ligne = (await screen.findByText('Rose ADJOVI')).closest('li');
    fireEvent.click(within(ligne).getByRole('button', { name: /Relancer/ }));

    await waitFor(() => expect(within(ligne).getByRole('status')).toHaveTextContent('Déjà relancé aujourd’hui'));
  });

  it('n’annonce pas « envoyée » une relance mise en file sans réseau', async () => {
    http.onGet(PATH).reply(200, DONNEES);
    http.onPost(`${PATH}/relancer`).reply(202, { queued: true });
    monter();

    const ligne = (await screen.findByText(/Mathématiques/)).closest('li');
    fireEvent.click(within(ligne).getByRole('button', { name: /Relancer/ }));

    await waitFor(() => expect(within(ligne).getByRole('status')).toHaveTextContent(/attente du réseau/));
  });

  it('dit que tout est à jour quand il n’y a rien à décider', async () => {
    http.onGet(PATH).reply(200, { impayes: [], notes_manquantes: [], absences: [] });
    monter();

    expect(await screen.findAllByText('Rien à signaler.')).toHaveLength(3);
  });
});
