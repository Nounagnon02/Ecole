/**
 * Page « Mes cours » de l'élève — revue web du 16/11/2026.
 *
 * Elle annonçait « cours, devoirs et ressources » mais ne lisait que le cahier
 * de textes : les devoirs publiés par l'enseignant (que le parent voyait sur
 * son téléphone) n'apparaissaient jamais. La recherche portait sur un champ
 * absent, la date « Prévu le » comparait une chaîne à une date, et le bouton
 * « Voir » ne faisait rien.
 */
import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { QueryClientProvider } from '@tanstack/react-query';
import { MemoryRouter } from 'react-router-dom';
import { makeQueryClient } from './helpers/render';
import { installHttpMock } from './helpers/http-mock';
import CoursPage from '@/app/features/eleve/CoursPage';

const LECONS = { current_page: 1, data: [
  { id: 4, titre: 'Les fractions', resume: 'Addition de fractions', devoirs: null, date: '2026-11-12', matiere: { id: 1, nom: 'Mathématiques' }, enseignant: 'Paul HOUNKPATIN', type: 'cours' },
] };
const DEVOIRS = [
  { id: 7, titre: 'Exercices 3 à 5 page 42', description: 'Sur le cahier', date_limite: '2026-11-20T00:00:00.000000Z', matiere: { id: 1, nom: 'Mathématiques' }, rendu: false, note: null },
  { id: 8, titre: 'Rédaction', description: null, date_limite: null, matiere: { id: 2, nom: 'Français' }, rendu: true, note: null },
];

let http;
beforeEach(() => {
  vi.useFakeTimers({ toFake: ['Date'] });
  vi.setSystemTime(new Date(2026, 10, 16, 12, 0));
  http = installHttpMock();
  http.onGet('/eleves/me/cours').reply(200, { success: true, data: LECONS });
  http.onGet('/devoirs/eleve').reply(200, { success: true, data: DEVOIRS });
});
afterEach(() => { http.restore(); vi.useRealTimers(); vi.restoreAllMocks(); });

const monter = () => render(
  <QueryClientProvider client={makeQueryClient()}><MemoryRouter><CoursPage /></MemoryRouter></QueryClientProvider>,
);

describe('CoursPage (élève)', () => {
  it('montre les devoirs publiés pour la classe, avec leur échéance et leur état', async () => {
    monter();
    expect(await screen.findByText('Exercices 3 à 5 page 42')).toBeInTheDocument();
    expect(screen.getByText('À rendre le 20/11/2026')).toBeInTheDocument();
    expect(screen.getByText('Rédaction')).toBeInTheDocument();
    expect(screen.getByText('Sans date limite')).toBeInTheDocument();
    expect(screen.getByText('Rendu')).toBeInTheDocument();
    // Les leçons du cahier de textes restent là.
    expect(screen.getByText('Les fractions')).toBeInTheDocument();
  });

  it('filtre sur les devoirs et cherche dans les titres', async () => {
    monter();
    await screen.findByText('Les fractions');
    fireEvent.change(screen.getByLabelText('Filtrer par type'), { target: { value: 'devoir' } });
    expect(screen.queryByText('Les fractions')).not.toBeInTheDocument();
    expect(screen.getByText('Rédaction')).toBeInTheDocument();

    fireEvent.change(screen.getByLabelText('Filtrer par type'), { target: { value: '' } });
    fireEvent.change(screen.getByPlaceholderText(/Rechercher/i), { target: { value: 'fraction' } });
    await waitFor(() => expect(screen.queryByText('Rédaction')).not.toBeInTheDocument());
    expect(screen.getByText('Les fractions')).toBeInTheDocument();
  });

  it('n’affiche ni bouton sans action, ni durée inconnue, ni matière générique', async () => {
    http.onGet('/devoirs/eleve').reply(200, { success: true, data: [{ id: 9, titre: 'Sans matière', date_limite: null, matiere: null, rendu: false }] });
    monter();
    await screen.findByText('Les fractions');
    await screen.findByText('Sans matière');
    expect(screen.queryByText('Matière')).not.toBeInTheDocument();
    expect(screen.queryByRole('button', { name: 'Voir' })).not.toBeInTheDocument();
    expect(screen.queryByText('—')).not.toBeInTheDocument();
  });
});
