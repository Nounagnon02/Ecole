<?php

namespace App\Http\Controllers\Notes;

use App\Http\Controllers\Controller;
use App\Models\Notes;
use App\Support\AnneeScolaire;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Log;

class NotesAutoSaveController extends Controller
{
    /**
     * Auto-save a single note value (debounced frontend → backend).
     *
     * POST /notes/auto-save
     * Body: { eleve_id, classe_id, matiere_id, type_evaluation, date_evaluation,
     *         periode, note, annee_scolaire? }
     *
     * Upserts the note using the unique constraint
     * (eleve_id, classe_id, matiere_id, type_evaluation, periode,
     *  date_evaluation, annee_scolaire).
     * Returns the saved value with a timestamp.
     */
    public function save(Request $request)
    {
        $validated = $request->validate([
            'eleve_id'       => 'required|integer',
            'classe_id'      => 'required|integer',
            'matiere_id'     => 'required|integer',
            'type_evaluation' => 'required|in:Devoir1,Devoir2,Interrogation,1ère evaluation,2ème evaluation,3ème evaluation,4ème evaluation,5ème evaluation,6ème evaluation',
            'date_evaluation' => 'required|date',
            'periode'        => 'required|in:Trimestre 1,Trimestre 2,Trimestre 3',
            'note'           => 'required|numeric|min:0|max:20',
            'annee_scolaire' => 'nullable|string|regex:/^\d{4}-\d{4}$/',
        ]);

        $anneeScolaire = $validated['annee_scolaire'] ?? AnneeScolaire::courante();

        $match = [
            'eleve_id'        => $validated['eleve_id'],
            'classe_id'       => $validated['classe_id'],
            'matiere_id'      => $validated['matiere_id'],
            'type_evaluation' => $validated['type_evaluation'],
            'periode'         => $validated['periode'],
            'date_evaluation' => $validated['date_evaluation'],
            'annee_scolaire'  => $anneeScolaire,
        ];

        $note = Notes::where($match)->first();

        if ($note) {
            if ($note->locked) {
                return response()->json([
                    'success' => false,
                    'message' => 'Note verrouillée, modification impossible',
                ], 403);
            }

            $note->update(['note' => $validated['note']]);

            Log::debug('Auto-save: note mise à jour', ['id' => $note->id]);
        } else {
            $note = Notes::create([
                ...$match,
                'note_sur' => 20,
                'created_by' => auth()->id(),
            ]);

            Log::debug('Auto-save: note créée', ['id' => $note->id]);
        }

        return response()->json([
            'success'  => true,
            'saved_at' => now()->toISOString(),
            'note'     => $note->note,
            'note_id'  => $note->id,
        ]);
    }
}
