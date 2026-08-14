/**
 * AffectationsPage — la direction affecte les enseignants aux cours
 *
 * La page lit et écrit deux sources : le pivot `enseignant_matiere`
 * (secondaire, triplet classe x série x matière) et la classe des
 * enseignants Maternelle/Primaire. Les invariants protégés ici :
 *
 *  - une erreur de chargement s'affiche avec « Réessayer », jamais un état
 *    vide déguisé ;
 *  - un refus d'écriture (validation 422, matiere hors série) s'affiche
 *    sans effacer le fil des affectations déjà visibles ;
 *  - le POST envoie exactement { classe_id, serie_id, matiere_id } ;
 *  - le formulaire suit la cascade classe -> série -> matière.
 */

import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { render, screen, waitFor, fireEvent } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import AffectationsPage from '@/app/features/affectations/AffectationsPage';
import { installHttpMock } from './helpers/http-mock';

const ENSEIGNANT = {
  id: 1,
  user: { id: 11, name: 'Adjovi', prenom: 'Rose' },
  specialite: 'Physique-Chimie',
};

const CLASSE = {
  id: 1,
  nom_classe: '6e A',
  categorie_classe: 'secondaire',
  series: [
    {
      id: 10,
      nom: '6ème',
      matieres: [
        { id: 100, nom: 'Mathématiques' },
        { id: 101, nom: 'Français' },
      ],
    },
  ],
};

const AFFECTATION = {
  id: 500,
  classe: { id: 1, nom_classe: '6e A' },
  serie: { id: 10, nom: '6ème' },
  matiere: { id: 100, nom: 'Mathématiques' },
};

const MP_ENSEIGNANT = {
  id: 7,
  user: { id: 17, name: 'Dossou', prenom: 'Aline' },
  classe: { id: 3, nom_classe: 'CP', categorie_classe: 'primaire' },
};

const envelope = (items) => ({ success: true, data: items });

const CLASSE_CP = {
  id: 3,
  nom_classe: 'CP',
  categorie_classe: 'primaire',
  series: [],
};

const CLASSE_CE1 = {
  id: 4,
  nom_classe: 'CE1',
  categorie_classe: 'primaire',
  series: [],
};

let http;

beforeEach(() => {
  http = installHttpMock();
  http.onGet('/enseignants').reply(200, [ENSEIGNANT]);
  http.onGet('/classes').reply(200, [CLASSE, CLASSE_CP, CLASSE_CE1]);
  http.onGet('/enseignants-mp').reply(200, envelope([MP_ENSEIGNANT]));
  vi.spyOn(console, 'error').mockImplementation(() => {});
});

afterEach(() => {
  http.restore();
  vi.restoreAllMocks();
});

function renderPage() {
  return render(
    <MemoryRouter>
      <AffectationsPage />
    </MemoryRouter>
  );
}

/** Sélectionne l'enseignant puis attend ses affectations. */
async function selectTeacher() {
  http.onGet('/enseignants/1/affectations').reply(200, envelope([AFFECTATION]));
  renderPage();
  await waitFor(() => expect(screen.getByText('Adjovi Rose')).toBeInTheDocument());
  fireEvent.change(screen.getByLabelText('Enseignant'), { target: { value: '1' } });
  await waitFor(() => expect(screen.getByText('Mathématiques')).toBeInTheDocument());
}

/* ══════════════════════════════════════════════════════════════════════
 *  Lecture
 * ═══════════════════════════════════════════════════════════════════ */

describe('AffectationsPage — lecture', () => {
  it('charge les enseignants, les classes et le personnel M/P', async () => {
    renderPage();

    await waitFor(() => expect(screen.getByText('Adjovi Rose')).toBeInTheDocument());
    expect(http.callsTo('get', '/enseignants')).toHaveLength(1);
    expect(http.callsTo('get', '/classes')).toHaveLength(1);
    expect(http.callsTo('get', '/enseignants-mp')).toHaveLength(1);
  });

  it('affiche les affectations d’un enseignant sélectionné', async () => {
    await selectTeacher();

    expect(screen.getByText('Mathématiques')).toBeInTheDocument();
    expect(screen.getByText(/6e A · 6ème/)).toBeInTheDocument();
    expect(screen.getByText('6ème')).toBeInTheDocument();
    expect(screen.getByText(/1 affectation/)).toBeInTheDocument();
  });

  it('sur erreur de chargement, affiche l’erreur et « Réessayer »', async () => {
    http.onGet('/enseignants').reply(500, { message: 'Erreur interne du serveur.' });

    renderPage();

    await waitFor(() => expect(screen.getByText('Erreur interne du serveur.')).toBeInTheDocument());
    expect(screen.getByRole('button', { name: 'Réessayer' })).toBeInTheDocument();
    // Jamais un état vide déguisé en succès.
    expect(screen.queryByText('Aucun enseignant Maternelle / Primaire')).not.toBeInTheDocument();
  });
});

/* ══════════════════════════════════════════════════════════════════════
 *  Écriture — affectations secondaire
 * ═══════════════════════════════════════════════════════════════════ */

