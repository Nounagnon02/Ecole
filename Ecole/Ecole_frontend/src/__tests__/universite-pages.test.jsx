/**
 * Pages université fraîchement recâblées — Planning, Tâches, Mes Cours
 *
 * Ces trois pages affichaient jusqu'ici un écran « fonctionnalité
 * indisponible ». Elles émettent maintenant de vrais GET :
 *
 *   PlanningPage  → GET /api/universite/planning
 *   TachesPage    → GET /api/universite/devoirs
 *   MesCoursPage  → GET /api/universite/mes-cours
 *
 * Le défaut historique du projet est ici le risque principal : le
 * chargement se fait dans un `try/catch` qui ne fait que `console.error`,
 * la liste reste vide, et si `error` n'était pas rendu l'utilisateur
 * verrait « aucune donnée » alors que le serveur a refusé ou est tombé.
 * Chaque page est donc testée sur quatre états franchement distincts :
 * chargement, données, vide, erreur.
 *
 * Les charges utiles reproduisent l'enveloppe réelle des contrôleurs
 * (`{ success, data: [...], meta }`) et la forme brute des relations
 * Eloquent — c'est là que se cachent les régressions de rendu.
 */

import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { render, screen, waitFor, fireEvent } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import PlanningPage from '@/app/features/universite/PlanningPage';
import TachesPage from '@/app/features/universite/TachesPage';
import MesCoursPage from '@/app/features/universite/MesCoursPage';
import { installHttpMock } from './helpers/http-mock';

let http;

beforeEach(() => {
  http = installHttpMock();
  // logger.error/console.error : neutralisés pour ne pas polluer la sortie,
  // sans masquer les assertions.
  vi.spyOn(console, 'error').mockImplementation(() => {});
});

afterEach(() => {
  http.restore();
  vi.restoreAllMocks();
});

function renderPage(element) {
  return render(<MemoryRouter>{element}</MemoryRouter>);
}

/** Le spinner d'attente : `<Loader2 className="… animate-spin" />`. */
function spinner(container) {
  return container.querySelector('.animate-spin');
}

/**
 * La carte de statistique portant ce libellé.
 *
 * `StatsCard` rend `<div><div><p>{title}</p>…</div><div><span>{value}</span>…</div></div>` :
 * deux niveaux au-dessus du libellé, on tient la carte entière, valeur incluse.
 */
function statCard(title) {
  return screen.getByText(title).parentElement.parentElement;
}

/* ══════════════════════════════════════════════════════════════════════
 *  PlanningPage — GET /universite/planning
 * ═══════════════════════════════════════════════════════════════════ */
