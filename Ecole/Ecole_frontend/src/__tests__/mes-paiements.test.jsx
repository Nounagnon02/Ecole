/**
 * MesPaiementsPage — le parent voit ce qu'il doit et paie (audit BUG-003)
 *
 * Le menu du parent ouvrait la page de la comptabilité, que l'API lui
 * refusait. Cette page lit ses propres routes et ouvre le paiement en ligne.
 */

import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { render, screen, fireEvent, waitFor, within } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { QueryClientProvider } from '@tanstack/react-query';
import MesPaiementsPage from '@/app/features/parent/MesPaiementsPage';
import PaiementRetourPage from '@/app/features/paiements/PaiementRetourPage';
import { ROUTE_CONFIG } from '@/features/roles/route-config';
import { getRoleNavigation } from '@/features/roles/navigation-config';
import { installHttpMock } from './helpers/http-mock';
import { makeQueryClient, signIn } from './helpers/render';

let http;
let allerVers;

const echeance = (id, total, paye, extra = {}) => ({
  id, libelle: `Tranche ${id}`, montant_total: total, montant_paye: paye, reste: total - paye,
  statut: paye <= 0 ? 'EN_ATTENTE' : paye >= total ? 'PAYE' : 'PARTIEL', paiement_en_cours: null, ...extra,
});
const reponse = (...echeances) => ({
  success: true,
  data: echeances,
  meta: {
    total_du: echeances.reduce((s, e) => s + e.montant_total, 0),
    total_paye: echeances.reduce((s, e) => s + e.montant_paye, 0),
    solde: echeances.reduce((s, e) => s + e.reste, 0),
  },
});

function monter(Page = MesPaiementsPage, url = '/parent/paiements') {
  return render(
    <QueryClientProvider client={makeQueryClient()}>
      <MemoryRouter initialEntries={[url]}><Page onRedirect={allerVers} /></MemoryRouter>
    </QueryClientProvider>,
  );
}
const ligne = (nom) => screen.getByText(nom).closest('tr');
// « 40 000 » tel que l'écrit Intl en français (espace insécable fine).
const montant = (n) => new RegExp(String(n).replace(/(\d)(?=(\d{3})+$)/g, '$1\\s'));

beforeEach(() => {
  http = installHttpMock();
  allerVers = vi.fn();
  vi.spyOn(console, 'error').mockImplementation(() => {});
  signIn('parent');
  http.onGet('/parent/enfants').reply(200, { success: true, data: [{ id: 7, nom: 'Ama ADJOVI', classe: '4ème A' }] });
});
afterEach(() => { http.restore(); vi.restoreAllMocks(); });

