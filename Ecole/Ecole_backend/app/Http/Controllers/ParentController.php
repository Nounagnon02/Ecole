<?php

namespace App\Http\Controllers;

use App\Models\{Message, RendezVous, UserParent, Eleve};
use App\Services\BulletinService;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;

class ParentController extends Controller
{
    protected $bulletinService;

    public function __construct(BulletinService $bulletinService)
    {
        $this->bulletinService = $bulletinService;
    }

    /**
     * Espace Parent : Liste de ses enfants
     */
    public function enfants()
    {
        $user = Auth::user();
        if (!$user->parent) {
            return response()->json(['message' => 'Profil parent non trouvé'], 404);
        }

        return $user->parent->eleves()->with('user', 'classe')->get()->map(function ($enfant) {
            return [
                'id' => $enfant->id,
                'nom' => $enfant->user->name,
                'prenom' => $enfant->user->prenom,
                'classe' => $enfant->classe->nom_classe,
                'matricule' => $enfant->numero_matricule,
            ];
        });
    }

    /**
     * Espace Parent : Consulter le bulletin d'un enfant
     */
    public function bulletin($enfantId, $periode)
    {
        $user = Auth::user();
        $parent = $user->parent;
        
        // Vérifier que c'est bien son enfant
        $enfant = $parent->eleves()->findOrFail($enfantId);
        
        if ($enfant->classe->categorie_classe === 'secondaire') {
            return $this->bulletinService->bulletinSecondaire($enfantId, $periode);
        } else {
            return $this->bulletinService->bulletinMaternellePrimaire($enfantId, $periode);
        }
    }

    public function messages()
    {
        $user = Auth::user();
        return Message::where('destinataire_id', $user->id) // Adapté au nouveau schéma
            ->orWhere('expediteur_id', $user->id)
            ->latest()
            ->get();
    }
}