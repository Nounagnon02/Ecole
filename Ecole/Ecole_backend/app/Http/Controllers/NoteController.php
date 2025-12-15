<?php

namespace App\Http\Controllers;

use App\Models\Note;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Validator;

/**
 * Contrôleur pour la gestion individuelle des notes
 * (différent de NotesController qui gère les opérations en masse)
 */
class NoteController extends Controller
{
    /**
     * Créer une nouvelle note
     */
    public function store(Request $request)
    {
        $validator = Validator::make($request->all(), [
            'eleve_id' => 'required|exists:eleves,id',
            'matiere_id' => 'required|exists:matieres,id',
            'classe_id' => 'required|exists:classes,id',
            'note' => 'required|numeric|min:0|max:20',
            'note_sur' => 'numeric|min:1|max:100',
            'type_evaluation' => 'required|string',
            'periode' => 'required|string',
            'date_evaluation' => 'date',
            'commentaire' => 'nullable|string'
        ]);

        if ($validator->fails()) {
            return response()->json([
                'success' => false,
                'errors' => $validator->errors()
            ], 422);
        }

        try {
            $note = Note::create($request->all());
            
            return response()->json([
                'success' => true,
                'message' => 'Note enregistrée avec succès',
                'data' => $note
            ], 201);
        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Erreur lors de l\'enregistrement de la note'
            ], 500);
        }
    }

    /**
     * Récupérer les notes d'un élève
     */
    public function getByEleve($eleveId)
    {
        $notes = Note::where('eleve_id', $eleveId)
            ->with(['matiere', 'classe'])
            ->orderBy('date_evaluation', 'desc')
            ->get();

        return response()->json([
            'success' => true,
            'data' => $notes
        ]);
    }

    /**
     * Récupérer les notes d'une classe
     */
    public function getByClasse($classeId)
    {
        $notes = Note::where('classe_id', $classeId)
            ->with(['eleve', 'matiere'])
            ->orderBy('date_evaluation', 'desc')
            ->get();

        return response()->json([
            'success' => true,
            'data' => $notes
        ]);
    }
}
