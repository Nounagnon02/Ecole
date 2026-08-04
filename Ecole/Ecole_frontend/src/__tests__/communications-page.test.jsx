/**
 * CommunicationsPage — le tableau d'affichage de l'établissement
 *
 * Page fraîchement recâblée sur `GET/POST /api/communications`. Deux
 * risques distincts sont couverts ici.
 *
 * En lecture, celui qui a déjà frappé ce projet : le chargement est dans
 * un `try/catch` qui ne fait que `console.error`. Si l'échec n'était pas
 * rendu, un 403 ou un 500 se présenterait comme « aucune communication »
 * — et le lecteur conclurait à tort qu'il n'y a rien à lire.
 *
 * En écriture, celui propre à une page qui lit *et* écrit : un refus de
 * validation ne doit pas emporter le fil déjà affiché. Un champ mal
 * rempli doit produire un message sur le champ, pas faire disparaître
 * les annonces.
 */

import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { render, screen, waitFor, fireEvent } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import CommunicationsPage from '@/app/features/communications/CommunicationsPage';
import { installHttpMock } from './helpers/http-mock';

const PATH = '/communications';

/** Forme réelle d'une ligne de `communications` avec ses relations chargées. */
const ANNONCE = {
  id: 1,
  titre: 'Rentrée 2026',
  contenu: 'Les cours reprennent le 15 septembre.',
  categorie: 'info',
  audience: 'ecole',
  epingle: false,
  tags: ['rentrée', 'calendrier'],
  publie_le: '2026-08-01T08:00:00+01:00',
  // `auteur` est la relation `auteur:id,name,prenom,role` : la colonne
  // d'identité de `users` est `name`, pas `nom`.
  auteur: { id: 7, name: 'Adjovi', prenom: 'Rose', role: 'secretaire' },
  classe: null,
};

const envelope = (items) => ({
  success: true,
  data: items,
  meta: { total: items.length, page: 1, per_page: 20 },
});

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
  return render(
    <MemoryRouter>
      <CommunicationsPage />
    </MemoryRouter>
  );
}

/** Ouvre le formulaire de rédaction et rend le `<form>`. */
async function openForm() {
  fireEvent.click(screen.getByRole('button', { name: /Nouvelle Publication/i }));
  return screen.getByRole('form', { name: 'Nouvelle publication' });
}

/* ══════════════════════════════════════════════════════════════════════
 *  Lecture — GET /communications
 * ═══════════════════════════════════════════════════════════════════ */
