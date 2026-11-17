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
    eleve: { id: 11, nom: 'Adjovi', prenom: 'Rose', classe: { nom_classe: '6A' }, matricule: 'MAT-001' },
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
    eleve: { id: 12, nom: 'Mensah', prenom: 'Kofi', classe: { nom_classe: 'CM1' }, matricule: 'MAT-002' },
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

// Forme exacte de ComptableController::paiements (17/11/2026) : `eleve.nom`,
// `eleve.prenom`. Les données précédentes imitaient `eleve.user.name`, la
// même erreur que la page : aucun nom ne s'affichait en vrai, sans qu'un test
// échoue.
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

    // Calcul sur les MONTANTS (revue de pertinence, 15/11/2026) : la ligne
    // partielle a reçu 25 000 sur 50 000. Encaissé 50 000 sur 75 000 dus,
    // soit 67 % ; reste 25 000. Avant, l'encaissé ignorait ce versement
    // partiel et « taux / impayés » comptaient des lignes (50 % / 50 %).
    expect(screen.getByText('Encaissé')).toBeInTheDocument();
    expect(screen.getAllByText(/50\s000/).length).toBeGreaterThan(0);
    expect(screen.getByText('67%')).toBeInTheDocument();
    expect(screen.getByText('Reste à encaisser')).toBeInTheDocument();
    expect(screen.queryByText('50%')).not.toBeInTheDocument();
    // Ligne partielle : payé 25 000, et ce qui est dû au total.
    expect(screen.getByText(/sur 50\s000.*dus/)).toBeInTheDocument();
  });

  it('affiche « — » et non « 100 % » d’impayés quand il n’y a aucun paiement', async () => {
    http.onGet(PATH).reply(200, { success: true, data: [] });

    renderPage();

    await waitFor(() => expect(screen.getAllByText('—').length).toBe(2));
    expect(screen.queryByText('100%')).not.toBeInTheDocument();
    expect(screen.queryByText('0%')).not.toBeInTheDocument();
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

describe('PaiementsPage — nom de l’élève (forme réelle de l’API)', () => {
  it('affiche le nom et le propose dans l’échéancier pour encaisser', async () => {
    http.onGet(PATH).reply(200, { success: true, data: PAIEMENTS });
    render(
      <QueryClientProvider client={makeQueryClient()}>
        <MemoryRouter initialEntries={['/paiements']}><PaiementsPage /></MemoryRouter>
      </QueryClientProvider>,
    );
    expect(await screen.findByText('Adjovi Rose')).toBeInTheDocument();
    fireEvent.change(screen.getAllByPlaceholderText(/Rechercher un élève/)[0], { target: { value: 'mensah' } });
    expect(screen.queryByText('Adjovi Rose')).not.toBeInTheDocument();
    expect(screen.getByText('Mensah Kofi')).toBeInTheDocument();
    fireEvent.click(screen.getByRole('button', { name: /Échéancier/ }));
    expect(await screen.findByRole('button', { name: /Mensah Kofi/ })).toBeInTheDocument();
    expect(screen.queryByText('Aucun élève trouvé')).not.toBeInTheDocument();
  });
});

