/**
 * NotesPage — lecture des notes
 *
 * L'API répond par une enveloppe contenant un paginateur Laravel
 * (`{ success, data: { data: [...], current_page, last_page, total } }`).
 * La page n'acceptait qu'un tableau dans `data` : avec 641 notes en base,
 * elle affichait « Total évaluations 0 » et « Aucune note trouvée », sans
 * erreur. Personne ne voyait les notes.
 */

import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { QueryClientProvider } from '@tanstack/react-query';
import NotesPage from '@/app/features/notes/NotesPage';
import { installHttpMock } from './helpers/http-mock';
import { makeQueryClient, signIn } from './helpers/render';
import { ROLES } from '@/shared/types/roles';

let http;

const note = (id, nom, valeur) => ({
  id, note: valeur, note_sur: '20.00', type_evaluation: 'Devoir1', periode: 'Trimestre 1',
  date_evaluation: '2026-11-10T00:00:00.000000Z', locked: false,
  eleve: { id, user: { name: nom, prenom: 'Test' } },
  matiere: { id: 2, nom: 'Mathématiques' }, classe: { id: 3, nom_classe: '4ème A' },
});
const page = (items, current, last, total) => ({
  success: true,
  data: { data: items, current_page: current, last_page: last, per_page: 50, total },
});

function monter() {
  return render(
    <QueryClientProvider client={makeQueryClient()}>
      <MemoryRouter><NotesPage /></MemoryRouter>
    </QueryClientProvider>,
  );
}

beforeEach(() => {
  http = installHttpMock();
  vi.spyOn(console, 'error').mockImplementation(() => {});
  signIn(ROLES.DIRECTEUR);
});

afterEach(() => {
  http.restore();
  vi.restoreAllMocks();
});

describe('NotesPage — réponse paginée de l’API', () => {
  it('affiche les notes contenues dans le paginateur', async () => {
    http.onGet('/notes/eleve').reply(200, page([note(1, 'AGBODJAN', '14.50'), note(2, 'DOSSOU', '8.00')], 1, 1, 2));

    monter();

    expect(await screen.findByText(/AGBODJAN/)).toBeInTheDocument();
    expect(screen.getByText(/DOSSOU/)).toBeInTheDocument();
    expect(screen.queryByText(/Aucune note trouvée/i)).not.toBeInTheDocument();
  });

  it('annonce le nombre total de notes, pas celui de la page affichée', async () => {
    http.onGet('/notes/eleve').reply(200, page([note(1, 'AGBODJAN', '14.50')], 1, 13, 641));

    monter();

    await screen.findByText(/AGBODJAN/);
    expect(screen.getByText('641')).toBeInTheDocument();
    expect(screen.getByText(/Page 1 sur 13/)).toBeInTheDocument();
  });

  it('charge la page suivante à la demande', async () => {
    http.onGet('/notes/eleve').reply(200, page([note(1, 'AGBODJAN', '14.50')], 1, 2, 51));

    monter();
    await screen.findByText(/AGBODJAN/);
    // Le simulateur ne garde qu'une réponse par route : on la remplace avant le clic.
    http.onGet('/notes/eleve').reply(200, page([note(51, 'ZINSOU', '12.00')], 2, 2, 51));
    fireEvent.click(screen.getByRole('button', { name: /Page suivante/i }));

    expect(await screen.findByText(/ZINSOU/)).toBeInTheDocument();
    const appels = http.callsTo('get', '/notes/eleve');
    expect(appels[appels.length - 1].url).toContain('page=2');
    await waitFor(() => expect(screen.getByText(/Page 2 sur 2/)).toBeInTheDocument());
  });

  it('accepte encore un simple tableau (ancienne forme de réponse)', async () => {
    http.onGet('/notes/eleve').reply(200, { success: true, data: [note(1, 'AGBODJAN', '14.50')] });

    monter();

    expect(await screen.findByText(/AGBODJAN/)).toBeInTheDocument();
  });

  it('sans aucune note, n’affiche pas un taux d’échec de 100 %', async () => {
    http.onGet('/notes/eleve').reply(200, page([], 1, 1, 0));

    monter();

    expect(await screen.findByText(/Aucune note trouvée/i)).toBeInTheDocument();
    expect(screen.queryByText('100%')).not.toBeInTheDocument();
  });

  it('ne propose de verrouiller une note qu’à la direction et aux enseignants', async () => {
    http.onGet('/notes/eleve').reply(200, page([note(1, 'AGBODJAN', '14.50')], 1, 1, 1));

    signIn(ROLES.PARENT);
    const { unmount } = monter();
    await screen.findByText(/AGBODJAN/);
    expect(screen.queryByRole('button', { name: /^Verrouiller$/i })).not.toBeInTheDocument();
    unmount();

    signIn(ROLES.ENSEIGNANT);
    monter();
    await screen.findByText(/AGBODJAN/);
    expect(screen.getByRole('button', { name: /^Verrouiller$/i })).toBeInTheDocument();
  });
});
