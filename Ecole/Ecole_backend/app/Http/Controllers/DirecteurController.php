<?php

namespace App\Http\Controllers;

use App\Models\{Classes, Eleve, Enseignant, Matieres};

class DirecteurController extends Controller
{
    public function stats()
    {
        return response()->json([
            'total_eleves' => Eleve::count(),
            'total_enseignants' => Enseignant::count(),
            'total_classes' => Classes::count(),
            'total_matieres' => Matieres::count(),
        ]);
    }

    public function classes()
    {
        return Classes::withCount('eleves')
            ->with('enseignants')
            ->get()
            ->map(function ($classe) {
                return [
                    'id' => $classe->id,
                    'nom' => $classe->nom_classe,
                    'niveau' => $classe->categorie_classe,
                    'eleves_count' => $classe->eleves_count,
                    'enseignant_principal' => $classe->enseignants->first()
                ];
            });
    }

    public function enseignants()
    {
        return Enseignant::with(['user', 'matieres'])->get()->map(function ($enseignant) {
            return [
                'id' => $enseignant->id,
                'nom' => $enseignant->user?->name,
                'prenom' => $enseignant->user?->prenom,
                'email' => $enseignant->user?->email,
                'telephone' => $enseignant->user?->telephone,
                'matieres' => $enseignant->matieres
            ];
        });
    }
}