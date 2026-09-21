/**
 * AffectationsPage : la plupart du contenu passait déjà par `t()`, mais le
 * bouton "Réessayer", les onglets, les titres/descriptions de carte, les
 * libellés de champ et l'état vide restaient en français codé en dur.
 */
import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { QueryClientProvider } from '@tanstack/react-query';
import { I18nProvider } from '@/shared/i18n';
import AffectationsPage from '@/app/features/affectations/AffectationsPage';
import { installHttpMock } from './helpers/http-mock';
import { makeQueryClient } from './helpers/render';

let http;

beforeEach(() => {
  http = installHttpMock();
  vi.spyOn(console, 'error').mockImplementation(() => {});
  http.onGet('/enseignants').reply(200, []);
  http.onGet('/classes').reply(200, []);
  http.onGet('/enseignants-mp').reply(200, []);
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
          <AffectationsPage />
        </I18nProvider>
      </MemoryRouter>
    </QueryClientProvider>,
  );
}

describe('AffectationsPage — i18n', () => {
  it('affiche les onglets et cartes en français par défaut', async () => {
    monter('fr');
    await waitFor(() => expect(screen.getByText('Secondaire')).toBeInTheDocument());
    expect(screen.getByText('Maternelle & Primaire')).toBeInTheDocument();
    expect(screen.getByText('Affecter un cours')).toBeInTheDocument();
  });

  it('traduit les onglets, cartes et libellés en anglais', async () => {
    monter('en');
    await waitFor(() => expect(screen.getByText('Secondary')).toBeInTheDocument());
    expect(screen.getByText('Nursery & Primary')).toBeInTheDocument();
    expect(screen.getByText('Assign a class')).toBeInTheDocument();
    expect(screen.getByText('Select a teacher to see their classes')).toBeInTheDocument();
  });

  it("traduit le bouton Réessayer sur l'état d'erreur", async () => {
    http.onGet('/enseignants').reply(500, { message: 'Boom' });
    monter('en');

    await waitFor(() => expect(screen.getByText('Retry')).toBeInTheDocument());
  });
});
