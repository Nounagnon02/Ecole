import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { QueryClientProvider } from '@tanstack/react-query';
import ParametresPage from '@/app/features/parametres/ParametresPage';
import { installHttpMock } from './helpers/http-mock';
import { makeQueryClient, signIn } from './helpers/render';

let http;
beforeEach(() => { http = installHttpMock(); vi.spyOn(console, 'error').mockImplementation(() => {}); });
afterEach(() => { http.restore(); vi.restoreAllMocks(); });

const monter = (role) => {
  signIn(role);
  render(<QueryClientProvider client={makeQueryClient()}><MemoryRouter><ParametresPage /></MemoryRouter></QueryClientProvider>);
  fireEvent.click(screen.getByRole('button', { name: /Notifications/ }));
};

describe('avis SMS du parent', () => {
  it('lit et enregistre les préférences', async () => {
    http.onGet('/parent/preferences').reply(200, { success: true, data: { absences: true, notes: true, echeances: true, recus: true, convocations: true, langue: 'fr' } });
    http.onPut('/parent/preferences').reply(200, { success: true, data: {} });
    monter('parent');

    const absences = await screen.findByRole('checkbox', { name: /Absences et retards/ });
    expect(absences).toBeChecked();
    fireEvent.click(absences);

    await waitFor(() => expect(http.callsTo('put', '/parent/preferences')).toHaveLength(1));
    expect(http.callsTo('put', '/parent/preferences')[0].body).toMatchObject({ absences: false, recus: true, langue: 'fr' });
  });

  it('ne montre plus d’interrupteurs factices au personnel', async () => {
    monter('secretaire');

    expect(await screen.findByText(/Votre compte n’a pas de réglage de notification/)).toBeInTheDocument();
    expect(screen.queryByRole('checkbox')).not.toBeInTheDocument();
  });
});
