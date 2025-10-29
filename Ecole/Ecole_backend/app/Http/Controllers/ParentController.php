<?php

namespace App\Http\Controllers;

use App\Models\{Message, RendezVous};
use App\Services\BulletinService;
use Illuminate\Http\Request;

class ParentController extends Controller
{
    protected $bulletinService;

    public function __construct(BulletinService $bulletinService)
    {
        $this->bulletinService = $bulletinService;
    }

    public function enfants()
    {
        $parent = auth()->user();
        return $parent->eleves->map(function ($enfant) {
            return [
                'id' => $enfant->id,
                'nom' => $enfant->nom,
                'prenom' => $enfant->prenom,
                'classe' => $enfant->classe,
                'matricule' => $enfant->numero_matricule,
                'moyenne_generale' => $this->getMoyenneGenerale($enfant->id),
                'absences_count' => $enfant->absences()->count()
            ];
        });
    }

    public function bulletins()
    {
        $parent = auth()->user();
        $bulletins = [];
        
        foreach ($parent->eleves as $enfant) {
            foreach (['1er_trimestre', '2eme_trimestre', '3eme_trimestre'] as $periode) {
                $bulletin = $this->getBulletinData($enfant->id, $periode);
                if ($bulletin) {
                    $bulletins[] = [
                        'enfant_id' => $enfant->id,
                        'enfant_nom' => $enfant->nom . ' ' . $enfant->prenom,
                        'periode' => $periode,
                        'moyenne_generale' => $bulletin['moyenne_generale'],
                        'rang' => $bulletin['rang']
                    ];
                }
            }
        }
        
        return $bulletins;
    }

    public function bulletin($enfantId, $periode)
    {
        $enfant = auth()->user()->eleves()->findOrFail($enfantId);
        
        if ($enfant->classe->categorie_classe === 'secondaire') {
            return $this->bulletinService->bulletinSecondaire($enfantId, $periode);
        } else {
            return $this->bulletinService->bulletinMaternellePrimaire($enfantId, $periode);
        }
    }

    public function messages()
    {
        $parentId = auth()->id();
        return Message::where('destinataire', $parentId)
            ->orWhere('expediteur', $parentId)
            ->latest()
            ->get();
    }

    public function rendezVous()
    {
        $parentId = auth()->id();
        return RendezVous::where('parent_id', $parentId)
            ->with(['eleve', 'enseignant'])
            ->latest()
            ->get();
    }

    private function getMoyenneGenerale($eleveId)
    {
        // Logique de calcul de moyenne - à adapter selon votre système
        return 15.5; // Exemple
    }

    private function getBulletinData($eleveId, $periode)
    {
        // Logique pour récupérer les données de bulletin
        return [
            'moyenne_generale' => 15.5,
            'rang' => ['position' => 5, 'total_eleves' => 30]
        ];
    }
}