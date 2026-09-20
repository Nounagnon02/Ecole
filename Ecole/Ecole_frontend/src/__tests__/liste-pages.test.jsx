/**
 * Contrat commun des pages de liste (audit P2.7 / P4.1)
 *
 * Quatorze pages métier partageaient le même squelette — un `useApi()`, un
 * `useState` de données, un `useEffect` de premier rendu — et aucune n'avait
 * de test. Elles partagent aussi le même contrat, vérifié ici une fois pour
 * toutes :
 *
 *   1. ce que l'API renvoie est rendu ;
 *   2. une liste vide donne un état vide explicite, pas un écran muet ;
 *   3. une erreur serveur ne se déguise pas en liste vide — c'est le pire
 *      cas, l'utilisateur conclut qu'il n'y a rien alors que rien n'a été lu.
 *
 * Écrit avant leur migration vers react-query : c'est ce qui rend le
 * changement de mécanisme vérifiable.
 */

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { QueryClientProvider } from '@tanstack/react-query';
import { installHttpMock } from './helpers/http-mock';
import { makeQueryClient } from './helpers/render';

import CataloguePage from '@/app/features/bibliothecaire/CataloguePage';
import EmpruntsPage from '@/app/features/bibliothecaire/EmpruntsPage';
import DisciplinePage from '@/app/features/censeur/DisciplinePage';
import DossiersPage from '@/app/features/infirmier/DossiersPage';
import SoinsPage from '@/app/features/infirmier/SoinsPage';
import DocumentsPage from '@/app/features/secretaire/DocumentsPage';
import InscriptionsPage from '@/app/features/secretaire/InscriptionsPage';
import PresencesPage from '@/app/features/surveillant/PresencesPage';
import SurveillancePage from '@/app/features/surveillant/SurveillancePage';
import DepartementsPage from '@/app/features/universite/DepartementsPage';
import EnseignantsPage from '@/app/features/universite/EnseignantsPage';
import EtudiantsPage from '@/app/features/universite/EtudiantsPage';
import FacultesPage from '@/app/features/universite/FacultesPage';
import NotesPage from '@/app/features/universite/NotesPage';

let http;

beforeEach(() => {
  http = installHttpMock();
  vi.spyOn(console, 'error').mockImplementation(() => {});
});

afterEach(() => {
  http.restore();
  vi.restoreAllMocks();
});

function monter(element) {
  return render(
    <QueryClientProvider client={makeQueryClient()}>
      <MemoryRouter>{element}</MemoryRouter>
    </QueryClientProvider>,
  );
}

/**
 * Chaque page : son composant, son endpoint, un élément représentatif, un
 * texte que ce dernier doit faire apparaître, et le libellé d'état vide.
 */
