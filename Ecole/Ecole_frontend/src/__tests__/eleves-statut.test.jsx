/**
 * ElevesPage — retrait et réintégration d'un élève (audit BUG-008)
 *
 * Le retrait écrit `statut = 'inactive'` côté API. La page lisait
 * `user.is_active`, absent de la liste : l'élève retiré restait « actif »,
 * sans message, et rien ne permettait de le réintégrer.
 */

import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { render, screen, fireEvent, waitFor, within } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { QueryClientProvider } from '@tanstack/react-query';
import ElevesPage from '@/app/features/eleves/ElevesPage';
import { installHttpMock } from './helpers/http-mock';
import { makeQueryClient, signIn } from './helpers/render';

let http;
const eleve = (id, nom, statut) => ({
  id, statut, numero_matricule: `BEN${id}`, user: { name: nom, prenom: 'Test' }, classe: { id: 1, nom_classe: '4ème' },
});
const liste = (...eleves) => ({ success: true, data: eleves });

function monter() {
  return render(
    <QueryClientProvider client={makeQueryClient()}>
      <MemoryRouter><ElevesPage /></MemoryRouter>
    </QueryClientProvider>,
  );
}
const ligne = (nom) => screen.getByText(new RegExp(nom)).closest('tr');

beforeEach(() => {
  http = installHttpMock();
  vi.spyOn(console, 'error').mockImplementation(() => {});
  vi.spyOn(window, 'confirm').mockReturnValue(true);
  signIn('directeur');
});
afterEach(() => { http.restore(); vi.restoreAllMocks(); });

describe('ElevesPage — statut de l’élève', () => {
  it('affiche « inactif » pour un élève dont le statut est inactive', async () => {
    http.onGet('/eleves').reply(200, liste(eleve(1, 'ADJOVI', 'active'), eleve(2, 'DJOKO', 'inactive')));

    monter();
    await screen.findByText(/DJOKO/);

    expect(within(ligne('DJOKO')).getByText('inactif')).toBeInTheDocument();
    expect(within(ligne('ADJOVI')).getByText('actif')).toBeInTheDocument();
  });

  it('après un retrait, recharge la liste et montre l’élève inactif', async () => {
    http.onGet('/eleves').reply(200, liste(eleve(2, 'DJOKO', 'active')));
    http.onPost('/eleves/2/deactivate').reply(200, { success: true });

    monter();
    await screen.findByText(/DJOKO/);
    http.onGet('/eleves').reply(200, liste(eleve(2, 'DJOKO', 'inactive')));
    fireEvent.click(within(ligne('DJOKO')).getByRole('button', { name: /Retirer des effectifs/i }));

    await waitFor(() => expect(within(ligne('DJOKO')).getByText('inactif')).toBeInTheDocument());
    expect(http.callsTo('post', '/eleves/2/deactivate')).toHaveLength(1);
  });

  it('propose de réintégrer un élève inactif, et le fait', async () => {
    http.onGet('/eleves').reply(200, liste(eleve(2, 'DJOKO', 'inactive')));
    http.onPost('/eleves/2/activate').reply(200, { success: true });

    monter();
    await screen.findByText(/DJOKO/);
    expect(within(ligne('DJOKO')).queryByRole('button', { name: /Retirer des effectifs/i })).not.toBeInTheDocument();
    http.onGet('/eleves').reply(200, liste(eleve(2, 'DJOKO', 'active')));
    fireEvent.click(within(ligne('DJOKO')).getByRole('button', { name: /Réintégrer/i }));

    await waitFor(() => expect(within(ligne('DJOKO')).getByText('actif')).toBeInTheDocument());
    expect(http.callsTo('post', '/eleves/2/activate')).toHaveLength(1);
  });
});
