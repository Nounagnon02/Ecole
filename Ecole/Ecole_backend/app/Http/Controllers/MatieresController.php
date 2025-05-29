<?php

namespace App\Http\Controllers;

use App\Models\Matieres;
use Illuminate\Http\Request;

class MatieresController extends Controller
{
    public function index(){
        return Matieres::all();
    }
    public function store(Request $request){
        $validated = $request->validate([
            'nom' => 'string|required'
        ]);
        $matieres = Matieres::create($validated);

        return response()->json($matieres, 201);
}
    // Affiche une matiere spécifique
    public function show($id)
    {
        $matiere = Matieres::find($id);

        if (!$matiere) {
            return response()->json(['message' => 'Matière non trouvée'], 404);
        }

        return response()->json($matiere, 200);
    }

    // Met à jour une matiere spécifique
    public function update(Request $request, $id)
    {
        $matiere = Matieres::find($id);

        if (!$matiere) {
            return response()->json(['message' => 'Matière non trouvée'], 404);
        }

        $validatedData = $request->validate([
            'nom'=>'string|required'
        ]);

        $matiere->update($validatedData);

        return response()->json($matiere, 200);
    }

    // Supprime une matiere spécifique
    public function destroy($id)
    {
        $matiere = Matieres::find($id);

        if (!$matiere) {
            return response()->json(['message' => 'Matière non trouvée'], 404);
        }

        $matiere->delete();

        return response()->json(['message' => 'Matière supprimée'], 200);
    }
}
