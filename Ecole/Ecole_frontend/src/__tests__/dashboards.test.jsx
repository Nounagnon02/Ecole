/**
 * Tableaux de bord directeur et élève — rendu, chargement, vide, erreur
 *
 * Ces deux écrans sont la première chose que voit l'utilisateur après
 * la connexion. On vérifie les quatre états observables : squelette de
 * chargement, données réelles, absence de données, échec de l'API — et
 * surtout que les deux derniers ne se confondent pas.
 */

import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { render, screen, waitFor, fireEvent } from '@testing-library/react';
import { MemoryRouter, Routes, Route, useLocation } from 'react-router-dom';
import DirecteurDashboard from '@/app/dashboards/directeur';
import EleveDashboard from '@/app/dashboards/eleve';
import ParentDashboard from '@/app/dashboards/parent';
import useAuthStore from '@/shared/stores/auth-store';
import { clearDashboardCache } from '@/shared/lib/dashboard-cache';
import { installHttpMock } from './helpers/http-mock';

const DIRECTEUR_ENDPOINT = '/dashboard/directeur/data';
const ELEVE_ENDPOINT = '/dashboard/eleve';

let http;

function LocationProbe() {
  const location = useLocation();
  return <div data-testid="url">{location.pathname}</div>;
}

function renderDashboard(element) {
  return render(
    <MemoryRouter initialEntries={['/tableau']}>
      <LocationProbe />
      <Routes>
        <Route path="/tableau" element={element} />
        <Route path="*" element={<div>AUTRE-ECRAN</div>} />
      </Routes>
    </MemoryRouter>
  );
}

const DIRECTEUR_PAYLOAD = {
  stats: {
    total_eleves: 412,
    total_enseignants: 27,
    total_classes: 14,
    evolution_effectifs: [{ name: 'Sept', students: 400 }],
    repartition_notes: [{ name: '10-12', value: 120 }],
  },
  classes_effectif: [
    { id: 1, nom_classe: '6e A', effectif: 32, categorie_classe: 'secondaire' },
    { id: 2, nom_classe: 'CM2', effectif: 28, categorie_classe: 'primaire' },
  ],
};

const ELEVE_PAYLOAD = {
  eleve: { id: 3, classe: '4e B' },
  stats: { moyenne_generale: 13.5, total_notes: 18, absences_mois: 2 },
  matieres: [
    { name: 'Maths', note: 15, coeff: 4 },
    { name: 'Français', note: 9, coeff: 3 },
  ],
  emploi_du_temps: [
    { heure_debut: '08:00', heure_fin: '10:00', jour: 'Lundi', salle: 'B12', matiere: { nom: 'Maths' }, enseignant: { user: { name: 'M. Aho' } } },
  ],
};

beforeEach(() => {
  http = installHttpMock();
  clearDashboardCache();
  useAuthStore.setState({
    user: { id: 1, name: 'Test', role: 'directeur' },
    isAuthenticated: true,
    isLoading: false,
    sessionLastVerified: Date.now(),
  });
  vi.spyOn(console, 'error').mockImplementation(() => {});
});

afterEach(() => {
  http.restore();
  clearDashboardCache();
  vi.restoreAllMocks();
});

