/**
 * Pages d'administration plateforme — chargement, états vides, erreurs.
 *
 * Les huit pages `admin/` n'avaient aucun test alors qu'elles pilotent les
 * plans, les modules et les comptes de toute la plateforme (audit P2.7).
 *
 * Écrits avant la migration de ces pages vers react-query : ils décrivent le
 * comportement attendu indépendamment du mécanisme de chargement, ce qui rend
 * la migration vérifiable plutôt que supposée.
 */

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, screen, waitFor, fireEvent } from '@testing-library/react';
import { QueryClientProvider } from '@tanstack/react-query';
import PlansPage from '@/app/features/admin/PlansPage';
import ModulesPage from '@/app/features/admin/ModulesPage';
import UtilisateursPage from '@/app/features/admin/UtilisateursPage';
import BillingPage from '@/app/features/admin/BillingPage';
import StatistiquesPage from '@/app/features/admin/StatistiquesPage';
import WhiteLabelPage from '@/app/features/admin/WhiteLabelPage';
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

function monter(element) {
  return render(
    <QueryClientProvider client={makeQueryClient()}>{element}</QueryClientProvider>,
  );
}

describe('PlansPage', () => {
  const CHEMIN = '/v1/admin/plans';

  it('liste les plans renvoyés par l’API', async () => {
    http.onGet(CHEMIN).reply(200, {
      data: [
        { id: 1, name: 'Essentiel', price_monthly: 25000, features: ['Notes', 'Paiements'] },
        { id: 2, name: 'Intégral', price_monthly: 60000, features: ['Tout'] },
      ],
    });

    monter(<PlansPage />);

    await waitFor(() => expect(screen.getByText('Essentiel')).toBeInTheDocument());
    expect(screen.getByText('Intégral')).toBeInTheDocument();
  });

  it('traverse les trois formes d’enveloppe que l’API peut renvoyer', async () => {
    // Les contrôleurs n'enveloppent pas tous pareil : `{data:{data:[]}}`,
    // `{data:[]}` ou un tableau nu. La page doit rendre les trois.
    http.onGet(CHEMIN).reply(200, [{ id: 9, name: 'Nu', price_monthly: 1000, features: [] }]);

    monter(<PlansPage />);

    await waitFor(() => expect(screen.getByText('Nu')).toBeInTheDocument());
  });

  it('affiche l’état vide plutôt qu’une grille muette', async () => {
    http.onGet(CHEMIN).reply(200, { data: [] });

    monter(<PlansPage />);

    await waitFor(() => expect(screen.getByText(/aucun plan disponible/i)).toBeInTheDocument());
  });

  it('ne fait pas passer une erreur serveur pour une liste vide', async () => {
    http.onGet(CHEMIN).reply(500, { message: 'Service indisponible' });

    monter(<PlansPage />);

    // Le silence est le pire cas : l'utilisateur croit qu'il n'y a aucun plan.
    await waitFor(() =>
      expect(screen.queryByText(/aucun plan disponible/i)).not.toBeInTheDocument(),
    );
  });
});

describe('ModulesPage', () => {
  const CHEMIN = '/v1/admin/modules';

  it('liste les modules renvoyés par l’API', async () => {
    http.onGet(CHEMIN).reply(200, {
      data: [
        { id: 1, name: 'Bibliothèque', is_active: true },
        { id: 2, name: 'Transport', is_active: false },
      ],
    });

    monter(<ModulesPage />);

    await waitFor(() => expect(screen.getByText('Bibliothèque')).toBeInTheDocument());
    expect(screen.getByText('Transport')).toBeInTheDocument();
  });

  it('affiche l’état vide quand aucun module n’est déclaré', async () => {
    http.onGet(CHEMIN).reply(200, { data: [] });

    monter(<ModulesPage />);

    await waitFor(() => expect(screen.getByText(/aucun module disponible/i)).toBeInTheDocument());
  });
});

describe('UtilisateursPage', () => {
  const CHEMIN = '/v1/admin/tenants';

  it('projette les tenants en lignes utilisateur', async () => {
    http.onGet(CHEMIN).reply(200, {
      data: [
        { id: 1, name: 'Complexe Excellence', email: 'excellence@test.bj', plan: { name: 'Intégral' } },
        { id: 2, name: 'Groupe Horizon', email: 'horizon@test.bj' },
      ],
    });

    monter(<UtilisateursPage />);

    await waitFor(() => expect(screen.getAllByText('Complexe Excellence').length).toBeGreaterThan(0));
    // Le plan sert de rôle ; sans plan, la projection retombe sur
    // « Directeur ». Le libellé existe aussi dans le filtre de rôles, d'où
    // `getAllByText`.
    expect(screen.getByText('Intégral')).toBeInTheDocument();
    expect(screen.getAllByText('Directeur').length).toBeGreaterThan(0);
  });
});

