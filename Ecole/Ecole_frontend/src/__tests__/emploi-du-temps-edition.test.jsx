/**
 * Emploi du temps (lot 6.3) : affichage par heure réelle, édition par la direction.
 */

import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { render, screen, fireEvent, waitFor, within } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { QueryClientProvider } from '@tanstack/react-query';
import EmploiDuTempsPage from '@/app/features/emploi-du-temps/EmploiDuTempsPage';
import { installHttpMock } from './helpers/http-mock';
import { makeQueryClient, signIn } from './helpers/render';

let http;
const cours = (id, jour, debut, fin, matiere, extra = {}) => ({
  id, jour, heure_debut: `${debut}:00`, heure_fin: `${fin}:00`, salle: 'S101', classe_id: 4, matiere_id: 2, enseignant_id: 7,
  matiere: { id: 2, nom: matiere }, classe: { id: 4, nom_classe: '6ème' }, enseignant: { id: 7, user: { name: 'HOUNKPE', prenom: 'Marie' } }, ...extra,
});
function monter(role = 'directeur') {
  signIn(role);
  return render(<QueryClientProvider client={makeQueryClient()}><MemoryRouter><EmploiDuTempsPage /></MemoryRouter></QueryClientProvider>);
}
const jour = (nom) => screen.getByRole('region', { name: nom });

beforeEach(() => {
  http = installHttpMock();
  vi.spyOn(console, 'error').mockImplementation(() => {});
  http.onGet('/classes').reply(200, [{ id: 4, nom_classe: '6ème' }]);
  http.onGet('/matieres').reply(200, [{ id: 2, nom: 'Mathématiques' }, { id: 3, nom: 'Français' }]);
  http.onGet('/enseignants').reply(200, [{ id: 7, user: { name: 'HOUNKPE', prenom: 'Marie' } }]);
  http.onGet('/emploi-du-temps').reply(200, { data: [cours(1, 'Lundi', '10:00', '12:00', 'Mathématiques'), cours(2, 'Lundi', '08:00', '10:00', 'Français')] });
});
afterEach(() => { http.restore(); vi.restoreAllMocks(); });

describe('emploi du temps', () => {
  it('range les cours par heure réelle, et ne montre aucun cours inventé', async () => {
    monter('eleve');

    await waitFor(() => expect(within(jour('Lundi')).getAllByTestId('cours')).toHaveLength(2));
    const lundi = within(jour('Lundi')).getAllByTestId('cours').map((c) => c.textContent);
    expect(lundi[0]).toMatch(/08:00 – 10:00Français/);
    expect(lundi[1]).toMatch(/10:00 – 12:00Mathématiques/);
    expect(within(jour('Mardi')).getByText('Aucun cours.')).toBeInTheDocument();
    expect(screen.queryByRole('button', { name: /Ajouter un cours/ })).not.toBeInTheDocument();
  });

  it('filtre par classe', async () => {
    monter();
    await screen.findByRole('option', { name: '6ème' });

    fireEvent.change(screen.getByLabelText(/^Classe/), { target: { value: '4' } });

    await waitFor(() => expect(http.callsTo('get', '/emploi-du-temps').at(-1).url).toBe('/emploi-du-temps?classe_id=4'));
  });

  it('ajoute un cours et montre un conflit horaire refusé par l’API', async () => {
    http.onPost('/emploi-du-temps/store').reply(422, { message: 'Conflit horaire : cette classe ou cet enseignant a déjà un cours sur ce créneau' });
    monter();
    fireEvent.click(await screen.findByRole('button', { name: /Ajouter un cours/ }));
    const d = await screen.findByRole('dialog');
    await within(d).findByRole('option', { name: 'Français' });

    fireEvent.change(within(d).getByLabelText(/^Classe/), { target: { value: '4' } });
    fireEvent.change(within(d).getByLabelText(/^Matière/), { target: { value: '3' } });
    fireEvent.change(within(d).getByLabelText(/^Enseignant/), { target: { value: '7' } });
    fireEvent.change(within(d).getByLabelText(/^Fin/), { target: { value: '07:00' } });
    fireEvent.click(within(d).getByRole('button', { name: /Enregistrer/ }));
    expect(await within(d).findByText(/La fin doit suivre le début/)).toBeInTheDocument();
    expect(http.callsTo('post', '/emploi-du-temps/store')).toHaveLength(0);

    fireEvent.change(within(d).getByLabelText(/^Fin/), { target: { value: '10:00' } });
    fireEvent.click(within(d).getByRole('button', { name: /Enregistrer/ }));

    expect(await within(d).findByRole('alert')).toHaveTextContent(/Conflit horaire/);
    expect(http.callsTo('post', '/emploi-du-temps/store')[0].body).toEqual({
      classe_id: 4, matiere_id: 3, enseignant_id: 7, jour: 'Lundi', heure_debut: '08:00', heure_fin: '10:00', salle: null,
    });
  });

  it('modifie et supprime un cours', async () => {
    http.onPut('/emploi-du-temps/update/1').reply(200, { success: true });
    http.onDelete('/emploi-du-temps/delete/1').reply(200, { success: true });
    vi.spyOn(window, 'confirm').mockReturnValue(true);
    monter();

    fireEvent.click(await screen.findByRole('button', { name: 'Modifier le cours de Mathématiques' }));
    const d = await screen.findByRole('dialog');
    await within(d).findByRole('option', { name: 'Français' });
    expect(within(d).getByLabelText(/^Début/)).toHaveValue('10:00');
    fireEvent.change(within(d).getByLabelText(/^Jour/), { target: { value: 'Mardi' } });
    fireEvent.click(within(d).getByRole('button', { name: /Enregistrer/ }));
    await waitFor(() => expect(http.callsTo('put', '/emploi-du-temps/update/1')[0].body).toMatchObject({ jour: 'Mardi', heure_debut: '10:00', salle: 'S101' }));

    fireEvent.click(screen.getByRole('button', { name: 'Supprimer le cours de Mathématiques' }));
    await waitFor(() => expect(http.callsTo('delete', '/emploi-du-temps/delete/1')).toHaveLength(1));
  });
});
