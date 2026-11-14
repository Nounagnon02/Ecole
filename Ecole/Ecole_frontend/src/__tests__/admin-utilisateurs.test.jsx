/*
 * Comptes gérés par l'administrateur d'école (BUG-023, audit du 14/11).
 *
 * La page « Utilisateurs » listait des écoles (`/v1/admin/tenants`) sous le
 * nom d'utilisateurs, n'était ouverte qu'au super-administrateur, et ses
 * boutons « Ajouter », « Désactiver », « Supprimer » ne faisaient rien.
 */
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor, within } from '@testing-library/react';
import { QueryClientProvider } from '@tanstack/react-query';
import { MemoryRouter } from 'react-router-dom';
import UtilisateursPage from '@/app/features/admin/UtilisateursPage';
import { PROTECTED_ROUTES } from '@/features/roles/route-config';
import { getRoleNavigation } from '@/features/roles/navigation-config';
import apiClient from '@/shared/lib/api-client';
import { signIn, makeQueryClient } from './helpers/render';

vi.mock('@/shared/lib/api-client', async () => {
  const { useQuery } = await vi.importActual('@tanstack/react-query');
  const client = { get: vi.fn(), post: vi.fn(), delete: vi.fn() };
  const useApiQuery = (key, url, options = {}) => useQuery({
    queryKey: key, retry: false, queryFn: async () => (await client.get(url, options.config ?? {})).data,
  });
  return { default: client, api: client, useApiQuery };
});

const comptes = [
  { id: 11, nom: 'HOUNSOU', prenom: 'Léa', email: null, telephone: '+2290197000001', role: 'secretaire', active: true, ecole: { id: 1, nom: 'CEG Test' } },
  { id: 12, nom: 'AZON', prenom: 'Paul', email: null, telephone: '+2290197000002', role: 'comptable', active: false, ecole: { id: 1, nom: 'CEG Test' } },
];

function monter() {
  return render(
    <QueryClientProvider client={makeQueryClient()}>
      <MemoryRouter><UtilisateursPage /></MemoryRouter>
    </QueryClientProvider>,
  );
}

describe('Utilisateurs de l’école (administrateur)', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    apiClient.get.mockResolvedValue({ data: { success: true, data: comptes } });
    signIn('admin', { ecole_id: 1 });
  });

  it('est ouverte à l’administrateur d’école et figure dans son menu', () => {
    const route = Object.values(PROTECTED_ROUTES).find((r) => r.path === '/admin/utilisateurs');
    expect(route.roles).toContain('admin');
    expect(getRoleNavigation('admin').map((i) => i.path)).toContain('/admin/utilisateurs');
  });

  it('liste les comptes de l’école, pas les écoles', async () => {
    monter();
    expect(await screen.findByText('HOUNSOU Léa')).toBeInTheDocument();
    expect(apiClient.get).toHaveBeenCalledWith('/admin/utilisateurs', expect.anything());
    expect(apiClient.get).not.toHaveBeenCalledWith(expect.stringContaining('tenants'), expect.anything());
  });

  it('crée un compte du personnel', async () => {
    apiClient.post.mockResolvedValue({ data: { success: true, acces: { identifiant: '0197000123', mot_de_passe_provisoire: 'Prov-1234' } } });
    monter();
    await screen.findByText('HOUNSOU Léa');
    fireEvent.click(screen.getByRole('button', { name: /ajouter/i }));
    const dialogue = await screen.findByRole('dialog');
    fireEvent.change(within(dialogue).getByLabelText(/rôle/i), { target: { value: 'comptable' } });
    fireEvent.change(within(dialogue).getByLabelText(/^nom/i), { target: { value: 'DOSSOU' } });
    fireEvent.change(within(dialogue).getByLabelText(/téléphone/i), { target: { value: '0197000123' } });
    fireEvent.click(within(dialogue).getByRole('button', { name: /créer/i }));

    await waitFor(() => expect(apiClient.post).toHaveBeenCalledWith('/admin/utilisateurs', expect.objectContaining({ role: 'comptable', nom: 'DOSSOU' })));
    expect(await within(dialogue).findByText('Prov-1234')).toBeInTheDocument();
  });

  it('désactive un compte après confirmation, et réactive un compte inactif', async () => {
    apiClient.post.mockResolvedValue({ data: { success: true, data: { active: false } } });
    monter();
    await screen.findByText('HOUNSOU Léa');

    fireEvent.click(screen.getByRole('button', { name: 'Désactiver HOUNSOU Léa' }));
    const confirmation = await screen.findByRole('dialog');
    fireEvent.click(within(confirmation).getByRole('button', { name: 'Désactiver' }));
    await waitFor(() => expect(apiClient.post).toHaveBeenCalledWith('/admin/utilisateurs/11/toggle-status'));

    fireEvent.click(screen.getByRole('button', { name: 'Réactiver AZON Paul' }));
    await waitFor(() => expect(apiClient.post).toHaveBeenCalledWith('/admin/utilisateurs/12/toggle-status'));
  });

  it('n’offre pas de création au super-administrateur sans école', async () => {
    signIn('super-admin', { ecole_id: null });
    monter();
    await screen.findByText('HOUNSOU Léa');
    expect(screen.queryByRole('button', { name: /ajouter/i })).not.toBeInTheDocument();
  });
});
