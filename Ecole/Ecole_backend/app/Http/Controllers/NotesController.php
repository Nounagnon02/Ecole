<?php

namespace App\Http\Controllers;

use App\Models\Moyennes;
use App\Models\Notes;
use App\Models\Eleves;
use App\Models\Classes;
use App\Models\Matieres;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Validator;
use PhpOffice\PhpSpreadsheet\IOFactory;
use Illuminate\Database\QueryException;
use Smalot\PdfParser\Parser as PdfParser;

class NotesController extends Controller
{
    public function getNotesByEleves($eleveId)
    {
        $notes = Notes::with('eleve')
            ->where('eleves_id', $eleveId)
            ->get();

        return response()->json($notes);
    }

    public function getNotesBySession($sessionId)
    {
        $notes = Notes::with('eleve')
            ->where('sessions_id', $sessionId)
            ->get();

        return response()->json($notes);
    }

    public function store111(Request $request, $sessionId)
    {
        $request->validate([
            'notes' => 'required|array',
            'notes.*.eleve_id' => 'required|exists:eleves,id',
            'notes.*.matiere_id' => 'required|exists:matieres,id',
            'notes.*.note' => 'required|numeric|min:0|max:20',
        ], [
            'notes.required' => 'Le champ notes est obligatoire.',
            'notes.*.eleve_id.exists' => 'L\'élève spécifié n\'existe pas.',
            'notes.*.matiere_id.exists' => 'La matière spécifiée n\'existe pas.',
            'notes.*.note.numeric' => 'La note doit être un nombre.',
        ]);

        $savedNotes = [];
        $ignoredNotes = [];

        foreach ($request->input('notes') as $noteData) {
            $existingNote = Notes::where('eleves_id', $noteData['eleve_id'])
                ->where('matieres_id', $noteData['matiere_id'])
                ->where('sessions_id', $sessionId)
                ->first();

            if ($existingNote) {
                $ignoredNotes[] = $noteData;
            } else {
                $note = new Notes();
                $note->eleves_id = $noteData['eleve_id'];
                $note->matieres_id = $noteData['matiere_id'];
                $note->note = $noteData['note'];
                $note->sessions_id = $sessionId;

                $note->save();
                $savedNotes[] = $note;
            }
        }

        return response()->json([
            'message' => count($savedNotes) ? 'Notes enregistrées avec succès.' : 'Aucune nouvelle note enregistrée.',
            'saved_notes' => $savedNotes,
            'ignored_notes' => $ignoredNotes
        ], 201);
    }


    private function getCoefficientBySerieAndMatiere($serie, $nomMatiere)
    {
        $coefficients = [
            'Série A' => [
                'Maths' => 4,
                'PCT' => 3,
                'SVT' => 2,
                'Hist-Géo' => 2,
                'Anglais' => 2,
                'Français' => 2,
            ],
            'Série B' => [
                'Maths' => 4,
                'PCT' => 3,
                'Français' => 2,
            ],
            'Série C' => [
                'Maths' => 4,
                'PCT' => 3,
                'Français' => 2,
            ],
            'Série D' => [
                'Maths' => 4,
                'PCT' => 3,
                'Français' => 2,
            ],
            'Série E' => [
                'Maths' => 4,
                'PCT' => 3,
                'Français' => 2,
            ],
            'Série F' => [
                'Maths' => 4,
                'PCT' => 3,
                'Français' => 2,
            ],
            'Série MC' => [
                'Maths' => 4,
                'PCT' => 3,
                'Français' => 2,
            ],
            'Série ML' => [
                'Maths' => 4,
                'PCT' => 3,
                'Français' => 2,
            ],
        ];

        return $coefficients[$serie][$nomMatiere] ?? 1;
    }

    public function getMoyennesBySession($sessionId)
    {
        $moyennes = Moyennes::with('eleve')
            ->where('sessions_id', $sessionId)
            ->get();

        return response()->json($moyennes);
    }

