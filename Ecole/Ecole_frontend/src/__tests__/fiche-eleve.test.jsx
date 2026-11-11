/**
 * Fiche de l'élève depuis la liste (lot 4.2) et correction du dossier.
 */

import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { render, screen, fireEvent, waitFor, within } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { QueryClientProvider } from '@tanstack/react-query';
import ElevesPage from '@/app/features/eleves/ElevesPage';
import { installHttpMock } from './helpers/http-mock';
import { makeQueryClient, signIn } from './helpers/render';

let http;
const fiche = (extra = {}) => ({ success: true, data: {
  eleve: { id: 7, name: 'DOSSOU', prenom: 'Afi', numero_matricule: 'BEN1', statut: 'active', date_naissance: '2014-03-14', classe: { id: 4, nom: '6ème' } },
  parents: [{ nom: 'DOSSOU Koffi', telephone: '+2290197000001', principal: true }, { nom: 'DOSSOU Ama', telephone: null, principal: false }],
  scolarite: { notes: 2, moyenne: 11.5, absences: 3, absences_non_justifiees: 2 },
  paiements: { total_du: 60000, total_paye: 20000, reste: 40000 },
  ...extra,
} });

async function ouvrir(role = 'secretaire') {
  signIn(role);
  render(<QueryClientProvider client={makeQueryClient()}><MemoryRouter><ElevesPage /></MemoryRouter></QueryClientProvider>);
  fireEvent.click(await screen.findByRole('button', { name: /^Fiche$/ }));
  const dialogue = await screen.findByRole('dialog');
  await within(dialogue).findByText('Identité');
  return dialogue;
}

beforeEach(() => {
  http = installHttpMock();
  vi.spyOn(console, 'error').mockImplementation(() => {});
  http.onGet('/eleves').reply(200, { success: true, data: [{ id: 7, statut: 'active', numero_matricule: 'BEN1', user: { name: 'DOSSOU', prenom: 'Afi' }, classe: { id: 4, nom_classe: '6ème' } }] });
  http.onGet('/eleves/7/fiche').reply(200, fiche());
  http.onGet('/classes').reply(200, [{ id: 4, nom_classe: '6ème' }, { id: 5, nom_classe: '5ème' }]);
});
afterEach(() => { http.restore(); vi.restoreAllMocks(); });

describe('fiche de l’élève', () => {
  it('montre les parents joignables et le résumé de scolarité', async () => {
    const dialogue = await ouvrir();

    const parents = within(dialogue).getByTestId('parents');
    expect(within(parents).getByText('DOSSOU Koffi').closest('li')).toHaveTextContent('Contact de référence');
    expect(within(parents).getByRole('link', { name: /\+2290197000001/ })).toHaveAttribute('href', 'tel:+2290197000001');
    const scolarite = within(dialogue).getByTestId('scolarite');
    expect(scolarite).toHaveTextContent('11,5/20');
    expect(scolarite).toHaveTextContent('dont 2 non justifiée(s)');
    expect(scolarite).toHaveTextContent(/40\s000/);
  });

  it('n’affiche pas de bloc de paiement quand l’API n’en rend pas, ni « 0/20 » sans note', async () => {
    http.onGet('/eleves/7/fiche').reply(200, fiche({ paiements: null, scolarite: { notes: 0, moyenne: null, absences: 0, absences_non_justifiees: 0 } }));
    const dialogue = await ouvrir('surveillant');

    expect(within(dialogue).queryByText(/Reste à payer/)).not.toBeInTheDocument();
    expect(within(dialogue).getByTestId('scolarite')).not.toHaveTextContent('/20');
    // La surveillance consulte, elle ne corrige pas le dossier.
    expect(within(dialogue).queryByRole('button', { name: /Modifier/ })).not.toBeInTheDocument();
  });

  it('corrige le prénom, la classe et le matricule, puis recharge', async () => {
    http.onPut('/eleves/update/7').reply(200, { id: 7 });
    const dialogue = await ouvrir();

    fireEvent.click(within(dialogue).getByRole('button', { name: /Modifier/ }));
    await within(dialogue).findByRole('option', { name: '5ème' });
    expect(within(dialogue).getByLabelText(/^Prénom/)).toHaveValue('Afi');
    fireEvent.change(within(dialogue).getByLabelText(/^Prénom/), { target: { value: 'Afiwa' } });
    fireEvent.change(within(dialogue).getByLabelText(/^Classe/), { target: { value: '5' } });
    fireEvent.change(within(dialogue).getByLabelText(/^Matricule/), { target: { value: 'BEN2' } });
    fireEvent.click(within(dialogue).getByRole('button', { name: /Enregistrer/ }));

    await waitFor(() => expect(http.callsTo('put', '/eleves/update/7')).toHaveLength(1));
    expect(http.callsTo('put', '/eleves/update/7')[0].body).toEqual({ name: 'DOSSOU', prenom: 'Afiwa', classe_id: 5, numero_matricule: 'BEN2' });
    await waitFor(() => expect(http.callsTo('get', '/eleves/7/fiche').length).toBeGreaterThan(1));
    await waitFor(() => expect(http.callsTo('get', '/eleves').length).toBeGreaterThan(1));
  });

  it('montre sous le champ le refus d’un matricule déjà pris', async () => {
    http.onPut('/eleves/update/7').reply(422, { message: 'Invalide', errors: { numero_matricule: ['Ce matricule est déjà utilisé.'] } });
    const dialogue = await ouvrir();

    fireEvent.click(within(dialogue).getByRole('button', { name: /Modifier/ }));
    await within(dialogue).findByRole('option', { name: '5ème' });
    fireEvent.click(within(dialogue).getByRole('button', { name: /Enregistrer/ }));

    await waitFor(() => expect(within(dialogue).getByLabelText(/^Matricule/)).toHaveAccessibleDescription(/déjà utilisé/));
  });
});
