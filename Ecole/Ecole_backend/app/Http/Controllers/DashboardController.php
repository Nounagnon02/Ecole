<?php

namespace App\Http\Controllers;

use App\Models\{User, Eleve, Classe, Note, Matiere};
use Illuminate\Http\Request;

class DashboardController extends Controller
{
    public function directeur()
    {
        return response()->json([
            'success' => true,
            'data' => [
                'total_eleves' => Eleve::count(),
                'total_classes' => Classe::count(),
                'total_enseignants' => User::where('role', 'enseignant')->count(),
                'classes' => Classe::with(['eleves', 'enseignants'])->get()
            ]
        ]);
    }

    /**
     * Endpoint consolidé pour le dashboard directeur
     * Retourne toutes les données en une seule requête avec cache de 5 minutes
     */
    public function getDashboardData()
    {
        $data = \Illuminate\Support\Facades\Cache::remember('dashboard_directeur', 300, function () {
            return [
                'classes' => Classe::with('series')->get(),
                'classes_effectif' => Classe::withCount('eleves')->get()->map(function ($c) {
                    $c->effectif = $c->eleves_count;
                    return $c;
                }),
                'eleves' => Eleve::all(),
                'matieres' => Matiere::all(),
                'matieres_series' => Matiere::with('series')->get(),
                'series' => \App\Models\Series::with('matieres')->get(),
                'stats' => [
                    'total_eleves' => Eleve::count(),
                    'total_classes' => Classe::count(),
                    'total_enseignants' => User::where('role', 'enseignant')->count(),
                    'evolution_effectifs' => $this->computeMonthlyEnrollment(),
                    'repartition_notes' => $this->computeGradeDistribution(),
                ]
            ];
        });

        return response()->json([
            'success' => true,
            'data' => $data,
            'cached' => true
        ]);
    }

    /**
     * Invalide le cache du dashboard
     */
    public function invalidateCache()
    {
        \Illuminate\Support\Facades\Cache::forget('dashboard_directeur');
        return response()->json(['success' => true, 'message' => 'Cache invalidé']);
    }

    public function enseignant(Request $request)
    {
        $enseignant = $request->user()->enseignant;
        
        return response()->json([
            'success' => true,
            'data' => [
                'classes' => $enseignant->classes()->with('eleves')->get(),
                'matieres' => $enseignant->matieres,
                'notes_recentes' => Note::where('enseignant_id', $enseignant->id)
                    ->with(['eleve', 'matiere'])
                    ->latest()
                    ->take(10)
                    ->get()
            ]
        ]);
    }

    public function parent(Request $request)
    {
        $user = $request->user();

        if (!$user || $user->role !== 'parent') {
            return response()->json(['message' => 'Non autorisé'], 403);
        }

        $parent = $user->parent;

        if (!$parent) {
            return response()->json(['success' => true, 'data' => ['parent' => $user, 'children' => []]]);
        }

        $children = $parent->eleves()->with(['classe', 'notes.matiere'])->get();

        return response()->json([
            'success' => true,
            'data' => [
                'parent' => $user,
                'children' => $children->map(function($child) {
                    return [
                        'id' => $child->id,
                        'name' => $child->user->name ?? 'N/A',
                        'class' => $child->classe->nom_classe ?? 'N/A',
                        'matricule' => $child->numero_matricule ?? 'N/A',
                        'moyenne_generale' => $this->calculateAverage($child->notes)
                    ];
                })
            ]
        ]);
    }

    /**
     * Dashboard Élève
     */
    public function eleve()
    {
        $data = \Illuminate\Support\Facades\Cache::remember('dashboard_eleve', 300, function () {
            return [
                'stats' => [
                    ['title' => 'Moyenne Générale', 'value' => '14.2/20', 'trend' => 0.8, 'trendLabel' => 'vs trimestre dernier'],
                    ['title' => 'Notes ce Mois', 'value' => '12', 'trend' => 2, 'trendLabel' => 'vs mois dernier'],
                    ['title' => 'Devoirs Rendus', 'value' => '95%', 'trend' => 5, 'trendLabel' => 'taux compliance'],
                    ['title' => 'Absences', 'value' => '2', 'trend' => -1, 'trendLabel' => 'ce mois'],
                ],
                'matieres' => [
                    ['name' => 'Mathématiques', 'note' => 15, 'coeff' => 4, 'appreciation' => 'Très bien'],
                    ['name' => 'Français', 'note' => 13, 'coeff' => 3, 'appreciation' => 'Bien'],
                    ['name' => 'Anglais', 'note' => 16, 'coeff' => 2, 'appreciation' => 'Excellent'],
                    ['name' => 'Physique', 'note' => 12, 'coeff' => 3, 'appreciation' => 'Assez bien'],
                    ['name' => 'SVT', 'note' => 14, 'coeff' => 2, 'appreciation' => 'Bien'],
                ],
                'emploi_du_temps' => [],
            ];
        });

        return response()->json(['success' => true, 'data' => $data, 'cached' => true]);
    }

