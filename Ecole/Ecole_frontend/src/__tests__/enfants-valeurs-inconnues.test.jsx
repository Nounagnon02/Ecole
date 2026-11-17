/*
 * Page Enfants du parent (recette du 14/11/2026, R-17).
 *
 * L'API renvoie `moyenne_generale`, `rang` et `absences_count` ; la page lisait
 * `moyenne`, `rang`, `absences` avec un repli à 0 : chaque enfant affichait une
 * moyenne de 0,0. Une valeur inconnue s'affiche « — », une valeur connue
 * s'affiche telle quelle.
 */
import { describe, it, expect, beforeEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import { QueryClientProvider } from '@tanstack/react-query';
import { MemoryRouter } from 'react-router-dom';
import EnfantsPage from '@/app/features/parent/EnfantsPage';
import { installHttpMock } from './helpers/http-mock';
import { makeQueryClient, signIn } from './helpers/render';

const enfant = (e) => ({ id: 7, nom: 'AHO', prenom: 'Kossi', classe: { nom: '6ème' }, ...e });
const monter = () => render(<QueryClientProvider client={makeQueryClient()}><MemoryRouter><EnfantsPage /></MemoryRouter></QueryClientProvider>);

describe('EnfantsPage — valeurs inconnues', () => {
  let http;
  beforeEach(() => { http = installHttpMock(); signIn('parent'); });

  it('n’affiche pas 0 pour une moyenne et un rang inconnus', async () => {
    http.onGet('/parent/enfants').reply(200, { success: true, data: [enfant({ moyenne_generale: null, rang: null, absences_count: 2 })] });
    monter();
    await screen.findAllByText(/AHO/);
    expect(screen.queryByText('0.0')).not.toBeInTheDocument();
    expect(screen.queryByText('0e')).not.toBeInTheDocument();
  });

  it('affiche la moyenne et le rang renvoyés par l’API', async () => {
    http.onGet('/parent/enfants').reply(200, { success: true, data: [enfant({ moyenne_generale: 13.25, rang: { position: 4, total_eleves: 30 }, absences_count: 1 })] });
    monter();
    expect((await screen.findAllByText('13.3')).length).toBeGreaterThan(0);
    expect(screen.getAllByText(/4e/).length).toBeGreaterThan(0);
  });
});
