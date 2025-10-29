<?php

namespace App\Http\Controllers;

use App\Models\TypeEvaluation;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Log;

class typeEvaluationController extends Controller
{
    //
    public function store(Request $request){
        $validated = $request->validate([
            'nom' => 'string|required'
        ]);
        $evals = TypeEvaluation::create($validated);

        return response()->json($evals, 201);
    }

    public function Index()
    {
        $evals = TypeEvaluation::all();
        return response()->json($evals);
    }

    public function attach(Request $request)
    {
        $validated = $request->validate([
            'classe_id' => 'required|exists:classes,id',
            'serie_id' => 'required|exists:series,id',
            'periode_id' => 'required|exists:periodes,id',
            'typeevaluation_id' => 'required|exists:type_evaluations,id',
        ]);

        // Vérifier si la liaison existe déjà
        $exists = DB::table('typeevaluation_classes')->where($validated)->exists();
        if ($exists) {
            return response()->json(['message' => 'Déjà lié'], 409);
        }

        DB::table('typeevaluation_classes')->insert($validated + ['created_at' => now(), 'updated_at' => now()]);

        return response()->json(['message' => 'Liaison créée avec succès'], 201);
    }



    public function attachMultiple(Request $request)
    {
        // Log incoming request for debugging
        Log::info('Received attachMultiple request:', $request->all());

        try {
            $validated = $request->validate([
                'liaisons' => 'required|array',
                'liaisons.*.classe_id' => 'required|integer|exists:classes,id',
                'liaisons.*.periode_id' => 'required|integer|exists:periodes,id',
                'liaisons.*.typeevaluation_id' => 'required|integer|exists:type_evaluations,id',
                'liaisons.*.serie_id' => 'nullable|integer|exists:series,id',
            ]);

            $created = [];
            $errors = [];

            DB::beginTransaction();

            foreach ($validated['liaisons'] as $index => $liaison) {
                try {
                    // Check if liaison already exists
                    $exists = DB::table('typeevaluation_classes')
                        ->where([
                            'classe_id' => $liaison['classe_id'],
                            'periode_id' => $liaison['periode_id'],
                            'typeevaluation_id' => $liaison['typeevaluation_id'],
                            'serie_id' => $liaison['serie_id'] ?? null,
                        ])
                        ->exists();

                    if ($exists) {
                        $errors[] = [
                            'index' => $index,
                            'liaison' => $liaison,
                            'message' => 'Cette liaison existe déjà'
                        ];
                        continue;
                    }

                    // Insert new liaison
                    $inserted = DB::table('typeevaluation_classes')->insert([
                        'classe_id' => $liaison['classe_id'],
                        'periode_id' => $liaison['periode_id'],
                        'typeevaluation_id' => $liaison['typeevaluation_id'],
                        'serie_id' => $liaison['serie_id'] ?? null,
                        'created_at' => now(),
                        'updated_at' => now()
                    ]);

                    if ($inserted) {
                        $created[] = $liaison;
                    }

                } catch (\Exception $e) {
                    Log::error('Error creating liaison:', [
                        'liaison' => $liaison,
                        'error' => $e->getMessage()
                    ]);

                    $errors[] = [
                        'index' => $index,
                        'liaison' => $liaison,
                        'message' => 'Erreur lors de la création: ' . $e->getMessage()
                    ];
                }
            }

            if (count($created) > 0) {
                DB::commit();
                return response()->json([
                    'success' => true,
                    'created' => $created,
                    'errors' => $errors,
                    'message' => count($created) . ' liaison(s) créée(s) avec succès'
                ], 201);
            } else {
                DB::rollBack();
                return response()->json([
                    'success' => false,
                    'created' => [],
                    'errors' => $errors,
                    'message' => 'Aucune liaison créée'
                ], 400);
            }

        } catch (\Illuminate\Validation\ValidationException $e) {
            Log::error('Validation error:', ['errors' => $e->errors()]);
            return response()->json([
                'success' => false,
                'message' => 'Erreur de validation',
                'errors' => $e->errors()
            ], 422);
        } catch (\Exception $e) {
            Log::error('Unexpected error:', ['error' => $e->getMessage()]);
            return response()->json([
                'success' => false,
                'message' => 'Une erreur inattendue est survenue',
                'error' => $e->getMessage()
            ], 500);
        }
    }


