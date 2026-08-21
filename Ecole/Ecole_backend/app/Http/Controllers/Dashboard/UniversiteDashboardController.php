<?php

namespace App\Http\Controllers\Dashboard;

use App\Http\Controllers\Controller;
use Illuminate\Support\Facades\Cache;

class UniversiteDashboardController extends Controller
{
    use DashboardHelpers;

    /**
     * Dashboard Université — données réelles depuis les tables universitaires
     */
    public function universite()
    {
        $ecoleId = \App\Models\Eleve::currentEcoleId() ?? 'global';
        $data = Cache::remember('dashboard_universite_' . $ecoleId, 300, function () {
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
                    'diplomes' => null,
                ]);

            // Stats par faculté
            $facultes = $facultesModel::withCount(['departements'])
                ->get()
                ->map(function ($f) use ($etudiantsModel, $enseignantsModel) {
                    $deptIds = $f->departements->pluck('id');
                    $filiereIds = \App\Models\Universite\Filiere::whereIn('departement_id', $deptIds)->pluck('id');
                    $etudiantsCount = $etudiantsModel::whereIn('filiere_id', $filiereIds)->count();
                    // `enseignants_count ?? 0` renvoyait toujours 0 : la relation
                    // n'existe pas sur Faculte. Les enseignants sont rattachés à
                    // un département, lui-même à une faculté (cf. audit P3).
                    $enseignantsCount = $enseignantsModel::whereHas('departement', fn ($q) => $q->where('faculte_id', $f->id))->count();

                    return [
                        'nom' => $f->nom,
                        'etudiants' => $etudiantsCount,
                        'enseignants' => $enseignantsCount,
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
                    'message' => "Nouvel étudiant inscrit — {$i->etudiant?->nom} {$i->etudiant?->prenom}",
                    'temps' => $i->date_inscription ? $i->date_inscription->diffForHumans() : null,
                ]);

            return [
                'stats' => [
                    ['title' => 'Facultés', 'value' => (string) $facultesCount, 'trend' => 0, 'trendLabel' => 'total'],
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

        return response()->json(['success' => true, 'data' => $data]);
    }
}
