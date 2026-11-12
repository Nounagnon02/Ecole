<?php

namespace App\Http\Controllers;

use App\Http\Controllers\Concerns\ScopesToCaller;
use App\Models\Bulletin;
use App\Models\Notes;
use App\Services\BulletinService;
use App\Support\AnneeScolaire;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Validator;

/**
 * Archives des bulletins verrouillés.
 *
 * POST /bulletins/verrouiller fige le bulletin d'une classe pour une période
 * (instantané des moyennes + mention), GET /bulletins le relit dans le périmètre
 * du demandeur.
 */
class BulletinsController extends Controller
{
    use ScopesToCaller;

    public function index(Request $request)
    {
        $this->authorize('viewAny', Bulletin::class);

        $query = Bulletin::query()
            ->when($request->filled('periode'), fn ($q) => $q->where('periode', $request->periode))
            ->when($request->filled('annee_scolaire'), fn ($q) => $q->where('annee_scolaire', $request->annee_scolaire))
            ->when($request->filled('classe_id'), fn ($q) => $q->where('classe_id', $request->classe_id))
            ->when($request->filled('eleve_id'), fn ($q) => $q->where('eleve_id', $request->eleve_id));

        $this->restrictToCallerScope($query);

        $rows = $query
            ->with(['eleve.user:id,name,prenom', 'classe:id,nom_classe'])
            ->orderByDesc('annee_scolaire')
            ->orderBy('periode')
            ->orderBy('rang')
            ->get();

        return response()->json(['success' => true, 'data' => $rows]);
    }

    /**
     * Verrouille le bulletin d'une classe pour une période : un enregistrement
     * `bulletins` par élève, figé à partir de l'instantané `moyennes`.
     */
    public function verrouiller(Request $request, BulletinService $service)
    {
        $this->authorize('create', Bulletin::class);

        $validated = Validator::make($request->all(), [
            'classe_id' => 'required|school_exists:classes,id',
            'periode' => 'required|in:Trimestre 1,Trimestre 2,Trimestre 3',
            'annee_scolaire' => 'nullable|string|regex:/^\d{4}-\d{4}$/',
        ])->validate();

        // Verrouiller sans calcul préalable figeait un instantané vide ou
        // périmé, et la réponse était une liste vide sans explication. Le
        // calcul fait donc partie du verrouillage.
        $annee = $validated['annee_scolaire'] ?? null;
        $service->recalculerClasseMoyennes($validated['classe_id'], $validated['periode'], $annee);
        $bulletins = $service->archiverClasse($validated['classe_id'], $validated['periode'], $annee);

        if ($bulletins->isEmpty()) {
            return response()->json([
                'success' => false,
                'message' => 'Aucune note n’est saisie pour cette classe sur cette période : il n’y a pas de bulletin à établir.',
            ], 422);
        }

        // Les notes qui ont servi au bulletin sont figées avec lui : une
        // correction passe désormais par un déverrouillage explicite.
        $verrouillees = Notes::where('classe_id', $validated['classe_id'])
            ->where('periode', $validated['periode'])
            ->where('annee_scolaire', $annee ?? AnneeScolaire::courante())
            ->where('locked', false)
            ->update(['locked' => true]);

        foreach ($bulletins->load('eleve.user:id,name,prenom') as $bulletin) {
            if ($bulletin->eleve) {
                \App\Support\AvisParents::envoyer($bulletin->eleve, 'bulletin', [
                    'periode' => $bulletin->periode,
                    'moyenne' => number_format((float) $bulletin->moyenne_generale, 2, ',', ''),
                    'rang' => $bulletin->rang.'/'.$bulletin->total_eleves,
                ]);
            }
        }

        return response()->json([
            'success' => true,
            'data' => $bulletins,
            'notes_verrouillees' => $verrouillees,
        ]);
    }
}
