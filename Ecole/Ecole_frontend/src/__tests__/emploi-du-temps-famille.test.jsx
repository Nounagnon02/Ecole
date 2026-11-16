/**
 * Emploi du temps vu par la famille — revue web du 16/11/2026.
 *
 * L'élève voyait l'emploi du temps de toute l'école, « Toutes les classes »
 * par défaut, et un sélecteur des vingt classes. L'API ne lui renvoie plus que
 * le sien ; la page ne propose plus de choisir une classe à la famille.
 */
import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { QueryClientProvider } from '@tanstack/react-query';
import EmploiDuTempsPage from '@/app/features/emploi-du-temps/EmploiDuTempsPage';
import { installHttpMock } from './helpers/http-mock';
import { makeQueryClient, signIn } from './helpers/render';

const COURS = [{ id: 1, jour: 'Lundi', heure_debut: '08:00:00', heure_fin: '10:00:00', salle: 'Salle 8', classe: { id: 3, nom_classe: '3ème' }, matiere: { nom: 'EPS' }, enseignant: { user: { name: 'KOUASSI', prenom: 'Yao' } } }];

let http;
beforeEach(() => {
  http = installHttpMock();
  vi.spyOn(console, 'error').mockImplementation(() => {});
  http.onGet('/emploi-du-temps').reply(200, { data: COURS });
  http.onGet('/classes').reply(200, [{ id: 3, nom_classe: '3ème' }, { id: 9, nom_classe: 'CP' }]);
});
afterEach(() => { http.restore(); vi.restoreAllMocks(); });

const monter = (role) => {
  signIn(role);
  return render(<QueryClientProvider client={makeQueryClient()}><MemoryRouter><EmploiDuTempsPage /></MemoryRouter></QueryClientProvider>);
};

describe('EmploiDuTempsPage — famille', () => {
  it('montre à l’élève son emploi du temps, sans choix de classe', async () => {
    monter('eleve');
    expect(await screen.findByText('EPS')).toBeInTheDocument();
    expect(screen.getByText('Votre emploi du temps de la semaine')).toBeInTheDocument();
    expect(screen.queryByText('Toutes les classes')).not.toBeInTheDocument();
    expect(screen.queryByRole('combobox')).not.toBeInTheDocument();
    expect(http.callsTo('get', '/classes')).toHaveLength(0);
  });

  it('présente au parent l’emploi du temps des classes de ses enfants', async () => {
    monter('parent');
    expect(await screen.findByText('EPS')).toBeInTheDocument();
    expect(screen.getByText('L’emploi du temps des classes de vos enfants')).toBeInTheDocument();
    // Plusieurs enfants possibles : la classe reste indiquée sur chaque cours.
    expect(screen.getByText('3ème')).toBeInTheDocument();
    expect(screen.queryByRole('combobox')).not.toBeInTheDocument();
  });

  it('garde le choix de la classe pour le personnel', async () => {
    monter('directeur');
    expect(await screen.findByText('EPS')).toBeInTheDocument();
    expect(screen.getByRole('combobox')).toBeInTheDocument();
  });
});