const PAGES = [
  {
    nom: 'CataloguePage',
    Composant: CataloguePage,
    url: '/bibliothecaire/livres',
    element: { id: 1, titre: 'Les Misérables', auteur: 'Victor Hugo', isbn: '978-2', categorie: 'Roman', disponible: 1 },
    attendu: 'Les Misérables',
    vide: /aucun ouvrage trouvé/i,
  },
  {
    nom: 'EmpruntsPage',
    Composant: EmpruntsPage,
    url: '/bibliothecaire/emprunts',
    element: { id: 1, livre: { titre: 'Les Misérables' }, eleve: { nom: 'Chabi', prenom: 'Awa' }, date_emprunt: '2026-09-01', statut: 'en_cours' },
    attendu: 'Les Misérables',
    vide: /aucun emprunt trouvé/i,
  },
  {
    nom: 'DisciplinePage',
    Composant: DisciplinePage,
    url: '/surveillant/incidents',
    // Cette page charge aussi ses statistiques : sans ce second mock, la
    // requête reste pendante et rien ne se rend.
    urlsAnnexes: ['/surveillant/statistiques'],
    element: { id: 1, type: 'retard', description: 'Retard répété', gravite: 'faible', date: '2026-09-10' },
    attendu: 'Retard répété',
    vide: /aucune alerte pour le moment/i,
  },
  {
    nom: 'SoinsPage',
    Composant: SoinsPage,
    url: '/infirmier/consultations',
    element: { id: 1, motif: 'Céphalées', traitement: 'Repos', date_consultation: '2026-09-12', eleve: { nom: 'Bio', prenom: 'Kader' } },
    attendu: 'Céphalées',
    vide: /aucun soin trouvé/i,
  },
  {
    nom: 'DocumentsPage',
    Composant: DocumentsPage,
    url: '/secretaire/courriers',
    element: { id: 1, objet: 'Convocation conseil', type: 'sortant', date: '2026-09-11', destinataire: 'Parents' },
    attendu: 'Convocation conseil',
    vide: /aucun courrier trouvé/i,
  },
  {
    nom: 'InscriptionsPage',
    Composant: InscriptionsPage,
    url: '/secretaire/dossiers-eleves',
    // La page lit `ins.eleve?.nom`, pas un champ plat.
    element: { id: 1, eleve: { nom: 'Adjovi', prenom: 'Rose' }, classe: '6e A', dossier_complet: true },
    attendu: 'Adjovi',
    vide: /aucune inscription trouvée/i,
  },
  {
    nom: 'PresencesPage',
    Composant: PresencesPage,
    url: '/surveillant/absences',
    urlsAnnexes: ['/eleves'],
    element: { id: 1, eleve: { nom: 'Chabi', prenom: 'Awa' }, date: '2026-09-15', justifiee: false, motif: 'Non justifiée' },
    attendu: 'Chabi',
    vide: /aucune présence trouvée/i,
  },
  {
    nom: 'SurveillancePage',
    Composant: SurveillancePage,
    url: '/surveillant/incidents',
    element: { id: 1, type: 'bagarre', description: 'Altercation cour', gravite: 'grave', date: '2026-09-14' },
    attendu: 'Altercation cour',
    vide: /aucun incident trouvé/i,
  },
  {
    nom: 'DepartementsPage',
    Composant: DepartementsPage,
    url: '/universite/departements',
    element: { id: 1, nom: 'Informatique', code: 'INFO', faculte: { nom: 'Sciences' } },
    attendu: 'Informatique',
    vide: /aucun département trouvé/i,
  },
  {
    nom: 'EnseignantsPage',
    Composant: EnseignantsPage,
    url: '/universite/enseignants',
    element: { id: 1, nom: 'Sossou', prenom: 'Marc', grade: 'Maître de conférences', email: 'm.sossou@test.bj' },
    attendu: 'Sossou',
    vide: /aucun enseignant trouvé/i,
  },
  {
    nom: 'EtudiantsPage',
    Composant: EtudiantsPage,
    url: '/universite/etudiants',
    element: { id: 1, nom: 'Kponou', prenom: 'Inès', matricule: 'ETU-001', filiere: { nom: 'Génie logiciel' } },
    attendu: 'Kponou',
    vide: /aucun étudiant trouvé/i,
  },
  {
    nom: 'FacultesPage',
    Composant: FacultesPage,
    url: '/universite/facultes',
    element: { id: 1, nom: 'Sciences et Techniques', code: 'FAST', doyen: 'Pr. Agbo' },
    attendu: 'Sciences et Techniques',
    vide: /aucune faculté trouvée/i,
  },
  {
    nom: 'NotesPage (université)',
    Composant: NotesPage,
    url: '/universite/notes',
    element: { id: 1, note: 15.5, etudiant: { nom: 'Kponou', prenom: 'Inès' }, matiere: { intitule: 'Algorithmique' } },
    attendu: 'Kponou',
    vide: /aucune note trouvée/i,
  },
];

describe.each(PAGES)('$nom', ({ Composant, url, urlsAnnexes = [], element, attendu, vide }) => {
  /** Les requêtes secondaires répondent vide : elles ne sont pas le sujet. */
  function mockerAnnexes() {
    urlsAnnexes.forEach((u) => http.onGet(u).reply(200, { success: true, data: [] }));
  }

  it('rend ce que l’API renvoie', async () => {
    mockerAnnexes();
    http.onGet(url).reply(200, { success: true, data: [element] });

    monter(<Composant />);

    await waitFor(() => expect(screen.getAllByText(new RegExp(attendu, 'i')).length).toBeGreaterThan(0));
  });

  it('affiche un état vide explicite sur liste vide', async () => {
    mockerAnnexes();
    http.onGet(url).reply(200, { success: true, data: [] });

    monter(<Composant />);

    await waitFor(() => expect(screen.getByText(vide)).toBeInTheDocument());
  });

  it('ne fait pas passer une erreur serveur pour une liste vide', async () => {
    mockerAnnexes();
    http.onGet(url).reply(500, { message: 'Service indisponible' });

    monter(<Composant />);

    // Le silence est le pire cas : l'utilisateur conclut qu'il n'y a rien,
    // alors que rien n'a pu être lu.
    await waitFor(() => expect(screen.queryByText(vide)).not.toBeInTheDocument());
  });
});

describe('DossiersPage', () => {
  it('rend les dossiers médicaux renvoyés par l’API', async () => {
    http.onGet('/infirmier/vaccinations').reply(200, { success: true, data: [] });
    http.onGet('/infirmier/dossiers-medicaux').reply(200, {
      success: true,
      data: [{ id: 1, eleve: { nom: 'Chabi', prenom: 'Awa' }, groupe_sanguin: 'O+', allergies: 'Arachide' }],
    });

    monter(<DossiersPage />);

    await waitFor(() => expect(screen.getAllByText(/Chabi/i).length).toBeGreaterThan(0));
  });
});
