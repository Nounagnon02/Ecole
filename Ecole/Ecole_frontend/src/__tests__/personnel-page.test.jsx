/**
 * Page « Personnel » : la direction crée directement un compte, sans fichier.
 */

import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { render, screen, fireEvent, waitFor, within } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { QueryClientProvider } from '@tanstack/react-query';
import PersonnelPage, { ROLES_PERSONNEL } from '@/app/features/personnel/PersonnelPage';
import { ROUTE_CONFIG } from '@/features/roles/route-config';
import { getRoleNavigation } from '@/features/roles/navigation-config';
import { ROLE_LABELS } from '@/shared/types/roles';
import { installHttpMock } from './helpers/http-mock';
import { makeQueryClient, signIn } from './helpers/render';

let http;
const compte = (id, nom, role, extra = {}) => ({ id, name: nom, prenom: 'Test', role, identifiant: `019600000${id}`, is_active: true, mot_de_passe_provisoire: false, ...extra });

function monter() {
  signIn('directeur');
  return render(<QueryClientProvider client={makeQueryClient()}><MemoryRouter><PersonnelPage /></MemoryRouter></QueryClientProvider>);
}
async function ouvrir() {
  monter();
  fireEvent.click(await screen.findByRole('button', { name: /Ajouter un membre/ }));
  return screen.findByRole('dialog');
}
const saisir = (dialogue, libelle, valeur) => fireEvent.change(within(dialogue).getByLabelText(libelle), { target: { value: valeur } });

beforeEach(() => {
  http = installHttpMock();
  vi.spyOn(console, 'error').mockImplementation(() => {});
  http.onGet('/personnel/comptes').reply(200, { success: true, data: [
    compte(1, 'HOUNKPE', 'enseignant'), compte(2, 'ZINSOU', 'comptable', { mot_de_passe_provisoire: true }),
  ] });
});
afterEach(() => { http.restore(); vi.restoreAllMocks(); });

describe('PersonnelPage', () => {
  it('liste les comptes avec leur rôle et signale ceux qui ne se sont jamais connectés', async () => {
    monter();

    const ligne = (await screen.findByText(/ZINSOU/)).closest('tr');
    expect(ligne).toHaveTextContent('Comptable');
    expect(ligne).toHaveTextContent('Jamais connecté');
    expect(screen.getByText(/HOUNKPE/).closest('tr')).toHaveTextContent('Actif');
  });

  it('crée un compte et affiche ses accès une seule fois', async () => {
    http.onPost('/personnel/comptes').reply(201, { success: true, acces: { role: 'surveillant', identifiant: '0196000009', mot_de_passe_provisoire: 'KM7PQ2RSTU', nouveau: true } });
    const dialogue = await ouvrir();

    saisir(dialogue, /^Rôle/, 'surveillant');
    saisir(dialogue, /^Nom/, 'KPADE');
    saisir(dialogue, /^Téléphone/, '01 96 00 00 09');
    fireEvent.click(within(dialogue).getByRole('button', { name: /Créer le compte/ }));

    await waitFor(() => expect(http.callsTo('post', '/personnel/comptes')).toHaveLength(1));
    expect(http.callsTo('post', '/personnel/comptes')[0].body).toEqual({ role: 'surveillant', nom: 'KPADE', telephone: '01 96 00 00 09' });
    expect(await screen.findByTestId('acces')).toHaveTextContent('0196000009');
    expect(screen.getByTestId('acces')).toHaveTextContent('KM7PQ2RSTU');
    await waitFor(() => expect(http.callsTo('get', '/personnel/comptes').length).toBeGreaterThan(1));
  });

  it('contrôle la saisie sans appeler l’API', async () => {
    const dialogue = await ouvrir();

    saisir(dialogue, /^Téléphone/, '12345');
    fireEvent.click(within(dialogue).getByRole('button', { name: /Créer le compte/ }));

    expect(await within(dialogue).findByText(/Choisissez un rôle/)).toBeInTheDocument();
    expect(within(dialogue).getByText(/Indiquez le nom/)).toBeInTheDocument();
    expect(within(dialogue).getByText(/Numéro invalide/)).toBeInTheDocument();
    expect(http.callsTo('post', '/personnel/comptes')).toHaveLength(0);
  });

  it('montre le refus de l’API (compte déjà existant)', async () => {
    http.onPost('/personnel/comptes').reply(422, { message: 'Un compte existe déjà pour le téléphone « 0196000002 ».', errors: { compte: ['Un compte existe déjà pour le téléphone « 0196000002 ».'] } });
    const dialogue = await ouvrir();

    saisir(dialogue, /^Rôle/, 'comptable'); saisir(dialogue, /^Nom/, 'ZINSOU'); saisir(dialogue, /^Téléphone/, '0196000002');
    fireEvent.click(within(dialogue).getByRole('button', { name: /Créer le compte/ }));

    expect(await within(dialogue).findByRole('alert')).toHaveTextContent(/Un compte existe déjà/);
  });

  it('est réservée à la direction, dans le menu comme dans les droits, et tous ses rôles ont un libellé', () => {
    expect(ROUTE_CONFIG.personnel.roles).toEqual(['directeur', 'directeurM', 'directeurP', 'directeurS']);
    expect(getRoleNavigation('directeur').map((e) => e.path)).toContain('/personnel');
    expect(getRoleNavigation('secretaire').map((e) => e.path)).not.toContain('/personnel');
    expect(ROLES_PERSONNEL.filter((role) => !ROLE_LABELS[role])).toEqual([]);
  });
});
