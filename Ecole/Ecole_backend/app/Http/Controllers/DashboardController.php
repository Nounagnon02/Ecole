<?php

namespace App\Http\Controllers;

use App\Models\{User, Eleve, Classes, Notes, Matieres};
use Illuminate\Http\Request;

class DashboardController extends Controller
{
    public function directeur()
    {
        return response()->json([
            'success' => true,
            'data' => [
                'total_eleves' => Eleve::count(),
                'total_classes' => Classes::count(),
                'total_enseignants' => User::where('role', 'enseignant')->where('ecole_id', auth()->user()?->ecole_id)->count(),
                'classes' => Classes::with(['eleves', 'enseignants'])->get()
            ]
        ]);
    }

    /**
     * Endpoint consolidé pour le dashboard directeur
     * Retourne toutes les données en une seule requête avec cache de 5 minutes
     */
    public function getDashboardData()
    {
        $ecoleId = auth()->user()?->ecole_id ?? 'global';
        $data = \Illuminate\Support\Facades\Cache::remember('dashboard_directeur_' . $ecoleId, 300, function () {
            return [
                'classes' => Classes::with('series')->get(),
                'classes_effectif' => Classes::withCount('eleves')->get()->map(function ($c) {
                    $c->effectif = $c->eleves_count;
                    return $c;
                }),
                'eleves' => Eleve::select('id', 'user_id', 'class_id', 'numero_matricule', 'ecole_id')->get(),
                'matieres' => Matieres::select('id', 'nom', 'coefficient', 'code', 'ecole_id')->get(),
                'matieres_series' => Matieres::with('series')->get(),
                'series' => \App\Models\Series::with('matieres')->get(),
                'stats' => [
                    'total_eleves' => Eleve::count(),
                    'total_classes' => Classes::count(),
                    'total_enseignants' => User::where('role', 'enseignant')->where('ecole_id', auth()->user()?->ecole_id)->count(),
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

        // Récupérer les classes et matières de l'enseignant
        $matiereIds = $enseignant->matieres()->pluck('matieres.id');
        $classeIds = $enseignant->classes()->pluck('classes.id');

        // Notes liées à l'enseignant via ses classes et matières
        $notes = Notes::whereIn('classe_id', $classeIds)
            ->whereIn('matiere_id', $matiereIds)
            ->with(['eleve', 'matiere'])
            ->latest()
            ->take(10)
            ->get();

        return response()->json([
            'success' => true,
            'data' => [
                'classes' => $enseignant->classes()->with('eleves')->get(),
                'matieres' => $enseignant->matieres,
                'notes_recentes' => $notes,
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
     * Dashboard Élève — données réelles
     */
    public function eleve(Request $request)
    {
        $user = $request->user();
        $eleve = $user->eleve;

        if (!$eleve) {
            return response()->json(['success' => false, 'message' => 'Profil élève non trouvé'], 404);
        }

        $notes = \App\Models\Notes::where('eleve_id', $eleve->id)
            ->with('matiere')
            ->get();

        $moyenneGenerale = $notes->avg('note');
        $absences = \App\Models\Absence::where('eleve_id', $eleve->id)
            ->whereMonth('date', now()->month)
            ->count();

        $notesByMatiere = $notes->groupBy('matiere.nom')->map(function ($group, $nom) {
            return [
                'name' => $nom,
                'note' => round($group->avg('note'), 2),
                'coeff' => $group->first()->matiere->coefficient ?? 1,
            ];
        })->values();

        $emploiDuTemps = \App\Models\EmploiDuTemps::where('classe_id', $eleve->class_id)
            ->with(['matiere', 'enseignant.user'])
            ->orderBy('jour')
            ->get();

        return response()->json([
            'success' => true,
            'data' => [
                'eleve' => [
                    'id' => $eleve->id,
                    'nom' => $user->name,
                    'prenom' => $user->prenom,
                    'classe' => $eleve->classe->nom_classe ?? null,
                    'matricule' => $eleve->numero_matricule,
                ],
                'stats' => [
                    'moyenne_generale' => $moyenneGenerale ? round($moyenneGenerale, 2) : null,
                    'total_notes' => $notes->count(),
                    'absences_mois' => $absences,
                ],
                'matieres' => $notesByMatiere,
                'emploi_du_temps' => $emploiDuTemps,
            ],
        ]);
    }

    /**
     * Dashboard Admin — données réelles
     */
    public function admin()
    {
        $ecoleId = auth()->user()?->ecole_id ?? 'global';
        $data = \Illuminate\Support\Facades\Cache::remember('dashboard_admin_' . $ecoleId, 120, function () {
            $totalEcoles = \App\Models\Ecole::count();
            $totalUsers = User::count();
            $activeUsers = User::where('is_active', true)->count();
            $tauxActivite = $totalUsers > 0 ? round(($activeUsers / $totalUsers) * 100) : 0;

            $repartitionRoles = User::selectRaw('role, COUNT(*) as total')
                ->groupBy('role')
                ->pluck('total', 'role')
                ->map(fn($v, $k) => ['name' => ucfirst($k), 'value' => $v])
                ->values();

            return [
                'stats' => [
                    ['title' => 'Total Écoles', 'value' => (string) $totalEcoles, 'trend' => 0, 'trendLabel' => 'établissements'],
                    ['title' => 'Utilisateurs', 'value' => number_format($totalUsers), 'trend' => 0, 'trendLabel' => 'inscrits'],
                    ['title' => "Taux d'Activité", 'value' => "{$tauxActivite}%", 'trend' => 0, 'trendLabel' => 'actifs'],
                ],
                'repartition_roles' => $repartitionRoles,
            ];
        });

        return response()->json(['success' => true, 'data' => $data]);
    }

    /**
     * Dashboard Université — données réelles depuis les tables universitaires
     */
    public function universite()
    {
        $ecoleId = auth()->user()?->ecole_id ?? 'global';
        $data = \Illuminate\Support\Facades\Cache::remember('dashboard_universite_' . $ecoleId, 300, function () {
            $facultesModel = \App\Models\Universite\Faculte::class;
            $departementsModel = \App\Models\Universite\Departement::class;
            $etudiantsModel = \App\Models\Universite\Etudiant::class;
            $enseignantsModel = \App\Models\Universite\Enseignant::class;
            $inscriptionsModel = \App\Models\Universite\Inscription::class;

            $facultesCount = $facultesModel::count();
            $departementsCount = $departementsModel::count();
            $enseignantsCount = $enseignantsModel::count();
            $etudiantsCount = $etudiantsModel::count();

            $totalInscrits = $inscriptionsModel::count();

            // Inscriptions par année académique
            $anneeModel = \App\Models\Universite\AnneeAcademique::class;
            $inscriptionsParAnnee = $anneeModel::withCount('inscriptions')
                ->orderBy('date_debut', 'desc')
                ->take(5)
                ->get()
                ->map(fn($a) => [
                    'annee' => $a->libelle ?? $a->annee,
                    'inscriptions' => $a->inscriptions_count,
                    'diplomes' => $a->diplomes_count ?? null,
                ]);

            // Stats par faculté
            $facultes = $facultesModel::withCount(['departements'])
                ->get()
                ->map(function ($f) use ($etudiantsModel) {
                    $deptIds = $f->departements->pluck('id');
                    $filiereIds = \App\Models\Universite\Filiere::whereIn('departement_id', $deptIds)->pluck('id');
                    $etudiantsCount = $etudiantsModel::whereIn('filiere_id', $filiereIds)->count();
                    return [
                        'nom' => $f->nom,
                        'etudiants' => $etudiantsCount,
                        'enseignants' => $f->enseignants_count ?? 0,
                        'departements' => $f->departements_count,
                    ];
                })->values();

            // Activités récentes (dernières inscriptions)
            $recentInscriptions = $inscriptionsModel::with('etudiant')
                ->latest('date_inscription')
                ->take(5)
                ->get()
                ->map(fn($i) => [
                    'id' => $i->id,
                    'type' => 'inscription',
                    'message' => "Nouvel étudiant inscrit — {$i->etudiant?->prenom} {$i->etudiant?->nom}",
                    'temps' => $i->date_inscription ? $i->date_inscription->diffForHumans() : null,
                ]);

            return [
                'stats' => [
                    ['title' => 'Facultés', 'value' => (string) $facultesCount, 'trend' => 0, 'trendLabel' => 'ce semestre'],
                    ['title' => 'Départements', 'value' => (string) $departementsCount, 'trend' => 0, 'trendLabel' => 'total'],
                    ['title' => 'Enseignants', 'value' => number_format($enseignantsCount), 'trend' => 0, 'trendLabel' => 'en activité'],
                    ['title' => 'Étudiants', 'value' => number_format($etudiantsCount), 'trend' => 0, 'trendLabel' => 'inscrits'],
                ],
                'inscriptions' => $inscriptionsParAnnee->isNotEmpty()
                    ? $inscriptionsParAnnee
                    : [['annee' => 'Aucune donnée', 'inscriptions' => 0, 'diplomes' => null]],
                'facultes' => $facultes->isNotEmpty()
                    ? $facultes
                    : [['nom' => 'Aucune faculté', 'etudiants' => 0, 'enseignants' => 0, 'departements' => 0]],
                'activites' => $recentInscriptions->isNotEmpty()
                    ? $recentInscriptions
                    : [['id' => 0, 'type' => 'info', 'message' => 'Aucune activité récente', 'temps' => null]],
            ];
        });

        return response()->json(['success' => true, 'data' => $data, 'cached' => true]);
    }

    // ─── STAFF DASHBOARDS (6 rôles — R4) ────────────────────────────

    /**
     * Dashboard Comptable — données réelles
     */
    public function comptable()
    {
        $data = \Illuminate\Support\Facades\Cache::remember('dashboard_comptable_' . auth()->id(), 120, function () {
            $moisActuel = now()->month;
            $anneeActuelle = now()->year;

            $revenusMois = \App\Models\PaiementEleve::whereMonth('date_paiement', $moisActuel)
                ->whereYear('date_paiement', $anneeActuelle)
                ->where('statut', 'paye')
                ->sum('montant');

            $enAttente = \App\Models\PaiementEleve::where('statut', 'en_attente')->count();

            $totalPaiements = \App\Models\PaiementEleve::whereMonth('date_paiement', $moisActuel)->count();
            $payes = \App\Models\PaiementEleve::whereMonth('date_paiement', $moisActuel)->where('statut', 'paye')->count();
            $tauxRecouvrement = $totalPaiements > 0 ? round(($payes / $totalPaiements) * 100) : 0;

            $donneesMensuelles = \App\Models\PaiementEleve::selectRaw('MONTH(date_paiement) as mois, SUM(montant) as revenus')
                ->whereYear('date_paiement', $anneeActuelle)
                ->where('statut', 'paye')
                ->groupBy('mois')
                ->orderBy('mois')
                ->get()
                ->map(fn($r) => ['mois' => $r->mois, 'revenus' => $r->revenus]);

            $dernieresPaiements = \App\Models\PaiementEleve::with(['eleve.user', 'eleve.classe'])
                ->latest('date_paiement')
                ->take(10)
                ->get()
                ->map(fn($p) => [
                    'id' => $p->id,
                    'eleve' => $p->eleve?->user?->name . ' ' . $p->eleve?->user?->prenom,
                    'classe' => $p->eleve?->classe?->nom_classe,
                    'montant' => $p->montant,
                    'statut' => $p->statut,
                    'date' => $p->date_paiement,
                ]);

            return [
                'stats' => [
                    ['title' => 'Revenus du Mois', 'value' => number_format($revenusMois, 0, ',', ' ') . ' F', 'trend' => 0],
                    ['title' => 'Factures en Attente', 'value' => (string) $enAttente, 'trend' => 0],
                    ['title' => 'Taux Recouvrement', 'value' => "{$tauxRecouvrement}%", 'trend' => 0],
                ],
                'donnes_ca' => $donneesMensuelles,
                'factures' => $dernieresPaiements,
            ];
        });

        return response()->json(['success' => true, 'data' => $data]);
    }

    /**
     * Dashboard Surveillant — données réelles
     */
    public function surveillant()
    {
        $data = \Illuminate\Support\Facades\Cache::remember('dashboard_surveillant_' . auth()->id(), 60, function () {
            $totalEleves = \App\Models\Eleve::count();
            $absentsAujourdhui = \App\Models\Absence::whereDate('date', today())->count();
            $presents = $totalEleves - $absentsAujourdhui;

            $absencesParJour = \App\Models\Absence::selectRaw('DATE(date) as jour, COUNT(*) as absents')
                ->whereBetween('date', [now()->startOfWeek(), now()->endOfWeek()])
                ->groupBy('jour')
                ->orderBy('jour')
                ->get()
                ->map(fn($r) => ['jour' => $r->jour, 'absents' => $r->absents, 'presents' => $totalEleves - $r->absents]);

            $derniersRetards = \App\Models\Absence::with(['eleve.user', 'eleve.classe'])
                ->where('type', 'retard')
                ->latest('date')
                ->take(10)
                ->get()
                ->map(fn($a) => [
                    'id' => $a->id,
                    'eleve' => $a->eleve?->user?->name,
                    'classe' => $a->eleve?->classe?->nom_classe,
                    'motif' => $a->motif,
                    'date' => $a->date,
                    'justifiee' => $a->justifiee,
                ]);

            return [
                'stats' => [
                    ['title' => 'Total Élèves', 'value' => (string) $totalEleves],
                    ['title' => 'Présents', 'value' => (string) $presents],
                    ['title' => 'Absents', 'value' => (string) $absentsAujourdhui],
                ],
                'presences_semaine' => $absencesParJour,
                'retards' => $derniersRetards,
            ];
        });

        return response()->json(['success' => true, 'data' => $data]);
    }

    /**
     * Dashboard Censeur — données réelles
     */
    public function censeur()
    {
        $data = \Illuminate\Support\Facades\Cache::remember('dashboard_censeur_' . auth()->id(), 120, function () {
            $totalEleves = \App\Models\Eleve::count();
            $sanctionsMois = \App\Models\Sanction::whereMonth('created_at', now()->month)->count();
            $absencesNonJustifiees = \App\Models\Absence::where('justifiee', false)
                ->whereMonth('date', now()->month)->count();

            $evolutionMensuelle = \App\Models\Sanction::selectRaw('MONTH(created_at) as mois, COUNT(*) as sanctions')
                ->whereYear('created_at', now()->year)
                ->groupBy('mois')
                ->orderBy('mois')
                ->get()
                ->map(fn($r) => ['mois' => $r->mois, 'sanctions' => $r->sanctions]);

            $dernieresSanctions = \App\Models\Sanction::with(['eleve.user', 'eleve.classe'])
                ->latest()
                ->take(10)
                ->get()
                ->map(fn($s) => [
                    'id' => $s->id,
                    'eleve' => $s->eleve?->user?->name,
                    'classe' => $s->eleve?->classe?->nom_classe,
                    'motif' => $s->motif,
                    'sanction' => $s->type_sanction ?? $s->description,
                    'date' => $s->created_at->toDateString(),
                    'statut' => $s->statut ?? 'En cours',
                ]);

            return [
                'stats' => [
                    ['title' => 'Total Élèves', 'value' => (string) $totalEleves],
                    ['title' => 'Sanctions', 'value' => (string) $sanctionsMois],
                    ['title' => 'Abs. non justifiées', 'value' => (string) $absencesNonJustifiees],
                ],
                'evolution' => $evolutionMensuelle,
                'sanctions' => $dernieresSanctions,
            ];
        });

        return response()->json(['success' => true, 'data' => $data]);
    }

    /**
     * Dashboard Infirmier — données réelles
     */
    public function infirmier()
    {
        $data = \Illuminate\Support\Facades\Cache::remember('dashboard_infirmier_' . auth()->id(), 60, function () {
            $visitesAujourdhui = \App\Models\ConsultationMedicale::whereDate('created_at', today())->count();
            $visitesMois = \App\Models\ConsultationMedicale::whereMonth('created_at', now()->month)->count();
            $enObservation = \App\Models\ConsultationMedicale::where('statut', 'observation')->count();

            $dernieresVisites = \App\Models\ConsultationMedicale::with(['eleve.user', 'eleve.classe'])
                ->latest()
                ->take(10)
                ->get()
                ->map(fn($c) => [
                    'id' => $c->id,
                    'eleve' => $c->eleve?->user?->name,
                    'classe' => $c->eleve?->classe?->nom_classe,
                    'motif' => $c->motif,
                    'soin' => $c->traitement,
                    'statut' => $c->statut ?? 'Traité',
                    'date' => $c->created_at->format('H:i'),
                ]);

            return [
                'stats' => [
                    ['title' => 'Visites du Mois', 'value' => (string) $visitesMois],
                    ['title' => 'Aujourd\'hui', 'value' => (string) $visitesAujourdhui],
                    ['title' => 'En Observation', 'value' => (string) $enObservation],
                ],
                'visites' => $dernieresVisites,
            ];
        });

        return response()->json(['success' => true, 'data' => $data]);
    }

    /**
     * Dashboard Bibliothécaire — données réelles
     */
    public function bibliothecaire()
    {
        $data = \Illuminate\Support\Facades\Cache::remember('dashboard_bibliothecaire_' . auth()->id(), 120, function () {
            $totalLivres = \App\Models\Livre::count();
            $empruntsEnCours = \App\Models\Emprunt::where('statut', 'en_cours')->count();
            $retards = \App\Models\Emprunt::where('statut', 'en_cours')
                ->where('date_retour_prevue', '<', today())->count();

            $derniersEmprunts = \App\Models\Emprunt::with(['eleve.user', 'eleve.classe', 'livre'])
                ->latest()
                ->take(10)
                ->get()
                ->map(fn($e) => [
                    'id' => $e->id,
                    'eleve' => $e->eleve?->user?->name,
                    'classe' => $e->eleve?->classe?->nom_classe,
                    'ouvrage' => $e->livre?->titre,
                    'dateEmprunt' => $e->date_emprunt,
                    'dateRetour' => $e->date_retour_prevue,
                    'statut' => $e->statut,
                ]);

            return [
                'stats' => [
                    ['title' => 'Total Ouvrages', 'value' => (string) $totalLivres],
                    ['title' => 'Emprunts en Cours', 'value' => (string) $empruntsEnCours],
                    ['title' => 'Retards', 'value' => (string) $retards],
                ],
                'emprunts' => $derniersEmprunts,
            ];
        });

        return response()->json(['success' => true, 'data' => $data]);
    }

    /**
     * Dashboard Secrétaire — données réelles
     */
    public function secretaire()
    {
        $data = \Illuminate\Support\Facades\Cache::remember('dashboard_secretaire_' . auth()->id(), 120, function () {
            $totalInscriptions = \App\Models\Eleve::count();
            $nouveauxMois = \App\Models\Eleve::whereMonth('created_at', now()->month)->count();

            $rendezVous = \App\Models\RendezVous::whereDate('date', today())
                ->latest()
                ->take(10)
                ->get()
                ->map(fn($r) => [
                    'id' => $r->id,
                    'visiteur' => $r->nom_visiteur,
                    'motif' => $r->motif,
                    'heure' => $r->heure,
                    'statut' => $r->statut,
                ]);

            $dernieresInscriptions = \App\Models\Eleve::with(['user', 'classe'])
                ->latest()
                ->take(10)
                ->get()
                ->map(fn($e) => [
                    'id' => $e->id,
                    'nom' => $e->user?->name . ' ' . $e->user?->prenom,
                    'classe' => $e->classe?->nom_classe,
                    'date' => $e->created_at->toDateString(),
                    'statut' => 'Complété',
                ]);

            return [
                'stats' => [
                    ['title' => 'Total Inscriptions', 'value' => (string) $totalInscriptions],
                    ['title' => 'Nouveaux ce Mois', 'value' => (string) $nouveauxMois],
                ],
                'rendez_vous' => $rendezVous,
                'inscriptions' => $dernieresInscriptions,
            ];
        });

        return response()->json(['success' => true, 'data' => $data]);
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

            return array_map(function ($i) use ($months, $eleves) {
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
            $excellent = \App\Models\Notes::where('note', '>=', 16)->count();
            $bien = \App\Models\Notes::whereBetween('note', [14, 15.99])->count();
            $moyen = \App\Models\Notes::whereBetween('note', [10, 13.99])->count();
            $insuffisant = \App\Models\Notes::where('note', '<', 10)->count();

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