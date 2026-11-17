/**
 * ParametresPage — section Profil (enseignant)
 *
 * Deux régressions protégées ici :
 *
 *  1. Le bouton « Changer la photo » était un bouton mort : aucun handler,
 *     aucune prévisualisation, rien n'était envoyé. Il doit désormais ouvrir
 *     un sélecteur de fichier, afficher un aperçu et renvoyer l'avatar dans
 *     le PUT /auth/profile.
 *
 *  2. Le store ne possédait pas de `setUser` (seulement `updateUser`) :
 *     enregistrer le profil appelait une fonction inexistante et plantait
 *     silencieusement. La sauvegarde doit aboutir et mettre à jour le store.
 *
 *  Enfin, pour un enseignant, expériences professionnelles et matières
 *  maîtrisées doivent être éditables puis envoyées — en bloc, comme le
 *  backend les synchronise.
 */

import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { render, screen, waitFor, fireEvent } from '@testing-library/react';
import ParametresPage from '@/app/features/parametres/ParametresPage';
import useAuthStore from '@/shared/stores/auth-store';
import { I18nProvider } from '@/shared/i18n';
import { installHttpMock } from './helpers/http-mock';
import { renderRoute, resetAuth } from './helpers/render';

let http;

beforeEach(() => {
  http = installHttpMock();
  vi.spyOn(console, 'error').mockImplementation(() => {});
});

afterEach(() => {
  http.restore();
  vi.restoreAllMocks();
});

function renderPage() {
  return renderRoute(<ParametresPage />, { path: '/parametres', withQuery: true });
}

