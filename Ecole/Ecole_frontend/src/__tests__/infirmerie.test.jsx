/**
 * Infirmerie (lot 6.6).
 */

import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { render, screen, fireEvent, waitFor, within } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { QueryClientProvider } from '@tanstack/react-query';
import SoinsPage from '@/app/features/infirmier/SoinsPage';
import DossiersPage from '@/app/features/infirmier/DossiersPage';
import { installHttpMock } from './helpers/http-mock';
import { makeQueryClient, signIn } from './helpers/render';

let http;
const monter = (Page) => {
  signIn('infirmier');
  return render(<QueryClientProvider client={makeQueryClient()}><MemoryRouter><Page /></MemoryRouter></QueryClientProvider>);
};
const eleve = { id: 9, user: { name: 'AGBO', prenom: 'Luc' }, classe: { nom_classe: '6ème' } };

beforeEach(() => {
  http = installHttpMock();
  vi.spyOn(console, 'error').mockImplementation(() => {});
  http.onGet('/eleves').reply(200, { success: true, data: [eleve] });
  http.onGet('/infirmier/consultations').reply(200, { data: [{ id: 1, eleve_id: 9, eleve, motif: 'Fièvre', diagnostic: 'Paludisme suspecté', traitement: 'Orienté vers le CS', date: '2026-11-11', urgence: true }] });
  http.onGet('/infirmier/dossiers-medicaux').reply(200, { data: [{ id: 2, eleve_id: 9, eleve, contact_urgence: '0197000001', groupe_sanguin: 'O+', allergies: 'Arachide', vaccins_a_jour: true, aptitude_sport: false }] });
  http.onGet('/infirmier/vaccinations').reply(200, { data: [] });
});
afterEach(() => { http.restore(); vi.restoreAllMocks(); });

describe('infirmerie', () => {
  it('affiche le nom de l’élève et le traitement, et enregistre une consultation', async () => {
    http.onPost('/infirmier/consultations').reply(201, {});
    monter(SoinsPage);

    expect(await screen.findByText(/AGBO/)).toBeInTheDocument();
    expect(screen.getByText('Orienté vers le CS')).toBeInTheDocument();

    fireEvent.click(screen.getByRole('button', { name: /Nouveau soin|Nouvelle consultation/i }));
    const d = await screen.findByRole('dialog');
    await within(d).findByRole('option', { name: /AGBO Luc/ });
    fireEvent.change(within(d).getByLabelText(/^Élève/), { target: { value: '9' } });
    fireEvent.change(within(d).getByLabelText(/^Motif/), { target: { value: 'Maux de tête' } });
    fireEvent.change(within(d).getByLabelText(/^Diagnostic/), { target: { value: 'Fatigue' } });
    fireEvent.change(within(d).getByLabelText(/^Urgence/), { target: { value: 'oui' } });
    fireEvent.click(within(d).getByRole('button', { name: /Enregistrer/ }));

    await waitFor(() => expect(http.callsTo('post', '/infirmier/consultations')).toHaveLength(1));
    expect(http.callsTo('post', '/infirmier/consultations')[0].body).toMatchObject({ eleve_id: 9, motif: 'Maux de tête', urgence: true, traitement: null });
  });

  it('modifie un dossier médical prérempli', async () => {
    http.onPost('/infirmier/dossiers-medicaux').reply(200, {});
    monter(DossiersPage);

    fireEvent.click(await screen.findByRole('button', { name: /Modifier|Edit/ }));
    const d = await screen.findByRole('dialog');
    await within(d).findByRole('option', { name: /AGBO Luc/ });
    expect(within(d).getByLabelText(/^Groupe sanguin/)).toHaveValue('O+');
    expect(within(d).getByLabelText(/^Apte au sport/)).toHaveValue('non');
    fireEvent.change(within(d).getByLabelText(/^Allergies/), { target: { value: 'Arachide, pénicilline' } });
    fireEvent.click(within(d).getByRole('button', { name: /Enregistrer/ }));

    await waitFor(() => expect(http.callsTo('post', '/infirmier/dossiers-medicaux')).toHaveLength(1));
    expect(http.callsTo('post', '/infirmier/dossiers-medicaux')[0].body).toMatchObject({
      eleve_id: 9, allergies: 'Arachide, pénicilline', groupe_sanguin: 'O+', vaccins_a_jour: true, aptitude_sport: false,
    });
  });
});