    /**
     * Dashboard Admin
     */
    public function admin()
    {
        $data = \Illuminate\Support\Facades\Cache::remember('dashboard_admin', 300, function () {
            return [
                'stats' => [
                    ['title' => 'Total Écoles', 'value' => '3', 'trend' => 0, 'trendLabel' => 'établissements'],
                    ['title' => 'Utilisateurs', 'value' => '1 284', 'trend' => 12, 'trendLabel' => 'ce trimestre'],
                    ['title' => "Taux d'Activité", 'value' => '78%', 'trend' => 5, 'trendLabel' => 'en hausse'],
                    ['title' => 'Signalements', 'value' => '5', 'trend' => -2, 'trendLabel' => 'cette semaine'],
                ],
                'repartition_roles' => [
                    ['name' => 'Direction', 'value' => 8],
                    ['name' => 'Enseignants', 'value' => 120],
                    ['name' => 'Élèves', 'value' => 950],
                    ['name' => 'Staff', 'value' => 45],
                    ['name' => 'Parents', 'value' => 380],
                ],
                'activites_recentes' => [
                    ['id' => 1, 'type' => 'connexion', 'message' => 'Nouvel utilisateur inscrit', 'temps' => 'Il y a 10 min'],
                    ['id' => 2, 'type' => 'alerte', 'message' => 'Tentative de connexion suspecte', 'temps' => 'Il y a 1h'],
                    ['id' => 3, 'type' => 'config', 'message' => 'Paramètres système mis à jour', 'temps' => 'Il y a 3h'],
                    ['id' => 4, 'type' => 'info', 'message' => 'Sauvegarde hebdomadaire effectuée', 'temps' => 'Il y a 1j'],
                ],
            ];
        });

        return response()->json(['success' => true, 'data' => $data, 'cached' => true]);
    }

    /**
     * Dashboard Université
     */
    public function universite()
    {
        $data = \Illuminate\Support\Facades\Cache::remember('dashboard_universite', 300, function () {
            return [
                'stats' => [
                    ['title' => 'Facultés', 'value' => '6', 'trend' => 0, 'trendLabel' => 'ce semestre'],
                    ['title' => 'Départements', 'value' => '27', 'trend' => 3.8, 'trendLabel' => 'vs semestre précédent'],
                    ['title' => 'Enseignants', 'value' => '235', 'trend' => 5.2, 'trendLabel' => 'vs année dernière'],
                    ['title' => 'Étudiants', 'value' => '5 190', 'trend' => 8.1, 'trendLabel' => 'vs année dernière'],
                ],
                'inscriptions' => [
                    ['annee' => '2021-22', 'inscriptions' => 4200, 'diplomes' => 3800],
                    ['annee' => '2022-23', 'inscriptions' => 4550, 'diplomes' => 4100],
                    ['annee' => '2023-24', 'inscriptions' => 4890, 'diplomes' => 4450],
                    ['annee' => '2024-25', 'inscriptions' => 5100, 'diplomes' => 4680],
                    ['annee' => '2025-26', 'inscriptions' => 5190, 'diplomes' => null],
                ],
                'facultes' => [
                    ['nom' => 'Sciences', 'etudiants' => 1200, 'enseignants' => 45, 'departements' => 5],
                    ['nom' => 'Lettres', 'etudiants' => 950, 'enseignants' => 38, 'departements' => 4],
                    ['nom' => 'Droit', 'etudiants' => 780, 'enseignants' => 28, 'departements' => 3],
                    ['nom' => 'SEG', 'etudiants' => 890, 'enseignants' => 32, 'departements' => 4],
                    ['nom' => 'Médecine', 'etudiants' => 650, 'enseignants' => 52, 'departements' => 6],
                    ['nom' => 'Ingénierie', 'etudiants' => 720, 'enseignants' => 40, 'departements' => 5],
                ],
                'activites' => [
                    ['id' => 1, 'type' => 'inscription', 'message' => 'Nouvel étudiant inscrit — Koffi Mensah (FST)', 'temps' => 'Il y a 15 min'],
                    ['id' => 2, 'type' => 'note', 'message' => "Notes du département de Droit publiées", 'temps' => 'Il y a 1h'],
                    ['id' => 3, 'type' => 'evenement', 'message' => "Conseil d'université — 28 juin 2026", 'temps' => 'Il y a 3h'],
                    ['id' => 4, 'type' => 'alerte', 'message' => 'Rappel: validation des inscriptions au 30 juin', 'temps' => 'Il y a 1j'],
                ],
            ];
        });

        return response()->json(['success' => true, 'data' => $data, 'cached' => true]);
    }

