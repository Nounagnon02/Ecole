<?php

namespace App\Http\Controllers;

use App\Models\Enseignants;
use App\Models\Enseignants_Martenel_Primaire;
use Illuminate\Http\Request;

class EnseignantsController extends Controller
{
    //
    public function getEnseignants(Request $request)
    {
        $query = Enseignants::query();
        
        if ($request->has('with_matieres')) {
            $query->with('matieres');
        }

        $enseignants = $query->get();
        
        return response()->json($enseignants);
    }

    public function getEnseignantsMP(Request $request)
    {
        $query = Enseignants_Martenel_Primaire::query();
        
        if ($request->has('with_classes')) {
            $query->with('classes');
        }

        $enseignants = $query->get();
        
        return response()->json($enseignants);
    }

    public function getEnseignantMEffectif(){
        $effectif = Enseignants_Martenel_Primaire::where('role', 'enseignementM')-> count();
        return response()->json( $effectif);
    }
    public function getEnseignantPEffectif(){
        $effectif = Enseignants_Martenel_Primaire::where('role', 'enseignementP')-> count();
        return response()->json( $effectif);
    }
    public function getEnseignantSEffectif(){
        $effectif = Enseignants::count();
        return response()->json( $effectif);
    }

    
}
