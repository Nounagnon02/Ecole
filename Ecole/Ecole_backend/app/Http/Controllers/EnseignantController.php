<?php

namespace App\Http\Controllers;

use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Log;

class EnseignantController extends Controller
{
    //recupere les classes d'un enseignant
    public function getClasses(Request $request, $id = null)
    {
        $enseignantId = $id ?? $request->enseignant_id ?? $request->query('enseignant_id');

        Log::info('getClasses appelé avec enseignantId: ' . $enseignantId);

        $classes = DB::table('enseignant_matiere')
            ->join('classes', 'enseignant_matiere.classe_id', '=', 'classes.id')
            ->where('enseignant_matiere.enseignant_id', $enseignantId)
            ->select('classes.id', 'classes.nom_classe as nom_classe')
            ->distinct()
            ->get();

        Log::info('Classes trouvées: ' . $classes->count());

        return response()->json(['success' => true, 'data' => $classes]);
    }

    //recupere l'emploi du temps d'un enseignant
    public function getEmploiTemps(Request $request)
    {
        $enseignantId = $request->enseignant_id ?? $request->query('enseignant_id');

        $emploi = DB::table('emplois_du_temps')
            ->where('enseignant_id', $enseignantId)
            ->orderBy('jour')
            ->orderBy('heure_debut')
            ->get();

        return response()->json(['success' => true, 'data' => $emploi]);
    }

    //recupere les matieres d'un enseignant
    public function getMatieres(Request $request)
    {
        $enseignantId = $request->enseignant_id ?? $request->query('enseignant_id');

        $matieres = DB::table('enseignant_matiere')
            ->join('matieres', 'enseignant_matiere.matiere_id', '=', 'matieres.id')
            ->where('enseignant_matiere.enseignant_id', $enseignantId)
            ->select('matieres.id', 'matieres.nom_matiere as nom_matiere')
            ->distinct()
            ->get();

        return response()->json(['success' => true, 'data' => $matieres]);
    }
    //recupere les classes assignées à l'enseignant authentifié
    public function classes()
    {
        $enseignantId = auth()->id();
        $classes = DB::table('enseignant_matiere')
            ->join('classes', 'enseignant_matiere.classe_id', '=', 'classes.id')
            ->where('enseignant_matiere.enseignant_id', $enseignantId)
            ->select('classes.id', 'classes.nom_classe as nom')
            ->distinct()
            ->get();

        return response()->json($classes);
    }
    //recupere les notes des élèves pour l'enseignant authentifié
    public function notes()
    {
        $enseignantId = auth()->id();
        $notes = DB::table('notes')
            ->join('eleves', 'notes.eleve_id', '=', 'eleves.id')
            ->join('matieres', 'notes.matiere_id', '=', 'matieres.id')
            ->select('notes.*', 'eleves.nom', 'eleves.prenom', 'matieres.nom_matiere')
            ->latest('notes.created_at')
            ->get();

        return response()->json($notes);
    }



}