    // ─── STAFF DASHBOARDS (6 rôles — R4) ────────────────────────────

    /**
     * Dashboard Comptable
     */
    public function comptable()
    {
        $data = \Illuminate\Support\Facades\Cache::remember('dashboard_comptable', 300, function () {
            return [
                'stats' => [
                    ['title' => 'Revenus du Mois', 'value' => '12 450 000 F', 'trend' => 8.3, 'trendLabel' => 'vs mois dernier'],
                    ['title' => 'Factures en Attente', 'value' => '34', 'trend' => -12, 'trendLabel' => 'vs mois dernier'],
                    ['title' => 'Taux Recouvrement', 'value' => '87%', 'trend' => 3.2, 'trendLabel' => 'ce trimestre'],
                    ['title' => 'Dépenses du Mois', 'value' => '4 320 000 F', 'trend' => 2.1, 'trendLabel' => 'vs mois dernier'],
                ],
                'donnes_ca' => [
                    ['mois' => 'Jan', 'revenus' => 11200, 'depenses' => 4200],
                    ['mois' => 'Fév', 'revenus' => 10800, 'depenses' => 4100],
                    ['mois' => 'Mar', 'revenus' => 12450, 'depenses' => 4320],
                    ['mois' => 'Avr', 'revenus' => 11800, 'depenses' => 4050],
                    ['mois' => 'Mai', 'revenus' => 13200, 'depenses' => 4500],
                    ['mois' => 'Juin', 'revenus' => 12450, 'depenses' => 4320],
                ],
                'repartition' => [
                    ['name' => 'Frais Scolaire', 'value' => 65],
                    ['name' => 'Cantine', 'value' => 15],
                    ['name' => 'Transport', 'value' => 12],
                    ['name' => 'Activités', 'value' => 8],
                ],
                'factures' => [
                    ['id' => 1, 'eleve' => 'Mensah Jean', 'classe' => '3e A', 'montant' => 45000, 'statut' => 'Payée', 'echeance' => '2026-06-15'],
                    ['id' => 2, 'eleve' => 'Akakpo Ama', 'classe' => '5e B', 'montant' => 38000, 'statut' => 'En attente', 'echeance' => '2026-06-20'],
                    ['id' => 3, 'eleve' => 'Koffi David', 'classe' => '6e A', 'montant' => 42000, 'statut' => 'Payée', 'echeance' => '2026-06-10'],
                    ['id' => 4, 'eleve' => 'Dossa Emile', 'classe' => '4e C', 'montant' => 35000, 'statut' => 'En retard', 'echeance' => '2026-06-01'],
                    ['id' => 5, 'eleve' => 'Amégnigban Rose', 'classe' => '2nde A', 'montant' => 55000, 'statut' => 'En attente', 'echeance' => '2026-06-25'],
                ],
            ];
        });

        return response()->json(['success' => true, 'data' => $data, 'cached' => true]);
    }

