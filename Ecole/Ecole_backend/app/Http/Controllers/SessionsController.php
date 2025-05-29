<?php

namespace App\Http\Controllers;

use App\Models\Candidats;
use App\Models\Eleves;
use App\Models\Sessions;
use Illuminate\Contracts\Session\Session;
use Illuminate\Http\Request;

class SessionsController extends Controller
{
    public function index(){
        // Récupère les sessions avec leurs matières associées
    $sessions = Sessions::with('matieres','candidats')->get();

    return response()->json($sessions);
    }

    public function getMatieresBySession($sessionId) {
        // Récupère la session avec les matières associées uniquement
        $session = Sessions::with('matieres')->find($sessionId);
    
        if (!$session) {
            return response()->json(['message' => 'Session non trouvée'], 404);
        }
    
        return response()->json($session->matieres);
    }
    public function getCandidatsBySession($sessionId) {
        // Récupère la session avec les matières associées uniquement
        $session = Sessions::with('candidats')->find($sessionId);
    
        if (!$session) {
            return response()->json(['message' => 'Session non trouvée'], 404);
        }
    
        return response()->json($session->candidats);
    }
    
    

    public function store(Request $request){
        $request->validate([
            'nom'=>'string|required',
            'statut'=>'string|required',
            'date_debut'=>'date|required',
            'date_fin'=>'date|required'
            
        ]);
    $data = $request->only(['nom', 'statut', 'date_debut','date_fin']);
        $sessions = Sessions::create($data);
        // Ajouter les matières à la session
        if ($request->has('matieres')) {
            $sessions->matieres()->attach($request->matieres);
        }
        return response()->json($sessions,201);
    }
    public function destroy($id)
{
    $session = Sessions::find($id);

    if ($session) {
        $session->delete();
        return response()->json(['message' => 'Session supprimée avec succès']);
    } else {
        return response()->json(['message' => 'Session introuvable'], 404);
    }
}

    public function show($id)
    {
        $sessions = Sessions::find($id);

        if (!$sessions) {
            return response()->json(['message' => 'Candidat non trouvé'], 404);
        }

        return response()->json($sessions, 200);
    }
    public function addCandidat(Request $request, Sessions $session)
    {
        $candidat = Eleves::findOrFail($request->candidat_id);
        $session->candidats()->attach($candidat);
        return response()->json(['message' => 'Candidat ajouté à la session'], 200);
    }

}
