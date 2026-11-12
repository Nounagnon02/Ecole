/**
 * Grille de saisie des notes (lot 5.1) et brouillon hors-ligne (5.2).
 */

import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { QueryClientProvider } from '@tanstack/react-query';
import SaisieNotesPage, { lireNote } from '@/app/features/notes/SaisieNotesPage';
import { ROUTE_CONFIG } from '@/features/roles/route-config';
import { getRoleNavigation } from '@/features/roles/navigation-config';
import { installHttpMock } from './helpers/http-mock';
import { makeQueryClient, signIn } from './helpers/render';

let http;
const grille = (notes = [], matieres = [{ id: 2, nom: 'Mathématiques' }]) => ({ success: true, data: {
  classe: { id: 4, nom_classe: '6ème' },
  eleves: [{ id: 1, nom: 'AGBO', prenom: 'Luc', matricule: 'B1' }, { id: 2, nom: 'DOSSOU', prenom: 'Afi', matricule: 'B2' }, { id: 3, nom: 'KPADE', prenom: 'Rita', matricule: 'B3' }],
  matieres, notes,
} });

async function ouvrir(role = 'enseignant') {
  signIn(role);
  const rendu = render(<QueryClientProvider client={makeQueryClient()}><MemoryRouter><SaisieNotesPage /></MemoryRouter></QueryClientProvider>);
  await screen.findByRole('option', { name: '6ème' });
  fireEvent.change(screen.getByLabelText(/^Classe/), { target: { value: '4' } });
  await screen.findByLabelText('Note de AGBO Luc');
  return rendu;
}
const champ = (nom) => screen.getByLabelText(`Note de ${nom}`);
const taper = (nom, valeur) => fireEvent.change(champ(nom), { target: { value: valeur } });
const enregistrer = () => fireEvent.click(screen.getByRole('button', { name: /Enregistrer les notes/ }));
const envois = () => http.callsTo('post', '/notes/bulk');

beforeEach(() => {
  http = installHttpMock();
  localStorage.clear();
  vi.spyOn(console, 'error').mockImplementation(() => {});
  http.onGet('/enseignant/classes').reply(200, { success: true, data: [{ id: 4, nom_classe: '6ème' }] });
  http.onGet('/classes').reply(200, [{ id: 4, nom_classe: '6ème' }, { id: 5, nom_classe: '5ème' }]);
  http.onGet('/notes/grille/4').reply(200, grille());
});
afterEach(() => { http.restore(); vi.restoreAllMocks(); });

describe('lecture d’une note', () => {
  it.each([['12', 12], ['12,5', 12.5], ['0', 0], ['20', 20], [' 7.25 ', 7.25], ['', null]])('« %s » → %s', (saisie, attendu) => {
    expect(lireNote(saisie)).toBe(attendu);
  });
  it.each(['21', '-1', 'abc', '12,5,3'])('« %s » est refusée', (saisie) => {
    expect(lireNote(saisie)).toBeNaN();
  });
});