    /**
     * Dashboard Surveillant
     */
    public function surveillant()
    {
        $data = \Illuminate\Support\Facades\Cache::remember('dashboard_surveillant', 300, function () {
            return [
                'stats' => [
                    ['title' => 'Total Élèves', 'value' => '1 284', 'trend' => 0, 'trendLabel' => 'effectif total'],
                    ['title' => 'Présents', 'value' => '1 156', 'trend' => 2.3, 'trendLabel' => 'taux 90%'],
                    ['title' => 'Absents', 'value' => '128', 'trend' => -5, 'trendLabel' => 'en baisse'],
                    ['title' => 'Alertes', 'value' => '3', 'trend' => -1, 'trendLabel' => 'cette semaine'],
                ],
                'presences_semaine' => [
                    ['jour' => 'Lun', 'presents' => 1150, 'absents' => 134, 'retard' => 45],
                    ['jour' => 'Mar', 'presents' => 1170, 'absents' => 114, 'retard' => 38],
                    ['jour' => 'Mer', 'presents' => 1156, 'absents' => 128, 'retard' => 42],
                    ['jour' => 'Jeu', 'presents' => 1180, 'absents' => 104, 'retard' => 35],
                    ['jour' => 'Ven', 'presents' => 1140, 'absents' => 144, 'retard' => 50],
                    ['jour' => 'Sam', 'presents' => 800, 'absents' => 484, 'retard' => 20],
                ],
                'zones' => [
                    ['name' => 'Bâtiment A', 'surveilles' => 320, 'incidents' => 2, 'statut' => 'Calme'],
                    ['name' => 'Bâtiment B', 'surveilles' => 450, 'incidents' => 5, 'statut' => 'Surveillance'],
                    ['name' => 'Cour', 'surveilles' => 280, 'incidents' => 1, 'statut' => 'Calme'],
                    ['name' => 'Cantine', 'surveilles' => 400, 'incidents' => 3, 'statut' => 'Calme'],
                ],
                'retards' => [
                    ['id' => 1, 'eleve' => 'Kodjo A.', 'classe' => '3e B', 'temps' => '25 min', 'motif' => 'Transport', 'recurrent' => true],
                    ['id' => 2, 'eleve' => 'Sena K.', 'classe' => '5e A', 'temps' => '15 min', 'motif' => 'Réveil tardif', 'recurrent' => false],
                    ['id' => 3, 'eleve' => 'Yawo D.', 'classe' => '4e B', 'temps' => '30 min', 'motif' => 'Non justifié', 'recurrent' => true],
                    ['id' => 4, 'eleve' => 'Afia M.', 'classe' => '6e A', 'temps' => '10 min', 'motif' => 'Trafic', 'recurrent' => false],
                    ['id' => 5, 'eleve' => 'Kossi E.', 'classe' => '2nde B', 'temps' => '45 min', 'motif' => 'Non justifié', 'recurrent' => true],
                ],
            ];
        });

        return response()->json(['success' => true, 'data' => $data, 'cached' => true]);
    }

    /**
     * Dashboard Censeur
     */
    public function censeur()
    {
        $data = \Illuminate\Support\Facades\Cache::remember('dashboard_censeur', 300, function () {
            return [
                'stats' => [
                    ['title' => 'Total Élèves', 'value' => '1 284', 'trend' => 0, 'trendLabel' => 'effectif total'],
                    ['title' => 'Sanctions', 'value' => '18', 'trend' => -8, 'trendLabel' => 'en baisse'],
                    ['title' => 'Abs. non justifiées', 'value' => '47', 'trend' => -12, 'trendLabel' => 'ce mois'],
                    ['title' => 'Avertissements', 'value' => '12', 'trend' => -3, 'trendLabel' => 'ce trimestre'],
                ],
                'evolution' => [
                    ['mois' => 'Jan', 'sanctions' => 22, 'avertissements' => 15],
                    ['mois' => 'Fév', 'sanctions' => 28, 'avertissements' => 18],
                    ['mois' => 'Mar', 'sanctions' => 20, 'avertissements' => 12],
                    ['mois' => 'Avr', 'sanctions' => 18, 'avertissements' => 10],
                    ['mois' => 'Mai', 'sanctions' => 15, 'avertissements' => 8],
                    ['mois' => 'Juin', 'sanctions' => 12, 'avertissements' => 6],
                ],
                'types_sanctions' => [
                    ['name' => 'Exclusion', 'value' => 15],
                    ['name' => 'Retenue', 'value' => 35],
                    ['name' => 'Avertissement', 'value' => 30],
                    ['name' => "Travail d'Intérêt", 'value' => 20],
                ],
                'sanctions' => [
                    ['id' => 1, 'eleve' => 'Adjeoda K.', 'classe' => '3e A', 'motif' => 'Violence', 'sanction' => 'Exclusion 3j', 'date' => '2026-06-15', 'statut' => 'Exécutée'],
                    ['id' => 2, 'eleve' => 'Bocco E.', 'classe' => '5e B', 'motif' => 'Tricherie', 'sanction' => 'Avertissement', 'date' => '2026-06-14', 'statut' => 'En cours'],
                    ['id' => 3, 'eleve' => 'Dossou Y.', 'classe' => '4e C', 'motif' => 'Absence répétée', 'sanction' => 'Retenue', 'date' => '2026-06-12', 'statut' => 'Exécutée'],
                    ['id' => 4, 'eleve' => 'Gbadamassi M.', 'classe' => '2nde A', 'motif' => 'Insolence', 'sanction' => "Travail d'intérêt", 'date' => '2026-06-10', 'statut' => 'En cours'],
                    ['id' => 5, 'eleve' => 'Hounkpatin R.', 'classe' => '6e A', 'motif' => 'Vol', 'sanction' => 'Exclusion 5j', 'date' => '2026-06-08', 'statut' => 'Exécutée'],
                ],
            ];
        });

        return response()->json(['success' => true, 'data' => $data, 'cached' => true]);
    }

