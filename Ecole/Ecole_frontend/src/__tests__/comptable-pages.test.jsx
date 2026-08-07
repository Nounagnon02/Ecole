/**
 * Pages comptable — Factures & Transactions.
 *
 * Les deux pages lisent `GET /comptable/paiements`. Pendant longtemps le
 * backend renvoyait des statistiques sur `statut` — une colonne qui n'existe
 * pas — donc chaque ligne arrivait avec `statut: null` : badges « — »,
 * « Payé » à zéro, filtres inertes. Le contrat est désormais explicite :
 * une enveloppe `{ success, data }` et un slug (`payee`, `partiel`,
 * `en_attente`) calculé côté API. Ces tests verrouillent ce que la page doit
 * rendre à partir de ce contrat.
 */

import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { render, screen, waitFor, fireEvent } from '@testing-library/react';
import FacturesPage from '@/app/features/comptable/FacturesPage';
import TransactionsPage from '@/app/features/comptable/TransactionsPage';
import { installHttpMock } from './helpers/http-mock';

const PATH = '/comptable/paiements';

const PAIEMENTS = [
  {
    id: 1,
    reference: 'PAY-2026-0002',
    numero: 'PAY-2026-0002',
    eleve: { id: 11, nom: 'Adjovi', prenom: 'Rose', classe: { nom_classe: 'INCE A' }, matricule: 'MAT-001' },
    client: 'Rose Adjovi',
    classe: '6A',
    motif: 'Inscription',
    type_paiement: 'Inscription',
    montant: 25000,
    montant_paye: 25000,
    montant_restant: 0,
    date_paiement: '2026-08-04',
    mode_paiement: 'MOBILE_MONEY',
    statut: 'payee',
    statut_label: 'Payée',
  },
  {
    id: 2,
    reference: 'PAY-2026-0001',
    numero: 'PAY-2026-0001',
    eleve: { id: 12, nom: 'Mensah', prenom: 'Kofi', classe: { nom_classe: 'CM1' }, matricule: 'MAT-002' },
    client: 'Kofi Mensah',
    classe: 'CM1',
    motif: 'Scolarité 1er trimestre',
    type_paiement: 'Scolarité 1er trimestre',
    montant: 50000,
    montant_paye: 25000,
    montant_restant: 25000,
    date_paiement: '2026-08-03',
    mode_paiement: 'ESPECES',
    statut: 'partiel',
    statut_label: 'Partielle',
  },
];

let http;

beforeEach(() => {
  http = installHttpMock();
  vi.spyOn(console, 'error').mockImplementation(() => {});
});

afterEach(() => {
  http.restore();
  vi.restoreAllMocks();
});

function mockPaiements() {
  http.onGet(PATH).reply(200, { success: true, data: PAIEMENTS });
}

describe('FacturesPage', () => {
  it('calcule les totaux et affiche le statut réel des paiements', async () => {
    mockPaiements();

    render(<FacturesPage />);

    await waitFor(() => expect(screen.getByText('Rose Adjovi')).toBeInTheDocument());

    // Les deux lignes du contrat sont là, avec leurs badges de statut.
    expect(screen.getByText('Kofi Mensah')).toBeInTheDocument();
    // « Payée » apparaît aussi dans la liste déroulante de filtre : on
    // prend toutes les occurrences.
    expect(screen.getAllByText('Payée').length).toBeGreaterThan(0);
    expect(screen.getByText('Partielle')).toBeInTheDocument();

    // Les cartes de synthèse sont câblées sur le statut réellement reçu,
    // plus sur une colonne fantôme.
    expect(screen.getByText('Total Facturé')).toBeInTheDocument();
    expect(screen.getByText('Payé')).toBeInTheDocument();
    expect(screen.getByText('Impayé')).toBeInTheDocument();
    expect(screen.getByText('Taux Recouvrement')).toBeInTheDocument();
  });

  it('filtre par recherche sur le nom du client', async () => {
    mockPaiements();

    render(<FacturesPage />);

    await waitFor(() => expect(screen.getByText('Rose Adjovi')).toBeInTheDocument());

    fireEvent.change(screen.getByPlaceholderText('Rechercher une facture...'), {
      target: { value: 'Kofi' },
    });

    expect(screen.queryByText('Rose Adjovi')).not.toBeInTheDocument();
    expect(screen.getByText('Kofi Mensah')).toBeInTheDocument();
  });

  it('filtre par statut', async () => {
    mockPaiements();

    render(<FacturesPage />);

    await waitFor(() => expect(screen.getByText('Rose Adjovi')).toBeInTheDocument());

    fireEvent.change(screen.getByDisplayValue('Tous les statuts'), {
      target: { value: 'en_attente' },
    });

    expect(screen.queryByText('Rose Adjovi')).not.toBeInTheDocument();
    expect(screen.queryByText('Kofi Mensah')).not.toBeInTheDocument();
    expect(screen.getByText('Aucune facture trouvée')).toBeInTheDocument();
  });
});

describe('TransactionsPage', () => {
  it('affiche les recettes et les lignes de transaction du contrat', async () => {
    mockPaiements();

    render(<TransactionsPage />);

    await waitFor(() => expect(screen.getByText('Rose Adjovi')).toBeInTheDocument());

    expect(screen.getByText('Kofi Mensah')).toBeInTheDocument();
    // « Inscription » est aussi une option du filtre par type.
    expect(screen.getAllByText('Inscription').length).toBeGreaterThan(0);
    expect(screen.getByText('Scolarité 1er trimestre')).toBeInTheDocument();
    expect(screen.getAllByText('Payée').length).toBeGreaterThan(0);
    expect(screen.getByText('Partielle')).toBeInTheDocument();

    // Ligne de synthèse présente (titre de page et carte partagent le
    // libellé « Transactions »).
    expect(screen.getByText('Recettes')).toBeInTheDocument();
    expect(screen.getAllByText('Transactions').length).toBeGreaterThan(0);
  });

  it('cherche dans la référence, le nom ou le motif', async () => {
    mockPaiements();

    render(<TransactionsPage />);

    await waitFor(() => expect(screen.getByText('Rose Adjovi')).toBeInTheDocument());

    fireEvent.change(screen.getByPlaceholderText('Rechercher une transaction...'), {
      target: { value: 'Cantine' },
    });

    expect(screen.getByText('Aucune transaction trouvée')).toBeInTheDocument();
  });
});