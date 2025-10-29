<?php

namespace App\Http\Controllers;

use App\Models\{Classes, Eleves, Enseignants, Matieres};
use Illuminate\Http\Request;

class DirecteurController extends Controller
{
    public function stats()
    {
        return response()->json([
            'total_eleves' => Eleves::count(),
            'total_enseignants' => Enseignants::count(),
            'total_classes' => Classes::count(),
            'total_matieres' => Matieres::count(),
        ]);
    }

    public function classes()
    {
        return Classes::with(['eleves'])->get()->map(function ($classe) {
            return [
                'id' => $classe->id,
                'nom' => $classe->nom_classe,
                'niveau' => $classe->categorie_classe,
                'eleves_count' => $classe->eleves->count(),
                'enseignant_principal' => $classe->enseignants->first()
            ];
        });
    }

    public function enseignants()
    {
        return Enseignants::with(['matieres'])->get()->map(function ($enseignant) {
            return [
                'id' => $enseignant->id,
                'nom' => $enseignant->nom,
                'prenom' => $enseignant->prenom,
                'email' => $enseignant->email,
                'telephone' => $enseignant->numero_de_telephone,
                'matieres' => $enseignant->matieres
            ];
        });
    }
}