<?php

namespace App\Http\Controllers;

use App\Models\Classes;
use App\Models\Eleve;
use App\Models\EnseignantMatiere;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Log;

/**
 * Le fichier comptait 37 méthodes : sept routées (`index`, `store`, `show`,
 * `update`, `destroy`, `getEleves`, `getEnseignants`), le reste jamais
 * appelé — ni par une route, ni entre elles, ni par un test. Beaucoup
 * duplicaient une même requête paramétrée par cycle
 * (`getEffectifEcole/Maternelle/Primaire/Secondaire`,
 * `getClassesWithSeriesAndMatieres*`, `getClassesWithEffectif*`,
 * `getClassesM/P/S`, `getClassesWithPeriodesAndTypes*`) — exactement la
 * near-duplication que l'audit signalait (cf. audit P4.4), en plus grave :
 * le code dupliqué ne servait à rien.
 *
 * Retiré avec elles : `App\Support\Cycles`, qui n'était importé que pour ce
 * code mort.
 */
class ClassesController extends Controller
{
    public function store(\App\Http\Requests\StoreClasseRequest $request)
    {
        try {
            $validated = $request->validated();

            $classe = Classes::create([
                'nom_classe' => $validated['nom_classe'],
                'categorie_classe' => $validated['categorie_classe'],
                'capacite_max' => $validated['capacite_max'] ?? null,
            ]);

            // `event(new Registered($classe))` a été retiré : la classe n'était
            // pas importée (Error fatale non rattrapée par catch(\Exception) →
            // 500 systématique), et Registered est un événement d'inscription
            // d'utilisateur, sans rapport avec la création d'une classe (F4).
            \Cache::forget('dashboard_directeur_' . (auth()->user()->ecole_id ?? 'global'));

            return response()->json($classe, 201);

        } catch (\Exception $e) {
            $this->rethrowIfMeaningful($e);
            Log::error('Erreur création classe', ['error' => $e->getMessage()]);
            return response()->json([
                'message' => 'Erreur lors de l\'ajout',
            ], 500);
        }
    }

    // Met à jour une classe spécifique
    public function update(Request $request, $id)
    {
        $classe = Classes::find($id);

        if (!$classe) {
            return response()->json(['message' => 'Classe non trouvée'], 404);
        }

        $validatedData = $request->validate([
            'nom_classe'=>'string|required',
            'capacite_max'=>'nullable|integer|min:1'
        ]);

        $classe->update($validatedData);

        return response()->json($classe, 200);
    }

    // Supprime une classe spécifique
    public function destroy($id)
    {
        $classe = Classes::find($id);
        if (!$classe) {
            return response()->json(['message' => 'Classe non trouvée'], 404);
        }

        $elevesCount = $classe->eleves()->count();
        if ($elevesCount > 0) {
            return response()->json([
                'message' => "Impossible de supprimer : {$elevesCount} élève(s) inscrit(s) dans cette classe"
            ], 422);
        }

        $classe->delete();

        return response()->json(['message' => 'Classe supprimée']);
    }

    // Récupère toutes les classes avec leurs séries, matières et enseignants
    public function index(Request $request)
    {
        $query = Classes::query();
        // Filtrage par catégorie de classe
        if ($request->has('categorie_classe')) {
            $query->where('categorie_classe', $request->input('categorie_classe'));
        }
        // Chargement des relations selon les paramètres
        if ($request->has('with_series')) {
            $query->with('series');
        }

        if ($request->has('with_matieres')) {
            $query->with('series.matieres');
        }

        if ($request->has('with_enseignants')) {
            $query->with('series.matieres.enseignants');
        }

        $classes = $query->get();

        return response()->json($classes);
    }

    // Récupère une classe spécifique
    public function show($id)
    {
        $classe = Classes::findOrFail($id);
        return response()->json($classe);
    }

    public function getEleves($id)
    {
        // `DB::table` contournait le scope BelongsToEcole, et les colonnes
        // visées n'existent pas : la clé est `classe_id`, le matricule
        // `numero_matricule`, et nom/prénom vivent sur `users`.
        $eleves = Eleve::with('user:id,name,prenom')
            ->where('classe_id', $id)
            ->get(['id', 'user_id', 'numero_matricule'])
            ->map(fn($e) => [
                'id' => $e->id,
                'nom' => $e->user->name ?? '',
                'prenom' => $e->user->prenom ?? '',
                'matricule' => $e->numero_matricule,
            ]);

        return response()->json(['success' => true, 'data' => $eleves]);
    }

    /**
     * Enseignants affectés à une classe (via le pivot enseignant_matiere),
     * avec la matière et la série couvertes.
     * GET /classes/{id}/enseignants
     */
    public function getEnseignants($id)
    {
        $classe = Classes::find($id);
        if (!$classe) {
            return response()->json(['message' => 'Classe non trouvée'], 404);
        }

        $enseignants = EnseignantMatiere::withoutGlobalScope('ecole')
            ->where('classe_id', $id)
            ->with([
                'enseignant.user:id,name,prenom',
                'matiere:id,nom',
                'serie:id,nom',
            ])
            ->orderBy('matiere_id')
            ->get(['id', 'enseignant_id', 'matiere_id', 'serie_id']);

        return response()->json(['success' => true, 'data' => $enseignants]);
    }
}
