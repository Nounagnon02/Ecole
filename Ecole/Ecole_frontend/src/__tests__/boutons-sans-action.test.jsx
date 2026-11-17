/**
 * Boutons sans action (constaté le 17/11/2026 sur le desktop et le web).
 *
 * « Factures », « Exporter » et « Nouveau paiement » de la page Paiements,
 * « Nouvel incident » du surveillant, « Révoquer » sur une session inventée…
 * ne faisaient rien. Une analyse du code en a trouvé 44.
 *
 * 1. Garde-fou : aucun `<Button>` sans `onClick`, `type="submit"`, lien ou
 *    `disabled` dans les pages, sauf ceux de la liste RESTANTS — défauts connus,
 *    consignés dans docs/ETAT_REEL_ET_REPRISE.md (D1), à vider au fil des
 *    corrections. Un bouton corrigé doit en sortir (le test le signale).
 * 2. Comportement des pages corrigées.
 */
import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { MemoryRouter, Routes, Route, useLocation } from 'react-router-dom';
import { QueryClientProvider } from '@tanstack/react-query';
import fs from 'node:fs';
import path from 'node:path';
import PaiementsPage from '@/app/features/paiements/PaiementsPage';
import SurveillancePage from '@/app/features/surveillant/SurveillancePage';
import * as telecharger from '@/shared/lib/telecharger';
import { installHttpMock } from './helpers/http-mock';
import { makeQueryClient, signIn } from './helpers/render';

/** Boutons encore sans action : `fichier:texte` (relatif à src/app). */
const RESTANTS = new Set([
  'dashboards/enseignant/index.jsx:', 'dashboards/enseignant/index.jsx:voir_la_semaine', 'dashboards/enseignant/index.jsx:nouveau',
  'dashboards/enseignant/index.jsx:saisir_des_notes', 'dashboards/enseignant/index.jsx:nouvelle_seance',
  'features/admin/BillingPage.jsx:export', 'features/admin/ConfigurationPage.jsx:save', 'features/admin/ConfigurationPage.jsx:',
  'features/admin/ConfigurationPage.jsx:reinitialiser', 'features/admin/EcolesPage.jsx:', 'features/admin/ModulesPage.jsx:nouveau_module',
  'features/admin/PlansPage.jsx:nouveau_plan', 'features/admin/PlansPage.jsx:edit', 'features/admin/PlansPage.jsx:delete',
  'features/enseignant/ClassesPage.jsx:', 'features/universite/CoursPage.jsx:ajouter_un_cours', 'features/universite/CoursPage.jsx:details',
  'features/universite/DepartementsPage.jsx:nouveau_departement', 'features/universite/DepartementsPage.jsx:gerer',
  'features/universite/EnseignantsPage.jsx:ajouter_un_enseignant', 'features/universite/EtudiantsPage.jsx:ajouter_un_etudiant',
  'features/universite/EtudiantsPage.jsx:', 'features/universite/FacultesPage.jsx:ajouter_une_faculte', 'features/universite/MesCoursPage.jsx:details',
  'features/universite/MesCoursPage.jsx:notes', 'features/universite/NotesPage.jsx:export', 'features/universite/NotesPage.jsx:ajouter_une_note',
  'features/universite/NotesPage.jsx:', 'features/universite/PlanningPage.jsx:nouvel_evenement', 'features/universite/PlanningPage.jsx:details',
  'features/universite/TachesPage.jsx:nouvelle_tache', 'features/universite/TachesPage.jsx:manage',
]);