    /**
     * Dashboard Infirmier
     */
    public function infirmier()
    {
        $data = \Illuminate\Support\Facades\Cache::remember('dashboard_infirmier', 300, function () {
            return [
                'stats' => [
                    ['title' => 'Visites du Mois', 'value' => '89', 'trend' => 12, 'trendLabel' => 'vs mois dernier'],
                    ['title' => 'En Cours', 'value' => '3', 'trend' => 1, 'trendLabel' => 'patients actuels'],
                    ['title' => 'Cas Urgents', 'value' => '5', 'trend' => -2, 'trendLabel' => 'ce mois'],
                    ['title' => 'Consultations', 'value' => '312', 'trend' => 8.5, 'trendLabel' => 'cette année'],
                ],
                'frequentation' => [
                    ['mois' => 'Jan', 'visites' => 65, 'urgences' => 8],
                    ['mois' => 'Fév', 'visites' => 72, 'urgences' => 6],
                    ['mois' => 'Mar', 'visites' => 58, 'urgences' => 10],
                    ['mois' => 'Avr', 'visites' => 80, 'urgences' => 7],
                    ['mois' => 'Mai', 'visites' => 75, 'urgences' => 5],
                    ['mois' => 'Juin', 'visites' => 89, 'urgences' => 5],
                ],
                'motifs' => [
                    ['name' => 'Maux de tête', 'value' => 28],
                    ['name' => 'Blessures légères', 'value' => 22],
                    ['name' => 'Maux de ventre', 'value' => 18],
                    ['name' => 'Fièvre', 'value' => 15],
                    ['name' => 'Allergies', 'value' => 10],
                    ['name' => 'Autres', 'value' => 7],
                ],
                'visites' => [
                    ['id' => 1, 'eleve' => 'Mensah J.', 'classe' => '3e A', 'motif' => 'Maux de tête', 'soin' => 'Paracétamol', 'heure' => '08:30', 'statut' => 'Traité'],
                    ['id' => 2, 'eleve' => 'Akakpo A.', 'classe' => '5e B', 'motif' => 'Blessure genou', 'soin' => 'Pansement', 'heure' => '09:15', 'statut' => 'Traité'],
                    ['id' => 3, 'eleve' => 'Koffi D.', 'classe' => 'CE2', 'motif' => 'Fièvre', 'soin' => 'Repos', 'heure' => '10:00', 'statut' => 'Observation'],
                    ['id' => 4, 'eleve' => 'Dossa E.', 'classe' => '4e C', 'motif' => 'Allergie', 'soin' => 'Antihistaminique', 'heure' => '11:30', 'statut' => 'Traité'],
                    ['id' => 5, 'eleve' => 'Amégnigban R.', 'classe' => '2nde A', 'motif' => 'Maux de ventre', 'soin' => 'Antispasmodique', 'heure' => '14:00', 'statut' => 'En attente'],
                ],
            ];
        });

        return response()->json(['success' => true, 'data' => $data, 'cached' => true]);
    }

