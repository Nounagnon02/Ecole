/**
 * Incidents et sanctions (lot 6.2).
 */

import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { render, screen, fireEvent, waitFor, within } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { QueryClientProvider } from '@tanstack/react-query';
import DisciplinePage from '@/app/features/censeur/DisciplinePage';
import { installHttpMock } from './helpers/http-mock';
import { makeQueryClient, signIn } from './helpers/render';

let http;
function monter() {
  signIn('censeur');
  return render(<QueryClientProvider client={makeQueryClient()}><MemoryRouter><DisciplinePage /></MemoryRouter></QueryClientProvider>);
}

beforeEach(() => {
  http = installHttpMock();
  vi.spyOn(console, 'error').mockImplementation(() => {});
  http.onGet('/surveillant/incidents').reply(200, [{ id: 3, description: 'Bagarre dans la cour', date: '2026-11-10', gravite: 'moyenne', statut: 'resolu' }]);
  http.onGet('/surveillant/statistiques').reply(200, { data: {} });
  http.onGet('/surveillant/sanctions').reply(200, [{ id: 5, type_sanction: 'Retenue', motif: 'Retards', date: '2026-11-09', statut: 'active', eleve: { user: { name: 'AGBO', prenom: 'Luc' } } }]);
  http.onGet('/eleves').reply(200, { success: true, data: [{ id: 1, user: { name: 'AGBO', prenom: 'Luc' }, classe: { nom_classe: '6ème' } }] });
});
afterEach(() => { http.restore(); vi.restoreAllMocks(); });

describe('discipline', () => {
  it('affiche un incident résolu comme traité, et permet de le rouvrir', async () => {
    http.onPatch('/surveillant/incidents/3').reply(200, { success: true });
    monter();

    const carte = (await screen.findByText('Bagarre dans la cour')).closest('div.flex.items-start');
    expect(carte).toHaveTextContent(/Traité/i);
    fireEvent.click(within(carte).getByRole('button', { name: /Rouvrir/ }));

    await waitFor(() => expect(http.callsTo('patch', '/surveillant/incidents/3')[0].body).toEqual({ statut: 'en_cours' }));
  });

  it('déclare un incident', async () => {
    http.onPost('/surveillant/incidents').reply(201, { id: 4 });
    monter();
    fireEvent.click(await screen.findByRole('button', { name: /Nouvel incident/ }));
    const d = await screen.findByRole('dialog');

    fireEvent.click(within(d).getByRole('button', { name: /Enregistrer/ }));
    expect(await within(d).findByText(/Décrivez l’incident/)).toBeInTheDocument();
    fireEvent.change(within(d).getByLabelText(/^Description/), { target: { value: 'Vitre cassée' } });
    fireEvent.change(within(d).getByLabelText(/^Gravité/), { target: { value: 'grave' } });
    fireEvent.click(within(d).getByRole('button', { name: /Enregistrer/ }));

    await waitFor(() => expect(http.callsTo('post', '/surveillant/incidents')).toHaveLength(1));
    expect(http.callsTo('post', '/surveillant/incidents')[0].body).toMatchObject({ description: 'Vitre cassée', gravite: 'grave' });
    await waitFor(() => expect(screen.queryByRole('dialog')).not.toBeInTheDocument());
  });

  it('prononce une sanction et en lève une', async () => {
    http.onPost('/surveillant/sanctions').reply(201, { id: 6 });
    http.onPatch('/surveillant/sanctions/5').reply(200, { success: true });
    monter();

    fireEvent.click(within(await screen.findByTestId('sanctions')).getByRole('button', { name: 'Lever' }));
    await waitFor(() => expect(http.callsTo('patch', '/surveillant/sanctions/5')[0].body).toEqual({ statut: 'levee' }));

    fireEvent.click(screen.getByRole('button', { name: /Prononcer une sanction/ }));
    const d = await screen.findByRole('dialog');
    await within(d).findByRole('option', { name: /AGBO Luc/ });
    fireEvent.change(within(d).getByLabelText(/^Élève/), { target: { value: '1' } });
    fireEvent.change(within(d).getByLabelText(/^Motif/), { target: { value: 'Insolence' } });
    fireEvent.click(within(d).getByRole('button', { name: /Enregistrer/ }));

    await waitFor(() => expect(http.callsTo('post', '/surveillant/sanctions')).toHaveLength(1));
    expect(http.callsTo('post', '/surveillant/sanctions')[0].body).toMatchObject({ eleve_id: 1, type_sanction: 'Avertissement', motif: 'Insolence' });
  });
});