describe('DirecteurDashboard', () => {
  it('interroge l’endpoint directeur et affiche les effectifs réels', async () => {
    http.onGet(DIRECTEUR_ENDPOINT).reply(200, { data: DIRECTEUR_PAYLOAD });

    renderDashboard(<DirecteurDashboard />);

    await waitFor(() => expect(screen.getByText('412')).toBeInTheDocument());
    expect(http.callsTo('get', DIRECTEUR_ENDPOINT)).toHaveLength(1);
    expect(screen.getByText('27')).toBeInTheDocument();
    expect(screen.getByText('14')).toBeInTheDocument();
  });

  it('liste les classes retournées par l’API', async () => {
    http.onGet(DIRECTEUR_ENDPOINT).reply(200, { data: DIRECTEUR_PAYLOAD });

    renderDashboard(<DirecteurDashboard />);

    await waitFor(() => expect(screen.getByText('6e A')).toBeInTheDocument());
    expect(screen.getByText('CM2')).toBeInTheDocument();
    expect(screen.queryByText('Aucune classe')).not.toBeInTheDocument();
  });

  it('accepte aussi une réponse non enveloppée', async () => {
    http.onGet(DIRECTEUR_ENDPOINT).reply(200, DIRECTEUR_PAYLOAD);

    renderDashboard(<DirecteurDashboard />);

    await waitFor(() => expect(screen.getByText('412')).toBeInTheDocument());
  });

  it('affiche l’état vide quand l’API ne renvoie aucune classe', async () => {
    http.onGet(DIRECTEUR_ENDPOINT).reply(200, { data: { stats: {}, classes_effectif: [] } });

    renderDashboard(<DirecteurDashboard />);

    await waitFor(() => expect(screen.getByText('Aucune classe')).toBeInTheDocument());
    // Compteurs à zéro et non « — » : c'est bien une absence de données.
    expect(screen.getAllByText('0').length).toBeGreaterThan(0);
  });

  it('signale l’erreur au lieu de faire passer un 500 pour un tableau vide', async () => {
    http.onGet(DIRECTEUR_ENDPOINT).reply(500, { message: 'Erreur interne' });

    renderDashboard(<DirecteurDashboard />);

    await waitFor(() => expect(screen.getByText(/Erreur de chargement/i)).toBeInTheDocument());
  });

  it('signale aussi un 403 et une erreur réseau', async () => {
    http.onGet(DIRECTEUR_ENDPOINT).reply(403, { message: 'Action non autorisée.' });
    const first = renderDashboard(<DirecteurDashboard />);
    await waitFor(() => expect(screen.getByText(/Erreur de chargement/i)).toBeInTheDocument());
    first.unmount();

    clearDashboardCache();
    http.onGet(DIRECTEUR_ENDPOINT).networkError('Network Error');
    renderDashboard(<DirecteurDashboard />);
    await waitFor(() => expect(screen.getByText(/Erreur de chargement/i)).toBeInTheDocument());
  });

  it('relance l’appel au clic sur Actualiser, en ignorant le cache', async () => {
    http.onGet(DIRECTEUR_ENDPOINT).reply(200, { data: DIRECTEUR_PAYLOAD });

    renderDashboard(<DirecteurDashboard />);
    await waitFor(() => expect(screen.getByText('412')).toBeInTheDocument());

    http.onGet(DIRECTEUR_ENDPOINT).reply(200, {
      data: { ...DIRECTEUR_PAYLOAD, stats: { ...DIRECTEUR_PAYLOAD.stats, total_eleves: 500 } },
    });
    fireEvent.click(screen.getByRole('button', { name: /Actualiser/i }));

    await waitFor(() => expect(screen.getByText('500')).toBeInTheDocument());
    expect(http.callsTo('get', DIRECTEUR_ENDPOINT)).toHaveLength(2);
  });

  it('renvoie vers /eleves quand on clique l’onglet Élèves', async () => {
    http.onGet(DIRECTEUR_ENDPOINT).reply(200, { data: DIRECTEUR_PAYLOAD });

    renderDashboard(<DirecteurDashboard />);
    await waitFor(() => expect(screen.getByText('412')).toBeInTheDocument());

    fireEvent.click(screen.getByRole('button', { name: /Élèves/i }));

    await waitFor(() => expect(screen.getByTestId('url').textContent).toBe('/eleves'));
  });

  it('filtre les classes sur la recherche', async () => {
    http.onGet(DIRECTEUR_ENDPOINT).reply(200, { data: DIRECTEUR_PAYLOAD });

    renderDashboard(<DirecteurDashboard />);
    await waitFor(() => expect(screen.getByText('6e A')).toBeInTheDocument());

    fireEvent.change(screen.getByPlaceholderText(/Rechercher/i), { target: { value: 'CM' } });

    await waitFor(() => expect(screen.queryByText('6e A')).not.toBeInTheDocument());
    expect(screen.getByText('CM2')).toBeInTheDocument();
  });
});

