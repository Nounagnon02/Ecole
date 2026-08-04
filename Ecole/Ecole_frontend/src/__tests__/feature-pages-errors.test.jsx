/**
 * Pages métier — l'erreur d'API doit se voir comme une erreur
 *
 * Le défaut visé : une page qui avale l'échec HTTP et rend une liste
 * vide. Pour l'utilisateur, « le serveur est tombé » et « il n'y a
 * aucune donnée » deviennent alors le même écran, et il conclut à tort
 * qu'il n'y a rien à voir.
 *
 * Chaque page est donc testée sur trois états distincts : données,
 * vide, erreur — et l'erreur doit produire un signal visible.
 */

import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { render, screen, waitFor, fireEvent } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { QueryClientProvider } from '@tanstack/react-query';
import ElevesPage from '@/app/features/eleves/ElevesPage';
import TransactionsPage from '@/app/features/comptable/TransactionsPage';
import AbsencesPage from '@/app/features/censeur/AbsencesPage';
import { installHttpMock } from './helpers/http-mock';
import { makeQueryClient } from './helpers/render';

let http;

beforeEach(() => {
  http = installHttpMock();
  vi.spyOn(console, 'error').mockImplementation(() => {});
});

afterEach(() => {
  http.restore();
  vi.restoreAllMocks();
});

function renderPage(element, { withQuery = false } = {}) {
  const tree = <MemoryRouter>{element}</MemoryRouter>;
  if (!withQuery) return render(tree);
  return render(<QueryClientProvider client={makeQueryClient()}>{tree}</QueryClientProvider>);
}

/* ══════════════════════════════════════════════════════════════════════
 *  ElevesPage — via useApiQuery (TanStack Query)
 * ═══════════════════════════════════════════════════════════════════ */
describe('ElevesPage', () => {
  const ELEVE = {
    id: 1,
    numero_matricule: 'ELV-2024-001',
    moyenne: 14,
    user: { name: 'Adjovi', prenom: 'Rose', email: 'rose@ecole.bj', is_active: true },
    classe: { nom_classe: '5e B' },
  };

  it('affiche les élèves renvoyés dans un paginateur Laravel', async () => {
    // Forme réelle de GET /eleves : paginate() renvoyé tel quel.
    http.onGet('/eleves').reply(200, { current_page: 1, last_page: 1, per_page: 50, total: 1, data: [ELEVE] });

    renderPage(<ElevesPage />, { withQuery: true });

    await waitFor(() => expect(screen.getByText(/Adjovi/)).toBeInTheDocument());
    expect(screen.getByText('ELV-2024-001')).toBeInTheDocument();
    // « 5e B » apparaît dans le badge de la ligne et dans le filtre de classes.
    expect(screen.getAllByText('5e B').length).toBeGreaterThan(0);
    expect(screen.queryByText(/Erreur de chargement/i)).not.toBeInTheDocument();
  });

  it('accepte aussi un tableau nu', async () => {
    http.onGet('/eleves').reply(200, [ELEVE]);

    renderPage(<ElevesPage />, { withQuery: true });

    await waitFor(() => expect(screen.getByText(/Adjovi/)).toBeInTheDocument());
  });

  it('affiche l’état vide sans message d’erreur quand il n’y a aucun élève', async () => {
    http.onGet('/eleves').reply(200, { current_page: 1, total: 0, data: [] });

    renderPage(<ElevesPage />, { withQuery: true });

    await waitFor(() => expect(screen.getByText('Aucun élève trouvé')).toBeInTheDocument());
    expect(screen.queryByText(/Erreur de chargement/i)).not.toBeInTheDocument();
  });

  it.each([
    [403, 'Action non autorisée.'],
    [404, 'Ressource introuvable.'],
    [500, 'Erreur interne du serveur.'],
  ])('rend visiblement l’erreur sur %i, message du serveur inclus', async (status, message) => {
    http.onGet('/eleves').reply(status, { message });

    renderPage(<ElevesPage />, { withQuery: true });

    await waitFor(() => expect(screen.getByText(new RegExp(message))).toBeInTheDocument());
    expect(screen.getByText(/Erreur de chargement/i)).toBeInTheDocument();
  });

  it('rend l’erreur sur panne réseau', async () => {
    http.onGet('/eleves').networkError('Network Error');

    renderPage(<ElevesPage />, { withQuery: true });

    await waitFor(() => expect(screen.getByText(/Erreur de chargement/i)).toBeInTheDocument());
  });

  it('n’insiste pas sur un 403 mais réessaie un 500', async () => {
    // Réessayer un verdict 4xx retarde l'erreur pour rien et multiplie
    // les requêtes ; une panne serveur, elle, mérite une nouvelle chance.
    http.onGet('/eleves').reply(403, { message: 'Interdit' });
    const first = renderPage(<ElevesPage />, { withQuery: true });
    await waitFor(() => expect(screen.getByText(/Interdit/)).toBeInTheDocument());
    expect(http.callsTo('get', '/eleves')).toHaveLength(1);
    first.unmount();

    http.reset();
    http.onGet('/eleves').reply(503, { message: 'Indisponible' });
    renderPage(<ElevesPage />, { withQuery: true });
    await waitFor(() => expect(screen.getByText(/Indisponible/)).toBeInTheDocument());
    expect(http.callsTo('get', '/eleves').length).toBeGreaterThan(1);
  });

  it('filtre par recherche sans perdre les données', async () => {
    http.onGet('/eleves').reply(200, {
      data: [ELEVE, { ...ELEVE, id: 2, user: { name: 'Kponou', prenom: 'Jean' }, classe: { nom_classe: '6e A' } }],
    });

    renderPage(<ElevesPage />, { withQuery: true });
    await waitFor(() => expect(screen.getByText(/Kponou/)).toBeInTheDocument());

    fireEvent.change(screen.getByPlaceholderText(/Rechercher un élève/i), {
      target: { value: 'Adjovi' },
    });

    await waitFor(() => expect(screen.queryByText(/Kponou/)).not.toBeInTheDocument());
    expect(screen.getByText(/Adjovi/)).toBeInTheDocument();
  });
});

