/**
 * Encaissement au guichet depuis l'échéancier (audit BUG-025)
 *
 * « Payer » sur une échéance n'ouvrait que le paiement en ligne. La
 * comptabilité doit pouvoir constater un versement en espèces, par chèque ou
 * par virement, sans dépasser le reste dû.
 */

import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { render, screen, fireEvent, waitFor, within } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { QueryClientProvider } from '@tanstack/react-query';
import PaiementsPage from '@/app/features/paiements/PaiementsPage';
import { installHttpMock } from './helpers/http-mock';
import { makeQueryClient, signIn } from './helpers/render';

let http;

const echeancier = (paye) => ({
  success: true,
  data: {
    eleve: { id: 12, nom: 'Mensah Kofi', classe: 'CM1', matricule: 'MAT-002' },
    resume: { total_du: 50000, total_paye: paye, solde: 50000 - paye, nb_echeances: 1, nb_payees: paye >= 50000 ? 1 : 0 },
    echeances: [{
      id: 2, reference: 'PAY-2026-0001', type: 'Scolarité 1er trimestre', montant: 50000,
      montant_total: 50000, montant_paye: paye, reste: 50000 - paye, date: '03/08/2026',
      statut: paye >= 50000 ? 'payee' : 'partiel', statut_label: paye >= 50000 ? 'Payée' : 'Partielle', mode: 'ESPECES',
    }],
  },
});

async function ouvrirEncaissement() {
  render(
    <MemoryRouter initialEntries={['/paiements?tab=echeancier']}>
      <QueryClientProvider client={makeQueryClient()}><PaiementsPage /></QueryClientProvider>
    </MemoryRouter>,
  );
  fireEvent.click(await screen.findByRole('button', { name: /Mensah Kofi/ }));
  fireEvent.click(await screen.findByRole('button', { name: /^Encaisser$/ }));
  return screen.getByRole('dialog');
}

beforeEach(() => {
  http = installHttpMock();
  vi.spyOn(console, 'error').mockImplementation(() => {});
  signIn('comptable');
  http.onGet('/comptable/paiements').reply(200, { success: true, data: [{
    id: 2, reference: 'PAY-2026-0001', eleve: { id: 12, user: { name: 'Mensah', prenom: 'Kofi' }, classe: { nom_classe: 'CM1' } },
    montant: 50000, statut: 'partiel', statut_label: 'Partielle', mode_paiement: 'ESPECES', date_paiement: '2026-08-03',
  }] });
  http.onGet('/comptable/echeancier/12').reply(200, echeancier(25000));
});
afterEach(() => { http.restore(); vi.restoreAllMocks(); });

describe('encaissement au guichet', () => {
  it('enregistre le versement puis recharge l’échéancier', async () => {
    http.onPost('/comptable/echeancier/2/encaisser').reply(201, { success: true, data: { reference: 'PAY-X', echeance: { id: 2, reste: 0 } } });
    const dialogue = await ouvrirEncaissement();

    expect(within(dialogue).getByLabelText(/Montant reçu/)).toHaveValue(25000); // le reste dû, par défaut
    fireEvent.change(within(dialogue).getByLabelText(/Montant reçu/), { target: { value: '10000' } });
    fireEvent.change(within(dialogue).getByLabelText(/Mode de règlement/), { target: { value: 'CHEQUE' } });
    fireEvent.change(within(dialogue).getByLabelText(/Référence/), { target: { value: 'CHQ-0042' } });
    http.onGet('/comptable/echeancier/12').reply(200, echeancier(35000));
    fireEvent.click(within(dialogue).getByRole('button', { name: /Enregistrer le versement/ }));

    await waitFor(() => expect(http.callsTo('post', '/comptable/echeancier/2/encaisser')).toHaveLength(1));
    expect(http.callsTo('post', '/comptable/echeancier/2/encaisser')[0].body)
      .toEqual({ montant: 10000, mode_paiement: 'CHEQUE', reference: 'CHQ-0042' });
    await waitFor(() => expect(screen.queryByRole('dialog')).not.toBeInTheDocument());
    await waitFor(() => expect(http.callsTo('get', '/comptable/echeancier/12').length).toBeGreaterThan(1));
  });

  it('refuse sur place un versement supérieur au reste dû', async () => {
    const dialogue = await ouvrirEncaissement();

    fireEvent.change(within(dialogue).getByLabelText(/Montant reçu/), { target: { value: '25001' } });
    fireEvent.click(within(dialogue).getByRole('button', { name: /Enregistrer le versement/ }));

    expect(await within(dialogue).findByText(/ne peut pas dépasser le reste dû/)).toBeInTheDocument();
    expect(http.callsTo('post', '/comptable/echeancier/2/encaisser')).toHaveLength(0);
  });

  it('garde le dialogue ouvert et montre le refus de l’API', async () => {
    http.onPost('/comptable/echeancier/2/encaisser').reply(422, { success: false, message: 'Cette échéance est déjà soldée.' });
    const dialogue = await ouvrirEncaissement();

    fireEvent.click(within(dialogue).getByRole('button', { name: /Enregistrer le versement/ }));

    expect(await within(dialogue).findByText(/déjà soldée/)).toBeInTheDocument();
  });

  it('ne propose pas d’encaisser une échéance soldée', async () => {
    http.onGet('/comptable/echeancier/12').reply(200, echeancier(50000));
    render(
      <MemoryRouter initialEntries={['/paiements?tab=echeancier']}>
        <QueryClientProvider client={makeQueryClient()}><PaiementsPage /></QueryClientProvider>
      </MemoryRouter>,
    );
    fireEvent.click(await screen.findByRole('button', { name: /Mensah Kofi/ }));

    await screen.findByText('PAY-2026-0001');
    expect(screen.queryByRole('button', { name: /^Encaisser$/ })).not.toBeInTheDocument();
  });
});

describe('reçu', () => {
  it('se télécharge sous un nom lisible au lieu d’ouvrir un onglet sur l’API', async () => {
    http.onGet('/comptable/paiements/2/recu').reply(200, '<html>Reçu</html>');
    const ouvrir = vi.spyOn(window, 'open').mockImplementation(() => null);
    URL.createObjectURL = vi.fn(() => 'blob:recu');
    URL.revokeObjectURL = vi.fn();
    const noms = [];
    vi.spyOn(HTMLAnchorElement.prototype, 'click').mockImplementation(function clic() { noms.push(this.download); });

    render(
      <MemoryRouter initialEntries={['/paiements']}>
        <QueryClientProvider client={makeQueryClient()}><PaiementsPage /></QueryClientProvider>
      </MemoryRouter>,
    );
    fireEvent.click(await screen.findByRole('button', { name: /Télécharger le reçu/ }));

    await waitFor(() => expect(noms).toEqual(['recu-PAY-2026-0001.html']));
    expect(ouvrir).not.toHaveBeenCalled();
  });
});
