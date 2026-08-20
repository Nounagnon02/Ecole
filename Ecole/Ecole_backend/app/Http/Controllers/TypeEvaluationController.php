<?php

namespace App\Http\Controllers;

use App\Models\TypeEvaluation;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Log;
use App\Support\Cycles;

class TypeEvaluationController extends Controller
{
    // ─── CRUD ────────────────────────────────────────────────────────

    public function store(Request $request)
    {
        $validated = $request->validate(['nom' => 'string|required']);
        return response()->json(TypeEvaluation::create($validated), 201);
    }

    public function index()
    {
        return response()->json(TypeEvaluation::all());
    }

    public function destroy($id)
    {
        $deleted = DB::table('typeevaluation_classes')->where('id', $id)->delete();
        return $deleted
            ? response()->json(['message' => 'Liaison supprimée avec succès'])
            : response()->json(['message' => 'Liaison non trouvée'], 404);
    }

    public function update(Request $request, $id)
    {
        $validated = $request->validate([
            'classe_id' => 'required|school_exists:classes,id',
            'serie_id' => 'nullable|school_exists:series,id',
            'periode_id' => 'required|school_exists:periodes,id',
            'typeevaluation_id' => 'required|school_exists:type_evaluations,id',
        ]);

        $updated = DB::table('typeevaluation_classes')
            ->where('id', $id)
            ->update($validated + ['updated_at' => now()]);

        return $updated
            ? response()->json(['message' => 'Liaison mise à jour avec succès'])
            : response()->json(['message' => 'Liaison non trouvée'], 404);
    }

    public function attach(Request $request)
    {
        $validated = $request->validate([
            'classe_id' => 'required|school_exists:classes,id',
            'serie_id' => 'required|school_exists:series,id',
            'periode_id' => 'required|school_exists:periodes,id',
            'typeevaluation_id' => 'required|school_exists:type_evaluations,id',
        ]);

        if (DB::table('typeevaluation_classes')->where($validated)->exists()) {
            return response()->json(['message' => 'Déjà lié'], 409);
        }

        DB::table('typeevaluation_classes')->insert($validated + ['created_at' => now(), 'updated_at' => now()]);
        return response()->json(['message' => 'Liaison créée avec succès'], 201);
    }

    public function attachMultiple(Request $request)
    {
        Log::debug('attachMultiple', ['keys' => array_keys($request->all())]);

        try {
            $validated = $request->validate([
                'liaisons' => 'required|array',
                'liaisons.*.classe_id' => 'required|integer|school_exists:classes,id',
                'liaisons.*.periode_id' => 'required|integer|school_exists:periodes,id',
                'liaisons.*.typeevaluation_id' => 'required|integer|school_exists:type_evaluations,id',
                'liaisons.*.serie_id' => 'nullable|integer|school_exists:series,id',
            ]);

            $created = [];
            $errors = [];

            DB::beginTransaction();

            foreach ($validated['liaisons'] as $index => $liaison) {
                try {
                    $exists = DB::table('typeevaluation_classes')
                        ->where([
                            'classe_id' => $liaison['classe_id'],
                            'periode_id' => $liaison['periode_id'],
                            'typeevaluation_id' => $liaison['typeevaluation_id'],
                            'serie_id' => $liaison['serie_id'] ?? null,
                        ])
                        ->exists();

                    if ($exists) {
                        $errors[] = ['index' => $index, 'liaison' => $liaison, 'message' => 'Cette liaison existe déjà'];
                        continue;
                    }

                    if (DB::table('typeevaluation_classes')->insert([
                        'classe_id' => $liaison['classe_id'],
                        'periode_id' => $liaison['periode_id'],
                        'typeevaluation_id' => $liaison['typeevaluation_id'],
                        'serie_id' => $liaison['serie_id'] ?? null,
                        'created_at' => now(),
                        'updated_at' => now(),
                    ])) {
                        $created[] = $liaison;
                    }
                } catch (\Exception $e) {
                    $this->rethrowIfMeaningful($e);
                    Log::error('Error creating liaison:', ['liaison' => $liaison, 'error' => $this->clientErrorMessage($e)]);
                    $errors[] = ['index' => $index, 'liaison' => $liaison, 'message' => $this->clientErrorMessage($e, 'Erreur lors de la création')];
                }
            }

            if (count($created) > 0) {
                DB::commit();
                return response()->json([
                    'success' => true, 'created' => $created, 'errors' => $errors,
                    'message' => count($created) . ' liaison(s) créée(s) avec succès',
                ], 201);
            }

            DB::rollBack();
            return response()->json(['success' => false, 'created' => [], 'errors' => $errors, 'message' => 'Aucune liaison créée'], 400);
        } catch (\Illuminate\Validation\ValidationException $e) {
            Log::error('Validation error:', ['errors' => $e->errors()]);
            return response()->json(['success' => false, 'message' => 'Erreur de validation', 'errors' => $e->errors()], 422);
        } catch (\Exception $e) {
            $this->rethrowIfMeaningful($e);
            Log::error('Unexpected error:', ['error' => $e->getMessage()]);
            return response()->json(['success' => false, 'message' => 'Une erreur inattendue est survenue', 'error' => $this->clientErrorMessage($e)], 500);
        }
    }

