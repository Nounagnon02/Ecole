<?php

namespace App\Http\Controllers;

use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;

class NoteController extends Controller
{
    public function store(Request $request)
    {
        $validated = $request->validate([
            'eleve_id' => 'required|integer',
            'matiere_id' => 'required|integer',
            'classe_id' => 'required|integer',
            'type_evaluation' => 'required|string',
            'periode' => 'required|string',
            'note' => 'required|numeric',
            'note_sur' => 'required|numeric',
            'date_evaluation' => 'required|date'
        ]);

        $id = DB::table('notes')->insertGetId(array_merge($validated, [
            'created_at' => now(),
            'updated_at' => now()
        ]));

        return response()->json(['success' => true, 'data' => ['id' => $id]], 201);
    }

    public function getByEleve($eleveId)
    {
        $notes = DB::table('notes')
            ->join('matieres', 'notes.matiere_id', '=', 'matieres.id')
            ->where('notes.eleve_id', $eleveId)
            ->select('notes.*', 'matieres.nom as matiere')
            ->orderBy('notes.date_evaluation', 'desc')
            ->get();

        return response()->json(['success' => true, 'data' => $notes]);
    }

    public function getByClasse($classeId, Request $request)
    {
        $matiereId = $request->query('matiere_id');
        $periode = $request->query('periode');

        $query = DB::table('notes')
            ->join('eleves', 'notes.eleve_id', '=', 'eleves.id')
            ->join('matieres', 'notes.matiere_id', '=', 'matieres.id')
            ->where('notes.classe_id', $classeId)
            ->select('notes.*', 
                     DB::raw("CONCAT(eleves.prenom, ' ', eleves.nom) as eleve"),
                     'matieres.nom as matiere');

        if ($matiereId) $query->where('notes.matiere_id', $matiereId);
        if ($periode) $query->where('notes.periode', $periode);

        $notes = $query->orderBy('eleves.nom')->get();

        return response()->json(['success' => true, 'data' => $notes]);
    }
}
