/**
 * Pages à requête dépendante — EnfantsPage, ClassesPage, EmploiDuTempsPage
 * (audit P2.7 / P4.1)
 *
 * Ces trois pages chargent un premier référentiel, en sélectionnent un
 * élément, puis chargent le détail de cet élément. Aucune n'avait de test,
 * alors que c'est le schéma le plus facile à casser : une sélection qui ne
 * déclenche pas son chargement, ou un détail qui reste celui de la sélection
 * précédente.
 *
 * Écrits avant leur migration vers react-query.
 */

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, screen, waitFor, fireEvent } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { QueryClientProvider } from '@tanstack/react-query';
import { installHttpMock } from './helpers/http-mock';
import { makeQueryClient } from './helpers/render';

import EnfantsPage from '@/app/features/parent/EnfantsPage';
import ClassesPage from '@/app/features/enseignant/ClassesPage';
import EmploiDuTempsPage from '@/app/features/emploi-du-temps/EmploiDuTempsPage';

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
    <QueryClientProvider client={makeQueryClient()}>
      <MemoryRouter>{element}</MemoryRouter>
    </QueryClientProvider>,
  );
}

describe('EnfantsPage', () => {
  const ENFANTS = '/parent/enfants';

  function mockDetails(id) {
    ['notes', 'absences', 'emploi-du-temps', 'paiements'].forEach((r) =>
      http.onGet(`/parent/enfants/${id}/${r}`).reply(200, { success: true, data: [] }),
    );
  }

  it('liste les enfants et charge le détail du premier', async () => {
    http.onGet(ENFANTS).reply(200, {
      success: true,
      data: [{ id: 5, nom: 'Chabi', prenom: 'Awa', classe: { nom_classe: '6e A' } }],
    });
    mockDetails(5);

    monter(<EnfantsPage />);

    await waitFor(() => expect(screen.getAllByText(/Awa|Chabi/).length).toBeGreaterThan(0));

    // La sélection du premier enfant doit déclencher ses quatre détails.
    await waitFor(() =>
      expect(http.callsTo('get', '/parent/enfants/5/notes').length).toBeGreaterThan(0),
    );
  });

  it('affiche l’état vide quand aucun enfant n’est rattaché', async () => {
    http.onGet(ENFANTS).reply(200, { success: true, data: [] });

    monter(<EnfantsPage />);

    await waitFor(() =>
      expect(screen.getByText(/aucun enfant lié à votre compte/i)).toBeInTheDocument(),
    );
  });

  it('n’interroge aucun détail tant qu’aucun enfant n’existe', async () => {
    http.onGet(ENFANTS).reply(200, { success: true, data: [] });

    monter(<EnfantsPage />);

    await waitFor(() => expect(http.callsTo('get', ENFANTS).length).toBe(1));
    expect(http.callsTo('get', '/parent/enfants/5/notes')).toHaveLength(0);
  });
});

describe('ClassesPage', () => {
  const CLASSES = '/enseignant/classes';

  it('liste les classes et charge les élèves de la classe choisie', async () => {
    http.onGet(CLASSES).reply(200, {
      success: true,
      // La page lit `classe.nom`, pas `nom_classe`.
      data: [{ id: 3, nom: '6e A', niveau: '6e', effectif: 42 }],
    });
    http.onGet('/classes/3/eleves').reply(200, {
      success: true,
      data: [{ id: 9, nom: 'Bio', prenom: 'Kader' }],
    });

    monter(<ClassesPage />);

    await waitFor(() => expect(screen.getAllByText(/6e A/).length).toBeGreaterThan(0));
    await waitFor(() =>
      expect(http.callsTo('get', '/classes/3/eleves').length).toBeGreaterThan(0),
    );
  });

  it('affiche l’état vide quand aucune classe n’est assignée', async () => {
    http.onGet(CLASSES).reply(200, { success: true, data: [] });

    monter(<ClassesPage />);

    await waitFor(() =>
      expect(screen.getByText(/aucune classe assignée/i)).toBeInTheDocument(),
    );
  });
});

describe('EmploiDuTempsPage', () => {
  const EDT = '/emploi-du-temps';

  it('place les séances renvoyées par l’API dans la grille', async () => {
    http.onGet(EDT).reply(200, {
      success: true,
      data: [
        {
          id: 1,
          jour: 'Lundi',
          heure_debut: '08:00',
          heure_fin: '09:00',
          matiere: { nom: 'Mathématiques' },
          classe: { nom_classe: '6e A' },
          salle: 'S101',
        },
      ],
    });

    monter(<EmploiDuTempsPage />);

    await waitFor(() => expect(screen.getAllByText(/Mathématiques/).length).toBeGreaterThan(0));
  });

  it('rend la grille même sans aucune séance', async () => {
    http.onGet(EDT).reply(200, { success: true, data: [] });

    monter(<EmploiDuTempsPage />);

    // Les jours de la semaine restent affichés : une grille vide reste une
    // grille, pas un écran blanc.
    await waitFor(() => expect(screen.getAllByText(/Lundi/).length).toBeGreaterThan(0));
  });
});
