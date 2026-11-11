/**
 * Inscription en masse par CSV depuis la page « Élèves ».
 */

import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { render, screen, fireEvent, waitFor, within } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { QueryClientProvider } from '@tanstack/react-query';
import ElevesPage from '@/app/features/eleves/ElevesPage';
import { COLONNES } from '@/app/features/eleves/ImportDialog';
import { installHttpMock } from './helpers/http-mock';
import { makeQueryClient, signIn } from './helpers/render';

let http;
let telecharges;
let contenus;

async function ouvrir(role = 'secretaire') {
  signIn(role);
  render(
    <QueryClientProvider client={makeQueryClient()}>
      <MemoryRouter><ElevesPage /></MemoryRouter>
    </QueryClientProvider>,
  );
  fireEvent.click(await screen.findByRole('button', { name: /Importer un fichier/ }));
  return screen.findByRole('dialog');
}
const choisir = (dialogue) => fireEvent.change(
  within(dialogue).getByLabelText(/Fichier CSV à importer/),
  { target: { files: [new File(['role;nom\neleve;DOSSOU'], 'comptes.csv', { type: 'text/csv' })] } },
);
const envois = () => http.callsTo('post', '/imports/comptes');

beforeEach(() => {
  http = installHttpMock();
  vi.spyOn(console, 'error').mockImplementation(() => {});
  http.onGet('/eleves').reply(200, { success: true, data: [] });
  telecharges = []; contenus = [];
  const BlobOrigine = globalThis.Blob;
  vi.spyOn(globalThis, 'Blob').mockImplementation(function B(parts, opts) { contenus.push(parts.join('')); return new BlobOrigine(parts, opts); });
  URL.createObjectURL = vi.fn(() => 'blob:x'); URL.revokeObjectURL = vi.fn();
  vi.spyOn(HTMLAnchorElement.prototype, 'click').mockImplementation(function clic() { telecharges.push(this.download); });
});
afterEach(() => { http.restore(); vi.restoreAllMocks(); });

describe('import de comptes par CSV', () => {
  it('fournit un modèle portant toutes les colonnes attendues', async () => {
    const dialogue = await ouvrir();

    fireEvent.click(within(dialogue).getByRole('button', { name: /Télécharger le modèle/ }));

    expect(telecharges).toEqual(['modele-inscription.csv']);
    expect(contenus[0].split('\r\n')[0].replace('﻿', '')).toBe(COLONNES.join(';'));
  });

  it('contrôle d’abord le fichier, puis importe et remet les accès en fichier', async () => {
    http.onPost('/imports/comptes').reply(200, { success: true, simulation: true, total: 2, crees: { eleve: 2, parent: 1 }, erreurs: [], acces: [] });
    const dialogue = await ouvrir();

    choisir(dialogue);

    expect(await within(dialogue).findByText(/Fichier valide : 2 lignes\. Seront créés : 2 élève\(s\), 1 parent\(s\)\./)).toBeInTheDocument();
    expect(envois()).toHaveLength(1);
    expect(envois()[0].body.get('simulation')).toBe('1');
    expect(envois()[0].body.get('file').name).toBe('comptes.csv');

    http.onPost('/imports/comptes').reply(200, {
      success: true, simulation: false, total: 2, crees: { eleve: 2, parent: 1 }, erreurs: [],
      acces: [{ role: 'eleve', nom: 'DOSSOU Afi', identifiant: 'E26ABC', mot_de_passe_provisoire: 'KM7PQ2RSTU', nouveau: true }],
    });
    fireEvent.click(within(dialogue).getByRole('button', { name: /Importer les 2 lignes/ }));

    expect(await within(dialogue).findByText(/Import terminé : 2 élève\(s\), 1 parent\(s\)\./)).toBeInTheDocument();
    expect(envois()[1].body.get('simulation')).toBeNull();

    fireEvent.click(within(dialogue).getByRole('button', { name: /Télécharger les 1 accès/ }));
    expect(telecharges[0]).toMatch(/^acces-\d{4}-\d{2}-\d{2}\.csv$/);
    expect(contenus[0]).toContain('eleve;DOSSOU Afi;E26ABC;KM7PQ2RSTU');
    // La liste des élèves est rechargée.
    await waitFor(() => expect(http.callsTo('get', '/eleves').length).toBeGreaterThan(1));
  });

  it('liste les lignes refusées et ne propose pas d’importer', async () => {
    http.onPost('/imports/comptes').reply(200, {
      success: false, simulation: true, total: 3, crees: {}, acces: [],
      erreurs: [{ ligne: 3, message: 'Classe « 7ème » introuvable dans l’école.' }, { ligne: 4, message: 'Rôle « sorcier » inconnu.' }],
    });
    const dialogue = await ouvrir();

    choisir(dialogue);

    expect(await within(dialogue).findByText(/2 ligne\(s\) à corriger\. Rien n’a été créé\./)).toBeInTheDocument();
    expect(within(dialogue).getByText('Classe « 7ème » introuvable dans l’école.').closest('tr')).toHaveTextContent('3');
    expect(within(dialogue).queryByRole('button', { name: /Importer les/ })).not.toBeInTheDocument();
  });

  it('prévient avant de fermer sans avoir récupéré les accès', async () => {
    http.onPost('/imports/comptes').reply(200, { success: true, simulation: false, total: 1, crees: { eleve: 1 }, erreurs: [], acces: [{ role: 'eleve', nom: 'A', identifiant: 'E1', mot_de_passe_provisoire: 'P1', nouveau: true }] });
    const confirmer = vi.spyOn(window, 'confirm').mockReturnValue(false);
    const dialogue = await ouvrir();
    choisir(dialogue);
    fireEvent.click(await within(dialogue).findByRole('button', { name: /Importer les 1 lignes/ }));
    await within(dialogue).findByText(/Import terminé/);

    fireEvent.click(within(dialogue).getByRole('button', { name: /Terminer/ }));

    expect(confirmer).toHaveBeenCalled();
    expect(screen.getByRole('dialog')).toBeInTheDocument();
  });

  it('n’est pas proposé à un rôle qui ne peut pas inscrire', async () => {
    signIn('comptable');
    render(<QueryClientProvider client={makeQueryClient()}><MemoryRouter><ElevesPage /></MemoryRouter></QueryClientProvider>);

    await screen.findByText(/Gérez l'ensemble des élèves/);
    expect(screen.queryByRole('button', { name: /Importer un fichier/ })).not.toBeInTheDocument();
  });
});