describe('ParametresPage — profil enseignant', () => {
  it('sauvegarde les champs personnels et met à jour le store', async () => {
    resetAuth({
      user: { id: 1, name: 'Kouassi', prenom: 'Jean', email: 'j@ecole.bj', telephone: '01', role: 'directeur' },
      isAuthenticated: true,
    });

    http.onPut('/auth/profile').reply(200, {
      success: true,
      user: { id: 1, name: 'Kouassi', prenom: 'Jean', email: 'j@ecole.bj', telephone: '02', role: 'directeur' },
    });

    renderPage();

    const telephone = document.querySelector('input[name="telephone"]');
    fireEvent.change(telephone, { target: { value: '02' } });

    fireEvent.click(screen.getByRole('button', { name: /Enregistrer/i }));

    await waitFor(() => expect(screen.getByText('Enregistré')).toBeInTheDocument());

    expect(http.callsTo('put', '/auth/profile')).toHaveLength(1);
    expect(useAuthStore.getState().user.telephone).toBe('02');
  });

  it('offre un sélecteur de photo fonctionnel (le bouton n est plus mort)', async () => {
    resetAuth({
      user: { id: 1, name: 'Awa', prenom: '', role: 'enseignant' },
      isAuthenticated: true,
      profil: null,
    });
    http.onGet('/matieres').reply(200, []);

    renderPage();

    const fileInput = document.querySelector('input[type="file"]');
    expect(fileInput).not.toBeNull();

    const file = new File(['data'], 'photo.png', { type: 'image/png' });
    fireEvent.change(fileInput, { target: { files: [file] } });

    await waitFor(() => {
      const avatar = document.querySelector('img[alt="Awa"]');
      expect(avatar).not.toBeNull();
      expect(avatar.getAttribute('src')).toMatch(/^data:image\/png/);
    });
  });

  it('charge et affiche les matières maîtrisées pour un enseignant', async () => {
    resetAuth({
      user: {
        id: 1,
        name: 'Awa',
        prenom: '',
        role: 'enseignant',
        profil: {
          specialite: 'Mathématiques',
          grade: 'Certifié',
          experiences: [],
          matieres_maitrisees: [{ id: 3, nom: 'Mathématiques' }],
        },
      },
      isAuthenticated: true,
    });

    http.onGet('/matieres').reply(200, [
      { id: 3, nom: 'Mathématiques' },
      { id: 7, nom: 'Physique-Chimie' },
    ]);

    renderPage();

    await waitFor(() => expect(screen.getByText('Physique-Chimie')).toBeInTheDocument());

    const mathematiques = screen.getByText('Mathématiques');
    expect(mathematiques.className).toContain('accent');
  });

  it('envoie expériences et matières maîtrisées dans le PUT', async () => {
    resetAuth({
      user: {
        id: 1,
        name: 'Awa',
        prenom: '',
        role: 'enseignant',
        profil: {
          specialite: 'Mathématiques',
          grade: 'Certifié',
          experiences: [
            { id: 5, poste: 'Professeur', etablissement: 'Lycée A', date_debut: '2019-09-01', date_fin: null, description: '' },
          ],
          matieres_maitrisees: [{ id: 3, nom: 'Mathématiques' }],
        },
      },
      isAuthenticated: true,
    });

    http.onGet('/matieres').reply(200, [
      { id: 3, nom: 'Mathématiques' },
      { id: 7, nom: 'Physique-Chimie' },
    ]);
    http.onPut('/auth/profile').reply(200, { success: true, user: {} });

    renderPage();

    await waitFor(() => expect(screen.getByText('Physique-Chimie')).toBeInTheDocument());

    // Ajoute Physique-Chimie aux matières maîtrisées.
    fireEvent.click(screen.getByText('Physique-Chimie'));

    fireEvent.click(screen.getByRole('button', { name: /Enregistrer/i }));

    await waitFor(() => expect(http.callsTo('put', '/auth/profile')).toHaveLength(1));

    const body = http.callsTo('put', '/auth/profile')[0].body;
    expect(body.matieres_maitrisees).toEqual([3, 7]);
    expect(body.experiences[0]).toMatchObject({ id: 5, poste: 'Professeur' });
  });

  it('permet d ajouter et retirer une expérience professionnelle', async () => {
    resetAuth({
      user: {
        id: 1,
        name: 'Awa',
        prenom: '',
        role: 'enseignant',
        profil: { specialite: '', grade: '', experiences: [], matieres_maitrisees: [] },
      },
      isAuthenticated: true,
    });
    http.onGet('/matieres').reply(200, []);

    renderPage();

    fireEvent.click(screen.getByRole('button', { name: /Ajouter/i }));

    const posteInputs = document.querySelectorAll('input[placeholder="Professeur de mathématiques"]');
    expect(posteInputs).toHaveLength(1);
    fireEvent.change(posteInputs[0], { target: { value: 'Directeur des études' } });

    const etablissementInputs = document.querySelectorAll('input[placeholder="Lycée public"]');
    expect(etablissementInputs).toHaveLength(1);
    fireEvent.change(etablissementInputs[0], { target: { value: 'Collège B' } });

    fireEvent.click(screen.getByRole('button', { name: /Retirer/i }));
    await waitFor(() =>
      expect(document.querySelector('input[placeholder="Professeur de mathématiques"]')).not.toBeInTheDocument()
    );
  });
});