/** Ouvertures `<Button …>` sans action, lues balise entière (accolades comprises). */
function boutonsSansAction() {
  const racine = path.resolve(__dirname, '../app');
  const fichiers = [];
  const parcourir = (d) => fs.readdirSync(d, { withFileTypes: true }).forEach((e) => {
    const p = path.join(d, e.name);
    if (e.isDirectory()) parcourir(p); else if (p.endsWith('.jsx')) fichiers.push(p);
  });
  parcourir(racine);
  const trouves = [];
  for (const f of fichiers) {
    const s = fs.readFileSync(f, 'utf8');
    for (const m of s.matchAll(/<Button\b/g)) {
      let i = m.index + m[0].length; let prof = 0;
      for (; i < s.length; i += 1) {
        if (s[i] === '{') prof += 1; else if (s[i] === '}') prof -= 1; else if (s[i] === '>' && prof === 0) break;
      }
      const attrs = s.slice(m.index, i);
      if (/onClick|type=["']submit|\bas=|\bto=|href=|\bform=|\bdisabled\b/.test(attrs)) continue;
      const fin = s.indexOf('</Button>', i);
      const contenu = attrs.trimEnd().endsWith('/') || fin < 0 ? '' : s.slice(i + 1, fin);
      const cle = (contenu.match(/t\('[^']*\.([a-z_]+)'\)/) || [])[1] ?? '';
      trouves.push(`${path.relative(racine, f)}:${cle}`);
    }
  }
  return trouves;
}

describe('garde-fou : boutons sans action', () => {
  it('n’en ajoute aucun en dehors des défauts connus et consignés', () => {
    const nouveaux = boutonsSansAction().filter((b) => !RESTANTS.has(b));
    expect(nouveaux).toEqual([]);
  });

  it('retire de la liste un bouton une fois corrigé', () => {
    const presents = new Set(boutonsSansAction());
    expect([...RESTANTS].filter((b) => !presents.has(b))).toEqual([]);
  });

  it('a corrigé ceux du desktop (Paiements, Surveillance, Absences, Paramètres, Messagerie)', () => {
    const desktop = boutonsSansAction().filter((b) => /paiements|surveillant|censeur|parametres|messagerie/.test(b));
    expect(desktop).toEqual([]);
  });
});

/* ─── Pages corrigées ─────────────────────────────────────────────────── */
let http;
beforeEach(() => { http = installHttpMock(); vi.spyOn(console, 'error').mockImplementation(() => {}); });
afterEach(() => { http.restore(); vi.restoreAllMocks(); });

const PAIEMENT = {
  id: 1, reference: 'PAY-2026-0002', eleve: { id: 11, user: { name: 'Adjovi', prenom: 'Rose' }, classe: { nom_classe: '6A' } },
  type_paiement: 'Inscription', montant: 25000, montant_paye: 25000, date_paiement: '2026-08-04', statut: 'payee', statut_label: 'Payée',
};

function OuEstOn() { return <span data-testid="adresse">{useLocation().pathname}{useLocation().search}</span>; }

function monterPaiements() {
  http.onGet('/comptable/paiements').reply(200, { success: true, data: [PAIEMENT] });
  return render(
    <QueryClientProvider client={makeQueryClient()}>
      <MemoryRouter initialEntries={['/paiements']}>
        <Routes><Route path="*" element={<><PaiementsPage /><OuEstOn /></>} /></Routes>
      </MemoryRouter>
    </QueryClientProvider>,
  );
}

describe('Paiements — boutons reliés', () => {
  it('« Exporter » télécharge la liste affichée en CSV', async () => {
    signIn('comptable');
    const csv = vi.spyOn(telecharger, 'telechargerCsv').mockImplementation(() => {});
    monterPaiements();
    await screen.findByText('PAY-2026-0002');
    fireEvent.click(screen.getByRole('button', { name: /Exporter/ }));
    expect(csv).toHaveBeenCalledTimes(1);
    const [nom, lignes] = csv.mock.calls[0];
    expect(nom).toMatch(/^paiements-\d{4}-\d{2}-\d{2}\.csv$/);
    expect(lignes[1]).toEqual(['PAY-2026-0002', 'Adjovi Rose', '6A', 'Inscription', 25000, 25000, '2026-08-04', 'Payée']);
  });

  it('« Nouveau paiement » mène à l’échéancier, curseur dans la recherche d’élève', async () => {
    signIn('comptable');
    monterPaiements();
    await screen.findByText('PAY-2026-0002');
    fireEvent.click(screen.getByRole('button', { name: /Nouveau paiement/ }));
    await waitFor(() => expect(screen.getByTestId('adresse')).toHaveTextContent('tab=echeancier'));
    await waitFor(() => expect(document.activeElement?.id).toBe('recherche-eleve-echeancier'));
  });

  it('« Factures » mène aux factures du comptable, et n’est pas proposé au directeur', async () => {
    signIn('comptable');
    const { unmount } = monterPaiements();
    await screen.findByText('PAY-2026-0002');
    fireEvent.click(screen.getByRole('button', { name: /Factures/ }));
    await waitFor(() => expect(screen.getByTestId('adresse')).toHaveTextContent('/comptable/factures'));
    unmount();

    signIn('directeur');
    monterPaiements();
    await screen.findByText('PAY-2026-0002');
    expect(screen.queryByRole('button', { name: /Factures/ })).not.toBeInTheDocument();
  });
});

describe('Surveillance — nouvel incident', () => {
  it('ouvre le formulaire de signalement', async () => {
    signIn('surveillant');
    http.onGet('/surveillant/incidents').reply(200, { success: true, data: [] });
    render(<QueryClientProvider client={makeQueryClient()}><MemoryRouter><SurveillancePage /></MemoryRouter></QueryClientProvider>);
    fireEvent.click(await screen.findByRole('button', { name: /Nouvel incident/ }));
    expect(await screen.findByRole('dialog')).toBeInTheDocument();
  });
});