describe('CommunicationsPage — lecture', () => {
  it('appelle bien /communications', async () => {
    http.onGet(PATH).reply(200, envelope([ANNONCE]));

    renderPage();

    await waitFor(() => expect(screen.getByText('Rentrée 2026')).toBeInTheDocument());
    expect(http.callsTo('get', PATH)).toHaveLength(1);
  });

  it('affiche les annonces de l’enveloppe { success, data, meta }', async () => {
    http.onGet(PATH).reply(200, envelope([ANNONCE]));

    renderPage();

    await waitFor(() => expect(screen.getByText('Rentrée 2026')).toBeInTheDocument());
    expect(screen.getByText('Les cours reprennent le 15 septembre.')).toBeInTheDocument();
    expect(screen.getByText('rentrée')).toBeInTheDocument();
    expect(screen.getByText('calendrier')).toBeInTheDocument();
    expect(screen.queryByText('Aucune communication trouvée')).not.toBeInTheDocument();
  });

  it('accepte aussi un tableau nu', async () => {
    http.onGet(PATH).reply(200, [ANNONCE]);

    renderPage();

    await waitFor(() => expect(screen.getByText('Rentrée 2026')).toBeInTheDocument());
  });

  it('lit l’auteur dans `auteur.name` et non dans `auteur.nom`', async () => {
    // `users` n'a pas de colonne `nom` : ne lire que `nom` retombait
    // systématiquement sur le libellé générique « Auteur ».
    http.onGet(PATH).reply(200, envelope([ANNONCE]));

    renderPage();

    await waitFor(() => expect(screen.getByText('Rose Adjovi')).toBeInTheDocument());
    expect(screen.queryByText('Auteur')).not.toBeInTheDocument();
    expect(screen.getByText('secretaire')).toBeInTheDocument();
  });

  it('supporte `tags` à null — colonne JSON nullable', async () => {
    // `.map()` sur null casserait tout le rendu de la page.
    http.onGet(PATH).reply(200, envelope([{ ...ANNONCE, tags: null }]));

    renderPage();

    await waitFor(() => expect(screen.getByText('Rentrée 2026')).toBeInTheDocument());
    expect(screen.getByText('Les cours reprennent le 15 septembre.')).toBeInTheDocument();
  });

  it('remonte les annonces épinglées en tête', async () => {
    http.onGet(PATH).reply(200, envelope([
      ANNONCE,
      { ...ANNONCE, id: 2, titre: 'Conseil de discipline', epingle: true, publie_le: '2026-07-01T08:00:00+01:00' },
    ]));

    const { container } = renderPage();

    await waitFor(() => expect(screen.getByText('Conseil de discipline')).toBeInTheDocument());
    expect(screen.getByText('Épinglé')).toBeInTheDocument();
    const titres = [...container.querySelectorAll('h3')].map((h) => h.textContent);
    expect(titres).toEqual(['Conseil de discipline', 'Rentrée 2026']);
  });

  it('affiche l’état vide, distinct d’une erreur', async () => {
    http.onGet(PATH).reply(200, envelope([]));

    renderPage();

    await waitFor(() => expect(screen.getByText('Aucune communication trouvée')).toBeInTheDocument());
    // Un fil vide reste un fil : l'en-tête et les filtres sont là, et
    // aucun bouton de reprise n'est proposé.
    expect(screen.getByText('Communications')).toBeInTheDocument();
    expect(screen.queryByRole('button', { name: 'Réessayer' })).not.toBeInTheDocument();
  });

  it.each([
    [401, 'Session expirée.'],
    [403, 'Action non autorisée.'],
    [500, 'Erreur interne du serveur.'],
  ])('sur %i, rend le message d’erreur et jamais un fil vide', async (status, message) => {
    http.onGet(PATH).reply(status, { message });

    renderPage();

    await waitFor(() => expect(screen.getByText(message)).toBeInTheDocument());
    expect(screen.getByRole('button', { name: 'Réessayer' })).toBeInTheDocument();
    // Le cœur du test : « le serveur a refusé » ne doit pas se déguiser en
    // « il n'y a aucune communication ».
    expect(screen.queryByText('Aucune communication trouvée')).not.toBeInTheDocument();
    expect(screen.queryByText('Rentrée 2026')).not.toBeInTheDocument();
  });

  it('sur panne réseau, rend le message d’erreur', async () => {
    http.onGet(PATH).networkError('Network Error');

    renderPage();

    await waitFor(() => expect(screen.getByText('Network Error')).toBeInTheDocument());
    expect(screen.queryByText('Aucune communication trouvée')).not.toBeInTheDocument();
  });

  it('affiche un indicateur de chargement avant la réponse', async () => {
    http.onGet(PATH).reply(200, envelope([ANNONCE]));

    const { container } = renderPage();

    expect(container.querySelector('.animate-spin')).not.toBeNull();
    expect(screen.queryByText('Aucune communication trouvée')).not.toBeInTheDocument();

    await waitFor(() => expect(screen.getByText('Rentrée 2026')).toBeInTheDocument());
    expect(container.querySelector('.animate-spin')).toBeNull();
  });

  it('filtre par catégorie', async () => {
    http.onGet(PATH).reply(200, envelope([
      ANNONCE,
      { ...ANNONCE, id: 2, titre: 'Kermesse', categorie: 'event' },
    ]));

    renderPage();
    await waitFor(() => expect(screen.getByText('Kermesse')).toBeInTheDocument());

    fireEvent.click(screen.getByRole('button', { name: 'Événements' }));

    await waitFor(() => expect(screen.queryByText('Rentrée 2026')).not.toBeInTheDocument());
    expect(screen.getByText('Kermesse')).toBeInTheDocument();

    fireEvent.click(screen.getByRole('button', { name: 'Tout' }));
    await waitFor(() => expect(screen.getByText('Rentrée 2026')).toBeInTheDocument());
  });
});

/* ══════════════════════════════════════════════════════════════════════
 *  Écriture — POST /communications
 * ═══════════════════════════════════════════════════════════════════ */