describe('PlanningPage', () => {
  const PATH = '/universite/planning';

  /** Forme réelle d'une ligne de `emplois_du_temps` avec ses relations. */
  const SEANCE = {
    id: 11,
    titre: 'Algèbre linéaire — CM1',
    type: 'cours',
    date: '2026-09-14',
    heure_debut: '08:00',
    heure_fin: '10:00',
    salle: 'Amphi B',
    statut: 'planifie',
    // `enseignant` arrive comme relation, pas comme chaîne.
    enseignant: { id: 3, nom: 'Kponou', prenom: 'Jean' },
    matiere: { id: 5, code: 'MTH101', intitule: 'Algèbre linéaire' },
    filiere: { id: 2, nom: 'Informatique' },
  };

  const envelope = (items) => ({
    success: true,
    data: items,
    meta: { total: items.length, page: 1, per_page: 50 },
  });

  it('appelle bien /universite/planning', async () => {
    http.onGet(PATH).reply(200, envelope([SEANCE]));

    renderPage(<PlanningPage />);

    await waitFor(() => expect(screen.getByText(SEANCE.titre)).toBeInTheDocument());
    expect(http.callsTo('get', PATH)).toHaveLength(1);
  });

  it('affiche les séances de l’enveloppe { success, data, meta }', async () => {
    http.onGet(PATH).reply(200, envelope([SEANCE]));

    renderPage(<PlanningPage />);

    await waitFor(() => expect(screen.getByText('Algèbre linéaire — CM1')).toBeInTheDocument());
    expect(screen.getByText('08:00 - 10:00')).toBeInTheDocument();
    expect(screen.getByText('Amphi B')).toBeInTheDocument();
    // La relation `enseignant` doit être aplatie en « prénom nom ».
    expect(screen.getByText('Jean Kponou')).toBeInTheDocument();
    expect(screen.queryByText('Aucun événement trouvé')).not.toBeInTheDocument();
  });

  it('accepte aussi un tableau nu', async () => {
    http.onGet(PATH).reply(200, [SEANCE]);

    renderPage(<PlanningPage />);

    await waitFor(() => expect(screen.getByText(SEANCE.titre)).toBeInTheDocument());
  });

  it('rend la relation `enseignant` sans planter la page', async () => {
    // Rendre l'objet tel quel lèverait « Objects are not valid as a React
    // child » et blanchirait toute la page : on vérifie que le reste de la
    // carte est bien là, preuve que le rendu est allé au bout.
    http.onGet(PATH).reply(200, envelope([SEANCE]));

    renderPage(<PlanningPage />);

    await waitFor(() => expect(screen.getByText('Jean Kponou')).toBeInTheDocument());
    expect(screen.getByText('Planning')).toBeInTheDocument();
    expect(screen.getByText('Amphi B')).toBeInTheDocument();
  });

  it('comble les champs absents par des valeurs affichables', async () => {
    // Le serveur peut renvoyer une séance sans lieu ni intervenant : la page
    // doit afficher un tiret, pas « undefined » ni une carte cassée.
    http.onGet(PATH).reply(200, envelope([{ id: 12, date: '2026-09-15' }]));

    const { container } = renderPage(<PlanningPage />);

    await waitFor(() => expect(spinner(container)).toBeNull());
    // « Événement » est aussi un libellé de filtre et un libellé de type :
    // seul le titre de la carte porte `font-semibold`.
    const titres = screen
      .getAllByText('Événement')
      .filter((el) => String(el.className).includes('font-semibold'));
    expect(titres).toHaveLength(1);
    expect(screen.getByText('08:00 - 10:00')).toBeInTheDocument();
    expect(screen.getAllByText('—').length).toBeGreaterThanOrEqual(2);
    expect(screen.queryByText(/undefined/)).not.toBeInTheDocument();
  });

  it('compte les séances dans les cartes de statistiques', async () => {
    http.onGet(PATH).reply(200, envelope([
      SEANCE,
      { ...SEANCE, id: 12, titre: 'TP Réseaux', type: 'tp', statut: 'termine' },
    ]));

    renderPage(<PlanningPage />);

    await waitFor(() => expect(screen.getByText('TP Réseaux')).toBeInTheDocument());
    expect(statCard('Total').textContent).toContain('2');
    expect(statCard('Terminés').textContent).toContain('1');
    expect(statCard('Planifiés').textContent).toContain('1');
  });

  it('affiche l’état vide, distinct d’une erreur', async () => {
    http.onGet(PATH).reply(200, envelope([]));

    renderPage(<PlanningPage />);

    await waitFor(() => expect(screen.getByText('Aucun événement trouvé')).toBeInTheDocument());
    // L'état vide ne doit emporter aucun signal d'échec.
    expect(screen.getByText('Planning')).toBeInTheDocument();
    expect(screen.queryByText(/Erreur|Session expirée|interdit/i)).not.toBeInTheDocument();
  });

  it.each([
    [401, 'Session expirée.'],
    [403, 'Action non autorisée.'],
    [500, 'Erreur interne du serveur.'],
  ])('sur %i, rend le message d’erreur et jamais une liste vide', async (status, message) => {
    http.onGet(PATH).reply(status, { message });

    renderPage(<PlanningPage />);

    await waitFor(() => expect(screen.getByText(message)).toBeInTheDocument());
    // Le cœur du test : « le serveur a refusé » ne doit pas se déguiser en
    // « il n'y a rien au planning ».
    expect(screen.queryByText('Aucun événement trouvé')).not.toBeInTheDocument();
    expect(screen.queryByText(SEANCE.titre)).not.toBeInTheDocument();
  });

  it('sur panne réseau, rend le message d’erreur', async () => {
    http.onGet(PATH).networkError('Network Error');

    renderPage(<PlanningPage />);

    await waitFor(() => expect(screen.getByText('Network Error')).toBeInTheDocument());
    expect(screen.queryByText('Aucun événement trouvé')).not.toBeInTheDocument();
  });

  it('affiche un indicateur de chargement avant la réponse', async () => {
    http.onGet(PATH).reply(200, envelope([SEANCE]));

    const { container } = renderPage(<PlanningPage />);

    // Pendant l'attente : ni données, ni « aucun événement ».
    expect(spinner(container)).not.toBeNull();
    expect(screen.queryByText('Aucun événement trouvé')).not.toBeInTheDocument();

    await waitFor(() => expect(screen.getByText(SEANCE.titre)).toBeInTheDocument());
    expect(spinner(container)).toBeNull();
  });

  it('filtre par recherche et par type sans perdre les données', async () => {
    http.onGet(PATH).reply(200, envelope([
      SEANCE,
      { ...SEANCE, id: 12, titre: 'TP Réseaux', type: 'tp' },
    ]));

    renderPage(<PlanningPage />);
    await waitFor(() => expect(screen.getByText('TP Réseaux')).toBeInTheDocument());

    fireEvent.change(screen.getByPlaceholderText(/Rechercher un événement/i), {
      target: { value: 'Algèbre' },
    });
    await waitFor(() => expect(screen.queryByText('TP Réseaux')).not.toBeInTheDocument());
    expect(screen.getByText(SEANCE.titre)).toBeInTheDocument();

    fireEvent.change(screen.getByPlaceholderText(/Rechercher un événement/i), {
      target: { value: '' },
    });
    await waitFor(() => expect(screen.getByText('TP Réseaux')).toBeInTheDocument());

    // Le bouton « TP » du filtre de types.
    fireEvent.click(screen.getByRole('button', { name: 'TP' }));
    await waitFor(() => expect(screen.queryByText(SEANCE.titre)).not.toBeInTheDocument());
    expect(screen.getByText('TP Réseaux')).toBeInTheDocument();
  });
});