describe('ParametresPage — activation de la 2FA', () => {
  function goToSecurite() {
    fireEvent.click(screen.getByRole('button', { name: /Sécurité/i }));
  }

  it('propose d’activer la 2FA quand elle est désactivée, et affiche le QR après /2fa/setup', async () => {
    resetAuth({
      user: { id: 1, name: 'Kouassi', role: 'directeur', two_factor_enabled: false },
      isAuthenticated: true,
    });
    http.onPost('/auth/2fa/setup').reply(200, {
      secret: 'JBSWY3DPEHPK3PXP',
      qr_code_url: 'otpauth://totp/Ecole:kouassi?secret=JBSWY3DPEHPK3PXP&issuer=Ecole',
    });

    renderPage();
    goToSecurite();

    expect(await screen.findByText('Désactivée')).toBeInTheDocument();
    fireEvent.click(screen.getByRole('button', { name: /Activer la 2FA/i }));

    await waitFor(() => expect(http.callsTo('post', '/auth/2fa/setup')).toHaveLength(1));
    expect(await screen.findByText(/Code de confirmation/i)).toBeInTheDocument();
  });

  it('active la 2FA sur un code valide et met à jour le badge de statut', async () => {
    resetAuth({
      user: { id: 1, name: 'Kouassi', role: 'directeur', two_factor_enabled: false },
      isAuthenticated: true,
    });
    http.onPost('/auth/2fa/setup').reply(200, {
      secret: 'JBSWY3DPEHPK3PXP',
      qr_code_url: 'otpauth://totp/Ecole:kouassi?secret=JBSWY3DPEHPK3PXP&issuer=Ecole',
    });
    http.onPost('/auth/2fa/verify').reply(200, { message: '2FA activée avec succès' });

    renderPage();
    goToSecurite();
    fireEvent.click(screen.getByRole('button', { name: /Activer la 2FA/i }));
    await screen.findByText(/Code de confirmation/i);

    fireEvent.change(screen.getByPlaceholderText('000000'), { target: { value: '654321' } });
    fireEvent.click(screen.getByRole('button', { name: /Confirmer/i }));

    await waitFor(() => expect(http.callsTo('post', '/auth/2fa/verify')[0].body).toEqual({ code: '654321' }));
    expect(await screen.findByText('Activée')).toBeInTheDocument();
    expect(useAuthStore.getState().user.two_factor_enabled).toBe(true);
  });

  it('propose de désactiver la 2FA quand elle est activée, et le fait sur un code valide', async () => {
    resetAuth({
      user: { id: 1, name: 'Kouassi', role: 'directeur', two_factor_enabled: true },
      isAuthenticated: true,
    });
    http.onPost('/auth/2fa/disable').reply(200, { message: '2FA désactivée' });

    renderPage();
    goToSecurite();

    expect(await screen.findByText('Activée')).toBeInTheDocument();
    fireEvent.click(screen.getByRole('button', { name: /Désactiver la 2FA/i }));

    fireEvent.change(screen.getByPlaceholderText('000000'), { target: { value: '111111' } });
    fireEvent.click(screen.getByRole('button', { name: /^Désactiver$/i }));

    await waitFor(() => expect(http.callsTo('post', '/auth/2fa/disable')[0].body).toEqual({ code: '111111' }));
    expect(await screen.findByText('Désactivée')).toBeInTheDocument();
    expect(useAuthStore.getState().user.two_factor_enabled).toBe(false);
  });

  it('affiche l’erreur du serveur sur un code invalide, sans changer le statut', async () => {
    resetAuth({
      user: { id: 1, name: 'Kouassi', role: 'directeur', two_factor_enabled: true },
      isAuthenticated: true,
    });
    http.onPost('/auth/2fa/disable').reply(422, { message: 'Code invalide' });

    renderPage();
    goToSecurite();
    fireEvent.click(screen.getByRole('button', { name: /Désactiver la 2FA/i }));

    fireEvent.change(screen.getByPlaceholderText('000000'), { target: { value: '000000' } });
    fireEvent.click(screen.getByRole('button', { name: /^Désactiver$/i }));

    await waitFor(() => expect(screen.getByText('Code invalide')).toBeInTheDocument());
    expect(useAuthStore.getState().user.two_factor_enabled).toBe(true);
  });
});

describe('ParametresPage — langue de l\'interface', () => {
  beforeEach(() => {
    localStorage.clear();
    document.documentElement.lang = 'fr';
    document.documentElement.dir = 'ltr';
  });

  // Le sélecteur « Langue » de cette section était décoratif : il ne
  // rattachait rien au provider i18n, donc choisir « English » ne changeait ni
  // le texte, ni la mémorisation du choix.
  it('change réellement la langue de toute la page', async () => {
    resetAuth({
      user: { id: 1, name: 'Kouassi', prenom: 'Jean', email: 'j@ecole.bj', role: 'directeur' },
      isAuthenticated: true,
    });

    renderRoute(<I18nProvider><ParametresPage /></I18nProvider>, { path: '/parametres', withQuery: true });

    fireEvent.click(screen.getByRole('button', { name: /Préférences/i }));
    expect(await screen.findByText('Préférences générales')).toBeInTheDocument();

    fireEvent.change(screen.getByRole('combobox', { name: 'Langue' }), { target: { value: 'en' } });

    expect(await screen.findByText('General preferences')).toBeInTheDocument();
    expect(screen.queryByText('Préférences générales')).not.toBeInTheDocument();
    expect(document.documentElement.lang).toBe('en');
    expect(localStorage.getItem('ecole-locale')).toBe('en');
  });
});
