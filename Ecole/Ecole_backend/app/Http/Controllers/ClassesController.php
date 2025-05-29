<?php

namespace App\Http\Controllers;

use App\Models\Classes;
use Illuminate\Auth\Events\Registered;
use Illuminate\Support\Facades\Auth;

use Illuminate\Http\Request;

class ClassesController extends Controller
{
    //
    public function store(Request $request)
    {
        try {
                $validated = $request->validate([
                    'nom_classe' => 'required|string',
                    'categorie_classe' => 'required|string',
                    ]);

                $classe = Classes::create([
                    'nom_classe' => $validated['nom_classe'],
                    'categorie_classe' => $validated['categorie_classe']

                ]);

                event(new Registered($classe));
                return response()->json($classe, 201);

            } 
            catch (\Illuminate\Validation\ValidationException $e) {
            return response()->json([
                'message' => 'Validation error',
                'errors' => $e->errors()
            ], 422);
        } catch (\Exception $e) {
            return response()->json([
                'message' => 'Erreur lors de l\'ajout',
                'error' => $e->getMessage()
            ], 500);
        }
    }

    public function index(){
        return Classes::all();
    }

    // Affiche une matiere spécifique
    public function show($id)
    {
        $classe = Classes::find($id);

        if (!$classe) {
            return response()->json(['message' => 'Matière non trouvée'], 404);
        }

        return response()->json($classe, 200);
    }

    // Met à jour une matiere spécifique
    public function update(Request $request, $id)
    {
        $classe = Classes::find($id);

        if (!$classe) {
            return response()->json(['message' => 'Matière non trouvée'], 404);
        }

        $validatedData = $request->validate([
            'nom'=>'string|required'
        ]);

        $classe->update($validatedData);

        return response()->json($classe, 200);
    }

    // Supprime une matiere spécifique
    public function destroy($id)
    {
        $classe = Classes::find($id);
        // Vérifie si la matière existe
        if (!$classe) {
            return response()->json(['message' => 'Classe non trouvée'], 404);
        }

        $classe->delete();

        return response()->json(['message' => 'Matière supprimée'], 200);
    }
}
