<?php

namespace App\Http\Controllers;

use App\Models\{User, Eleve, Classe, Note, Matiere};
use Illuminate\Http\Request;

class DashboardController extends Controller
{
    public function directeur()
    {
        return response()->json([
            'success' => true,
            'data' => [
                'total_eleves' => Eleve::count(),
                'total_classes' => Classe::count(),
                'total_enseignants' => User::where('role', 'enseignant')->count(),
                'classes' => Classe::with(['eleves', 'enseignants'])->get()
            ]
        ]);
    }

    public function enseignant(Request $request)
    {
        $enseignant = $request->user()->enseignant;
        
        return response()->json([
            'success' => true,
            'data' => [
                'classes' => $enseignant->classes()->with('eleves')->get(),
                'matieres' => $enseignant->matieres,
                'notes_recentes' => Note::where('enseignant_id', $enseignant->id)
                    ->with(['eleve', 'matiere'])
                    ->latest()
                    ->take(10)
                    ->get()
            ]
        ]);
    }

    public function parent(Request $request, $parentId)
    {
        $parent = User::findOrFail($parentId);
        $children = $parent->eleves()->with(['classe', 'notes.matiere'])->get();

        return response()->json([
            'success' => true,
            'data' => [
                'parent' => $parent,
                'children' => $children->map(function($child) {
                    return [
                        'id' => $child->id,
                        'name' => $child->user->prenom . ' ' . $child->user->nom,
                        'class' => $child->classe->nom_classe,
                        'matricule' => $child->matricule,
                        'moyenne_generale' => $this->calculateAverage($child->notes)
                    ];
                })
            ]
        ]);
    }

    private function calculateAverage($notes)
    {
        if ($notes->isEmpty()) return null;
        
        return $notes->avg('note');
    }
}