    public function destroy($id)
    {
        $note = Notes::find($id);

        if (!$note) {
            return response()->json([
                'success' => false,
                'message' => 'Note non trouvée'
            ], 404);
        }

        try {
            $note->delete();

            return response()->json([
                'success' => true,
                'message' => 'Note supprimée avec succès'
            ]);
        } catch (QueryException $e) {
            return response()->json([
                'success' => false,
                'message' => 'Erreur de base de données : ' . $e->getMessage()
            ], 500);
        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Erreur lors de la suppression de la note : ' . $e->getMessage()
            ], 500);
        }
    }   
    public function store(Request $request)
    {
        $validator = Validator::make($request->all(), [
            'eleve_id' => 'required|exists:eleves,id',
            'classe_id' => 'required|exists:classes,id',
            'matiere_id' => 'required|exists:matieres,id',
            'enseignant_id' => 'required|exists:enseignants,id',
            'note' => 'required|numeric|min:0',
            'note_sur' => 'required|numeric|min:1|max:100',
            'type_evaluation' => 'nullable|string|max:100',
            'commentaire' => 'nullable|string',
            'date_evaluation' => 'required|date',
            'periode' => 'nullable|string|max:50'
        ]);

        if ($validator->fails()) {
            return response()->json([
                'success' => false,
                'errors' => $validator->errors()
            ], 422);
        }

        try {
            $note = Notes::create($request->all());

            return response()->json([
                'success' => true,
                'message' => 'Note ajoutée avec succès',
                'note' => $note->load(['eleve', 'classe', 'matiere', 'enseignant'])
            ]);
        } catch (QueryException $e) {
            return response()->json([
                'success' => false,
                'message' => 'Erreur de base de données : ' . $e->getMessage()
            ], 500);
        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Erreur lors de l\'ajout de la note : ' . $e->getMessage()
            ], 500);
        }
    }

    public function show($id)
    {
        $note = Notes::with(['eleve', 'classe', 'matiere', 'enseignant'])->find($id);

        if (!$note) {
            return response()->json([
                'success' => false,
                'message' => 'Note non trouvée'
            ], 404);
        }

        return response()->json([
            'success' => true,
            'note' => $note
        ]);
    }

    public function update(Request $request, $id)
    {
        $note = Notes::find($id);

        if (!$note) {
            return response()->json([
                'success' => false,
                'message' => 'Note non trouvée'
            ], 404);
        }

        $validator = Validator::make($request->all(), [
            'eleve_id' => 'sometimes|exists:eleves,id',
            'classe_id' => 'sometimes|exists:classes,id',
            'matiere_id' => 'sometimes|exists:matieres,id',
            'enseignant_id' => 'sometimes|exists:enseignants,id',
            'note' => 'sometimes|numeric|min:0',
            'note_sur' => 'sometimes|numeric|min:1|max:100',
            'type_evaluation' => 'nullable|string|max:100',
            'commentaire' => 'nullable|string',
            'date_evaluation' => 'sometimes|date',
            'periode' => 'nullable|string|max:50'
        ]);

        if ($validator->fails()) {
            return response()->json([
                'success' => false,
                'errors' => $validator->errors()
            ], 422);
        }

        try {
            $note->update($request->all());

            return response()->json([
                'success' => true,
                'message' => 'Note mise à jour avec succès',
                'note' => $note->load(['eleve', 'classe', 'matiere', 'enseignant'])
            ]);
        } catch (QueryException $e) {
            return response()->json([
                'success' => false,
                'message' => 'Erreur de base de données : ' . $e->getMessage()
            ], 500);
        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Erreur lors de la mise à jour de la note : ' . $e->getMessage()
            ], 500);
        }
    }


    public function importNotes(Request $request)
    {
        $validator = Validator::make($request->all(), [
            'classe_id' => 'required|exists:classes,id',
            'matiere_id' => 'required|exists:matieres,id',
            'enseignant_id' => 'required|exists:enseignants,id',
            'fichier' => 'required|file|mimes:xlsx,xls,pdf|max:5120', // 5MB max
            'type_evaluation' => 'nullable|string|max:100',
            'date_evaluation' => 'required|date',
            'periode' => 'nullable|string|max:50'
        ]);

        if ($validator->fails()) {
            return response()->json([
                'success' => false,
                'errors' => $validator->errors()
            ], 422);
        }

        try {
            $file = $request->file('fichier');
            $extension = $file->getClientOriginalExtension();
            
            $notesData = [];

            if (in_array($extension, ['xlsx', 'xls'])) {
                $notesData = $this->processExcelFile($file);
            } elseif ($extension === 'pdf') {
                $notesData = $this->processPdfFile($file);
            }

            if (empty($notesData)) {
                return response()->json([
                    'success' => false,
                    'message' => 'Aucune donnée trouvée dans le fichier'
                ], 422);
            }

            $sucessCount = 0;
            $errors = [];

            DB::beginTransaction();

            foreach ($notesData as $index => $noteData) {
                try {
                    // Rechercher l'élève par nom ou numéro
                    $eleve = $this->findEleve($noteData['eleve'], $request->classe_id);
                    
                    if (!$eleve) {
                        $errors[] = "Ligne " . ($index + 1) . ": Élève '{$noteData['eleve']}' non trouvé";
                        continue;
                    }

                    Notes::create([
                        'eleve_id' => $eleve->id,
                        'classe_id' => $request->classe_id,
                        'matiere_id' => $request->matiere_id,
                        'enseignant_id' => $request->enseignant_id,
                        'note' => $noteData['note'],
                        'note_sur' => $noteData['note_sur'] ?? 20,
                        'type_evaluation' => $request->type_evaluation,
                        'commentaire' => $noteData['commentaire'] ?? null,
                        'date_evaluation' => $request->date_evaluation,
                        'periode' => $request->periode
                    ]);

                    $sucessCount++;
                } catch (\Exception $e) {
                    $errors[] = "Ligne " . ($index + 1) . ": " . $e->getMessage();
                }
            }

            DB::commit();

            return response()->json([
                'success' => true,
                'message' => "{$sucessCount} notes importées avec succès",
                'errors' => $errors,
                'imported_count' => $sucessCount,
                'total_count' => count($notesData)
            ]);

        } catch (\Exception $e) {
            DB::rollBack();
            return response()->json([
                'success' => false,
                'message' => 'Erreur lors de l\'importation: ' . $e->getMessage()
            ], 500);
        }
    }

    private function processExcelFile($file)
    {
        $spreadsheet = IOFactory::load($file->getPathname());
        $worksheet = $spreadsheet->getActiveSheet();
        $data = [];

        $highestRow = $worksheet->getHighestRow();
        
        for ($row = 2; $row <= $highestRow; $row++) {
            $eleve = $worksheet->getCell('A' . $row)->getValue();
            $note = $worksheet->getCell('B' . $row)->getValue();
            $noteSur = $worksheet->getCell('C' . $row)->getValue();
            $commentaire = $worksheet->getCell('D' . $row)->getValue();

            if ($eleve && $note !== null) {
                $data[] = [
                    'eleve' => trim($eleve),
                    'note' => floatval($note),
                    'note_sur' => $noteSur ? floatval($noteSur) : 20,
                    'commentaire' => $commentaire ? trim($commentaire) : null
                ];
            }
        }

        return $data;
    }

    private function processPdfFile($file)
    {
        $parser = new PdfParser();
        $pdf = $parser->parseFile($file->getPathname());
        $text = $pdf->getText();
        
        // Logique simple pour extraire les notes du PDF
        // À adapter selon le format de vos PDFs
        $lines = explode("\n", $text);
        $data = [];

        foreach ($lines as $line) {
            // Exemple de regex pour extraire nom et note
            if (preg_match('/^(.+?)\s+(\d+(?:\.\d+)?)\s*(?:\/\s*(\d+(?:\.\d+)?))?/', trim($line), $matches)) {
                $data[] = [
                    'eleve' => trim($matches[1]),
                    'note' => floatval($matches[2]),
                    'note_sur' => isset($matches[3]) ? floatval($matches[3]) : 20,
                    'commentaire' => null
                ];
            }
        }

        return $data;
    }

    private function findEleve($identifier, $classeId)
    {
        // Recherche par nom complet, prénom, nom ou numéro
        return Eleves::where('classe_id', $classeId)
            ->where(function($query) use ($identifier) {
                $query->where('nom', 'LIKE', "%{$identifier}%")
                    ->orWhere('prenom', 'LIKE', "%{$identifier}%")
                    ->orWhere('numero_eleve', $identifier)
                    ->orWhereRaw("CONCAT(prenom, ' ', nom) LIKE ?", ["%{$identifier}%"])
                    ->orWhereRaw("CONCAT(nom, ' ', prenom) LIKE ?", ["%{$identifier}%"]);
            })
            ->first();
    }

    // Méthodes pour obtenir les données nécessaires aux formulaires
    public function getClasses()
    {
        $classes = Classes::select('id', 'nom', 'niveau')->orderBy('niveau')->orderBy('nom')->get();
        return response()->json($classes);
    }

    public function getMatieres()
    {
        $matieres = Matieres::select('id', 'nom', 'code')->orderBy('nom')->get();
        return response()->json($matieres);
    }

    public function getElevesByClasse($classeId)
    {
        $eleves = Eleves::where('classe_id', $classeId)
            ->select('id', 'nom', 'prenom', 'numero_eleve')
            ->orderBy('nom')
            ->orderBy('prenom')
            ->get();
        
        return response()->json($eleves);
    }

    // Dans NotesController.php
public function index(Request $request)
{
    try {
        $query = Notes::with(['eleve', 'classe', 'matiere', 'enseignant']);

        if ($request->filled('classe_id')) {
            $query->where('classe_id', $request->classe_id);
        }

        if ($request->filled('matiere_id')) {
            $query->where('matiere_id', $request->matiere_id);
        }

        $notes = $query->orderBy('date_evaluation', 'desc')->get();

        return response()->json($notes->toArray());
    } catch (\Exception $e) {
        return response()->json([], 500);
    }
}
}

