<?php

namespace App\Http\Controllers\Universite;

use App\Http\Controllers\Controller;
use App\Models\Universite\Enseignant;
use Illuminate\Http\Request;

class EnseignantController extends Controller
{
    public function index()
    {
        $enseignants = Enseignant::with('departement')->get();
        return response()->json($enseignants);
    }

    public function store(Request $request)
    {
        $request->validate([
            'nom' => 'required|string|max:100',
            'prenom' => 'required|string|max:100',
            'grade' => 'required|string|max:50',
            'specialite' => 'nullable|string',
            'telephone' => 'nullable|string|max:20',
            'email' => 'nullable|email',
            'departement_id' => 'required|exists:departements,id'
        ]);

        $enseignant = Enseignant::create($request->all());
        return response()->json($enseignant, 201);
    }

    public function show(Enseignant $enseignant)
    {
        return response()->json($enseignant->load('departement', 'matieres'));
    }

    public function update(Request $request, Enseignant $enseignant)
    {
        $request->validate([
            'nom' => 'sometimes|required|string|max:100',
            'prenom' => 'sometimes|required|string|max:100',
            'grade' => 'sometimes|required|string|max:50',
            'departement_id' => 'sometimes|required|exists:departements,id'
        ]);

        $enseignant->update($request->all());
        return response()->json($enseignant);
    }

    public function destroy(Enseignant $enseignant)
    {
        $enseignant->delete();
        return response()->json(null, 204);
    }
}
