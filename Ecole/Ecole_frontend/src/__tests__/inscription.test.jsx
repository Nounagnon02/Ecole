/**
 * Inscription d'un élève depuis la page « Élèves » (audit BUG-002, lot 4.1)
 */

import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { render, screen, fireEvent, waitFor, within } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { QueryClientProvider } from '@tanstack/react-query';
import ElevesPage from '@/app/features/eleves/ElevesPage';
import { telephoneBeninValide } from '@/app/features/eleves/InscriptionDialog';
import { installHttpMock } from './helpers/http-mock';
import { makeQueryClient, signIn } from './helpers/render';

let http;

function monter(role = 'secretaire') {
  signIn(role);
  return render(
    <QueryClientProvider client={makeQueryClient()}>
      <MemoryRouter><ElevesPage /></MemoryRouter>
    </QueryClientProvider>,
  );
}
async function ouvrir() {
  monter();
  fireEvent.click(await screen.findByRole('button', { name: /Nouvel élève/ }));
  const dialogue = await screen.findByRole('dialog');
  await within(dialogue).findByRole('option', { name: '6ème' });
  return dialogue;
}
const saisir = (dialogue, libelle, valeur) => fireEvent.change(within(dialogue).getByLabelText(libelle), { target: { value: valeur } });

beforeEach(() => {
  http = installHttpMock();
  vi.spyOn(console, 'error').mockImplementation(() => {});
  http.onGet('/eleves').reply(200, { success: true, data: [] });
  http.onGet('/classes').reply(200, [{ id: 4, nom_classe: '6ème' }, { id: 5, nom_classe: '5ème' }]);
});
afterEach(() => { http.restore(); vi.restoreAllMocks(); });

describe('téléphone béninois', () => {
  it.each(['0197123456', '01 97 12 34 56', '+229 01 97 12 34 56', '97123456', '+22997123456'])('accepte %s', (n) => {
    expect(telephoneBeninValide(n)).toBe(true);
  });
  it.each(['', '12345', '9712345678', '+33612345678', '01971234ab'])('refuse « %s »', (n) => {
    expect(telephoneBeninValide(n)).toBe(false);
  });
});