    /**
     * Dashboard Bibliothécaire
     */
    public function bibliothecaire()
    {
        $data = \Illuminate\Support\Facades\Cache::remember('dashboard_bibliothecaire', 300, function () {
            return [
                'stats' => [
                    ['title' => 'Total Ouvrages', 'value' => '3 240', 'trend' => 5.2, 'trendLabel' => 'nouveautés'],
                    ['title' => 'Emprunts en Cours', 'value' => '142', 'trend' => 8, 'trendLabel' => 'ce mois'],
                    ['title' => 'Retards', 'value' => '23', 'trend' => -5, 'trendLabel' => 'en baisse'],
                    ['title' => 'Membres Actifs', 'value' => '456', 'trend' => 12, 'trendLabel' => 'ce semestre'],
                ],
                'activite' => [
                    ['mois' => 'Jan', 'emprunts' => 120, 'retours' => 95],
                    ['mois' => 'Fév', 'emprunts' => 135, 'retours' => 110],
                    ['mois' => 'Mar', 'emprunts' => 142, 'retours' => 115],
                    ['mois' => 'Avr', 'emprunts' => 128, 'retours' => 120],
                    ['mois' => 'Mai', 'emprunts' => 150, 'retours' => 130],
                    ['mois' => 'Juin', 'emprunts' => 142, 'retours' => 125],
                ],
                'categories' => [
                    ['name' => 'Scolaires', 'value' => 45],
                    ['name' => 'Littérature', 'value' => 25],
                    ['name' => 'Scientifiques', 'value' => 15],
                    ['name' => 'BD/Mangas', 'value' => 10],
                    ['name' => 'Dictionnaires', 'value' => 5],
                ],
                'emprunts' => [
                    ['id' => 1, 'eleve' => 'Mensah J.', 'classe' => '3e A', 'ouvrage' => 'Maths 3e', 'dateEmprunt' => '2026-06-01', 'dateRetour' => '2026-06-15', 'statut' => 'En cours'],
                    ['id' => 2, 'eleve' => 'Akakpo A.', 'classe' => '5e B', 'ouvrage' => 'Le Petit Prince', 'dateEmprunt' => '2026-05-20', 'dateRetour' => '2026-06-03', 'statut' => 'En retard'],
                    ['id' => 3, 'eleve' => 'Koffi D.', 'classe' => '6e A', 'ouvrage' => 'Atlas Mondial', 'dateEmprunt' => '2026-06-05', 'dateRetour' => '2026-06-19', 'statut' => 'En cours'],
                    ['id' => 4, 'eleve' => 'Dossa E.', 'classe' => '4e C', 'ouvrage' => 'Physique 4e', 'dateEmprunt' => '2026-06-10', 'dateRetour' => '2026-06-24', 'statut' => 'En cours'],
                    ['id' => 5, 'eleve' => 'Amégnigban R.', 'classe' => '2nde A', 'ouvrage' => 'Bescherelle', 'dateEmprunt' => '2026-05-15', 'dateRetour' => '2026-05-29', 'statut' => 'En retard'],
                ],
            ];
        });

        return response()->json(['success' => true, 'data' => $data, 'cached' => true]);
    }