    /*public function attachMultiple(Request $request)
    {
        Log::info('Received request:', $request->all());

        $validated = $request->validate([
            'liaisons' => 'required|array',
            'liaisons.*.classe_id' => 'required|exists:classes,id',
            'liaisons.*.periode_id' => 'required|exists:periodes,id',
            'liaisons.*.typeevaluation_id' => 'required|exists:type_evaluations,id',
            'liaisons.*.serie_id' => 'nullable|exists:series,id',
        ]);

        try {

            foreach ($request->liaisons as $liaison) {
            try {
                // Vérifier si la liaison existe déjà
                $exists = DB::table('typeevaluation_classes')
                    ->where([
                        'classe_id' => $liaison['classe_id'],
                        'periode_id' => $liaison['periode_id'],
                        'typeevaluation_id' => $liaison['typeevaluation_id'],
                        'serie_id' => $liaison['serie_id'] ?? null,
                    ])
                    ->exists();

                if ($exists) {
                    $errors[] = [
                        'liaison' => $liaison,
                        'message' => 'Cette liaison existe déjà'
                    ];
                    continue;
                }

                DB::table('typeevaluation_classes')->insert($liaison + [
                    'created_at' => now(),
                    'updated_at' => now()
                ]);

                $created[] = $liaison;
            } catch (\Exception $e) {
                $errors[] = [
                    'liaison' => $liaison,
                    'message' => $e->getMessage()
                ];
            }
        }

            return response()->json(['message' => 'Liaisons created successfully']);
        } catch (\Exception $e) {
            Log::error('Error creating liaisons:', ['error' => $e->getMessage()]);
            return response()->json(['message' => $e->getMessage()], 400);
        }
    }*/


    //Recuper les chaque classe avec ses series et periodes et types d'evaluations
    public function getClassesWithPeriodesAndTypesM()
    {
        $data = DB::table('typeevaluation_classes')
            ->where('categorie_classe','maternelle')
            ->join('classes', 'typeevaluation_classes.classe_id', '=', 'classes.id')
            ->join('periodes', 'typeevaluation_classes.periode_id', '=', 'periodes.id')
            ->join('type_evaluations', 'typeevaluation_classes.typeevaluation_id', '=', 'type_evaluations.id')
            ->join('series', 'typeevaluation_classes.serie_id', '=', 'series.id')
            ->select(
                'typeevaluation_classes.*',
                'classes.nom_classe as classe_nom',
                'periodes.nom as periode_nom',
                'type_evaluations.nom as type_nom',
                'series.nom as serie_nom'
            )
            ->whereNotNull('typeevaluation_classes.serie_id')
            ->get();
        return response()->json($data);
    }

