/**
 * EcolesPage — chargement, statistiques, filtres, création (audit P2.7 / P4.1)
 *
 * 504 lignes, la plus grosse des huit pages `admin/`, et aucune n'avait de
 * test. C'est pourtant l'écran qui crée et provisionne les établissements :
 * une régression y touche la racine de toutes les données.
 *
 * Ces cas sont écrits avant la migration de la page vers react-query : ils
 * décrivent le comportement attendu indépendamment du mécanisme de
 * chargement, et c'est ce qui rend la migration sûre.
 */

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, screen, within, fireEvent, waitFor } from '@testing-library/react';
import { QueryClientProvider } from '@tanstack/react-query';
import EcolesPage from '@/app/features/admin/EcolesPage';
import { installHttpMock } from './helpers/http-mock';
import { makeQueryClient } from './helpers/render';

const CHEMIN = '/ecoles';

const ECOLES = [
  { id: 1, nom: 'Complexe Excellence', email: 'excellence@test.bj', ville: 'Cotonou', status: 'active', total_eleves: 412 },
  { id: 2, nom: 'Groupe Horizon', email: 'horizon@test.bj', ville: 'Porto-Novo', status: 'active', total_eleves: 188 },
  { id: 3, nom: 'École Lumière', email: 'lumiere@test.bj', ville: 'Parakou', status: 'inactive', total_eleves: 0 },
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

/** La page peut vivre avec ou sans QueryClient : le montage le fournit. */
function monter() {
  return render(
    <QueryClientProvider client={makeQueryClient()}>
      <EcolesPage />
    </QueryClientProvider>,
  );
}

describe('EcolesPage', () => {
  it('liste les établissements renvoyés par l’API', async () => {
    http.onGet(CHEMIN).reply(200, { success: true, data: ECOLES });

    monter();

    await waitFor(() => expect(screen.getByText('Complexe Excellence')).toBeInTheDocument());
    expect(screen.getByText('Groupe Horizon')).toBeInTheDocument();
    expect(screen.getByText('École Lumière')).toBeInTheDocument();
  });

  it('accepte une réponse paginée comme une liste nue', async () => {
    // `/ecoles` est paginé : le tableau vit sous `data.data`. La page doit
    // traverser les deux formes sans afficher un écran vide.
    http.onGet(CHEMIN).reply(200, { success: true, data: { data: ECOLES, total: 3 } });

    monter();

    await waitFor(() => expect(screen.getByText('Complexe Excellence')).toBeInTheDocument());
  });

  it('agrège les statistiques sur les données réelles', async () => {
    http.onGet(CHEMIN).reply(200, { success: true, data: ECOLES });

    monter();

    await waitFor(() => expect(screen.getByText('Complexe Excellence')).toBeInTheDocument());

    // 3 écoles, 2 actives, 1 inactive, 600 élèves cumulés.
    expect(screen.getByText('600')).toBeInTheDocument();
  });

  it('filtre la liste sur la recherche par nom', async () => {
    http.onGet(CHEMIN).reply(200, { success: true, data: ECOLES });

    monter();
    await waitFor(() => expect(screen.getByText('Complexe Excellence')).toBeInTheDocument());

    fireEvent.change(screen.getByPlaceholderText(/rechercher/i), { target: { value: 'Horizon' } });

    expect(screen.getByText('Groupe Horizon')).toBeInTheDocument();
    expect(screen.queryByText('Complexe Excellence')).not.toBeInTheDocument();
  });

  it('filtre sur le statut', async () => {
    http.onGet(CHEMIN).reply(200, { success: true, data: ECOLES });

    monter();
    await waitFor(() => expect(screen.getByText('École Lumière')).toBeInTheDocument());

    fireEvent.change(screen.getByLabelText(/filtrer par statut/i), { target: { value: 'inactive' } });

    expect(screen.getByText('École Lumière')).toBeInTheDocument();
    expect(screen.queryByText('Complexe Excellence')).not.toBeInTheDocument();
  });

  it('signale l’échec de chargement au lieu d’un écran vide muet', async () => {
    http.onGet(CHEMIN).reply(500, { message: 'Base indisponible' });

    monter();

    await waitFor(() => expect(screen.getByText(/base indisponible|erreur/i)).toBeInTheDocument());
  });

  it('crée un établissement et recharge la liste', async () => {
    http.onGet(CHEMIN).reply(200, { success: true, data: ECOLES });
    http.onPost(CHEMIN).reply(201, { success: true, data: { id: 4 } });

    monter();
    await waitFor(() => expect(screen.getByText('Complexe Excellence')).toBeInTheDocument());

    fireEvent.click(screen.getByRole('button', { name: /ajouter une école/i }));

    const modale = screen.getByRole('dialog');
    fireEvent.change(within(modale).getByPlaceholderText('Ex: Complexe Scolaire Lumière'), { target: { value: 'Nouvelle École' } });
    fireEvent.change(within(modale).getByPlaceholderText('contact@ecole.bj'), { target: { value: 'nouvelle@test.bj' } });
    fireEvent.change(within(modale).getByPlaceholderText('Cotonou, Bénin'), { target: { value: 'Rue 1' } });

    fireEvent.click(within(modale).getByRole('button', { name: /créer l'école/i }));

    await waitFor(() => expect(http.callsTo('post', CHEMIN)).toHaveLength(1));

    // La liste doit être rechargée : sans cela, l'établissement créé
    // n'apparaît qu'au prochain rafraîchissement manuel.
    await waitFor(() => expect(http.callsTo('get', CHEMIN).length).toBeGreaterThan(1));
  });

  it('remonte les erreurs de validation du serveur sur le bon champ', async () => {
    http.onGet(CHEMIN).reply(200, { success: true, data: ECOLES });
    http.onPost(CHEMIN).reply(422, {
      message: 'Données invalides',
      errors: { email: ['Cet email est déjà utilisé.'] },
    });

    monter();
    await waitFor(() => expect(screen.getByText('Complexe Excellence')).toBeInTheDocument());

    fireEvent.click(screen.getByRole('button', { name: /ajouter une école/i }));

    const modale = screen.getByRole('dialog');
    fireEvent.change(within(modale).getByPlaceholderText('Ex: Complexe Scolaire Lumière'), { target: { value: 'Doublon' } });
    fireEvent.change(within(modale).getByPlaceholderText('contact@ecole.bj'), { target: { value: 'deja@pris.bj' } });
    fireEvent.click(within(modale).getByRole('button', { name: /créer l'école/i }));

    await waitFor(() => expect(screen.getByText(/déjà utilisé/i)).toBeInTheDocument());
  });
});
