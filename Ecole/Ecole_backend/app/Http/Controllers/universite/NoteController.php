<?php

namespace App\Http\Controllers\Universite;

use App\Http\Controllers\Controller;
use App\Models\Universite\Note;
use Illuminate\Http\Request;

class NoteController extends Controller
{
    public function index()
    {
        $notes = Note::with('etudiant', 'matiere')->get();
        return response()->json($notes);
    }

    public function store(Request $request)
    {
        $request->validate([
            'etudiant_id' => 'required|exists:etudiants,id',
            'matiere_id' => 'required|exists:matieres,id',
            'note' => 'required|numeric|min:0|max:20',
            'type' => 'required|in:CC,TP,Examen',
            'date_evaluation' => 'required|date'
        ]);

        $note = Note::create($request->all());
        return response()->json($note, 201);
    }

    public function show(Note $note)
    {
        return response()->json($note->load('etudiant', 'matiere'));
    }

    public function update(Request $request, Note $note)
    {
        $request->validate([
            'note' => 'sometimes|required|numeric|min:0|max:20',
            'type' => 'sometimes|required|in:CC,TP,Examen',
            'date_evaluation' => 'sometimes|required|date'
        ]);

        $note->update($request->all());
        return response()->json($note);
    }

    public function destroy(Note $note)
    {
        $note->delete();
        return response()->json(null, 204);
    }
}
