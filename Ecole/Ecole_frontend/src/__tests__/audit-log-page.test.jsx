/**
 * AuditLogPage — `AuditLog`/`Auditable` étaient alimentés depuis longtemps
 * (User, Notes) mais jamais consultables au-delà d'un widget de 10
 * dernières actions sur le dashboard admin. Ce test fixe le contrat de
 * l'écran qui les rend enfin consultables : liste, filtre, détail avant/après.
 */
import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { render, screen, waitFor, fireEvent } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { QueryClientProvider } from '@tanstack/react-query';
import { I18nProvider } from '@/shared/i18n';
import AuditLogPage from '@/app/features/admin/AuditLogPage';
import { installHttpMock } from './helpers/http-mock';
import { makeQueryClient } from './helpers/render';

let http;

const PAGE = {
  current_page: 1,
  last_page: 1,
  total: 1,
  data: [
    {
      id: 1,
      user: { id: 1, name: 'Adjovi', prenom: 'Rose' },
      event: 'updated',
      auditable_type: 'App\\Models\\Notes',
      auditable_id: 42,
      old_values: { note: 10 },
      new_values: { note: 15 },
      created_at: '2026-09-21T10:00:00.000000Z',
    },
  ],
};

beforeEach(() => {
  http = installHttpMock();
  vi.spyOn(console, 'error').mockImplementation(() => {});
  http.onGet('/audit-logs').reply(200, PAGE);
});

afterEach(() => {
  http.restore();
  vi.restoreAllMocks();
});

function monter(initialLocale = 'fr') {
  return render(
    <QueryClientProvider client={makeQueryClient()}>
      <MemoryRouter>
        <I18nProvider initialLocale={initialLocale}>
          <AuditLogPage />
        </I18nProvider>
      </MemoryRouter>
    </QueryClientProvider>,
  );
}

describe('AuditLogPage', () => {
  it('affiche les entrées avec utilisateur, action et élément concerné', async () => {
    monter('fr');

    await waitFor(() => expect(screen.getByText('Adjovi Rose')).toBeInTheDocument());
    expect(screen.getByText('Notes #42')).toBeInTheDocument();
    // « Modification » apparaît aussi comme option du filtre : au moins un
    // badge de ligne doit porter ce texte, en plus de l'option.
    expect(screen.getAllByText('Modification').length).toBeGreaterThan(1);
  });

  it("affiche l'avant/après au clic sur Voir le détail", async () => {
    monter('fr');
    await waitFor(() => expect(screen.getByText('Adjovi Rose')).toBeInTheDocument());

    fireEvent.click(screen.getByText('Voir le détail'));

    expect(screen.getByText('Avant')).toBeInTheDocument();
    expect(screen.getByText('Après')).toBeInTheDocument();
    expect(screen.getByText('10')).toBeInTheDocument();
    expect(screen.getByText('15')).toBeInTheDocument();
  });

  it('affiche un utilisateur supprimé plutôt que rien quand user est absent', async () => {
    http.onGet('/audit-logs').reply(200, {
      ...PAGE,
      data: [{ ...PAGE.data[0], user: null }],
    });
    monter('fr');

    await waitFor(() => expect(screen.getByText('Utilisateur supprimé')).toBeInTheDocument());
  });

  it("affiche l'état vide quand aucune entrée ne correspond aux filtres", async () => {
    http.onGet('/audit-logs').reply(200, { current_page: 1, last_page: 1, total: 0, data: [] });
    monter('fr');

    await waitFor(() => expect(screen.getByText('Aucune activité trouvée pour ces filtres')).toBeInTheDocument());
  });

  it('traduit le titre et les colonnes en anglais', async () => {
    monter('en');

    expect(screen.getByRole('heading', { name: 'Audit log' })).toBeInTheDocument();
    await waitFor(() => expect(screen.getByText('Adjovi Rose')).toBeInTheDocument());
    expect(screen.getByText('Action')).toBeInTheDocument();
    expect(screen.getByText('User')).toBeInTheDocument();
  });
});
