/**
 * MessageriePage — contrat du module.
 *
 * Trois régressions verrouillées :
 *   - la première conversation devait être sélectionnée avec l'objet MAPPÉ
 *     (avec `id`/`name`), sinon le fil partait sur /conversation/undefined ;
 *   - l'aperçu du dernier message (`dernier_message`) doit s'afficher ;
 *   - l'ouverture d'un fil appelle PUT …/read (badges non-lus qui
 *     redescendent) et rafraîchit la liste.
 */

import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { render, screen, waitFor, fireEvent } from '@testing-library/react';
import MessageriePage from '@/app/features/messagerie/MessageriePage';
import { installHttpMock } from './helpers/http-mock';
import { signIn } from './helpers/render';

const CONVERSATIONS = [
  {
    id: 10,
    contact_id: 10,
    contact_nom: 'Aminata Diallo',
    role: 'enseignant',
    dernier_message: 'Bonjour Directeur',
    derniere_date: '2026-08-07T09:00:00+01:00',
    non_lus: 2,
  },
];

const THREAD = [
  {
    id: 1,
    expediteur: '10',
    destinataire: '1',
    contenu: 'Bonjour Directeur',
    created_at: '2026-08-07T09:00:00+01:00',
  },
  {
    id: 2,
    expediteur: '1',
    destinataire: '10',
    contenu: 'Bonjour Amin, à demain',
    created_at: '2026-08-07T09:05:00+01:00',
  },
];

let http;

beforeEach(() => {
  http = installHttpMock();
  signIn('directeur', { id: 1 });
  vi.spyOn(console, 'error').mockImplementation(() => {});
});

afterEach(() => {
  http.restore();
  vi.restoreAllMocks();
});

function mockConversations() {
  http.onGet('/messages/conversations').reply(200, { success: true, data: CONVERSATIONS });
}

function mockThread() {
  http.onGet('/messages/conversation/10').reply(200, { success: true, data: THREAD });
}

function mockReadConversation() {
  http.onPut('/messages/conversation/10/read').reply(200, { success: true, data: { marked: 2 } });
}

async function waitForListReady() {
  await waitFor(() => expect(screen.getAllByText('Aminata Diallo').length).toBeGreaterThan(0));
}

describe('MessageriePage', () => {
  it('affiche l’aperçu, le rôle et sélectionne la première conversation (mappée)', async () => {
    mockConversations();
    mockThread();
    mockReadConversation();

    render(<MessageriePage />);

    await waitForListReady();
    expect(screen.getByText('enseignant')).toBeInTheDocument();
    // L'aperçu du dernier message existe (liste + fil rechargé).
    expect(screen.getAllByText('Bonjour Directeur').length).toBeGreaterThan(0);

    // Le fil de la première conversation est chargé automatiquement.
    await waitFor(() => expect(screen.getByText('Bonjour Amin, à demain')).toBeInTheDocument());

    // L'ouverture a marqué le fil lu et a rafraîchi la liste.
    expect(http.callsTo('put', '/messages/conversation/10/read').length).toBeGreaterThan(0);
    expect(http.callsTo('GET', '/messages/conversations').length).toBeGreaterThanOrEqual(2);
  });

  it('envoie un message au contact sélectionné', async () => {
    mockConversations();
    mockThread();
    mockReadConversation();
    http.onPost('/messages').reply(201, {
      success: true,
      data: { id: 3, created_at: '2026-08-07T10:00:00+01:00' },
    });

    render(<MessageriePage />);

    await waitForListReady();
    // Le fil doit être chargé avant d'écrire : sinon le libellé envoyé
    // se confond avec l'aperçu de la liste.
    await waitFor(() => expect(screen.getByText('Bonjour Amin, à demain')).toBeInTheDocument());

    fireEvent.change(screen.getByPlaceholderText('Écrivez votre message...'), {
      target: { value: 'Reçu, merci !' },
    });
    fireEvent.click(screen.getByText('Envoyer'));

    await waitFor(() => expect(screen.getAllByText('Reçu, merci !').length).toBeGreaterThan(0));

    const calls = http.callsTo('POST', '/messages');
    expect(calls.length).toBe(1);
    expect(calls[0].body).toEqual({ destinataire: '10', contenu: 'Reçu, merci !' });
  });

  it('ouvre une nouvelle conversation depuis le contacteur', async () => {
    mockConversations();
    mockThread();
    mockReadConversation();
    http.onGet('/messages/contacts').reply(200, {
      success: true,
      data: [{ id: 20, name: 'Kofi Mensah', role: 'parent' }],
    });
    // La sélection de Kofi ouvre le fil /20 : la page le charge comme tout
    // fil existant (vide ici, rien n'a encore été échangé).
    http.onGet('/messages/conversation/20').reply(200, { success: true, data: [] });
    http.onPost('/messages').reply(201, {
      success: true,
      data: { id: 3, created_at: '2026-08-07T10:00:00+01:00' },
    });

    render(<MessageriePage />);

    await waitForListReady();

    fireEvent.click(screen.getByText('Nouvelle conversation'));
    await waitFor(() => expect(screen.getByText('Kofi Mensah')).toBeInTheDocument());

    fireEvent.click(screen.getByText('Kofi Mensah'));

    // Le fil du nouveau contact est désormais le fil affiché ; l'envoi cible
    // le bon destinataire.
    await waitFor(() => expect(screen.getAllByText('Kofi Mensah').length).toBeGreaterThan(0));
    expect(screen.getByText('parent')).toBeInTheDocument();

    fireEvent.change(screen.getByPlaceholderText('Écrivez votre message...'), {
      target: { value: 'Bonsoir' },
    });
    fireEvent.keyDown(screen.getByPlaceholderText('Écrivez votre message...'), { key: 'Enter', code: 'Enter' });

    await waitFor(() => expect(screen.getAllByText('Bonsoir').length).toBeGreaterThan(0));
    const calls = http.callsTo('POST', '/messages');
    expect(calls.length).toBe(1);
    expect(calls[0].body).toEqual({ destinataire: '20', contenu: 'Bonsoir' });
  });
});