    // ─── QUERY BUILDERS ──────────────────────────────────────────────

    /**
     * Requête de base sur typeevaluation_classes avec joins optionnels.
     */
    private function baseQuery(?string $categorie = null, ?int $classeId = null, bool $withSeries = false, bool $withClasse = false)
    {
        $query = DB::table('typeevaluation_classes')
            ->join('type_evaluations', 'typeevaluation_classes.typeevaluation_id', '=', 'type_evaluations.id')
            ->join('periodes', 'typeevaluation_classes.periode_id', '=', 'periodes.id');

        if ($withClasse) {
            $query->join('classes', 'typeevaluation_classes.classe_id', '=', 'classes.id');
        }

        if ($withSeries) {
            $query->join('series', 'typeevaluation_classes.serie_id', '=', 'series.id');
        } else {
            $query->leftJoin('series', 'typeevaluation_classes.serie_id', '=', 'series.id');
        }

        if ($categorie !== null && $withClasse) {
            $query->where('classes.categorie_classe', $categorie);
        } elseif ($categorie !== null) {
            $query->join('classes', 'typeevaluation_classes.classe_id', '=', 'classes.id')
                  ->where('classes.categorie_classe', $categorie);
        }

        if ($classeId !== null) {
            $query->where('typeevaluation_classes.classe_id', $classeId);
        }

        $query->select(
            'typeevaluation_classes.id as id',
            'type_evaluations.id as type_id',
            'type_evaluations.nom as type_nom',
            'periodes.id as periode_id',
            'periodes.nom as periode_nom',
            'periodes.date_debut',
            'periodes.date_fin',
        );

        if ($withClasse) {
            $query->addSelect('classes.id as classe_id', 'classes.nom_classe');
        }

        if ($withSeries) {
            $query->addSelect('series.id as serie_id', 'series.nom as serie_nom');
        } else {
            $query->addSelect('series.id as serie_id', 'series.nom as serie_nom');
        }

        return $query;
    }

    /**
     * Types d'évaluation via Eloquent (whereHas sur periodes/classes).
     */
    private function getTypesByCycles(?string $categorie = null, ?int $classeId = null)
    {
        $types = TypeEvaluation::whereHas('periodes', function ($query) use ($categorie, $classeId) {
            $query->whereHas('classes', function ($q) use ($categorie, $classeId) {
                if ($categorie !== null) $q->where('classes.categorie_classe', $categorie);
                if ($classeId !== null) $q->where('classes.id', $classeId);
            });
        })->get();

        return response()->json($types);
    }

