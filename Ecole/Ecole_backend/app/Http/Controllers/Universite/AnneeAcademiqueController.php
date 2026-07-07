<?php

namespace App\Http\Controllers\Universite;

use App\Http\Controllers\Controller;
use App\Models\Universite\AnneeAcademique;
use Illuminate\Http\Request;

class AnneeAcademiqueController extends Controller
{
    public function index()
    {
        $annees = AnneeAcademique::paginate(15);
        return response()->json($annees);
    }

    public function store(Request $request)
    {
        $validated = $request->validate([
            'libelle' => 'required|string|max:50',
            'date_debut' => 'required|date',
            'date_fin' => 'required|date|after:date_debut'
        ]);

        $annee = AnneeAcademique::create($validated);
        return response()->json($annee, 201);
    }

    public function show(AnneeAcademique $anneeAcademique)
    {
        return response()->json($anneeAcademique->load('inscriptions', 'semestres'));
    }

    public function update(Request $request, AnneeAcademique $anneeAcademique)
    {
        $validated = $request->validate([
            'libelle' => 'sometimes|required|string|max:50',
            'date_debut' => 'sometimes|required|date',
            'date_fin' => 'sometimes|required|date|after:date_debut'
        ]);

        $anneeAcademique->update($validated);
        return response()->json($anneeAcademique);
    }

    public function destroy(AnneeAcademique $anneeAcademique)
    {
        $anneeAcademique->delete();
        return response()->json(null, 204);
    }
}
