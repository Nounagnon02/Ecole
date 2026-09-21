/**
 * EmploiDuTempsPage : les en-têtes de jours de la grille (Lundi…Samedi)
 * venaient d'un dictionnaire français statique (`JOURS_LABELS`), jamais
 * traduit -- alors que les clés de traduction correspondantes existaient
 * déjà (`emploi_du_temps.lundi`…`samedi`), simplement jamais branchées ici.
 */
import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { QueryClientProvider } from '@tanstack/react-query';
import { I18nProvider } from '@/shared/i18n';
import EmploiDuTempsPage from '@/app/features/emploi-du-temps/EmploiDuTempsPage';
import { installHttpMock } from './helpers/http-mock';
import { makeQueryClient } from './helpers/render';

let http;

beforeEach(() => {
  http = installHttpMock();
  vi.spyOn(console, 'error').mockImplementation(() => {});
  http.onGet('/emploi-du-temps').reply(200, []);
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
          <EmploiDuTempsPage />
        </I18nProvider>
      </MemoryRouter>
    </QueryClientProvider>,
  );
}

describe('EmploiDuTempsPage — i18n', () => {
  it('affiche les jours en français par défaut', async () => {
    monter('fr');
    await waitFor(() => expect(screen.getByText('Lundi')).toBeInTheDocument());
    expect(screen.getByText('Samedi')).toBeInTheDocument();
  });

  it('traduit les en-têtes de jours en anglais', async () => {
    monter('en');
    await waitFor(() => expect(screen.getByText('Monday')).toBeInTheDocument());
    expect(screen.getByText('Saturday')).toBeInTheDocument();
    expect(screen.queryByText('Lundi')).not.toBeInTheDocument();
  });
});
