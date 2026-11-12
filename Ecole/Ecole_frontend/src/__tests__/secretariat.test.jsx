/**
 * Secrétariat (lot 6.5) : inscriptions, courrier, certificats.
 */

import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { render, screen, fireEvent, waitFor, within } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { QueryClientProvider } from '@tanstack/react-query';
import InscriptionsPage from '@/app/features/secretaire/InscriptionsPage';
import DocumentsPage from '@/app/features/secretaire/DocumentsPage';
import { installHttpMock } from './helpers/http-mock';
import { makeQueryClient, signIn } from './helpers/render';

let http;
const monter = (Page) => {
  signIn('secretaire');
  return render(<QueryClientProvider client={makeQueryClient()}><MemoryRouter><Page /></MemoryRouter></QueryClientProvider>);
};

beforeEach(() => {
  http = installHttpMock();
  vi.spyOn(console, 'error').mockImplementation(() => {});
  vi.spyOn(window, 'print').mockImplementation(() => {});
  http.onGet('/secretaire/dossiers-eleves').reply(200, { data: [
    { id: 7, eleve: { id: 7, user: { name: 'DOSSOU', prenom: 'Afi' }, classe: { nom_classe: '6ème' } }, nom_parent: 'DOSSOU Koffi', telephone_parent: '+2290197000001', dossier_complet: false },
  ] });
  http.onGet('/secretaire/courriers').reply(200, { success: true, data: [
    { id: 1, reference: 'A-2026-0001', type: 'entrant', expediteur: 'DDEMP', destinataire: 'Directeur', objet: 'Calendrier des examens', date_reception: '2026-11-10' },
  ] });
  http.onGet('/secretaire/certificats').reply(200, { data: [
    { id: 4, numero_certificat: 'CERT-2026-0001', type_certificat: 'scolarite', date_emission: '2026-11-12', delivre: false,
      eleve: { numero_matricule: 'B1', user: { name: 'AGBO', prenom: 'Luc' }, classe: { nom_classe: '6ème' } } },
  ] });
  http.onGet('/eleves').reply(200, { success: true, data: [{ id: 9, user: { name: 'AGBO', prenom: 'Luc' }, classe: { nom_classe: '6ème' } }] });
  http.onGet('/eleves/7/fiche').reply(200, { success: true, data: { eleve: { id: 7, name: 'DOSSOU', prenom: 'Afi', classe: null }, parents: [], scolarite: { notes: 0, moyenne: null, absences: 0, absences_non_justifiees: 0 }, paiements: null } });
});
afterEach(() => { http.restore(); vi.restoreAllMocks(); });

describe('inscriptions du secrétariat', () => {
  it('montre le nom de l’élève et du parent, et ouvre l’inscription et la fiche', async () => {
    monter(InscriptionsPage);

    const carte = (await screen.findByText('DOSSOU Afi')).closest('div.flex');
    expect(screen.getByText('DOSSOU Koffi')).toBeInTheDocument();
    fireEvent.click(screen.getByRole('button', { name: /Compléter/ }));
    const d = await screen.findByRole('dialog');
    await waitFor(() => expect(d).toHaveTextContent('Identité'));
    expect(carte).toBeTruthy();
  });

  it('« Nouvelle inscription » ouvre le formulaire d’inscription', async () => {
    http.onGet('/classes').reply(200, []);
    monter(InscriptionsPage);
    fireEvent.click(await screen.findByRole('button', { name: /Nouvelle inscription/ }));

    expect(await screen.findByRole('dialog')).toHaveTextContent(/Inscrire un élève/);
  });
});

describe('courrier et certificats', () => {
  it('enregistre un courrier', async () => {
    http.onPost('/secretaire/courriers').reply(201, { success: true });
    monter(DocumentsPage);
    expect(await screen.findByText('A-2026-0001')).toBeInTheDocument();

    fireEvent.click(screen.getByRole('button', { name: /Nouveau courrier/ }));
    const d = await screen.findByRole('dialog');
    fireEvent.change(within(d).getByLabelText(/^Expéditeur/), { target: { value: 'Mairie' } });
    fireEvent.change(within(d).getByLabelText(/^Destinataire/), { target: { value: 'Directeur' } });
    fireEvent.change(within(d).getByLabelText(/^Objet/), { target: { value: 'Convocation' } });
    fireEvent.click(within(d).getByRole('button', { name: /Enregistrer/ }));

    await waitFor(() => expect(http.callsTo('post', '/secretaire/courriers')).toHaveLength(1));
    expect(http.callsTo('post', '/secretaire/courriers')[0].body).toMatchObject({ type: 'entrant', expediteur: 'Mairie', objet: 'Convocation' });
  });

  it('établit, délivre et imprime un certificat', async () => {
    http.onPost('/secretaire/certificats').reply(201, { id: 5 });
    http.onPut('/secretaire/certificats/4/delivrer').reply(200, {});
    monter(DocumentsPage);
    const liste = await screen.findByTestId('certificats');

    fireEvent.click(within(liste).getByRole('button', { name: /Marquer délivré/ }));
    await waitFor(() => expect(http.callsTo('put', '/secretaire/certificats/4/delivrer')).toHaveLength(1));

    fireEvent.click(within(liste).getByRole('button', { name: /Imprimer/ }));
    await waitFor(() => expect(window.print).toHaveBeenCalled());
    expect(screen.getByTestId('impression-certificat')).toHaveTextContent(/certifie que l’élève AGBO Luc, matricule B1, est régulièrement inscrit\(e\) en classe de 6ème/);

    fireEvent.click(screen.getByRole('button', { name: /Établir un certificat/ }));
    const d = await screen.findByRole('dialog');
    await within(d).findByRole('option', { name: /AGBO Luc/ });
    fireEvent.change(within(d).getByLabelText(/^Élève/), { target: { value: '9' } });
    fireEvent.click(within(d).getByRole('button', { name: /Établir un certificat/ }));
    await waitFor(() => expect(http.callsTo('post', '/secretaire/certificats')[0].body).toMatchObject({ eleve_id: 9, type_certificat: 'scolarite' }));
  });
});
