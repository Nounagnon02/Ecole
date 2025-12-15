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

    /**
     * Endpoint consolidé pour le dashboard directeur
     * Retourne toutes les données en une seule requête avec cache de 5 minutes
     */
    public function getDashboardData()
    {
        $data = \Illuminate\Support\Facades\Cache::remember('dashboard_directeur', 300, function () {
            return [
                'classes' => Classe::with('series')->get(),
                'classes_effectif' => Classe::withCount('eleves')->get()->map(function ($c) {
                    $c->effectif = $c->eleves_count;
                    return $c;
                }),
                'eleves' => Eleve::all(),
                'matieres' => Matiere::all(),
                'matieres_series' => Matiere::with('series')->get(),
                'series' => \App\Models\Series::with('matieres')->get(),
                'stats' => [
                    'total_eleves' => Eleve::count(),
                    'total_classes' => Classe::count(),
                    'total_enseignants' => User::where('role', 'enseignant')->count(),
                    'evolution_effectifs' => [
                        ['name' => 'Sept', 'students' => 320],
                        ['name' => 'Oct', 'students' => 330],
                        ['name' => 'Nov', 'students' => 340],
                        ['name' => 'Déc', 'students' => 350]
                    ],
                    'repartition_notes' => [
                        ['name' => 'Excellent', 'value' => 25],
                        ['name' => 'Bien', 'value' => 35],
                        ['name' => 'Moyen', 'value' => 25],
                        ['name' => 'Insuffisant', 'value' => 15]
                    ]
                ]
            ];
        });

        return response()->json([
            'success' => true,
            'data' => $data,
            'cached' => true
        ]);
    }

    /**
     * Invalide le cache du dashboard
     */
    public function invalidateCache()
    {
        \Illuminate\Support\Facades\Cache::forget('dashboard_directeur');
        return response()->json(['success' => true, 'message' => 'Cache invalidé']);
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