    public function getClassesWithPeriodesAndTypesP()
    {
        $data = DB::table('typeevaluation_classes')
            ->join('classes', 'typeevaluation_classes.classe_id', '=', 'classes.id')
            ->join('periodes', 'typeevaluation_classes.periode_id', '=', 'periodes.id')
            ->join('type_evaluations', 'typeevaluation_classes.typeevaluation_id', '=', 'type_evaluations.id')
            ->leftJoin('series', 'typeevaluation_classes.serie_id', '=', 'series.id')
            ->where('classes.categorie_classe', 'Primaire')
            ->select(
                'typeevaluation_classes.id as id',
                'classes.id as classe_id',
                'classes.nom_classe',
                'periodes.id as periode_id',
                'periodes.nom as periode_nom',
                'periodes.date_debut',
                'periodes.date_fin',
                'type_evaluations.id as type_id',
                'type_evaluations.nom as type_nom',
                'series.id as serie_id',
                'series.nom as serie_nom'
            )
            ->get()
            ->map(function ($item) {
                return [
                    'id' => $item->id,
                    'classe_id' => $item->classe_id,
                    'classe_nom' => $item->nom_classe,
                    'periode_id' => $item->periode_id,
                    'periode_nom' => $item->periode_nom,
                    'date_debut' => $item->date_debut,
                    'date_fin' => $item->date_fin,
                    'type_id' => $item->type_id,
                    'type_nom' => $item->type_nom,
                    'serie_id' => $item->serie_id,
                    'serie_nom' => $item->serie_nom
                ];
            });

        return response()->json($data);
    }
public function getClassesWithPeriodesAndTypesS()
    {
        $data = DB::table('typeevaluation_classes')
            ->join('classes', 'typeevaluation_classes.classe_id', '=', 'classes.id')
            ->join('periodes', 'typeevaluation_classes.periode_id', '=', 'periodes.id')
            ->join('type_evaluations', 'typeevaluation_classes.typeevaluation_id', '=', 'type_evaluations.id')
            ->leftJoin('series', 'typeevaluation_classes.serie_id', '=', 'series.id')
            ->where('classes.categorie_classe', 'secondaire')
            ->select(
                'typeevaluation_classes.id as id',
                'classes.id as classe_id',
                'classes.nom_classe',
                'periodes.id as periode_id',
                'periodes.nom as periode_nom',
                'periodes.date_debut',
                'periodes.date_fin',
                'type_evaluations.id as type_id',
                'type_evaluations.nom as type_nom',
                'series.id as serie_id',
                'series.nom as serie_nom'
            )
            ->get()
            ->map(function ($item) {
                return [
                    'id' => $item->id,
                    'classe_id' => $item->classe_id,
                    'classe_nom' => $item->nom_classe,
                    'periode_id' => $item->periode_id,
                    'periode_nom' => $item->periode_nom,
                    'date_debut' => $item->date_debut,
                    'date_fin' => $item->date_fin,
                    'type_id' => $item->type_id,
                    'type_nom' => $item->type_nom,
                    'serie_id' => $item->serie_id,
                    'serie_nom' => $item->serie_nom
                ];
            });

        return response()->json($data);
    }



    public function getClassesWithPeriodesAndTypes()
    {
        $data = DB::table('typeevaluation_classes')
            ->join('classes', 'typeevaluation_classes.classe_id', '=', 'classes.id')
            ->join('periodes', 'typeevaluation_classes.periode_id', '=', 'periodes.id')
            ->join('type_evaluations', 'typeevaluation_classes.typeevaluation_id', '=', 'type_evaluations.id')
            ->join('series', 'typeevaluation_classes.serie_id', '=', 'series.id')
            ->select(
                'typeevaluation_classes.*',
                'classes.nom_classe as classe_nom',
                'periodes.nom as periode_nom',
                'type_evaluations.nom as type_nom',
                'series.nom as serie_nom'
            )
            ->whereNotNull('typeevaluation_classes.serie_id')
            ->get();
        return response()->json($data);
    }



    // Dans votre contrôleur
    public function destroy($id)
    {
        $deleted = DB::table('typeevaluation_classes')
            ->where('id', $id)
            ->delete();

        if ($deleted) {
            return response()->json(['message' => 'Liaison supprimée avec succès']);
        }

        return response()->json(['message' => 'Liaison non trouvée'], 404);
    }


    public function update(Request $request, $id)
    {
        $validated = $request->validate([
            'classe_id' => 'required|exists:classes,id',
            'serie_id' => 'nullable|exists:series,id',
            'periode_id' => 'required|exists:periodes,id',
            'typeevaluation_id' => 'required|exists:type_evaluations,id',
        ]);

        $updated = DB::table('typeevaluation_classes')
            ->where('id', $id)
            ->update($validated + ['updated_at' => now()]);

        if ($updated) {
            return response()->json(['message' => 'Liaison mise à jour avec succès']);
        }

        return response()->json(['message' => 'Liaison non trouvée'], 404);
    }
    // Pour récupérer les liaisons d'une classe
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

    // Récupérer les types d'évaluation d'une classe spécifique
    public function getTypesByClasse($classeId)
    {
        $types = TypeEvaluation::whereHas('periodes', function($query) use ($classeId) {
            $query->whereHas('classes', function($q) use ($classeId) {
                $q->where('classes.id', $classeId);
            });
        })->get();

        return response()->json($types);
    }

