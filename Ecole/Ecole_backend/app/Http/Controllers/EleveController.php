<?php

namespace App\Http\Controllers;

use App\Models\{Devoir, EmploiDuTemps};
use App\Services\BulletinService;
use Illuminate\Http\Request;

class EleveController extends Controller
{
    protected $bulletinService;

    public function __construct(BulletinService $bulletinService)
    {
        $this->bulletinService = $bulletinService;
    }

    public function bulletin($periode)
    {
        $eleveId = auth()->id();
        $eleve = auth()->user();
        
        if ($eleve->classe->categorie_classe === 'secondaire') {
            return $this->bulletinService->bulletinSecondaire($eleveId, $periode);
        } else {
            return $this->bulletinService->bulletinMaternellePrimaire($eleveId, $periode);
        }
    }

    public function devoirs()
    {
        $eleve = auth()->user();
        return Devoir::where('classe_id', $eleve->class_id)
            ->with(['matiere', 'enseignant'])
            ->latest()
            ->get()
            ->map(function ($devoir) {
                return [
                    'id' => $devoir->id,
                    'titre' => $devoir->titre,
                    'description' => $devoir->description,
                    'matiere' => $devoir->matiere->nom,
                    'date_limite' => $devoir->date_limite,
                    'rendu' => false // À implémenter selon votre logique
                ];
            });
    }

    public function emploiDuTemps()
    {
        $eleve = auth()->user();
        return EmploiDuTemps::where('classe_id', $eleve->class_id)
            ->with(['matiere', 'enseignant'])
            ->get()
            ->map(function ($cours) {
                return [
                    'id' => $cours->id,
                    'jour' => $cours->jour,
                    'heure_debut' => $cours->heure_debut,
                    'heure_fin' => $cours->heure_fin,
                    'matiere' => $cours->matiere->nom,
                    'enseignant' => $cours->enseignant->nom . ' ' . $cours->enseignant->prenom,
                    'salle' => $cours->salle
                ];
            });
    }
}