/* ══════════════════════════════════════════════════════════════════════
 *  TachesPage — GET /universite/devoirs
 * ═══════════════════════════════════════════════════════════════════ */
describe('TachesPage', () => {
  const PATH = '/universite/devoirs';

  /** Forme réelle renvoyée par `DevoirController::present()`. */
  const DEVOIR = {
    id: 21,
    titre: 'Projet compilateur',
    description: 'Rendre le lexer et le parser',
    type: 'projet',
    priorite: 'haute',
    statut: 'en_cours',
    date_limite: '2026-12-01T23:59:00+01:00',
    publie: true,
    matiere_id: 5,
    // `cours` est un objet, pas une chaîne : la page doit lire `.intitule`.
    cours: { id: 5, code: 'INF301', intitule: 'Compilation' },
    soumissions: 4,
    total_etudiants: 30,
    ma_soumission: null,
  };

  const envelope = (items) => ({
    success: true,
    data: items,
    meta: { total: items.length, page: 1, per_page: 20 },
  });

  it('appelle bien /universite/devoirs — et non /universite/taches', async () => {
    http.onGet(PATH).reply(200, envelope([DEVOIR]));

    renderPage(<TachesPage />);

    await waitFor(() => expect(screen.getByText(DEVOIR.titre)).toBeInTheDocument());
    expect(http.callsTo('get', PATH)).toHaveLength(1);
    expect(http.callsTo('get', '/universite/taches')).toHaveLength(0);
  });

  it('affiche les devoirs, leur cours et leurs soumissions', async () => {
    http.onGet(PATH).reply(200, envelope([DEVOIR]));

    renderPage(<TachesPage />);

    await waitFor(() => expect(screen.getByText('Projet compilateur')).toBeInTheDocument());
    // `cours` aplati depuis la relation.
    expect(screen.getByText('Compilation')).toBeInTheDocument();
    expect(screen.getByText('4/30 soumissions')).toBeInTheDocument();
    expect(screen.getByText('Haute')).toBeInTheDocument();
    expect(screen.queryByText('Aucune tâche trouvée')).not.toBeInTheDocument();
  });

  it('accepte aussi un tableau nu', async () => {
    http.onGet(PATH).reply(200, [DEVOIR]);

    renderPage(<TachesPage />);

    await waitFor(() => expect(screen.getByText(DEVOIR.titre)).toBeInTheDocument());
  });

  it('rend la relation `cours` sans planter la page', async () => {
    http.onGet(PATH).reply(200, envelope([DEVOIR]));

    renderPage(<TachesPage />);

    await waitFor(() => expect(screen.getByText('Compilation')).toBeInTheDocument());
    expect(screen.getByText('Tâches')).toBeInTheDocument();
    expect(screen.getByText('4/30 soumissions')).toBeInTheDocument();
  });

  it('n’affiche pas « Invalid Date » quand la date limite est absente', async () => {
    http.onGet(PATH).reply(200, envelope([{ ...DEVOIR, date_limite: null }]));

    renderPage(<TachesPage />);

    await waitFor(() => expect(screen.getByText(DEVOIR.titre)).toBeInTheDocument());
    expect(screen.getByText('—')).toBeInTheDocument();
    expect(screen.queryByText(/Invalid Date|NaN/)).not.toBeInTheDocument();
  });

  it('compte les tâches dans les cartes de statistiques', async () => {
    http.onGet(PATH).reply(200, envelope([
      DEVOIR,
      { ...DEVOIR, id: 22, titre: 'Exposé UML', statut: 'termine', priorite: 'basse' },
    ]));

    renderPage(<TachesPage />);

    await waitFor(() => expect(screen.getByText('Exposé UML')).toBeInTheDocument());
    expect(statCard('Total').textContent).toContain('2');
    expect(statCard('Terminées').textContent).toContain('1');
    expect(statCard('Urgentes').textContent).toContain('1');
  });

  it('affiche l’état vide, distinct d’une erreur', async () => {
    // Réponse réelle de `emptyPage()` : 200, data vide, message explicatif.
    http.onGet(PATH).reply(200, {
      success: true,
      message: 'Aucun profil étudiant n’est rattaché à ce compte.',
      data: [],
      meta: { total: 0, page: 1, per_page: 0 },
    });

    renderPage(<TachesPage />);

    await waitFor(() => expect(screen.getByText('Aucune tâche trouvée')).toBeInTheDocument());
    expect(screen.getByText('Tâches')).toBeInTheDocument();
  });

  it.each([
    [401, 'Session expirée.'],
    [403, 'Action non autorisée.'],
    [500, 'Erreur interne du serveur.'],
  ])('sur %i, rend le message d’erreur et jamais une liste vide', async (status, message) => {
    http.onGet(PATH).reply(status, { message });

    renderPage(<TachesPage />);

    await waitFor(() => expect(screen.getByText(message)).toBeInTheDocument());
    expect(screen.queryByText('Aucune tâche trouvée')).not.toBeInTheDocument();
    expect(screen.queryByText(DEVOIR.titre)).not.toBeInTheDocument();
  });

  it('sur panne réseau, rend le message d’erreur', async () => {
    http.onGet(PATH).networkError('Network Error');

    renderPage(<TachesPage />);

    await waitFor(() => expect(screen.getByText('Network Error')).toBeInTheDocument());
    expect(screen.queryByText('Aucune tâche trouvée')).not.toBeInTheDocument();
  });

  it('affiche un indicateur de chargement avant la réponse', async () => {
    http.onGet(PATH).reply(200, envelope([DEVOIR]));

    const { container } = renderPage(<TachesPage />);

    expect(spinner(container)).not.toBeNull();
    expect(screen.queryByText('Aucune tâche trouvée')).not.toBeInTheDocument();

    await waitFor(() => expect(screen.getByText(DEVOIR.titre)).toBeInTheDocument());
    expect(spinner(container)).toBeNull();
  });

  it('filtre par statut avec la valeur ASCII du serveur', async () => {
    // `a_faire` sans accent : le filtre compare la valeur telle quelle au
    // `statut` du serveur, qui stocke la forme ASCII.
    http.onGet(PATH).reply(200, envelope([
      DEVOIR,
      { ...DEVOIR, id: 22, titre: 'Exposé UML', statut: 'a_faire' },
    ]));

    renderPage(<TachesPage />);
    await waitFor(() => expect(screen.getByText('Exposé UML')).toBeInTheDocument());

    fireEvent.change(screen.getByDisplayValue('Tous les statuts'), { target: { value: 'a_faire' } });

    await waitFor(() => expect(screen.queryByText('Projet compilateur')).not.toBeInTheDocument());
    expect(screen.getByText('Exposé UML')).toBeInTheDocument();
  });

  it('filtre par recherche sur le titre et sur le cours', async () => {
    http.onGet(PATH).reply(200, envelope([
      DEVOIR,
      {
        ...DEVOIR,
        id: 22,
        titre: 'Exposé UML',
        cours: { id: 6, code: 'INF302', intitule: 'Génie logiciel' },
      },
    ]));

    renderPage(<TachesPage />);
    await waitFor(() => expect(screen.getByText('Exposé UML')).toBeInTheDocument());

    fireEvent.change(screen.getByPlaceholderText(/Rechercher une tâche/i), {
      target: { value: 'Génie' },
    });

    await waitFor(() => expect(screen.queryByText('Projet compilateur')).not.toBeInTheDocument());
    expect(screen.getByText('Exposé UML')).toBeInTheDocument();
  });
});

