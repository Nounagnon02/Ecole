<?php

namespace App\Http\Controllers;

use App\Models\Candidats;
use App\Models\Eleves;
use App\Models\Moyennes;
use App\Models\Notes;
use Illuminate\Http\Request;
use PhpParser\Node\Stmt\Else_;

class EleveController extends Controller
{
    public function getBulletin($id)
    {
        // Récupérer l'eleve par ID avec les matières
        $eleve = Eleves::with('matieres')->find($id);
    
        // Vérifier si l'eleve existe
        if (!$eleve) {
            return response()->json(['message' => 'Candidat non trouvé.'], 404);
        }
        // Récupérer les notes de l'eleve avec les matières associées
        $notes = Notes::with('matieres')->where('eleves_id', $id)->get();
    
        // Récupérer la moyenne depuis la table moyennes
        $moyenne = Moyennes::where('eleves_id', $id)->value('moyenne'); 
    
        // Construire le bulletin
        $bulletin = [
            'Eleve' => $eleve,
            'notes' => $notes,
            'moyenne' => $moyenne,
        ];
    
        return response()->json($bulletin);
    }
    



    public function index(){
        // Récupère les sessions avec leurs matières associées
    $sessions = Eleves::all();

    return response()->json($sessions);
    }
public function getByMatricule($matricule)
{
    $candidat = Eleves::where('numero_matricule', $matricule)->first();
    return response()->json($candidat);
}
public function getMoyennesByCandidats($candidatId)
    {
        $moyennes = Moyennes::with('candidats')
            ->where('candidats_id', $candidatId)
            ->get();
    
        return response()->json($moyennes);
    }
    



    public function store(Request $request){
        $request->validate([
            'nom'=>'required|string',
            'prenom'=>'required|string',
            'email'=>'unique:candidats,email',
            'serie'=>'string|required',
            'numero_matricule'=>'string|required'
            
        ]);

        $eleve= Eleves::create($request->all());
        return response()->json($eleve,201);
    }

     // Affiche d'un eleve spécifique
    public function show($id)
    {
        $eleve = Eleves::find($id);

        if (!$eleve) {
            return response()->json(['message' => 'Candidat non trouvé'], 404);
        }

        return response()->json($eleve, 200);
    }

     // Met à jour d'un eleve spécifique
    public function update(Request $request, $id)
    {
        $eleve = Eleves::find($id);

        if (!$eleve) {
            return response()->json(['message' => 'Candidat non trouvé'], 404);
        }

        $validatedData = $request->validate([
            'nom'=>'string|required',
            'prenom'=>'string|required',
            'email'=>'string|required',
            'serie'=>'string|required',
            'numero_matricule'=>'string|required'

        ]);

        $eleve->update($validatedData);

        return response()->json($eleve, 200);
    }

     // Supprime un eleve  spécifique
    public function destroy($id)
    {
        $eleve = Eleves::find($id);

        if (!$eleve) {
            return response()->json(['message' => 'Candidat non trouvé'], 404);
        }

        $eleve->delete();
        return response()->json(['message' => 'Candidat supprimé'], 200);
    }
}