    // Récupérer les types d'évaluation d'une catégorie de classe
    public function getTypesByCategorie($categorie)
    {
        $types = TypeEvaluation::whereHas('periodes', function($query) use ($categorie) {
            $query->whereHas('classes', function($q) use ($categorie) {
                $q->where('classes.categorie_classe', $categorie);
            });
        })->get();

        return response()->json($types);
    }

    // Récupérer les types d'évaluation de la maternelle
    public function getTypesMaternelle()
    {
        $types = TypeEvaluation::whereHas('periodes', function($query) {
            $query->whereHas('classes', function($q) {
                $q->where('classes.categorie_classe', 'maternelle');
            });
        })->get();
        return response()->json($types);
    }

    // Récupérer les types d'évaluation du primaire
    public function getTypesPrimaire()
    {
        $types = TypeEvaluation::whereHas('periodes', function($query) {
            $query->whereHas('classes', function($q) {
                $q->where('classes.categorie_classe', 'Primaire');
            });
        })->get();
        return response()->json($types);
    }

    // Récupérer les types d'évaluation du secondaire
    public function getTypesSecondaire()
    {
        $types = TypeEvaluation::whereHas('periodes', function($query) {
            $query->whereHas('classes', function($q) {
                $q->where('classes.categorie_classe', 'secondaire');
            });
        })->get();
        return response()->json($types);
    }

    // Récupérer les types d'évaluation avec leurs périodes pour une classe
    public function getTypesWithPeriodesByClasse($classeId)
    {
        $data = DB::table('typeevaluation_classes')
            ->where('classe_id', $classeId)
            ->join('type_evaluations', 'typeevaluation_classes.typeevaluation_id', '=', 'type_evaluations.id')
            ->join('periodes', 'typeevaluation_classes.periode_id', '=', 'periodes.id')
            ->select(
                'type_evaluations.id as type_id',
                'type_evaluations.nom as type_nom',
                'periodes.id as periode_id',
                'periodes.nom as periode_nom',
                'periodes.date_debut',
                'periodes.date_fin'
            )
            ->get();

        return response()->json($data);
    }

    // Récupérer les types d'évaluation avec leurs périodes pour une classe avec séries
    public function getTypesWithPeriodesByClasseWithSeries($classeId)
    {
        $data = DB::table('typeevaluation_classes')
            ->where('classe_id', $classeId)
            ->join('type_evaluations', 'typeevaluation_classes.typeevaluation_id', '=', 'type_evaluations.id')
            ->join('periodes', 'typeevaluation_classes.periode_id', '=', 'periodes.id')
            ->join('series', 'typeevaluation_classes.serie_id', '=', 'series.id')
            ->select(
                'type_evaluations.id as type_id',
                'type_evaluations.nom as type_nom',
                'periodes.id as periode_id',
                'periodes.nom as periode_nom',
                'periodes.date_debut',
                'periodes.date_fin',
                'series.id as serie_id',
                'series.nom as serie_nom'
            )
            ->get();
        return response()->json($data);
    }

    // Récupérer les types d'évaluation avec leurs périodes pour une catégorie
    public function getTypesWithPeriodesByCategorie($categorie)
    {
        $data = DB::table('typeevaluation_classes')
            ->join('classes', 'typeevaluation_classes.classe_id', '=', 'classes.id')
            ->join('type_evaluations', 'typeevaluation_classes.typeevaluation_id', '=', 'type_evaluations.id')
            ->join('periodes', 'typeevaluation_classes.periode_id', '=', 'periodes.id')
            ->where('classes.categorie_classe', $categorie)
            ->select(
                'type_evaluations.id as type_id',
                'type_evaluations.nom as type_nom',
                'periodes.id as periode_id',
                'periodes.nom as periode_nom',
                'periodes.date_debut',
                'periodes.date_fin',
                'classes.id as classe_id',
                'classes.nom_classe'
            )
            ->get();

        return response()->json($data);
    }

    // Récupérer les types d'évaluation avec leurs périodes pour la maternelle
    public function getTypesWithPeriodesMaternelle()
    {
        $data = DB::table('typeevaluation_classes')
            ->join('classes', 'typeevaluation_classes.classe_id', '=', 'classes.id')
            ->join('type_evaluations', 'typeevaluation_classes.typeevaluation_id', '=', 'type_evaluations.id')
            ->join('periodes', 'typeevaluation_classes.periode_id', '=', 'periodes.id')
            ->where('classes.categorie_classe', 'maternelle')
            ->select(
                'type_evaluations.id as type_id',
                'type_evaluations.nom as type_nom',
                'periodes.id as periode_id',
                'periodes.nom as periode_nom',
                'periodes.date_debut',
                'periodes.date_fin',
                'classes.id as classe_id',
                'classes.nom_classe'
            )
            ->get();
        return response()->json($data);
    }