describe('EleveDashboard', () => {
  it('affiche moyenne, notes et absences depuis l’API', async () => {
    http.onGet(ELEVE_ENDPOINT).reply(200, { data: ELEVE_PAYLOAD });

    renderDashboard(<EleveDashboard />);

    await waitFor(() => expect(screen.getByText('13.5/20')).toBeInTheDocument());
    expect(screen.getByText('18')).toBeInTheDocument();
    expect(screen.getByText('2')).toBeInTheDocument();
    expect(screen.getByText(/Classe de 4e B/)).toBeInTheDocument();
  });

  it('affiche les prochains cours', async () => {
    http.onGet(ELEVE_ENDPOINT).reply(200, { data: ELEVE_PAYLOAD });

    renderDashboard(<EleveDashboard />);

    await waitFor(() => expect(screen.getByText('Maths')).toBeInTheDocument());
    expect(screen.getByText('08:00')).toBeInTheDocument();
    expect(screen.queryByText('Aucun cours planifié')).not.toBeInTheDocument();
  });

  it('affiche l’état vide de l’emploi du temps', async () => {
    http.onGet(ELEVE_ENDPOINT).reply(200, {
      data: { eleve: {}, stats: {}, matieres: [], emploi_du_temps: [] },
    });

    renderDashboard(<EleveDashboard />);

    await waitFor(() => expect(screen.getByText('Aucun cours planifié')).toBeInTheDocument());
    // Pas de moyenne connue → tiret, jamais 0/20.
    expect(screen.getByText('—')).toBeInTheDocument();
  });

  it('affiche « Aucune note disponible » dans l’onglet Notes quand la liste est vide', async () => {
    http.onGet(ELEVE_ENDPOINT).reply(200, {
      data: { eleve: {}, stats: {}, matieres: [], emploi_du_temps: [] },
    });

    renderDashboard(<EleveDashboard />);
    await waitFor(() => expect(screen.getByText('Aucun cours planifié')).toBeInTheDocument());

    fireEvent.click(screen.getByRole('button', { name: /Mes Notes/i }));

    await waitFor(() => expect(screen.getByText('Aucune note disponible')).toBeInTheDocument());
  });

  it('affiche les notes par matière dans l’onglet Notes', async () => {
    http.onGet(ELEVE_ENDPOINT).reply(200, { data: ELEVE_PAYLOAD });

    renderDashboard(<EleveDashboard />);
    await waitFor(() => expect(screen.getByText('13.5/20')).toBeInTheDocument());

    fireEvent.click(screen.getByRole('button', { name: /Mes Notes/i }));

    await waitFor(() => expect(screen.getByText('15/20')).toBeInTheDocument());
    expect(screen.getByText('9/20')).toBeInTheDocument();
    expect(screen.getByText('×4')).toBeInTheDocument();
  });

  it('rend le message d’erreur du serveur, pas un écran vide muet', async () => {
    http.onGet(ELEVE_ENDPOINT).reply(500, { message: 'Base de données indisponible' });

    renderDashboard(<EleveDashboard />);

    await waitFor(() =>
      expect(screen.getByText(/Base de données indisponible/)).toBeInTheDocument()
    );
    expect(screen.getByText(/Erreur de chargement/)).toBeInTheDocument();
  });

  it('rend l’erreur sur 401 sans afficher de fausses données', async () => {
    http.onGet(ELEVE_ENDPOINT).reply(401, { message: 'Unauthenticated.' });

    renderDashboard(<EleveDashboard />);

    await waitFor(() => expect(screen.getByText(/Erreur de chargement/)).toBeInTheDocument());
    expect(screen.queryByText('13.5/20')).not.toBeInTheDocument();
  });

  it('renvoie vers /emploi-du-temps depuis l’onglet dédié', async () => {
    http.onGet(ELEVE_ENDPOINT).reply(200, { data: ELEVE_PAYLOAD });

    renderDashboard(<EleveDashboard />);
    await waitFor(() => expect(screen.getByText('13.5/20')).toBeInTheDocument());

    fireEvent.click(screen.getByRole('button', { name: /Emploi du Temps/i }));

    await waitFor(() => expect(screen.getByTestId('url').textContent).toBe('/emploi-du-temps'));
  });
});