describe('AffectationsPage — affectation secondaire', () => {
  it('envoie le triplet { classe_id, serie_id, matiere_id } en POST', async () => {
    await selectTeacher();

    http.onPost('/enseignants/1/affectations').reply(201, envelope([AFFECTATION, {
      ...AFFECTATION,
      id: 501,
      matiere: { id: 101, nom: 'Français' },
    }]));

    fireEvent.change(screen.getByLabelText('Classe'), { target: { value: '1' } });
    fireEvent.change(screen.getByLabelText('Série'), { target: { value: '10' } });
    fireEvent.change(screen.getByLabelText('Matière'), { target: { value: '101' } });
    fireEvent.click(screen.getByRole('button', { name: /Affecter/i }));

    await waitFor(() => expect(http.callsTo('post', '/enseignants/1/affectations')).toHaveLength(1));
    expect(http.callsTo('post', '/enseignants/1/affectations')[0].body).toEqual({
      affectations: [{ classe_id: 1, serie_id: 10, matiere_id: 101 }],
    });

    // Le fil est mis à jour depuis la réponse, sans rechargement complet.
    await waitFor(() => expect(screen.getByText('Français')).toBeInTheDocument());
  });

  it('le bouton « Affecter » est inerte tant que la cascade est incomplète', async () => {
    await selectTeacher();

    const bouton = screen.getByRole('button', { name: /Affecter/i });
    expect(bouton).toBeDisabled();

    fireEvent.change(screen.getByLabelText('Classe'), { target: { value: '1' } });
    expect(bouton).toBeDisabled();

    fireEvent.change(screen.getByLabelText('Série'), { target: { value: '10' } });
    expect(bouton).toBeDisabled();

    fireEvent.change(screen.getByLabelText('Matière'), { target: { value: '100' } });
    expect(bouton).toBeEnabled();
  });

  it('un refus 422 (matière hors série) s’affiche sans perdre le fil', async () => {
    await selectTeacher();

    http.onPost('/enseignants/1/affectations').reply(422, {
      message: "La matière sélectionnée n'est pas rattachée à la série de cette classe.",
    });

    fireEvent.change(screen.getByLabelText('Classe'), { target: { value: '1' } });
    fireEvent.change(screen.getByLabelText('Série'), { target: { value: '10' } });
    fireEvent.change(screen.getByLabelText('Matière'), { target: { value: '100' } });
    fireEvent.click(screen.getByRole('button', { name: /Affecter/i }));

    await waitFor(() =>
      expect(screen.getByText(/n'est pas rattachée à la série/)).toBeInTheDocument()
    );
    // Le fil des affectations déjà chargées reste intact.
    expect(screen.getByText(/6e A · 6ème/)).toBeInTheDocument();
    expect(screen.queryByRole('button', { name: 'Réessayer' })).not.toBeInTheDocument();
  });

  it('retire une affectation via DELETE', async () => {
    await selectTeacher();

    http.onDelete('/enseignants/1/affectations/500').reply(200, envelope([]));

    fireEvent.click(screen.getByRole('button', { name: /Retirer Mathématiques/ }));

    await waitFor(() =>
      expect(http.callsTo('delete', '/enseignants/1/affectations/500')).toHaveLength(1)
    );
    await waitFor(() => expect(screen.getByText(/0 affectation/)).toBeInTheDocument());
    expect(screen.queryByText('Mathématiques')).not.toBeInTheDocument();
  });
});

/* ══════════════════════════════════════════════════════════════════════
 *  Écriture — Maternelle & Primaire
 * ═══════════════════════════════════════════════════════════════════ */

describe('AffectationsPage — Maternelle & Primaire', () => {
  async function openMpTab() {
    renderPage();
    await waitFor(() => expect(screen.getByText('Adjovi Rose')).toBeInTheDocument());
    fireEvent.click(screen.getByRole('button', { name: 'Maternelle & Primaire' }));
    await waitFor(() => expect(screen.getByText('Dossou Aline')).toBeInTheDocument());
  }

  it('liste les enseignants M/P avec leur classe actuelle', async () => {
    await openMpTab();

    expect(screen.getByText('CP')).toBeInTheDocument();
  });

  it('déplace un enseignant M/P vers une autre classe', async () => {
    await openMpTab();

    http.onPost('/enseignants-mp/7/affectation').reply(201, {
      success: true,
      data: { ...MP_ENSEIGNANT, classe: { id: 4, nom_classe: 'CE1', categorie_classe: 'primaire' } },
    });

    fireEvent.change(screen.getByLabelText(/Classe de Dossou Aline/), { target: { value: '4' } });

    await waitFor(() => expect(http.callsTo('post', '/enseignants-mp/7/affectation')).toHaveLength(1));
    expect(http.callsTo('post', '/enseignants-mp/7/affectation')[0].body).toEqual({ classe_id: 4 });
    await waitFor(() => expect(screen.getByText('CE1')).toBeInTheDocument());
  });
});
