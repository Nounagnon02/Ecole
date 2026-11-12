/**
 * Page « Bulletins » (lot 5.4 et 5.5).
 */

import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { render, screen, fireEvent, waitFor, within } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { QueryClientProvider } from '@tanstack/react-query';
import BulletinsPage from '@/app/features/bulletins/BulletinsPage';
import { getRoleNavigation } from '@/features/roles/navigation-config';
import { installHttpMock } from './helpers/http-mock';
import { makeQueryClient, signIn } from './helpers/render';

let http;
const bulletin = (id, nom, moyenne, rang, extra = {}) => ({
  id, eleve_id: id, periode: 'Trimestre 1', annee_scolaire: '2026-2027', moyenne_generale: String(moyenne), rang, total_eleves: 3,
  mention: moyenne >= 14 ? 'Bien' : 'Passable', classe: { id: 4, nom_classe: '6ème' },
  eleve: { id, numero_matricule: `B${id}`, user: { name: nom, prenom: 'Test' } },
  data: [{ matiere_id: 2, matiere: 'Mathématiques', moyenne: moyenne, coefficient: 4, rang }],
  ...extra,
});

function monter(role) {
  signIn(role);
  return render(<QueryClientProvider client={makeQueryClient()}><MemoryRouter><BulletinsPage /></MemoryRouter></QueryClientProvider>);
}
async function choisirClasse() {
  await screen.findByRole('option', { name: '6ème' });
  fireEvent.change(screen.getByLabelText(/^Classe/), { target: { value: '4' } });
}

beforeEach(() => {
  http = installHttpMock();
  vi.spyOn(console, 'error').mockImplementation(() => {});
  vi.spyOn(window, 'print').mockImplementation(() => {});
  http.onGet('/classes').reply(200, [{ id: 4, nom_classe: '6ème' }]);
  http.onGet('/enseignant/classes').reply(200, { success: true, data: [{ id: 4, nom_classe: '6ème' }] });
  http.onGet('/bulletins').reply(200, { success: true, data: [bulletin(1, 'AGBO', 16, 1), bulletin(2, 'DOSSOU', 9.5, 2)] });
});
afterEach(() => { http.restore(); vi.restoreAllMocks(); });

describe('BulletinsPage', () => {
  it('liste les bulletins de la classe choisie avec rang, moyenne et mention', async () => {
    monter('directeur');
    await choisirClasse();

    const ligne = (await screen.findByText(/AGBO/)).closest('tr');
    expect(ligne).toHaveTextContent('1er / 3');
    expect(ligne).toHaveTextContent('16,00');
    expect(ligne).toHaveTextContent('Bien');
    const appel = http.callsTo('get', '/bulletins').at(-1);
    expect(appel.url).toContain('classe_id=4');
    expect(appel.url).toContain('periode=Trimestre');
  });

  it('arrête les bulletins après confirmation et recharge la liste', async () => {
    http.onPost('/bulletins/verrouiller').reply(200, { success: true, data: [bulletin(1, 'AGBO', 16, 1), bulletin(2, 'DOSSOU', 9.5, 2)], notes_verrouillees: 12 });
    monter('directeur');
    await choisirClasse();
    await screen.findByText(/AGBO/);
    const avant = http.callsTo('get', '/bulletins').length;

    fireEvent.click(screen.getByRole('button', { name: /Arrêter les bulletins/ }));
    const dialogue = await screen.findByRole('dialog');
    expect(dialogue).toHaveTextContent(/6ème/);
    fireEvent.click(within(dialogue).getByRole('button', { name: /Arrêter les bulletins/ }));

    expect(await screen.findByText('2 bulletin(s) arrêté(s), 12 note(s) verrouillée(s).')).toBeInTheDocument();
    expect(http.callsTo('post', '/bulletins/verrouiller')[0].body).toEqual({ classe_id: 4, periode: 'Trimestre 1' });
    await waitFor(() => expect(http.callsTo('get', '/bulletins').length).toBeGreaterThan(avant));
  });

  it('montre le refus de l’API quand la période n’a pas de note', async () => {
    http.onPost('/bulletins/verrouiller').reply(422, { success: false, message: 'Aucune note n’est saisie pour cette classe sur cette période.' });
    monter('directeur');
    await choisirClasse();
    fireEvent.click(await screen.findByRole('button', { name: /Arrêter les bulletins/ }));
    fireEvent.click(within(await screen.findByRole('dialog')).getByRole('button', { name: /Arrêter les bulletins/ }));

    expect(await screen.findByRole('alert')).toHaveTextContent(/Aucune note/);
  });

  it('ouvre un bulletin et l’imprime seul ; imprime toute la classe un par page', async () => {
    monter('directeur');
    await choisirClasse();
    fireEvent.click(within((await screen.findByText(/AGBO/)).closest('tr')).getByRole('button', { name: /Voir/ }));

    const dialogue = await screen.findByRole('dialog');
    expect(within(dialogue).getByTestId('synthese')).toHaveTextContent('16,00 / 20');
    expect(within(dialogue).getByText('Mathématiques').closest('tr')).toHaveTextContent('4');
    fireEvent.click(within(dialogue).getByRole('button', { name: /^Imprimer$/ }));
    await waitFor(() => expect(window.print).toHaveBeenCalledTimes(1));
    expect(screen.getByTestId('impression').querySelectorAll('article')).toHaveLength(1);

    fireEvent.click(within(dialogue).getByRole('button', { name: /Fermer|Close/ }) ?? document.body);
    fireEvent.click(screen.getByRole('button', { name: /Imprimer la classe/ }));
    await waitFor(() => expect(window.print).toHaveBeenCalledTimes(2));
    expect(screen.getByTestId('impression').querySelectorAll('article')).toHaveLength(2);
  });

  it('ne propose pas d’arrêter les bulletins à un enseignant', async () => {
    monter('enseignant');
    await choisirClasse();
    await screen.findByText(/AGBO/);

    expect(screen.queryByRole('button', { name: /Arrêter les bulletins/ })).not.toBeInTheDocument();
  });

  it('montre au parent les bulletins de ses enfants, sans choix de classe', async () => {
    monter('parent');

    expect(await screen.findByText(/AGBO/)).toBeInTheDocument();
    expect(screen.queryByLabelText(/^Classe/)).not.toBeInTheDocument();
    expect(http.callsTo('get', '/bulletins').at(-1).url).not.toContain('classe_id');
    expect(getRoleNavigation('parent').map((e) => e.path)).toContain('/bulletins');
    expect(getRoleNavigation('eleve').map((e) => e.path)).toContain('/bulletins');
  });

  it('dit à la famille qu’aucun bulletin n’est encore arrêté', async () => {
    http.onGet('/bulletins').reply(200, { success: true, data: [] });
    monter('eleve');

    expect(await screen.findByText(/Aucun bulletin n’a encore été arrêté/)).toBeInTheDocument();
  });
});
