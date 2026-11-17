/**
 * Tableau de bord de l'élève — pertinence (revue web du 16/11/2026).
 *
 * Vu dans le navigateur, lundi 16/11 : « Moyenne générale 15/20 » sur une
 * seule note brute, « Absences ce mois » qui comptait les retards, et
 * « Prochains cours » qui commençait par jeudi.
 */
import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { render, screen, waitFor, within } from '@testing-library/react';
import { QueryClientProvider } from '@tanstack/react-query';
import { MemoryRouter } from 'react-router-dom';
import { makeQueryClient } from './helpers/render';
import { installHttpMock } from './helpers/http-mock';
import EleveDashboard from '@/app/dashboards/eleve';
import useAuthStore from '@/shared/stores/auth-store';
import { clearDashboardCache } from '@/shared/lib/query-client';

const cours = (jour, heure_debut, nom) => ({
  jour, heure_debut, heure_fin: '18:00', salle: 'B1', matiere: { nom }, enseignant: { user: { name: 'M. Aho' } },
});

const PAYLOAD = {
  eleve: { id: 3, classe: '3ème' },
  stats: { moyenne_generale: 14, periode: 'trimestre2', total_notes: 4, absences_mois: 1, retards_mois: 2 },
  matieres: [{ name: 'Mathématiques', note: 12.5, coeff: 4 }],
  // Ordre de la semaine, comme l'API le renvoie désormais.
  emploi_du_temps: [cours('lundi', '08:00', 'EPS'), cours('mardi', '08:00', 'Anglais'), cours('mardi', '14:00', 'Physique'), cours('jeudi', '10:00', 'Français')],
};

let http;
beforeEach(() => {
  // Mardi 17/11/2026, 10 h 30 : le cours de 8 h est passé.
  vi.useFakeTimers({ toFake: ['Date'] });
  vi.setSystemTime(new Date(2026, 10, 17, 10, 30));
  http = installHttpMock();
  clearDashboardCache();
  useAuthStore.setState({ user: { id: 1, name: 'Élève', role: 'eleve' }, isAuthenticated: true, isLoading: false, sessionLastVerified: Date.now() });
  http.onGet('/dashboard/eleve').reply(200, { data: PAYLOAD });
});

afterEach(() => {
  http.restore();
  clearDashboardCache();
  vi.useRealTimers();
  vi.restoreAllMocks();
});

const monter = () => render(
  <QueryClientProvider client={makeQueryClient()}>
    <MemoryRouter><EleveDashboard /></MemoryRouter>
  </QueryClientProvider>,
);

describe('EleveDashboard — pertinence', () => {
  it('présente la moyenne comme provisoire, avec sa période', async () => {
    monter();
    expect(await screen.findByText('Moyenne du trimestre 2 (provisoire)')).toBeInTheDocument();
    expect(screen.getByText('14/20')).toBeInTheDocument();
    expect(screen.queryByText('Moyenne générale')).not.toBeInTheDocument();
  });

  it('montre les retards à part des absences', async () => {
    monter();
    expect(await screen.findByText('Absences ce mois')).toBeInTheDocument();
    expect(screen.getByText('Retards ce mois')).toBeInTheDocument();
    expect(screen.getByText('2')).toBeInTheDocument();
  });

  it('liste les prochains cours à partir de maintenant, dans l’ordre de la semaine', async () => {
    monter();
    const titre = await screen.findByText('Prochains cours');
    const carte = titre.closest('[data-testid="prochains-cours"]');
    await waitFor(() => expect(within(carte).getByText('Physique')).toBeInTheDocument());
    const ordre = within(carte).getAllByText(/^(EPS|Anglais|Physique|Français)$/).map((n) => n.textContent);
    expect(ordre).toEqual(['Physique', 'Français', 'EPS', 'Anglais']);
  });
});