    // ─── ENDPOINTS : Classes avec périodes et types ──────────────────

    public function getClassesWithPeriodesAndTypesM()
    {
        $data = $this->baseQuery(categorie: Cycles::KINDERGARTEN, withClasse: true, withSeries: true)
            ->whereNotNull('typeevaluation_classes.serie_id')->get();
        return response()->json($data);
    }

    public function getClassesWithPeriodesAndTypesP()
    {
        $data = $this->baseQuery(categorie: Cycles::PRIMARY, withClasse: true)->get();
        return response()->json($data);
    }

    public function getClassesWithPeriodesAndTypesS()
    {
        $data = $this->baseQuery(categorie: Cycles::SECONDARY, withClasse: true)->get();
        return response()->json($data);
    }

    public function getClassesWithPeriodesAndTypes()
    {
        $data = $this->baseQuery(withClasse: true, withSeries: true)
            ->whereNotNull('typeevaluation_classes.serie_id')->get();
        return response()->json($data);
    }

    // ─── ENDPOINTS : Types d'évaluation par classe/catégorie ─────────

    public function getByClasse($classe_id)
    {
        $data = DB::table('typeevaluation_classes')
            ->where('classe_id', $classe_id)
            ->join('periodes', 'typeevaluation_classes.periode_id', '=', 'periodes.id')
            ->join('type_evaluations', 'typeevaluation_classes.typeevaluation_id', '=', 'type_evaluations.id')
            ->select('typeevaluation_classes.*', 'periodes.nom as periode_nom', 'type_evaluations.nom as type_nom')
            ->get();
        return response()->json($data);
    }

    public function getTypesByClasse($classeId)
    {
        return $this->getTypesByCycles(classeId: $classeId);
    }

    public function getTypesByCategorie($categorie)
    {
        return $this->getTypesByCycles(categorie: $categorie);
    }

    public function getTypesMaternelle()
    {
        return $this->getTypesByCycles(categorie: Cycles::KINDERGARTEN);
    }

    public function getTypesPrimaire()
    {
        return $this->getTypesByCycles(categorie: Cycles::PRIMARY);
    }

    public function getTypesSecondaire()
    {
        return $this->getTypesByCycles(categorie: Cycles::SECONDARY);
    }

    // ─── ENDPOINTS : Types avec périodes ─────────────────────────────

    public function getTypesWithPeriodesByClasse($classeId)
    {
        $data = $this->baseQuery(classeId: $classeId)->get();
        return response()->json($data);
    }

    public function getTypesWithPeriodesByClasseWithSeries($classeId)
    {
        $data = $this->baseQuery(classeId: $classeId, withSeries: true)->get();
        return response()->json($data);
    }

    public function getTypesWithPeriodesByCategorie($categorie)
    {
        $data = $this->baseQuery(categorie: $categorie, withClasse: true)->get();
        return response()->json($data);
    }

    public function getTypesWithPeriodesMaternelle()
    {
        $data = $this->baseQuery(categorie: Cycles::KINDERGARTEN, withClasse: true)->get();
        return response()->json($data);
    }

    public function getTypesWithPeriodesPrimaire()
    {
        $data = $this->baseQuery(categorie: Cycles::PRIMARY, withClasse: true)->get();
        return response()->json($data);
    }

    public function getTypesWithPeriodesSecondaire()
    {
        $data = $this->baseQuery(categorie: Cycles::SECONDARY, withClasse: true)->get();
        return response()->json($data);
    }

    public function getTypesWithPeriodesByClassesAndSeries()
    {
        $data = $this->baseQuery(withClasse: true, withSeries: true)->get();
        return response()->json($data);
    }

    public function getTypesWithPeriodesAndSeriesByClasse($classeId)
    {
        $data = $this->baseQuery(classeId: $classeId, withSeries: true)->get();
        return response()->json($data);
    }
}
