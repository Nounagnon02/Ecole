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
  return renderRoute(<ParametresPage />, { path: '/parametres' });
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
