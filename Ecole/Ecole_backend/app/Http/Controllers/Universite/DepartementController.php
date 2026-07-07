<?php

namespace App\Http\Controllers\Universite;

use App\Http\Controllers\Controller;
use App\Models\Universite\Departement;
use Illuminate\Http\Request;

class DepartementController extends Controller
{
    public function index()
    {
        $departements = Departement::with('faculte')->paginate(15);
        return response()->json($departements);
    }

    public function store(Request $request)
    {
        $validated = $request->validate([
            'nom' => 'required|string|max:100',
            'faculte_id' => 'required|exists:facultes,id'
        ]);

        $departement = Departement::create($validated);
        return response()->json($departement, 201);
    }

    public function show(Departement $departement)
    {
        return response()->json($departement->load('faculte', 'filieres', 'enseignants'));
    }

    public function update(Request $request, Departement $departement)
    {
        $validated = $request->validate([
            'nom' => 'sometimes|required|string|max:100',
            'faculte_id' => 'sometimes|required|exists:facultes,id'
        ]);

        $departement->update($validated);
        return response()->json($departement);
    }

    public function destroy(Departement $departement)
    {
        $departement->delete();
        return response()->json(null, 204);
    }
}