describe('MesPaiementsPage', () => {
  it('affiche le dû, le payé et le reste de l’enfant', async () => {
    http.onGet('/parent/enfants/7/paiements').reply(200, reponse(echeance(1, 60000, 20000), echeance(2, 40000, 40000)));

    monter();

    const tranche = await waitFor(() => ligne('Tranche 1'));
    expect(within(tranche).getByTestId('reste')).toHaveTextContent(montant(40000));
    expect(screen.getByTestId('total-reste')).toHaveTextContent(montant(40000));
    expect(screen.getByTestId('total-paye')).toHaveTextContent(montant(60000));
    // Une échéance soldée ne se paie plus.
    expect(within(ligne('Tranche 2')).queryByRole('button', { name: /Payer/ })).not.toBeInTheDocument();
  });

  it('ouvre le paiement du montant choisi puis envoie vers la passerelle', async () => {
    http.onGet('/parent/enfants/7/paiements').reply(200, reponse(echeance(1, 60000, 20000)));
    http.onPost('/payments/initialize').reply(200, { success: true, data: { payment_id: 3, checkout_url: 'https://sandbox.fedapay.com/pay/TX1' } });

    monter();
    fireEvent.click(within(await waitFor(() => ligne('Tranche 1'))).getByRole('button', { name: /Payer/ }));

    const champ = screen.getByLabelText(/Montant à payer/);
    expect(champ).toHaveValue(40000); // le reste, proposé par défaut
    fireEvent.change(champ, { target: { value: '15000' } });
    fireEvent.click(screen.getByRole('button', { name: /Continuer vers le paiement/ }));

    await waitFor(() => expect(allerVers).toHaveBeenCalledWith('https://sandbox.fedapay.com/pay/TX1'));
    expect(http.callsTo('post', '/payments/initialize')[0].body)
      .toMatchObject({ eleve_id: 7, paiement_eleve_id: 1, amount: 15000, type: 'scolarite' });
  });

  it('refuse sur place un montant supérieur au reste, sans appeler l’API', async () => {
    http.onGet('/parent/enfants/7/paiements').reply(200, reponse(echeance(1, 60000, 20000)));

    monter();
    fireEvent.click(within(await waitFor(() => ligne('Tranche 1'))).getByRole('button', { name: /Payer/ }));
    fireEvent.change(screen.getByLabelText(/Montant à payer/), { target: { value: '40001' } });
    fireEvent.click(screen.getByRole('button', { name: /Continuer vers le paiement/ }));

    expect(await screen.findByText(/ne peut pas dépasser/)).toBeInTheDocument();
    expect(http.callsTo('post', '/payments/initialize')).toHaveLength(0);
  });

  it('montre le refus de l’API tel qu’elle le formule', async () => {
    http.onGet('/parent/enfants/7/paiements').reply(200, reponse(echeance(1, 60000, 0)));
    http.onPost('/payments/initialize').reply(422, { success: false, message: 'Un paiement de 50 000 FCFA est déjà en cours sur cette échéance.' });

    monter();
    fireEvent.click(within(await waitFor(() => ligne('Tranche 1'))).getByRole('button', { name: /Payer/ }));
    fireEvent.click(screen.getByRole('button', { name: /Continuer vers le paiement/ }));

    expect(await screen.findByText(/déjà en cours sur cette échéance/)).toBeInTheDocument();
    expect(allerVers).not.toHaveBeenCalled();
  });

  it('propose de reprendre un paiement en cours plutôt que d’en ouvrir un second', async () => {
    http.onGet('/parent/enfants/7/paiements').reply(200, reponse(
      echeance(1, 60000, 0, { paiement_en_cours: { id: 3, montant: 60000, checkout_url: 'https://sandbox.fedapay.com/pay/TX9' } }),
    ));

    monter();
    const tranche = await waitFor(() => ligne('Tranche 1'));

    expect(within(tranche).getByText(/Paiement en cours/)).toBeInTheDocument();
    expect(within(tranche).queryByRole('button', { name: /^Payer/ })).not.toBeInTheDocument();
    fireEvent.click(within(tranche).getByRole('button', { name: /Reprendre/ }));
    expect(allerVers).toHaveBeenCalledWith('https://sandbox.fedapay.com/pay/TX9');
  });

  it('dit clairement qu’il n’y a rien à payer', async () => {
    http.onGet('/parent/enfants/7/paiements').reply(200, reponse());

    monter();

    expect(await screen.findByText(/Aucune échéance/)).toBeInTheDocument();
  });
});

describe('PaiementRetourPage', () => {
  it.each([
    ['confirme', /Paiement confirmé/],
    ['attente', /en attente de confirmation/],
    ['echoue', /n’a pas abouti/],
    ['erreur', /Nous n’avons pas pu vérifier/],
    ['nimportequoi', /Nous n’avons pas pu vérifier/],
  ])('statut « %s »', (statut, texte) => {
    monter(PaiementRetourPage, `/paiement/retour?statut=${statut}`);

    expect(screen.getByRole('status')).toHaveTextContent(texte);
    expect(screen.getByRole('button', { name: /Retour aux paiements/ })).toBeEnabled();
  });
});

describe('menu et droits', () => {
  it('le menu du parent mène à sa page, pas à celle de la comptabilité', () => {
    const chemins = getRoleNavigation('parent').map((entree) => entree.path);

    expect(chemins).toContain('/parent/paiements');
    expect(chemins).not.toContain('/paiements');
    expect(ROUTE_CONFIG.parentPaiements.roles).toEqual(['parent']);
    expect(ROUTE_CONFIG.paiementRetour.roles).toContain('parent');
  });
});
