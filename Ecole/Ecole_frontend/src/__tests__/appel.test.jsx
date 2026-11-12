/**
 * Appel d'une classe (lot 6.1).
 */

import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { render, screen, fireEvent, waitFor, within } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { QueryClientProvider } from '@tanstack/react-query';
import PresencesPage from '@/app/features/surveillant/PresencesPage';
import { ROUTE_CONFIG } from '@/features/roles/route-config';
import { installHttpMock } from './helpers/http-mock';
import { makeQueryClient, signIn } from './helpers/render';

let http;
const feuille = (statuts = ['present', 'present']) => ({ success: true, data: { classe: { id: 4 }, date: '2026-11-10', eleves: [
  { id: 1, nom: 'AGBO', prenom: 'Luc', matricule: 'B1', statut: statuts[0] },
  { id: 2, nom: 'DOSSOU', prenom: 'Afi', matricule: 'B2', statut: statuts[1] },
] } });

async function ouvrir() {
  signIn('surveillant');
  const rendu = render(<QueryClientProvider client={makeQueryClient()}><MemoryRouter><PresencesPage /></MemoryRouter></QueryClientProvider>);
  await screen.findByRole('option', { name: '6ème' });
  fireEvent.change(screen.getByLabelText(/^Classe/), { target: { value: '4' } });
  await screen.findByRole('group', { name: 'Présence de AGBO Luc' });
  return rendu;
}
const bouton = (nom, statut) => within(screen.getByRole('group', { name: `Présence de ${nom}` })).getByRole('button', { name: statut });
const envois = () => http.callsTo('post', '/surveillant/appel');

beforeEach(() => {
  http = installHttpMock();
  localStorage.clear();
  vi.spyOn(console, 'error').mockImplementation(() => {});
  http.onGet('/classes').reply(200, [{ id: 4, nom_classe: '6ème' }]);
  http.onGet('/surveillant/appel/4').reply(200, feuille());
  http.onGet('/surveillant/absences').reply(200, []);
});
afterEach(() => { http.restore(); vi.restoreAllMocks(); });

describe('appel', () => {
  it('chaque élève est présent par défaut ; une touche le marque absent, et l’appel complet part', async () => {
    http.onPost('/surveillant/appel').reply(200, { success: true, data: { present: 1, absent: 1, retard: 0 } });
    await ouvrir();

    expect(bouton('AGBO Luc', 'Présent')).toHaveAttribute('aria-pressed', 'true');
    fireEvent.click(bouton('DOSSOU Afi', 'Absent'));
    expect(screen.getByText('1 présent(s), 1 absent(s), 0 retard(s).')).toBeInTheDocument();
    fireEvent.click(screen.getByRole('button', { name: /Enregistrer l’appel/ }));

    expect(await screen.findByText('Appel enregistré.')).toBeInTheDocument();
    expect(envois()[0].body).toMatchObject({ classe_id: 4, eleves: [{ eleve_id: 1, statut: 'present' }, { eleve_id: 2, statut: 'absent' }] });
    expect(localStorage.length).toBe(0);
  });

  it('s’ouvre sur l’appel déjà relevé', async () => {
    http.onGet('/surveillant/appel/4').reply(200, feuille(['retard', 'present']));
    await ouvrir();

    await waitFor(() => expect(bouton('AGBO Luc', 'Retard')).toHaveAttribute('aria-pressed', 'true'));
  });

  it('sans réseau, garde l’appel et l’envoie au retour de la connexion', async () => {
    http.onPost('/surveillant/appel').networkError();
    const { unmount } = await ouvrir();
    fireEvent.click(bouton('AGBO Luc', 'Absent'));
    fireEvent.click(screen.getByRole('button', { name: /Enregistrer l’appel/ }));
    expect(await screen.findByText(/Pas de connexion/)).toBeInTheDocument();

    unmount();
    await ouvrir();
    await waitFor(() => expect(bouton('AGBO Luc', 'Absent')).toHaveAttribute('aria-pressed', 'true'));

    http.onPost('/surveillant/appel').reply(200, { success: true, data: {} });
    const avant = envois().length;
    window.dispatchEvent(new Event('online'));
    await waitFor(() => expect(envois().length).toBe(avant + 1));
    expect(await screen.findByText('Appel enregistré.')).toBeInTheDocument();
  });

  it('justifie une absence du jour', async () => {
    http.onGet('/surveillant/absences').reply(200, [{ id: 9, type: 'absence', justifiee: false, motif: null, eleve: { user: { name: 'DOSSOU', prenom: 'Afi' } } }]);
    http.onPatch('/surveillant/absences/9').reply(200, { success: true });
    vi.spyOn(window, 'prompt').mockReturnValue('Certificat médical');
    await ouvrir();

    fireEvent.click(within(await screen.findByTestId('absences')).getByRole('button', { name: 'Justifier' }));

    await waitFor(() => expect(http.callsTo('patch', '/surveillant/absences/9')).toHaveLength(1));
    expect(http.callsTo('patch', '/surveillant/absences/9')[0].body).toEqual({ justifiee: true, motif: 'Certificat médical' });
  });

  it('est ouverte aux rôles que l’API autorise', () => {
    expect(ROUTE_CONFIG.surveillantPresences.roles).toEqual(expect.arrayContaining(['surveillant', 'censeur', 'directeur']));
    expect(ROUTE_CONFIG.surveillantPresences.roles).not.toContain('enseignant');
  });
});