/* ══════════════════════════════════════════════════════════════════════
 *  MesCoursPage — GET /universite/mes-cours
 * ═══════════════════════════════════════════════════════════════════ */
describe('MesCoursPage', () => {
  const PATH = '/universite/mes-cours';

  /** Forme réelle renvoyée par `MyCoursesController::present()`. */
  const COURS = {
    id: 5,
    code: 'INF301',
    intitule: 'Compilation',
    credit: 6,
    semestre: 'S5',
    filiere: 'Informatique',
    enseignant: 'Jean Kponou',
    horaire: '08:00 - 10:00',
    salle: 'Amphi B',
    etudiants: 42,
    progression: 60,
    prochain_cours: '2026-09-14',
    statut: 'en_cours',
    seances: 10,
    seances_faites: 6,
  };

  const envelope = (items) => ({
    success: true,
    data: items,
    meta: { profil: 'enseignant', etudiant_id: null, total: items.length },
  });

  it('appelle bien /universite/mes-cours', async () => {
    http.onGet(PATH).reply(200, envelope([COURS]));

    renderPage(<MesCoursPage />);

    await waitFor(() => expect(screen.getByText('Compilation')).toBeInTheDocument());
    expect(http.callsTo('get', PATH)).toHaveLength(1);
  });

  it('affiche les cours, leur salle, leur effectif et leur progression', async () => {
    http.onGet(PATH).reply(200, envelope([COURS]));

    renderPage(<MesCoursPage />);

    await waitFor(() => expect(screen.getByText('Compilation')).toBeInTheDocument());
    expect(screen.getByText('INF301')).toBeInTheDocument();
    expect(screen.getByText('Amphi B')).toBeInTheDocument();
    expect(screen.getByText('42 étudiants')).toBeInTheDocument();
    expect(screen.getByText('60%')).toBeInTheDocument();
    // `prochain_cours` doit être repris sous `prochainCours`.
    expect(screen.getByText(/Prochain : 2026-09-14/)).toBeInTheDocument();
    expect(screen.queryByText('Aucun cours trouvé')).not.toBeInTheDocument();
  });

  it('accepte aussi un tableau nu', async () => {
    http.onGet(PATH).reply(200, [COURS]);

    renderPage(<MesCoursPage />);

    await waitFor(() => expect(screen.getByText('Compilation')).toBeInTheDocument());
  });

  it('affiche 0% quand la progression est absente, sans « undefined% »', async () => {
    http.onGet(PATH).reply(200, envelope([{ id: 6, code: 'MTH101', intitule: 'Algèbre' }]));

    renderPage(<MesCoursPage />);

    await waitFor(() => expect(screen.getByText('Algèbre')).toBeInTheDocument());
    expect(screen.getByText('0%')).toBeInTheDocument();
    expect(screen.queryByText(/undefined/)).not.toBeInTheDocument();
  });

  it('agrège les effectifs dans les cartes de statistiques', async () => {
    http.onGet(PATH).reply(200, envelope([
      COURS,
      { ...COURS, id: 6, code: 'MTH101', intitule: 'Algèbre', etudiants: 8, statut: 'termine' },
    ]));

    renderPage(<MesCoursPage />);

    await waitFor(() => expect(screen.getByText('Algèbre')).toBeInTheDocument());
    expect(statCard('Total').textContent).toContain('2');
    expect(statCard('Étudiants').textContent).toContain('50');
    expect(statCard('Terminés').textContent).toContain('1');
  });

  it('affiche l’état vide, distinct d’une erreur', async () => {
    http.onGet(PATH).reply(200, envelope([]));

    renderPage(<MesCoursPage />);

    await waitFor(() => expect(screen.getByText('Aucun cours trouvé')).toBeInTheDocument());
    expect(screen.getByText('Mes Cours')).toBeInTheDocument();
  });

  it('rend le 404 « aucun profil universitaire » comme une erreur, pas comme un vide', async () => {
    // Réponse réelle quand le compte n'a ni `etudiant` ni
    // `enseignantUniversite` : c'est un état à expliquer, pas une liste vide.
    http.onGet(PATH).reply(404, {
      success: false,
      message: 'Aucun profil universitaire n’est rattaché à ce compte.',
    });

    renderPage(<MesCoursPage />);

    await waitFor(() =>
      expect(screen.getByText('Aucun profil universitaire n’est rattaché à ce compte.')).toBeInTheDocument()
    );
    expect(screen.queryByText('Aucun cours trouvé')).not.toBeInTheDocument();
  });

  it.each([
    [401, 'Session expirée.'],
    [403, 'Action non autorisée.'],
    [500, 'Erreur interne du serveur.'],
  ])('sur %i, rend le message d’erreur et jamais une liste vide', async (status, message) => {
    http.onGet(PATH).reply(status, { message });

    renderPage(<MesCoursPage />);

    await waitFor(() => expect(screen.getByText(message)).toBeInTheDocument());
    expect(screen.queryByText('Aucun cours trouvé')).not.toBeInTheDocument();
    expect(screen.queryByText('Compilation')).not.toBeInTheDocument();
  });

  it('sur panne réseau, rend le message d’erreur', async () => {
    http.onGet(PATH).networkError('Network Error');

    renderPage(<MesCoursPage />);

    await waitFor(() => expect(screen.getByText('Network Error')).toBeInTheDocument());
    expect(screen.queryByText('Aucun cours trouvé')).not.toBeInTheDocument();
  });

  it('affiche un indicateur de chargement avant la réponse', async () => {
    http.onGet(PATH).reply(200, envelope([COURS]));

    const { container } = renderPage(<MesCoursPage />);

    expect(spinner(container)).not.toBeNull();
    expect(screen.queryByText('Aucun cours trouvé')).not.toBeInTheDocument();

    await waitFor(() => expect(screen.getByText('Compilation')).toBeInTheDocument());
    expect(spinner(container)).toBeNull();
  });

  it('filtre par intitulé et par code', async () => {
    http.onGet(PATH).reply(200, envelope([
      COURS,
      { ...COURS, id: 6, code: 'MTH101', intitule: 'Algèbre' },
    ]));

    renderPage(<MesCoursPage />);
    await waitFor(() => expect(screen.getByText('Algèbre')).toBeInTheDocument());

    fireEvent.change(screen.getByPlaceholderText(/Rechercher un cours/i), {
      target: { value: 'MTH' },
    });

    await waitFor(() => expect(screen.queryByText('Compilation')).not.toBeInTheDocument());
    expect(screen.getByText('Algèbre')).toBeInTheDocument();
  });
});
