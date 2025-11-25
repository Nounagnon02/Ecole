<?php

namespace App\Http\Controllers\Universite;

use App\Http\Controllers\Controller;
use App\Models\Universite\Matiere;
use Illuminate\Http\Request;

class MatiereController extends Controller
{
    public function index()
    {
        $matieres = Matiere::with('enseignant', 'semestre', 'filiere')->get();
        return response()->json($matieres);
    }

    public function store(Request $request)
    {
        $request->validate([
            'code' => 'required|string|unique:matieres',
            'intitule' => 'required|string|max:200',
            'credit' => 'required|integer|min:1',
            'enseignant_id' => 'required|exists:enseignants,id',
            'semestre_id' => 'required|exists:semestres,id',
            'filiere_id' => 'required|exists:filieres,id'
        ]);

        $matiere = Matiere::create($request->all());
        return response()->json($matiere, 201);
    }

    public function show(Matiere $matiere)
    {
        return response()->json($matiere->load('enseignant', 'semestre', 'filiere', 'notes'));
    }

    public function update(Request $request, Matiere $matiere)
    {
        $request->validate([
            'code' => 'sometimes|required|string|unique:matieres,code,' . $matiere->id,
            'intitule' => 'sometimes|required|string|max:200',
            'credit' => 'sometimes|required|integer|min:1',
            'enseignant_id' => 'sometimes|required|exists:enseignants,id',
            'semestre_id' => 'sometimes|required|exists:semestres,id',
            'filiere_id' => 'sometimes|required|exists:filieres,id'
        ]);

        $matiere->update($request->all());
        return response()->json($matiere);
    }

    public function destroy(Matiere $matiere)
    {
        $matiere->delete();
        return response()->json(null, 204);
    }
}
