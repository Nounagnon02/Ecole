/**
 * Bibliothèque (lot 6.7).
 */

import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { render, screen, fireEvent, waitFor, within } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { QueryClientProvider } from '@tanstack/react-query';
import CataloguePage from '@/app/features/bibliothecaire/CataloguePage';
import EmpruntsPage from '@/app/features/bibliothecaire/EmpruntsPage';
import { installHttpMock } from './helpers/http-mock';
import { makeQueryClient, signIn } from './helpers/render';

let http;
const monter = (Page) => {
  signIn('bibliothecaire');
  return render(<QueryClientProvider client={makeQueryClient()}><MemoryRouter><Page /></MemoryRouter></QueryClientProvider>);
};

beforeEach(() => {
  http = installHttpMock();
  vi.spyOn(console, 'error').mockImplementation(() => {});
  http.onGet('/bibliothecaire/livres').reply(200, [
    { id: 1, titre: 'L’Enfant noir', auteur: 'Camara Laye', categorie: 'Roman', isbn: '9782266000000', nombre_exemplaires: 3, exemplaires_disponibles: 2, disponible: true },
    { id: 2, titre: 'Une si longue lettre', auteur: 'Mariama Bâ', categorie: 'Roman', isbn: '9782000000000', nombre_exemplaires: 1, exemplaires_disponibles: 0, disponible: false },
  ]);
  http.onGet('/eleves').reply(200, { success: true, data: [{ id: 9, user: { name: 'AGBO', prenom: 'Luc' }, classe: { nom_classe: '6ème' } }] });
  http.onGet('/bibliothecaire/emprunts').reply(200, [
    { id: 5, livre: { titre: 'L’Enfant noir' }, eleve: { user: { name: 'AGBO', prenom: 'Luc' }, classe: { nom_classe: '6ème' } }, date_emprunt: '2026-11-01', date_retour_prevue: '2026-11-15', date_retour_effective: null },
  ]);
});
afterEach(() => { http.restore(); vi.restoreAllMocks(); });

describe('bibliothèque', () => {
  it('compte les exemplaires en rayon et prête depuis le catalogue', async () => {
    http.onPost('/bibliothecaire/emprunts').reply(201, {});
    monter(CataloguePage);

    const carte = (await screen.findByText('L’Enfant noir')).closest('[class*="rounded"]').parentElement;
    expect(screen.getByText(/2\/3 ex\./)).toBeInTheDocument();
    expect(screen.getByText(/0\/1 ex\./)).toBeInTheDocument();
    const boutons = screen.getAllByRole('button', { name: /Emprunter|Prêter/ });
    expect(boutons[1]).toBeDisabled();
    expect(carte).toBeTruthy();

    fireEvent.click(boutons[0]);
    const d = await screen.findByRole('dialog');
    await within(d).findByRole('option', { name: /AGBO Luc/ });
    expect(within(d).getByLabelText(/^Livre/)).toHaveValue('1');
    expect(within(d).queryByRole('option', { name: /Une si longue lettre/ })).not.toBeInTheDocument();
    fireEvent.change(within(d).getByLabelText(/^Élève/), { target: { value: '9' } });
    fireEvent.click(within(d).getByRole('button', { name: /^Prêter$/ }));

    await waitFor(() => expect(http.callsTo('post', '/bibliothecaire/emprunts')[0].body).toMatchObject({ livre_id: 1, eleve_id: 9 }));
  });

  it('ajoute un ouvrage', async () => {
    http.onPost('/bibliothecaire/livres').reply(201, {});
    monter(CataloguePage);
    fireEvent.click(await screen.findByRole('button', { name: /Ajouter un ouvrage/ }));
    const d = await screen.findByRole('dialog');

    fireEvent.change(within(d).getByLabelText(/^Titre/), { target: { value: 'Le Monde s’effondre' } });
    fireEvent.change(within(d).getByLabelText(/^Auteur/), { target: { value: 'Chinua Achebe' } });
    fireEvent.change(within(d).getByLabelText(/^ISBN/), { target: { value: '9782070000000' } });
    fireEvent.change(within(d).getByLabelText(/^Catégorie/), { target: { value: 'Roman' } });
    fireEvent.change(within(d).getByLabelText(/^Année/), { target: { value: '1958' } });
    fireEvent.click(within(d).getByRole('button', { name: /Enregistrer/ }));

    await waitFor(() => expect(http.callsTo('post', '/bibliothecaire/livres')[0].body).toMatchObject({ titre: 'Le Monde s’effondre', annee_publication: 1958, nombre_exemplaires: 1 }));
  });

  it('enregistre un retour et montre le nom de l’élève', async () => {
    http.onPut('/bibliothecaire/emprunts/5/retour').reply(200, {});
    monter(EmpruntsPage);

    expect(await screen.findByText(/AGBO/)).toBeInTheDocument();
    fireEvent.click(screen.getByRole('button', { name: /retour/i }));

    await waitFor(() => expect(http.callsTo('put', '/bibliothecaire/emprunts/5/retour')).toHaveLength(1));
  });
});
