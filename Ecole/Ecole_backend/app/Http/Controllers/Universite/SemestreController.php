<?php

namespace App\Http\Controllers\Universite;

use App\Http\Controllers\Controller;
use App\Models\Universite\Semestre;
use Illuminate\Http\Request;

class SemestreController extends Controller
{
    public function index()
    {
        $semestres = Semestre::with('anneeAcademique')->paginate(15);
        return response()->json($semestres);
    }

    public function store(Request $request)
    {
        $validated = $request->validate([
            'libelle' => 'required|string|max:50',
            'annee_academique_id' => 'required|exists:annee_academiques,id'
        ]);

        $semestre = Semestre::create($validated);
        return response()->json($semestre, 201);
    }

    public function show(Semestre $semestre)
    {
        return response()->json($semestre->load('anneeAcademique', 'matieres'));
    }

    public function update(Request $request, Semestre $semestre)
    {
        $validated = $request->validate([
            'libelle' => 'sometimes|required|string|max:50',
            'annee_academique_id' => 'sometimes|required|exists:annee_academiques,id'
        ]);

        $semestre->update($validated);
        return response()->json($semestre);
    }

    public function destroy(Semestre $semestre)
    {
        $semestre->delete();
        return response()->json(null, 204);
    }
}
