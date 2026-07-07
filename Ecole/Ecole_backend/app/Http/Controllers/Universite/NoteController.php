<?php

namespace App\Http\Controllers\Universite;

use App\Http\Controllers\Controller;
use App\Models\Universite\Note;
use Illuminate\Http\Request;

class NoteController extends Controller
{
    public function index()
    {
        $notes = Note::with('etudiant', 'matiere')->paginate(15);
        return response()->json($notes);
    }

    public function store(Request $request)
    {
        $validated = $request->validate([
            'etudiant_id' => 'required|exists:etudiants,id',
            'matiere_id' => 'required|exists:matieres,id',
            'note' => 'required|numeric|min:0|max:20',
            'type' => 'required|in:CC,TP,Examen',
            'date_evaluation' => 'required|date'
        ]);

        $note = Note::create($validated);
        return response()->json($note, 201);
    }

    public function show(Note $note)
    {
        return response()->json($note->load('etudiant', 'matiere'));
    }

    public function update(Request $request, Note $note)
    {
        $validated = $request->validate([
            'note' => 'sometimes|required|numeric|min:0|max:20',
            'type' => 'sometimes|required|in:CC,TP,Examen',
            'date_evaluation' => 'sometimes|required|date'
        ]);

        $note->update($validated);
        return response()->json($note);
    }

    public function destroy(Note $note)
    {
        $note->delete();
        return response()->json(null, 204);
    }
}
