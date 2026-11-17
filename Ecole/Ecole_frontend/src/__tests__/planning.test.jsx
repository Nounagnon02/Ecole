/**
 * Planning du secrétariat (lot 6.4).
 */

import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { render, screen, fireEvent, waitFor, within } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { QueryClientProvider } from '@tanstack/react-query';
import PlanningPage from '@/app/features/secretaire/PlanningPage';
import { installHttpMock } from './helpers/http-mock';
import { makeQueryClient, signIn } from './helpers/render';

let http;
function monter() {
  signIn('secretaire');
  return render(<QueryClientProvider client={makeQueryClient()}><MemoryRouter><PlanningPage /></MemoryRouter></QueryClientProvider>);
}

beforeEach(() => {
  http = installHttpMock();
  vi.spyOn(console, 'error').mockImplementation(() => {});
  http.onGet('/secretaire/evenements').reply(200, { success: true, data: [
    { id: 3, titre: 'Conseil de classe 6ème', type: 'conseil', date_debut: '2026-12-10 15:00:00', date_fin: null, lieu: 'Salle B' },
  ] });
});
afterEach(() => { http.restore(); vi.restoreAllMocks(); });

describe('planning', () => {
  it('lit les routes du secrétariat, pas celles de la direction', async () => {
    monter();

    expect(await screen.findByText('Conseil de classe 6ème')).toBeInTheDocument();
    expect(http.callsTo('get', '/evenements')).toHaveLength(0);
  });

  it('crée un événement', async () => {
    http.onPost('/secretaire/evenements').reply(201, { success: true });
    monter();
    fireEvent.click(await screen.findByRole('button', { name: /Nouvel événement/ }));
    const d = await screen.findByRole('dialog');

    fireEvent.change(within(d).getByLabelText(/^Titre/), { target: { value: 'Réunion parents-professeurs' } });
    fireEvent.change(within(d).getByLabelText(/^Début/), { target: { value: '2026-12-15T16:00' } });
    fireEvent.change(within(d).getByLabelText(/^Type/), { target: { value: 'reunion' } });
    fireEvent.click(within(d).getByRole('button', { name: /Enregistrer/ }));

    await waitFor(() => expect(http.callsTo('post', '/secretaire/evenements')).toHaveLength(1));
    expect(http.callsTo('post', '/secretaire/evenements')[0].body).toMatchObject({ titre: 'Réunion parents-professeurs', type: 'reunion', date_debut: '2026-12-15T16:00', date_fin: null });
    await waitFor(() => expect(http.callsTo('get', '/secretaire/evenements').length).toBeGreaterThan(1));
  });

  it('modifie et supprime un événement', async () => {
    http.onPut('/secretaire/evenements/3').reply(200, { success: true });
    http.onDelete('/secretaire/evenements/3').reply(200, { success: true });
    vi.spyOn(window, 'confirm').mockReturnValue(true);
    monter();

    fireEvent.click(await screen.findByRole('button', { name: /Modifier|Edit/ }));
    const d = await screen.findByRole('dialog');
    expect(within(d).getByLabelText(/^Début/)).toHaveValue('2026-12-10T15:00');
    fireEvent.change(within(d).getByLabelText(/^Lieu/), { target: { value: 'Bibliothèque' } });
    fireEvent.click(within(d).getByRole('button', { name: /Enregistrer/ }));
    await waitFor(() => expect(http.callsTo('put', '/secretaire/evenements/3')[0].body).toMatchObject({ lieu: 'Bibliothèque' }));

    fireEvent.click(screen.getByRole('button', { name: /Supprimer|Delete/ }));
    await waitFor(() => expect(http.callsTo('delete', '/secretaire/evenements/3')).toHaveLength(1));
  });
});