    // Récupérer les types d'évaluation avec leurs périodes pour le primaire
    public function getTypesWithPeriodesPrimaire()
    {
        $data = DB::table('typeevaluation_classes')
            ->join('classes', 'typeevaluation_classes.classe_id', '=', 'classes.id')
            ->join('type_evaluations', 'typeevaluation_classes.typeevaluation_id', '=', 'type_evaluations.id')
            ->join('periodes', 'typeevaluation_classes.periode_id', '=', 'periodes.id')
            ->where('classes.categorie_classe', 'Primaire')
            ->select(
                'type_evaluations.id as type_id',
                'type_evaluations.nom as type_nom',
                'periodes.id as periode_id',
                'periodes.nom as periode_nom',
                'periodes.date_debut',
                'periodes.date_fin',
                'classes.id as classe_id',
                'classes.nom_classe'
            )
            ->get();
        return response()->json($data);
    }


    // Récupérer les types d'évaluation avec leurs périodes pour le secondaire
    public function getTypesWithPeriodesSecondaire()
    {
        $data = DB::table('typeevaluation_classes')
            ->join('classes', 'typeevaluation_classes.classe_id', '=', 'classes.id')
            ->join('type_evaluations', 'typeevaluation_classes.typeevaluation_id', '=', 'type_evaluations.id')
            ->join('periodes', 'typeevaluation_classes.periode_id', '=', 'periodes.id')
            ->where('classes.categorie_classe', 'secondaire')
            ->select(
                'type_evaluations.id as type_id',
                'type_evaluations.nom as type_nom',
                'periodes.id as periode_id',
                'periodes.nom as periode_nom',
                'periodes.date_debut',
                'periodes.date_fin',
                'classes.id as classe_id',
                'classes.nom_classe'
            )
            ->get();
        return response()->json($data);
    }

    // Récupérer les types d'évaluation avec leurs périodes par classes et séries
    public function getTypesWithPeriodesByClassesAndSeries()
    {
        $data = DB::table('typeevaluation_classes')
            ->join('classes', 'typeevaluation_classes.classe_id', '=', 'classes.id')
            ->join('type_evaluations', 'typeevaluation_classes.typeevaluation_id', '=', 'type_evaluations.id')
            ->join('periodes', 'typeevaluation_classes.periode_id', '=', 'periodes.id')
            ->join('series', 'typeevaluation_classes.serie_id', '=', 'series.id')
            ->select(
                'type_evaluations.id as type_id',
                'type_evaluations.nom as type_nom',
                'periodes.id as periode_id',
                'periodes.nom as periode_nom',
                'periodes.date_debut',
                'periodes.date_fin',
                'classes.id as classe_id',
                'classes.nom_classe',
                'series.id as serie_id',
                'series.nom as serie_nom'
            )
            ->get();
        return response()->json($data);
    }
    // Récupérer les types d'évaluation avec leurs périodes et séries pour une classe
    public function getTypesWithPeriodesAndSeriesByClasse($classeId)
    {
        $data = DB::table('typeevaluation_classes')
            ->where('classe_id', $classeId)
            ->join('type_evaluations', 'typeevaluation_classes.typeevaluation_id', '=', 'type_evaluations.id')
            ->join('periodes', 'typeevaluation_classes.periode_id', '=', 'periodes.id')
            ->join('series', 'typeevaluation_classes.serie_id', '=', 'series.id')
            ->select(
                'type_evaluations.id as type_id',
                'type_evaluations.nom as type_nom',
                'periodes.id as periode_id',
                'periodes.nom as periode_nom',
                'periodes.date_debut',
                'periodes.date_fin',
                'series.id as serie_id',
                'series.nom as serie_nom'
            )
            ->get();

        return response()->json($data);
    }

}