describe('inscription', () => {
  it('inscrit l’élève et son parent, puis affiche les accès une seule fois', async () => {
    http.onPost('/eleves/store').reply(201, {
      id: 9, numero_matricule: 'E26ABCDEF',
      acces: {
        eleve: { identifiant: 'E26ABCDEF', mot_de_passe_provisoire: 'KM7PQ2RSTU' },
        parent: { identifiant: '0197000001', mot_de_passe_provisoire: 'ZX9WV8UTSR', nouveau: true },
      },
    });
    const dialogue = await ouvrir();

    saisir(dialogue, /^Nom(\s*\*)?$/, 'DOSSOU');
    saisir(dialogue, /^Prénom(\s*\*)?$/, 'Afi');
    saisir(dialogue, /^Classe/, '4');
    saisir(dialogue, /Nom du parent/, 'DOSSOU');
    saisir(dialogue, /Téléphone du parent/, '01 97 00 00 01');
    fireEvent.click(within(dialogue).getByRole('button', { name: /Inscrire l’élève/ }));

    await waitFor(() => expect(http.callsTo('post', '/eleves/store')).toHaveLength(1));
    expect(http.callsTo('post', '/eleves/store')[0].body).toEqual({
      name: 'DOSSOU', prenom: 'Afi', classe_id: 4, parent: { name: 'DOSSOU', telephone: '01 97 00 00 01' },
    });

    expect(await screen.findByTestId('acces-eleve')).toHaveTextContent('E26ABCDEF');
    expect(screen.getByTestId('acces-eleve')).toHaveTextContent('KM7PQ2RSTU');
    expect(screen.getByTestId('acces-parent')).toHaveTextContent('0197000001');
    expect(screen.getByTestId('acces-parent')).toHaveTextContent('ZX9WV8UTSR');
    // La liste est rechargée pour montrer le nouvel inscrit.
    await waitFor(() => expect(http.callsTo('get', '/eleves').length).toBeGreaterThan(1));
  });

  it('sans parent, n’envoie pas de bloc parent', async () => {
    http.onPost('/eleves/store').reply(201, { id: 9, acces: { eleve: { identifiant: 'E1', mot_de_passe_provisoire: 'P1' }, parent: null } });
    const dialogue = await ouvrir();

    saisir(dialogue, /^Nom(\s*\*)?$/, 'DOSSOU');
    saisir(dialogue, /^Prénom(\s*\*)?$/, 'Afi');
    saisir(dialogue, /^Classe/, '5');
    fireEvent.click(within(dialogue).getByRole('button', { name: /Inscrire l’élève/ }));

    await waitFor(() => expect(http.callsTo('post', '/eleves/store')).toHaveLength(1));
    expect(http.callsTo('post', '/eleves/store')[0].body).toEqual({ name: 'DOSSOU', prenom: 'Afi', classe_id: 5 });
    await screen.findByTestId('acces-eleve');
    expect(screen.queryByTestId('acces-parent')).not.toBeInTheDocument();
  });

  it('envoie le matricule saisi à la main, et montre sous le champ le refus d’un doublon', async () => {
    http.onPost('/eleves/store').reply(422, { message: 'Invalide', errors: { numero_matricule: ['Ce matricule est déjà utilisé.'] } });
    const dialogue = await ouvrir();

    saisir(dialogue, /^Nom(\s*\*)?$/, 'DOSSOU'); saisir(dialogue, /^Prénom(\s*\*)?$/, 'Afi'); saisir(dialogue, /^Classe/, '4');
    saisir(dialogue, /Matricule/, ' BEN2026001 ');
    fireEvent.click(within(dialogue).getByRole('button', { name: /Inscrire l’élève/ }));

    await waitFor(() => expect(http.callsTo('post', '/eleves/store')).toHaveLength(1));
    expect(http.callsTo('post', '/eleves/store')[0].body).toMatchObject({ numero_matricule: 'BEN2026001' });
    await waitFor(() => expect(within(dialogue).getByLabelText(/Matricule/)).toHaveAccessibleDescription(/déjà utilisé/));
  });

  it('dit que le parent était déjà connu au lieu d’afficher un mot de passe', async () => {
    http.onPost('/eleves/store').reply(201, { id: 9, acces: { eleve: { identifiant: 'E1', mot_de_passe_provisoire: 'P1' }, parent: { identifiant: '0197000001', mot_de_passe_provisoire: null, nouveau: false } } });
    const dialogue = await ouvrir();

    saisir(dialogue, /^Nom(\s*\*)?$/, 'DOSSOU'); saisir(dialogue, /^Prénom(\s*\*)?$/, 'Sena'); saisir(dialogue, /^Classe/, '4');
    saisir(dialogue, /Nom du parent/, 'DOSSOU'); saisir(dialogue, /Téléphone du parent/, '97000001');
    fireEvent.click(within(dialogue).getByRole('button', { name: /Inscrire l’élève/ }));

    expect(await screen.findByTestId('acces-parent')).toHaveTextContent(/a déjà un compte/);
  });

  it('signale les champs manquants et un téléphone mal formé sans appeler l’API', async () => {
    const dialogue = await ouvrir();

    saisir(dialogue, /Nom du parent/, 'DOSSOU');
    saisir(dialogue, /Téléphone du parent/, '12345');
    fireEvent.click(within(dialogue).getByRole('button', { name: /Inscrire l’élève/ }));

    expect(await within(dialogue).findByText(/Indiquez le nom de l’élève/)).toBeInTheDocument();
    expect(within(dialogue).getByText(/Choisissez une classe/)).toBeInTheDocument();
    expect(within(dialogue).getByText(/Numéro invalide/)).toBeInTheDocument();
    expect(http.callsTo('post', '/eleves/store')).toHaveLength(0);
  });

  it('montre les refus de l’API et garde la saisie', async () => {
    http.onPost('/eleves/store').reply(422, { message: 'Invalide', errors: { numero_matricule: ['Ce matricule est déjà utilisé.'] } });
    const dialogue = await ouvrir();

    saisir(dialogue, /^Nom(\s*\*)?$/, 'DOSSOU'); saisir(dialogue, /^Prénom(\s*\*)?$/, 'Afi'); saisir(dialogue, /^Classe/, '4');
    fireEvent.click(within(dialogue).getByRole('button', { name: /Inscrire l’élève/ }));

    expect(await within(dialogue).findByRole('alert')).toHaveTextContent('Ce matricule est déjà utilisé.');
    expect(within(dialogue).getByLabelText(/^Nom(\s*\*)?$/)).toHaveValue('DOSSOU');
  });

  it('ne propose l’inscription qu’à la direction et au secrétariat', async () => {
    monter('comptable');

    await screen.findByText(/Gérez l'ensemble des élèves/);
    expect(screen.queryByRole('button', { name: /Nouvel élève/ })).not.toBeInTheDocument();
  });
});

describe('export', () => {
  it('télécharge la liste affichée au format CSV', async () => {
    http.onGet('/eleves').reply(200, { success: true, data: [
      { id: 1, statut: 'active', numero_matricule: 'BEN1', user: { name: 'AGBO', prenom: 'Luc; Jr' }, classe: { id: 4, nom_classe: '6ème' } },
    ] });
    const contenus = [];
    const BlobOrigine = globalThis.Blob;
    vi.spyOn(globalThis, 'Blob').mockImplementation(function B(parts, opts) { contenus.push(parts.join('')); return new BlobOrigine(parts, opts); });
    URL.createObjectURL = vi.fn(() => 'blob:x'); URL.revokeObjectURL = vi.fn();
    const noms = [];
    vi.spyOn(HTMLAnchorElement.prototype, 'click').mockImplementation(function clic() { noms.push(this.download); });

    monter('directeur');
    await screen.findByText(/AGBO/);
    fireEvent.click(screen.getByRole('button', { name: /Exporter/ }));

    expect(noms[0]).toMatch(/^eleves-\d{4}-\d{2}-\d{2}\.csv$/);
    expect(contenus[0]).toContain('Matricule;Nom;Prénom;Classe;Statut');
    expect(contenus[0]).toContain('BEN1;AGBO;"Luc; Jr";6ème;');
  });
});