describe('grille de saisie', () => {
  it('choisit seule l’unique matière et envoie les notes saisies, sans les élèves laissés vides', async () => {
    http.onPost('/notes/bulk').reply(201, { success: true, count: 2, warnings: [] });
    await ouvrir();

    taper('AGBO Luc', '12,5');
    taper('KPADE Rita', '8');
    enregistrer();

    await waitFor(() => expect(envois()).toHaveLength(1));
    expect(envois()[0].body).toMatchObject({
      classe_id: 4, matiere_id: 2, type_evaluation: 'Devoir1', periode: 'Trimestre 1',
      notes: [{ eleve_id: 1, note: 12.5 }, { eleve_id: 3, note: 8 }],
    });
    expect(await screen.findByText('Notes enregistrées.')).toBeInTheDocument();
    expect(localStorage.length).toBe(0);
  });

  it('passe à l’élève suivant avec Entrée, au précédent avec la flèche haut', async () => {
    await ouvrir();

    champ('AGBO Luc').focus();
    fireEvent.keyDown(champ('AGBO Luc'), { key: 'Enter' });
    expect(champ('DOSSOU Afi')).toHaveFocus();
    fireEvent.keyDown(champ('DOSSOU Afi'), { key: 'ArrowUp' });
    expect(champ('AGBO Luc')).toHaveFocus();
  });

  it('s’ouvre sur les notes déjà saisies et n’autorise pas à toucher une note verrouillée', async () => {
    http.onGet('/notes/grille/4').reply(200, grille([{ id: 9, eleve_id: 1, note: 12.5, note_sur: 20, locked: false }, { id: 10, eleve_id: 2, note: 7, note_sur: 20, locked: true }]));
    http.onPost('/notes/bulk').reply(201, { success: true, count: 1, warnings: [] });
    await ouvrir();

    await waitFor(() => expect(champ('AGBO Luc')).toHaveValue('12,5'));
    expect(champ('DOSSOU Afi')).toBeDisabled();
    taper('AGBO Luc', '14');
    enregistrer();

    await waitFor(() => expect(envois()).toHaveLength(1));
    expect(envois()[0].body.notes).toEqual([{ eleve_id: 1, note: 14 }]);
  });

  it('bloque l’enregistrement tant qu’une note est hors de 0 à 20', async () => {
    await ouvrir();

    taper('AGBO Luc', '21');

    expect(screen.getByText(/1 note\(s\) à corriger/)).toBeInTheDocument();
    expect(champ('AGBO Luc')).toHaveAttribute('aria-invalid', 'true');
    expect(screen.getByRole('button', { name: /Enregistrer les notes/ })).toBeDisabled();
  });

  it('sans réseau, garde le brouillon, le dit, le restaure à la réouverture et l’envoie au retour du réseau', async () => {
    http.onPost('/notes/bulk').networkError?.();
    if (!http.onPost('/notes/bulk').networkError) http.onPost('/notes/bulk').reply(0, null);
    const { unmount } = await ouvrir();

    taper('AGBO Luc', '12');
    expect(screen.getByText(/1 note\(s\) non enregistrée\(s\), gardée\(s\) sur cet appareil/)).toBeInTheDocument();
    enregistrer();
    expect(await screen.findByText(/Pas de connexion/)).toBeInTheDocument();
    expect(localStorage.length).toBe(1);

    // La page est fermée puis rouverte : la saisie est toujours là.
    unmount();
    await ouvrir();
    await waitFor(() => expect(champ('AGBO Luc')).toHaveValue('12'));

    http.onPost('/notes/bulk').reply(201, { success: true, count: 1, warnings: [] });
    const avant = envois().length;
    window.dispatchEvent(new Event('online'));

    await waitFor(() => expect(envois().length).toBe(avant + 1));
    expect(await screen.findByText('Notes enregistrées.')).toBeInTheDocument();
    expect(localStorage.length).toBe(0);
  });

  it('montre le refus de l’API et garde la saisie', async () => {
    http.onPost('/notes/bulk').reply(403, { success: false, message: 'Cette matière ne vous est pas affectée dans cette classe.' });
    await ouvrir();

    taper('AGBO Luc', '12');
    enregistrer();

    expect(await screen.findByText(/ne vous est pas affectée/)).toBeInTheDocument();
    expect(champ('AGBO Luc')).toHaveValue('12');
  });

  it('dit à l’enseignant sans classe pourquoi il ne peut rien saisir', async () => {
    http.onGet('/enseignant/classes').reply(200, { success: true, data: [] });
    signIn('enseignant');
    render(<QueryClientProvider client={makeQueryClient()}><MemoryRouter><SaisieNotesPage /></MemoryRouter></QueryClientProvider>);

    expect(await screen.findByText(/Aucune classe ne vous est affectée/)).toBeInTheDocument();
  });

  it('la direction choisit parmi toutes les classes ; la page est fermée aux familles', async () => {
    await ouvrir('directeur');

    expect(screen.getByRole('option', { name: '5ème' })).toBeInTheDocument();
    expect(ROUTE_CONFIG.notesSaisie.roles).not.toContain('parent');
    expect(getRoleNavigation('enseignant').map((e) => e.path)).toContain('/notes/saisie');
    expect(getRoleNavigation('parent').map((e) => e.path)).not.toContain('/notes/saisie');
  });
});
