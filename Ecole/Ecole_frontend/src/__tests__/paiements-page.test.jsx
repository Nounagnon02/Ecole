/**
 * PaiementsPage (route `/paiements`) — contrat `GET /comptable/paiements`.
 *
 * Le backend expose un slug (`payee`/`partiel`/`en_attente`) plus un libellé
 * (`statut_label`). Pendant longtemps cette page testait `'paye'`/`'payé'` —
 * jamais émis — donc les cartes « Revenus Encaissés » et « Taux d'Encaisse »
 * restaient à zéro, les badges retombaient en « en attente » et le filtre par
 * statut ne matchait rien. Ces tests verrouillent l'usage du vrai contrat.
 */

import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { render, screen, waitFor, fireEvent } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { QueryClientProvider } from '@tanstack/react-query';
import PaiementsPage from '@/app/features/paiements/PaiementsPage';
import { installHttpMock } from './helpers/http-mock';
import { makeQueryClient } from './helpers/render';

const PATH = '/comptable/paiements';

const PAIEMENTS = [
  {
    id: 1,
    reference: 'PAY-2026-0002',
    numero: 'PAY-2026-0002',
    eleve: { id: 11, user: { name: 'Adjovi', prenom: 'Rose' }, classe: { nom_classe: '6A' }, matricule: 'MAT-001' },
    client: 'Adjovi Rose',
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
    eleve: { id: 12, user: { name: 'Mensah', prenom: 'Kofi' }, classe: { nom_classe: 'CM1' }, matricule: 'MAT-002' },
    client: 'Mensah Kofi',
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

function renderPage() {
  return render(
    <MemoryRouter>
      <QueryClientProvider client={makeQueryClient()}>
        <PaiementsPage />
      </QueryClientProvider>
    </MemoryRouter>
  );
}

describe('PaiementsPage', () => {
  it('calcule l’encaisse sur le slug `payee` et affiche les libellés', async () => {
    http.onGet(PATH).reply(200, { success: true, data: PAIEMENTS });

    renderPage();

    // Une ligne du tableau chargée : les données sont arrivées.
    await waitFor(() => expect(screen.getByText('Adjovi Rose')).toBeInTheDocument());

    // Les badges portent le libellé (`statut_label`), pas le slug brut.
    expect(screen.getByText('Payée')).toBeInTheDocument();
    expect(screen.getByText('Partielle')).toBeInTheDocument();

    // Une ligne payée sur deux : encaissé = 25000, taux = 50 %, impayés = 50 %.
    // Le calcul doit reposer sur `statut === 'payee'`, pas `'paye'`/`'payé'`.
    expect(screen.getAllByText(/25\s*000/).length).toBeGreaterThan(0);
    expect(screen.getAllByText('50%').length).toBe(2);
    expect(screen.getByText('Impayés')).toBeInTheDocument();
  });

  it('filtre par statut avec les valeurs du contrat', async () => {
    http.onGet(PATH).reply(200, { success: true, data: PAIEMENTS });

    renderPage();

    await waitFor(() => expect(screen.getByText('Adjovi Rose')).toBeInTheDocument());

    fireEvent.change(screen.getByDisplayValue('Tous les statuts'), {
      target: { value: 'payee' },
    });
    expect(screen.getByText('Adjovi Rose')).toBeInTheDocument();
    expect(screen.queryByText('Mensah Kofi')).not.toBeInTheDocument();

    fireEvent.change(screen.getByDisplayValue('Payé'), {
      target: { value: 'partiel' },
    });
    expect(screen.getByText('Mensah Kofi')).toBeInTheDocument();
    expect(screen.queryByText('Adjovi Rose')).not.toBeInTheDocument();
  });
});