describe('BillingPage', () => {
  const FACTURES = '/v1/admin/billing/invoices';
  const REVENUS = '/v1/admin/analytics/revenue';

  it('liste les factures et agrège le revenu', async () => {
    http.onGet(FACTURES).reply(200, {
      data: [
        { id: 1, invoice_number: 'F-001', school: 'Complexe Excellence', amount: 150000, status: 'paid' },
        { id: 2, invoice_number: 'F-002', school: 'Groupe Horizon', amount: 90000, status: 'pending' },
      ],
    });
    http.onGet(REVENUS).reply(200, { data: [{ year: 2026, month: 9, total: 240000 }] });

    monter(<BillingPage />);

    // Le numéro de facture est concaténé à la date et au mode de règlement
    // dans un même paragraphe ; le nom d'établissement, lui, est rendu seul.
    await waitFor(() => expect(screen.getByText('Complexe Excellence')).toBeInTheDocument());
    expect(screen.getByText('Groupe Horizon')).toBeInTheDocument();
    expect(screen.getByText(/F-001/)).toBeInTheDocument();
  });

  it('affiche les factures même si les revenus échouent', async () => {
    // Les deux appels sont indépendants : l'échec de l'un ne doit pas vider
    // l'autre. C'est le contrat que portait `Promise.allSettled`.
    http.onGet(FACTURES).reply(200, {
      data: [{ id: 1, invoice_number: 'F-001', school: 'Excellence', amount: 150000, status: 'paid' }],
    });
    http.onGet(REVENUS).reply(500, { message: 'Analytics indisponible' });

    monter(<BillingPage />);

    await waitFor(() => expect(screen.getByText('Excellence')).toBeInTheDocument());
  });

  it('affiche l’état vide quand il n’y a aucune facture', async () => {
    http.onGet(FACTURES).reply(200, { data: [] });
    http.onGet(REVENUS).reply(200, { data: [] });

    monter(<BillingPage />);

    await waitFor(() => expect(screen.getByText(/aucune facture trouvée/i)).toBeInTheDocument());
  });
});

describe('StatistiquesPage', () => {
  const CHEMIN = '/v1/admin/analytics/overview';

  it('rend les chiffres renvoyés par l’API', async () => {
    http.onGet(CHEMIN).reply(200, {
      data: { total_tenants: 12, total_users: 840, mrr: 310000, activites: [] },
    });

    monter(<StatistiquesPage />);

    await waitFor(() => expect(screen.getByText('Statistiques')).toBeInTheDocument());
  });

  it('survit à une réponse non enveloppée', async () => {
    http.onGet(CHEMIN).reply(200, { total_tenants: 3, total_users: 42, activites: [] });

    monter(<StatistiquesPage />);

    await waitFor(() => expect(screen.getByText('Statistiques')).toBeInTheDocument());
  });
});

describe('WhiteLabelPage', () => {
  const TENANTS = '/v1/admin/tenants';
  const REGLAGES = (id) => `/v1/admin/tenants/${id}/settings`;

  function mockTenants() {
    http.onGet(TENANTS).reply(200, {
      data: [
        { id: 7, name: 'Complexe Excellence' },
        { id: 8, name: 'Groupe Horizon' },
      ],
    });
  }

  it('sélectionne le premier établissement et charge sa configuration', async () => {
    mockTenants();
    http.onGet(REGLAGES(7)).reply(200, {
      data: { nom_brand: 'Excellence', couleur_primaire: '#123456' },
    });

    monter(<WhiteLabelPage />);

    await waitFor(() => expect(screen.getByDisplayValue('Excellence')).toBeInTheDocument());
  });

  it('recharge la configuration quand on change d’établissement', async () => {
    mockTenants();
    http.onGet(REGLAGES(7)).reply(200, { data: { nom_brand: 'Excellence' } });
    http.onGet(REGLAGES(8)).reply(200, { data: { nom_brand: 'Horizon' } });

    monter(<WhiteLabelPage />);
    await waitFor(() => expect(screen.getByDisplayValue('Excellence')).toBeInTheDocument());

    fireEvent.change(screen.getByRole('combobox'), { target: { value: '8' } });

    // La requête est dépendante de la sélection : changer d'établissement
    // doit amener sa configuration, pas conserver la précédente.
    await waitFor(() => expect(screen.getByDisplayValue('Horizon')).toBeInTheDocument());
  });

  it('n’interroge aucune configuration tant qu’aucun établissement n’est choisi', async () => {
    http.onGet(TENANTS).reply(200, { data: [] });

    monter(<WhiteLabelPage />);

    await waitFor(() => expect(http.callsTo('get', TENANTS)).toHaveLength(1));
    expect(http.callsTo('get', REGLAGES(7))).toHaveLength(0);
  });
});
