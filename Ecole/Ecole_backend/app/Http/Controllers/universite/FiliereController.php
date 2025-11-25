<?php

namespace App\Http\Controllers\Universite;

use App\Http\Controllers\Controller;
use App\Models\Universite\Filiere;
use Illuminate\Http\Request;

class FiliereController extends Controller
{
    public function index()
    {
        $filieres = Filiere::with('departement')->get();
        return response()->json($filieres);
    }

    public function store(Request $request)
    {
        $request->validate([
            'nom' => 'required|string|max:100',
            'niveau' => 'required|string|max:50',
            'departement_id' => 'required|exists:departements,id'
        ]);

        $filiere = Filiere::create($request->all());
        return response()->json($filiere, 201);
    }

    public function show(Filiere $filiere)
    {
        return response()->json($filiere->load('departement', 'etudiants', 'matieres'));
    }

    public function update(Request $request, Filiere $filiere)
    {
        $request->validate([
            'nom' => 'sometimes|required|string|max:100',
            'niveau' => 'sometimes|required|string|max:50',
            'departement_id' => 'sometimes|required|exists:departements,id'
        ]);

        $filiere->update($request->all());
        return response()->json($filiere);
    }

    public function destroy(Filiere $filiere)
    {
        $filiere->delete();
        return response()->json(null, 204);
    }
}
