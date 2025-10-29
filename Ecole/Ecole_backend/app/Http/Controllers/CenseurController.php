<?php

namespace App\Http\Controllers;

use App\Models\{Classes, ConseilClasse, Examen, Notes};
use Illuminate\Http\Request;

class CenseurController extends Controller
{
    public function resultats()
    {
        $stats = [
            'moyenne_generale' => Notes::avg('note'),
            'taux_reussite' => 85, // À calculer selon votre logique
            'eleves_excellence' => Notes::where('note', '>=', 16)->distinct('eleve_id')->count(),
            'eleves_difficulte' => Notes::where('note', '<', 10)->distinct('eleve_id')->count()
        ];

        $resultats = Classes::with(['eleves'])->get()->map(function ($classe) {
            return [
                'id' => $classe->id,
                'nom' => $classe->nom_classe,
                'effectif' => $classe->eleves->count(),
                'moyenne' => $this->getMoyenneClasse($classe->id),
                'admis' => $this->getAdmis($classe->id),
                'echec' => $this->getEchec($classe->id)
            ];
        });

        return response()->json([
            'stats' => $stats,
            'resultats' => $resultats
        ]);
    }

    public function conseilsClasse()
    {
        return ConseilClasse::with(['classe'])->latest()->get();
    }

    public function examens()
    {
        return Examen::latest()->get();
    }

    public function storeConseilClasse(Request $request)
    {
        $request->validate([
            'classe_id' => 'required|exists:classes,id',
            'date' => 'required|date',
            'trimestre' => 'required|string'
        ]);

        return ConseilClasse::create($request->all());
    }

    public function storeExamen(Request $request)
    {
        $request->validate([
            'nom' => 'required|string',
            'type' => 'required|string',
            'date_debut' => 'required|date',
            'date_fin' => 'required|date'
        ]);

        return Examen::create($request->all());
    }

    public function statsChart()
    {
        return [
            'labels' => ['6ème', '5ème', '4ème', '3ème', '2nde', '1ère', 'Tle'],
            'datasets' => [[
                'label' => 'Moyenne par classe',
                'data' => [14.5, 13.8, 15.2, 14.1, 13.5, 14.8, 15.5]
            ]]
        ];
    }

    private function getMoyenneClasse($classeId)
    {
        return Notes::whereHas('eleve', function ($query) use ($classeId) {
            $query->where('class_id', $classeId);
        })->avg('note') ?? 0;
    }

    private function getAdmis($classeId)
    {
        // Logique pour calculer les admis
        return 25; // Exemple
    }

    private function getEchec($classeId)
    {
        // Logique pour calculer les échecs
        return 5; // Exemple
    }
}