/* ══════════════════════════════════════════════════════════════════════
 *  TransactionsPage — via useApi
 * ═══════════════════════════════════════════════════════════════════ */
describe('TransactionsPage', () => {
  const TRX = {
    id: 1,
    reference: 'PAY-001',
    montant: 25000,
    statut: 'paye',
    type_paiement: 'scolarite',
    mode_paiement: 'mobile_money',
    date_paiement: '2026-01-15',
    eleve: { nom: 'Adjovi', prenom: 'Rose', classe: { nom_classe: '5e B' } },
  };

  it('affiche les transactions renvoyées en collection nue', async () => {
    // Forme réelle : ComptableController::paiements renvoie ->get().
    http.onGet('/comptable/paiements').reply(200, [TRX]);

    renderPage(<TransactionsPage />);

    await waitFor(() => expect(screen.getByText('PAY-001')).toBeInTheDocument());
    expect(screen.queryByText('Aucune transaction trouvée')).not.toBeInTheDocument();
  });

  it('affiche aussi les transactions d’une enveloppe { data: [...] }', async () => {
    http.onGet('/comptable/paiements').reply(200, { data: [TRX] });

    renderPage(<TransactionsPage />);

    await waitFor(() => expect(screen.getByText('PAY-001')).toBeInTheDocument());
  });

  it('affiche l’état vide quand la liste est vide', async () => {
    http.onGet('/comptable/paiements').reply(200, { data: [] });

    renderPage(<TransactionsPage />);

    await waitFor(() => expect(screen.getByText('Aucune transaction trouvée')).toBeInTheDocument());
    expect(screen.queryByText('Réessayer')).not.toBeInTheDocument();
  });

  it.each([[401], [403], [404], [500]])(
    'sur %i, affiche l’écran d’erreur et non un tableau vide',
    async (status) => {
      http.onGet('/comptable/paiements').reply(status, { message: `Échec ${status}` });

      renderPage(<TransactionsPage />);

      await waitFor(() => expect(screen.getByText(`Échec ${status}`)).toBeInTheDocument());
      expect(screen.getByText('Réessayer')).toBeInTheDocument();
      // L'état « rien à afficher » ne doit pas être présenté à sa place.
      expect(screen.queryByText('Aucune transaction trouvée')).not.toBeInTheDocument();
    }
  );

  it('sur panne réseau, affiche l’écran d’erreur', async () => {
    http.onGet('/comptable/paiements').networkError('Network Error');

    renderPage(<TransactionsPage />);

    await waitFor(() => expect(screen.getByText('Réessayer')).toBeInTheDocument());
    expect(screen.queryByText('Aucune transaction trouvée')).not.toBeInTheDocument();
  });

  it('filtre par statut', async () => {
    http.onGet('/comptable/paiements').reply(200, [
      TRX,
      { ...TRX, id: 2, reference: 'PAY-002', statut: 'en_attente' },
    ]);

    renderPage(<TransactionsPage />);
    await waitFor(() => expect(screen.getByText('PAY-002')).toBeInTheDocument());

    fireEvent.change(screen.getByDisplayValue('Tous les statuts'), { target: { value: 'paye' } });

    await waitFor(() => expect(screen.queryByText('PAY-002')).not.toBeInTheDocument());
    expect(screen.getByText('PAY-001')).toBeInTheDocument();
  });
});

