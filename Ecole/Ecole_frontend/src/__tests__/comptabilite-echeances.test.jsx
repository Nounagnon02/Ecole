/**
 * Factures et exports comptables (lot 6.8).
 */

import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { render, screen, fireEvent, waitFor, within } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { QueryClientProvider } from '@tanstack/react-query';
import FacturesPage from '@/app/features/comptable/FacturesPage';
import { installHttpMock } from './helpers/http-mock';
import { makeQueryClient, signIn } from './helpers/render';

let http;
let noms;
let contenus;

beforeEach(() => {
  http = installHttpMock();
  vi.spyOn(console, 'error').mockImplementation(() => {});
  noms = []; contenus = [];
  const BlobOrigine = globalThis.Blob;
  vi.spyOn(globalThis, 'Blob').mockImplementation(function B(parts, opts) { contenus.push(parts.map(String).join('')); return new BlobOrigine(parts, opts); });
  URL.createObjectURL = vi.fn(() => 'blob:x'); URL.revokeObjectURL = vi.fn();
  vi.spyOn(HTMLAnchorElement.prototype, 'click').mockImplementation(function clic() { noms.push(this.download); });
  http.onGet('/comptable/paiements').reply(200, { success: true, data: [
    { id: 1, reference: 'PAY-1', client: 'AGBO Luc', classe: '6ème', motif: 'Scolarité', montant: 20000, montant_total: 60000, montant_paye: 20000, montant_restant: 40000, date_paiement: '2026-11-30', statut: 'partiel', statut_label: 'Partielle' },
    { id: 2, reference: 'PAY-2', client: 'DOSSOU Afi', classe: '6ème', motif: 'Scolarité', montant: 0, montant_total: 60000, montant_paye: 0, montant_restant: 60000, date_paiement: '2026-11-30', statut: 'en_attente', statut_label: 'En attente' },
  ] });
  http.onGet('/classes').reply(200, [{ id: 4, nom_classe: '6ème' }]);
  http.onGet('/eleves').reply(200, { success: true, data: [] });
});
afterEach(() => { http.restore(); vi.restoreAllMocks(); });

function monter() {
  signIn('comptable');
  return render(<QueryClientProvider client={makeQueryClient()}><MemoryRouter><FacturesPage /></MemoryRouter></QueryClientProvider>);
}

describe('échéances', () => {
  it('compte le dû, l’encaissé et le reste, pas les lignes versées', async () => {
    monter();
    await screen.findByText('AGBO Luc');

    expect(screen.getAllByText(/120\s000/).length).toBeGreaterThan(0);
    expect(screen.getAllByText(/100\s000/).length).toBeGreaterThan(0);
  });

  it('crée une échéance pour toute une classe', async () => {
    http.onPost('/comptable/echeances').reply(201, { success: true, crees: 28, deja_facturees: 2 });
    monter();
    fireEvent.click(await screen.findByRole('button', { name: /Nouvelle facture/ }));
    const d = await screen.findByRole('dialog');
    await within(d).findByRole('option', { name: '6ème' });

    fireEvent.change(within(d).getByLabelText(/^Pour toute une classe/), { target: { value: '4' } });
    fireEvent.change(within(d).getByLabelText(/^Libellé/), { target: { value: 'Scolarité 2e tranche' } });
    fireEvent.change(within(d).getByLabelText(/^Montant dû/), { target: { value: '45000' } });
    fireEvent.click(within(d).getByRole('button', { name: /Créer l’échéance/ }));

    expect(await screen.findByText('28 échéance(s) créée(s) ; 2 élève(s) l’avaient déjà.')).toBeInTheDocument();
    expect(http.callsTo('post', '/comptable/echeances')[0].body).toMatchObject({ classe_id: 4, eleve_id: null, type_paiement: 'Scolarité 2e tranche', montant_total: 45000 });
  });

  it('exporte les échéances affichées et télécharge un reçu', async () => {
    http.onGet('/comptable/paiements/1/recu').reply(200, '<html>Reçu</html>');
    monter();
    await screen.findByText('AGBO Luc');

    fireEvent.click(screen.getByRole('button', { name: /Exporter/ }));
    expect(noms[0]).toMatch(/^echeances-\d{4}-\d{2}-\d{2}\.csv$/);
    expect(contenus[0]).toContain('PAY-1;AGBO Luc;6ème;Scolarité;60000;20000;40000;2026-11-30;Partielle');

    fireEvent.click(screen.getByRole('button', { name: 'Reçu PAY-1' }));
    await waitFor(() => expect(noms).toContain('recu-PAY-1.html'));
  });
});
