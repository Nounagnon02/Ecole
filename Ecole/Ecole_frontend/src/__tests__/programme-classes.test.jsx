/*
 * Programme des classes (audit du 14/11, N-08) : la direction configure les
 * séries, matières et coefficients d'une classe sans passer par la base.
 * Sans programme, une classe neuve ne peut recevoir aucun enseignant.
 */
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor, within } from '@testing-library/react';
import { QueryClientProvider } from '@tanstack/react-query';
import { MemoryRouter } from 'react-router-dom';
import ProgrammePage from '@/app/features/programme/ProgrammePage';
import { PROTECTED_ROUTES } from '@/features/roles/route-config';
import { getRoleNavigation } from '@/features/roles/navigation-config';
import apiClient from '@/shared/lib/api-client';
import { signIn, makeQueryClient } from './helpers/render';

vi.mock('@/shared/lib/api-client', async () => {
  const { useQuery } = await vi.importActual('@tanstack/react-query');
  const client = { get: vi.fn(), post: vi.fn(), put: vi.fn(), delete: vi.fn() };
  const useApiQuery = (key, url, options = {}) => useQuery({
    queryKey: key, retry: false, enabled: options.queryOptions?.enabled ?? true,
    queryFn: async () => (await client.get(url, options.config ?? {})).data,
  });
  return { default: client, api: client, useApiQuery };
});

const PROGRAMMES = {
  10: [{ serie_id: 3, serie_nom: 'Collège', matiere_id: 1, matiere_nom: 'Mathématiques', coefficient: 4 }],
  11: [
    { serie_id: 3, serie_nom: 'Collège', matiere_id: 1, matiere_nom: 'Mathématiques', coefficient: 3 },
    { serie_id: 3, serie_nom: 'Collège', matiere_id: 2, matiere_nom: 'Français', coefficient: 3 },
  ],
  12: [],
};

function reponses(url) {
  if (url === '/classes') return { data: [{ id: 10, nom_classe: '6ème' }, { id: 11, nom_classe: '5ème' }, { id: 12, nom_classe: '3ème' }] };
  if (url === '/series') return { data: { data: [{ id: 3, nom: 'Collège' }] } };
  if (url === '/matieres') return { data: { data: [{ id: 1, nom: 'Mathématiques' }, { id: 2, nom: 'Français' }] } };
  const m = url.match(/^\/classes\/(\d+)\/programme$/);
  if (m) return { data: { success: true, data: PROGRAMMES[m[1]] } };
  return { data: [] };
}

function monter() {
  return render(
    <QueryClientProvider client={makeQueryClient()}>
      <MemoryRouter><ProgrammePage /></MemoryRouter>
    </QueryClientProvider>,
  );
}

async function choisirClasse(nom) {
  const select = await screen.findByLabelText('Classe');
  await waitFor(() => expect(within(select).getByRole('option', { name: nom })).toBeInTheDocument());
  fireEvent.change(select, { target: { value: within(select).getByRole('option', { name: nom }).value } });
}

describe('Programme des classes', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    apiClient.get.mockImplementation((url) => Promise.resolve(reponses(url)));
    apiClient.post.mockResolvedValue({ data: { id: 9 } });
    apiClient.put.mockResolvedValue({ data: {} });
    apiClient.delete.mockResolvedValue({ data: {} });
    signIn('directeur', { ecole_id: 1 });
  });

  it('est ouverte à la direction et à l’administrateur d’école, et figure au menu du directeur', () => {
    const route = Object.values(PROTECTED_ROUTES).find((r) => r.path === '/programme');
    expect(route.roles).toEqual(expect.arrayContaining(['directeur', 'directeurS', 'admin']));
    expect(getRoleNavigation('directeur').map((i) => i.path)).toContain('/programme');
  });

  it('affiche le programme de la classe choisie', async () => {
    monter();
    await choisirClasse('6ème');
    expect(await screen.findByLabelText('Coefficient de Mathématiques')).toHaveValue(4);
    expect(screen.getByRole('cell', { name: 'Mathématiques' })).toBeInTheDocument();
  });

  it('ajoute une matière avec son coefficient à la classe', async () => {
    monter();
    await choisirClasse('6ème');
    await screen.findByLabelText('Coefficient de Mathématiques');
    fireEvent.change(screen.getByLabelText('Série'), { target: { value: '3' } });
    fireEvent.change(screen.getByLabelText('Matière'), { target: { value: '2' } });
    fireEvent.change(screen.getByLabelText('Coefficient'), { target: { value: '3' } });
    fireEvent.click(screen.getByRole('button', { name: 'Ajouter la matière' }));
    await waitFor(() => expect(apiClient.post).toHaveBeenCalledWith('/series/3/matieres', { matiere_id: 2, classe_id: 10, coefficient: 3 }));
  });

  it('crée une série à la volée avant d’y ajouter la matière', async () => {
    monter();
    await choisirClasse('3ème');
    fireEvent.change(await screen.findByLabelText('Série'), { target: { value: 'nouvelle' } });
    fireEvent.change(screen.getByLabelText('Nom de la nouvelle série'), { target: { value: 'Collège 2' } });
    fireEvent.change(screen.getByLabelText('Matière'), { target: { value: '1' } });
    fireEvent.click(screen.getByRole('button', { name: 'Ajouter la matière' }));
    await waitFor(() => expect(apiClient.post).toHaveBeenCalledWith('/series/store', { nom: 'Collège 2' }));
    await waitFor(() => expect(apiClient.post).toHaveBeenCalledWith('/series/9/matieres', { matiere_id: 1, classe_id: 12, coefficient: 1 }));
  });

  it('change un coefficient de cette classe seulement', async () => {
    monter();
    await choisirClasse('6ème');
    const champ = await screen.findByLabelText('Coefficient de Mathématiques');
    fireEvent.change(champ, { target: { value: '5' } });
    fireEvent.blur(champ);
    await waitFor(() => expect(apiClient.put).toHaveBeenCalledWith('/series/3/matieres/1/coefficient', { classe_id: 10, coefficient: 5 }));
  });

  it('retire une matière de cette classe seulement, après confirmation', async () => {
    monter();
    await choisirClasse('6ème');
    fireEvent.click(await screen.findByRole('button', { name: 'Retirer Mathématiques' }));
    fireEvent.click(within(await screen.findByRole('dialog')).getByRole('button', { name: 'Retirer' }));
    await waitFor(() => expect(apiClient.delete).toHaveBeenCalledWith('/series/3/matieres/1', { params: { classe_id: 10 } }));
  });

  it('reprend le programme d’une autre classe pour une classe neuve', async () => {
    monter();
    await choisirClasse('3ème');
    expect(await screen.findByText(/aucune matière/i)).toBeInTheDocument();
    fireEvent.change(screen.getByLabelText('Reprendre le programme de'), { target: { value: '11' } });
    fireEvent.click(screen.getByRole('button', { name: 'Reprendre' }));
    await waitFor(() => expect(apiClient.post).toHaveBeenCalledTimes(2));
    expect(apiClient.post).toHaveBeenCalledWith('/series/3/matieres', { matiere_id: 1, classe_id: 12, coefficient: 3 });
    expect(apiClient.post).toHaveBeenCalledWith('/series/3/matieres', { matiere_id: 2, classe_id: 12, coefficient: 3 });
  });
});