describe('CommunicationsPage — écriture', () => {
  beforeEach(() => {
    http.onGet(PATH).reply(200, envelope([ANNONCE]));
  });

  async function readyWithForm() {
    renderPage();
    await waitFor(() => expect(screen.getByText('Rentrée 2026')).toBeInTheDocument());
    return openForm();
  }

  it('n’ouvre le formulaire que sur demande', async () => {
    renderPage();
    await waitFor(() => expect(screen.getByText('Rentrée 2026')).toBeInTheDocument());

    expect(screen.queryByRole('form', { name: 'Nouvelle publication' })).not.toBeInTheDocument();

    await openForm();
    expect(screen.getByRole('form', { name: 'Nouvelle publication' })).toBeInTheDocument();

    fireEvent.click(screen.getByRole('button', { name: 'Annuler' }));
    expect(screen.queryByRole('form', { name: 'Nouvelle publication' })).not.toBeInTheDocument();
  });

  it('envoie exactement titre, contenu et catégorie en POST', async () => {
    http.onPost(PATH).reply(201, {
      success: true,
      message: 'Communication publiée',
      data: {
        id: 9,
        titre: 'Réunion parents',
        contenu: 'Samedi à 9h en salle polyvalente.',
        categorie: 'event',
        epingle: false,
        tags: [],
        publie_le: '2026-08-04T10:00:00+01:00',
        auteur: { id: 7, name: 'Adjovi', prenom: 'Rose', role: 'secretaire' },
      },
    });

    await readyWithForm();

    fireEvent.change(screen.getByLabelText('Titre'), { target: { value: 'Réunion parents' } });
    fireEvent.change(screen.getByLabelText('Contenu'), {
      target: { value: 'Samedi à 9h en salle polyvalente.' },
    });
    fireEvent.change(screen.getByLabelText('Catégorie'), { target: { value: 'event' } });
    fireEvent.click(screen.getByRole('button', { name: /Publier/i }));

    await waitFor(() => expect(http.callsTo('post', PATH)).toHaveLength(1));
    expect(http.callsTo('post', PATH)[0].body).toEqual({
      titre: 'Réunion parents',
      contenu: 'Samedi à 9h en salle polyvalente.',
      categorie: 'event',
    });
  });

  it('insère l’annonce créée dans le fil et referme le formulaire', async () => {
    http.onPost(PATH).reply(201, {
      success: true,
      data: {
        id: 9,
        titre: 'Réunion parents',
        contenu: 'Samedi à 9h.',
        categorie: 'event',
        tags: null,
        publie_le: '2026-08-04T10:00:00+01:00',
        auteur: { id: 7, name: 'Adjovi', prenom: 'Rose', role: 'secretaire' },
      },
    });

    await readyWithForm();

    fireEvent.change(screen.getByLabelText('Titre'), { target: { value: 'Réunion parents' } });
    fireEvent.change(screen.getByLabelText('Contenu'), { target: { value: 'Samedi à 9h.' } });
    fireEvent.click(screen.getByRole('button', { name: /Publier/i }));

    await waitFor(() => expect(screen.getByText('Réunion parents')).toBeInTheDocument());
    // La nouvelle annonce est rendue comme les autres — auteur aplati inclus.
    expect(screen.getByText('Samedi à 9h.')).toBeInTheDocument();
    expect(screen.getAllByText('Rose Adjovi').length).toBe(2);
    // Le fil déjà chargé reste en place.
    expect(screen.getByText('Rentrée 2026')).toBeInTheDocument();
    expect(screen.queryByRole('form', { name: 'Nouvelle publication' })).not.toBeInTheDocument();
  });

  it('rend les erreurs de validation 422 champ par champ, sans perdre le fil', async () => {
    // Réponse réelle de `$request->validate()` : 422 + { message, errors }.
    http.onPost(PATH).reply(422, {
      message: 'Le champ titre est obligatoire. (et 1 autre erreur)',
      errors: {
        titre: ['Le champ titre est obligatoire.'],
        contenu: ['Le champ contenu est obligatoire.'],
      },
    });

    await readyWithForm();

    fireEvent.click(screen.getByRole('button', { name: /Publier/i }));

    await waitFor(() =>
      expect(screen.getByText('Le champ titre est obligatoire.')).toBeInTheDocument()
    );
    expect(screen.getByText('Le champ contenu est obligatoire.')).toBeInTheDocument();
    // Le message général de l'échec est là aussi.
    expect(screen.getByText(/et 1 autre erreur/)).toBeInTheDocument();

    // Et surtout : un refus de validation ne remplace pas la page par
    // l'écran d'erreur. Le formulaire reste ouvert, le fil reste lisible.
    expect(screen.getByRole('form', { name: 'Nouvelle publication' })).toBeInTheDocument();
    expect(screen.getByText('Rentrée 2026')).toBeInTheDocument();
    expect(screen.queryByRole('button', { name: 'Réessayer' })).not.toBeInTheDocument();
  });

  it('marque le champ fautif via aria-invalid', async () => {
    http.onPost(PATH).reply(422, {
      message: 'Invalide',
      errors: { titre: ['Le champ titre est obligatoire.'] },
    });

    await readyWithForm();
    fireEvent.click(screen.getByRole('button', { name: /Publier/i }));

    await waitFor(() => expect(screen.getByLabelText('Titre')).toHaveAttribute('aria-invalid', 'true'));
    expect(screen.getByLabelText('Contenu')).not.toHaveAttribute('aria-invalid');
  });

  it('efface le message d’un champ dès qu’on le corrige', async () => {
    http.onPost(PATH).reply(422, {
      message: 'Invalide',
      errors: { titre: ['Le champ titre est obligatoire.'] },
    });

    await readyWithForm();
    fireEvent.click(screen.getByRole('button', { name: /Publier/i }));
    await waitFor(() =>
      expect(screen.getByText('Le champ titre est obligatoire.')).toBeInTheDocument()
    );

    fireEvent.change(screen.getByLabelText('Titre'), { target: { value: 'Réunion parents' } });

    expect(screen.queryByText('Le champ titre est obligatoire.')).not.toBeInTheDocument();
  });

  it.each([
    [403, 'Seule la direction peut publier une communication.'],
    [500, 'Erreur interne du serveur.'],
  ])('rend visiblement un échec %i de publication', async (status, message) => {
    // Un refus sans détail par champ : seul le message général peut alerter.
    // Sans lui, le clic sur « Publier » ne produirait rien du tout.
    http.onPost(PATH).reply(status, { message });

    await readyWithForm();
    fireEvent.click(screen.getByRole('button', { name: /Publier/i }));

    await waitFor(() => expect(screen.getByText(message)).toBeInTheDocument());
    expect(screen.getByRole('form', { name: 'Nouvelle publication' })).toBeInTheDocument();
    expect(screen.getByText('Rentrée 2026')).toBeInTheDocument();
  });

  it('rend visiblement une panne réseau à la publication', async () => {
    http.onPost(PATH).networkError('Network Error');

    await readyWithForm();
    fireEvent.click(screen.getByRole('button', { name: /Publier/i }));

    await waitFor(() => expect(screen.getByText('Network Error')).toBeInTheDocument());
    expect(screen.getByText('Rentrée 2026')).toBeInTheDocument();
  });

  it('n’ajoute rien au fil quand la publication échoue', async () => {
    http.onPost(PATH).reply(422, { message: 'Invalide', errors: { titre: ['Obligatoire.'] } });

    const { container } = renderPage();
    await waitFor(() => expect(screen.getByText('Rentrée 2026')).toBeInTheDocument());
    await openForm();

    fireEvent.change(screen.getByLabelText('Titre'), { target: { value: 'Brouillon' } });
    fireEvent.click(screen.getByRole('button', { name: /Publier/i }));

    await waitFor(() => expect(screen.getByText('Obligatoire.')).toBeInTheDocument());
    expect(container.querySelectorAll('h3')).toHaveLength(1);
  });

  it('remet le formulaire à zéro entre deux ouvertures après un échec', async () => {
    http.onPost(PATH).reply(422, { message: 'Invalide', errors: { titre: ['Obligatoire.'] } });

    await readyWithForm();
    fireEvent.click(screen.getByRole('button', { name: /Publier/i }));
    await waitFor(() => expect(screen.getByText('Obligatoire.')).toBeInTheDocument());

    fireEvent.click(screen.getByRole('button', { name: 'Annuler' }));
    await openForm();

    expect(screen.queryByText('Obligatoire.')).not.toBeInTheDocument();
    expect(screen.queryByText('Invalide')).not.toBeInTheDocument();
  });
});