    /**
     * Dashboard Secrétaire
     */
    public function secretaire()
    {
        $data = \Illuminate\Support\Facades\Cache::remember('dashboard_secretaire', 300, function () {
            return [
                'stats' => [
                    ['title' => 'Total Inscriptions', 'value' => '1 284', 'trend' => 3.2, 'trendLabel' => 'cette année'],
                    ['title' => 'Nouveaux', 'value' => '38', 'trend' => 8, 'trendLabel' => 'ce mois'],
                    ['title' => 'Dossiers en Cours', 'value' => '7', 'trend' => -3, 'trendLabel' => 'en baisse'],
                    ['title' => 'Documents Générés', 'value' => '156', 'trend' => 15, 'trendLabel' => 'ce mois'],
                ],
                'flux_inscriptions' => [
                    ['mois' => 'Jan', 'nouveaux' => 42, 'transferts' => 8],
                    ['mois' => 'Fév', 'nouveaux' => 28, 'transferts' => 5],
                    ['mois' => 'Mar', 'nouveaux' => 35, 'transferts' => 10],
                    ['mois' => 'Avr', 'nouveaux' => 22, 'transferts' => 6],
                    ['mois' => 'Mai', 'nouveaux' => 18, 'transferts' => 4],
                    ['mois' => 'Juin', 'nouveaux' => 38, 'transferts' => 12],
                ],
                'rendez_vous' => [
                    ['id' => 1, 'visiteur' => 'M. Akakpo', 'motif' => 'Inscription 6e A', 'heure' => '08:30', 'statut' => 'Confirmé'],
                    ['id' => 2, 'visiteur' => 'Mme Hountondji', 'motif' => 'Réinscription 4e B', 'heure' => '09:30', 'statut' => 'Confirmé'],
                    ['id' => 3, 'visiteur' => 'M. Dossa', 'motif' => 'Demande documents', 'heure' => '10:00', 'statut' => 'En attente'],
                    ['id' => 4, 'visiteur' => 'Mme Koffi', 'motif' => 'Changement classe', 'heure' => '11:30', 'statut' => 'Confirmé'],
                    ['id' => 5, 'visiteur' => 'M. Gbaguidi', 'motif' => 'Information bourse', 'heure' => '14:00', 'statut' => 'En attente'],
                ],
                'inscriptions' => [
                    ['id' => 1, 'nom' => 'Mensah Jean', 'classe' => '3e A', 'type' => 'Nouveau', 'date' => '2026-06-15', 'statut' => 'Complété'],
                    ['id' => 2, 'nom' => 'Akakpo Ama', 'classe' => '5e B', 'type' => 'Réinscription', 'date' => '2026-06-14', 'statut' => 'Complété'],
                    ['id' => 3, 'nom' => 'Koffi David', 'classe' => '6e A', 'type' => 'Nouveau', 'date' => '2026-06-13', 'statut' => 'En attente'],
                    ['id' => 4, 'nom' => 'Dossa Emile', 'classe' => '4e C', 'type' => 'Réinscription', 'date' => '2026-06-12', 'statut' => 'Complété'],
                    ['id' => 5, 'nom' => 'Amégnigban Rose', 'classe' => '2nde A', 'type' => 'Nouveau', 'date' => '2026-06-11', 'statut' => 'En attente'],
                ],
            ];
        });

        return response()->json(['success' => true, 'data' => $data, 'cached' => true]);
    }

    private function calculateAverage($notes)
    {
        if ($notes->isEmpty()) return null;

        return $notes->avg('note');
    }

    private function computeMonthlyEnrollment(): array
    {
        // Tente de récupérer les inscriptions par mois depuis la base
        try {
            $eleves = \App\Models\Eleve::selectRaw('MONTH(created_at) as mois, COUNT(*) as total')
                ->whereYear('created_at', now()->year)
                ->groupBy('mois')
                ->pluck('total', 'mois')
                ->toArray();

            $months = ['Sept', 'Oct', 'Nov', 'Déc', 'Jan', 'Fév', 'Mar', 'Avr', 'Mai', 'Juin', 'Juil', 'Août'];

            return array_map(function ($i) use ($eleves) {
                return [
                    'name' => $months[$i - 1] ?? "Mois $i",
                    'students' => $eleves[$i] ?? 0,
                ];
            }, range(1, 12));
        } catch (\Exception $e) {
            return [
                ['name' => 'Aucune', 'students' => 0],
            ];
        }
    }

    private function computeGradeDistribution(): array
    {
        try {
            $excellent = \App\Models\Note::where('note', '>=', 16)->count();
            $bien = \App\Models\Note::whereBetween('note', [14, 15.99])->count();
            $moyen = \App\Models\Note::whereBetween('note', [10, 13.99])->count();
            $insuffisant = \App\Models\Note::where('note', '<', 10)->count();

            return [
                ['name' => 'Excellent', 'value' => $excellent ?: 0],
                ['name' => 'Bien', 'value' => $bien ?: 0],
                ['name' => 'Moyen', 'value' => $moyen ?: 0],
                ['name' => 'Insuffisant', 'value' => $insuffisant ?: 0],
            ];
        } catch (\Exception $e) {
            return [
                ['name' => 'Aucune donnée', 'value' => 0],
            ];
        }
    }
}