describe('cache des tableaux de bord', () => {
  it('sert la réponse en cache sans rappeler l’API au remontage', async () => {
    http.onGet(ELEVE_ENDPOINT).reply(200, { data: ELEVE_PAYLOAD });

    const first = renderDashboard(<EleveDashboard />);
    await waitFor(() => expect(screen.getByText('13.5/20')).toBeInTheDocument());
    first.unmount();

    renderDashboard(<EleveDashboard />);
    await waitFor(() => expect(screen.getByText('13.5/20')).toBeInTheDocument());

    expect(http.callsTo('get', ELEVE_ENDPOINT)).toHaveLength(1);
  });

  it('est purgé à la déconnexion — sinon l’utilisateur suivant voit les données du précédent', async () => {
    http.onGet(ELEVE_ENDPOINT).reply(200, { data: ELEVE_PAYLOAD });
    http.onPost('/auth/logout').reply(204, null);

    const first = renderDashboard(<EleveDashboard />);
    await waitFor(() => expect(screen.getByText('13.5/20')).toBeInTheDocument());
    first.unmount();

    await useAuthStore.getState().logout();

    // Nouvel utilisateur, mêmes rôle et endpoint : ses propres données.
    http.onGet(ELEVE_ENDPOINT).reply(200, {
      data: { eleve: { classe: '3e C' }, stats: { moyenne_generale: 8 }, matieres: [], emploi_du_temps: [] },
    });
    renderDashboard(<EleveDashboard />);

    await waitFor(() => expect(screen.getByText('8/20')).toBeInTheDocument());
    expect(screen.queryByText('13.5/20')).not.toBeInTheDocument();
    expect(http.callsTo('get', ELEVE_ENDPOINT)).toHaveLength(2);
  });

  it('est purgé aussi sur perte de session (401)', async () => {
    http.onGet(ELEVE_ENDPOINT).reply(200, { data: ELEVE_PAYLOAD });

    const first = renderDashboard(<EleveDashboard />);
    await waitFor(() => expect(screen.getByText('13.5/20')).toBeInTheDocument());
    first.unmount();

    useAuthStore.getState().clearSession();

    http.onGet(ELEVE_ENDPOINT).reply(200, {
      data: { eleve: {}, stats: { moyenne_generale: 11 }, matieres: [], emploi_du_temps: [] },
    });
    renderDashboard(<EleveDashboard />);

    await waitFor(() => expect(screen.getByText('11/20')).toBeInTheDocument());
  });
});

describe('ParentDashboard', () => {
  const PARENT_ENDPOINT = '/dashboard/parent';

  const PARENT_PAYLOAD = {
    parent: { id: 9 },
    enfants: [
      {
        id: 1,
        nom: 'Aho',
        prenom: 'Kossi',
        classe: '6e A',
        moyenne: 14,
        rang: 3,
        role: 'père',
        is_primary: true,
        is_guardian: true,
      },
      {
        id: 2,
        nom: 'Aho',
        prenom: 'Ama',
        classe: '5e B',
        moyenne: 11,
        rang: null,
        role: 'mère',
        is_primary: false,
        is_guardian: false,
      },
    ],
    stats: [
      { title: 'Enfants Scolarisés', value: 2 },
      { title: 'Moyenne Générale', value: 12.5 },
    ],
    evolution: [{ mois: 'Fév', Kossi: 14 }],
    communications: [],
  };

  beforeEach(() => {
    useAuthStore.setState({
      user: { id: 1, name: 'Test', role: 'parent' },
      isAuthenticated: true,
      isLoading: false,
      sessionLastVerified: Date.now(),
    });
  });

  it('affiche la filiation enrichie de chaque enfant', async () => {
    http.onGet(PARENT_ENDPOINT).reply(200, { data: PARENT_PAYLOAD });

    renderDashboard(<ParentDashboard />);

    await waitFor(() => expect(screen.getByText('Aho Kossi')).toBeInTheDocument());
    expect(screen.getByText('Aho Ama')).toBeInTheDocument();
    expect(screen.getAllByText('père')).toHaveLength(1);
    expect(screen.getAllByText('Contact principal')).toHaveLength(1);
    expect(screen.getAllByText('mère')).toHaveLength(1);
    expect(screen.getByText('Enfants Scolarisés')).toBeInTheDocument();
  });

  it('affiche l’état vide quand le parent n’a pas d’enfants', async () => {
    http.onGet(PARENT_ENDPOINT).reply(200, {
      data: { ...PARENT_PAYLOAD, enfants: [], evolution: [], communications: [] },
    });

    renderDashboard(<ParentDashboard />);

    await waitFor(() => expect(screen.getByText('Aucun enfant trouvé')).toBeInTheDocument());
  });
});
