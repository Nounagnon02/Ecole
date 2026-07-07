<?php

namespace App\Http\Controllers;

use App\Models\{Absence, Incident, Sanction};
use Illuminate\Http\Request;

class SurveillantController extends Controller
{
    public function absences()
    {
        return Absence::with(['eleve.classe'])->latest()->get();
    }

    public function incidents()
    {
        return Incident::latest()->get();
    }

    public function sanctions()
    {
        return Sanction::with(['eleve.classe'])->latest()->get();
    }

    public function storeAbsence(Request $request)
    {
        $validated = $request->validate([
            'eleve_id' => 'required|exists:eleves,id',
            'date' => 'required|date',
            'type' => 'required|in:absence,retard',
            'motif' => 'nullable|string'
        ]);

        return Absence::create($validated);
    }

    public function storeIncident(Request $request)
    {
        $validated = $request->validate([
            'description' => 'required|string',
            'date' => 'required|date',
            'gravite' => 'required|in:faible,moyenne,grave'
        ]);

        return Incident::create($validated);
    }

    public function storeSanction(Request $request)
    {
        $validated = $request->validate([
            'eleve_id' => 'required|exists:eleves,id',
            'type_sanction' => 'required|string',
            'motif' => 'required|string',
            'date' => 'required|date',
            'duree' => 'nullable|integer'
        ]);

        return Sanction::create($validated);
    }
}