/* ══════════════════════════════════════════════════════════════════════
 *  AbsencesPage — via useApi
 * ═══════════════════════════════════════════════════════════════════ */
describe('AbsencesPage', () => {
  const ABSENCE = {
    id: 1,
    eleve_id: 10,
    date: '2026-02-02',
    type: 'absence',
    justifiee: false,
    motif: 'Non renseigné',
    eleve: { nom: 'Kponou', prenom: 'Jean', classe: { nom_classe: '4e C' } },
  };

  it('affiche les absences et leurs compteurs', async () => {
    http.onGet('/surveillant/absences').reply(200, { data: [ABSENCE, { ...ABSENCE, id: 2, justifiee: true }] });

    renderPage(<AbsencesPage />);

    await waitFor(() => expect(screen.getAllByText(/Kponou/).length).toBe(2));
    expect(screen.getByText('Total Absences')).toBeInTheDocument();
    expect(screen.queryByText('Aucune absence trouvée')).not.toBeInTheDocument();
  });

  it('affiche l’état vide sans écran d’erreur', async () => {
    http.onGet('/surveillant/absences').reply(200, []);

    renderPage(<AbsencesPage />);

    await waitFor(() => expect(screen.getByText('Aucune absence trouvée')).toBeInTheDocument());
    expect(screen.queryByText('Réessayer')).not.toBeInTheDocument();
  });

  it.each([[403], [500]])('sur %i, affiche l’erreur du serveur', async (status) => {
    http.onGet('/surveillant/absences').reply(status, { message: `Refus ${status}` });

    renderPage(<AbsencesPage />);

    await waitFor(() => expect(screen.getByText(`Refus ${status}`)).toBeInTheDocument());
    expect(screen.queryByText('Aucune absence trouvée')).not.toBeInTheDocument();
  });

  it('filtre les absences non justifiées', async () => {
    http.onGet('/surveillant/absences').reply(200, {
      data: [
        ABSENCE,
        { ...ABSENCE, id: 2, justifiee: true, eleve: { nom: 'Sossou', prenom: 'Ada', classe: { nom_classe: '3e A' } } },
      ],
    });

    renderPage(<AbsencesPage />);
    await waitFor(() => expect(screen.getByText(/Sossou/)).toBeInTheDocument());

    fireEvent.change(screen.getByDisplayValue('Toutes les absences'), {
      target: { value: 'non_justifiee' },
    });

    await waitFor(() => expect(screen.queryByText(/Sossou/)).not.toBeInTheDocument());
    expect(screen.getByText(/Kponou/)).toBeInTheDocument();
  });
});
