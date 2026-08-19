<?php

namespace App\Http\Controllers\Notes;

use App\Http\Controllers\Controller;
use App\Models\Notes;
use App\Models\Eleve;
use App\Support\AnneeScolaire;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Facades\Validator;

class NotesImportController extends Controller
{
    use NotesHelpers;

    /**
     * Importer des notes depuis un fichier JSON
     */
    public function import(Request $request)
    {
        try {
            Log::debug('Import notes', ['keys' => array_keys($request->all())]);
            // 1. Validation des données reçues
            $validator = Validator::make($request->all(), [
            'classe_id' => 'required|school_exists:classes,id',
            'matiere_id' => 'required|school_exists:matieres,id',
            'type_evaluation' => 'required|in:Devoir1,Devoir2,Interrogation',
            'date_evaluation' => 'required|date',
            'periode' => 'required|in:Trimestre 1,Trimestre 2,Trimestre 3',
            'notes' => 'required'
        ]);

            if ($validator->fails()) {
            return response()->json([
                'success' => false,
                'message' => 'Données invalides',
                'errors' => $validator->errors()
            ], 400);
        }

            // 2. Décoder les données des notes
            $notesData = is_string($request->notes) ? json_decode($request->notes, true) : $request->notes;
        
            if (!is_array($notesData)) {
                return response()->json([
                    'success' => false,
                    'message' => 'Format des notes invalide',
                    'recu' => $request->notes
                ], 400);
            }

            // 3. Commencer une transaction
            DB::beginTransaction();
            
            $importedCount = 0;
            $errors = [];

            // 4. Traiter chaque note
            foreach ($notesData as $noteData) {
                try {
                    // Rechercher l'élève par matricule
                    // `Eleve::where(...)`, pas `DB::table('eleves')` : hors du
                    // scope tenant, deux établissements ayant le même numéro de
                    // matricule voyaient l'import rattacher la note à l'élève de
                    // l'autre école.
                    $eleve = Eleve::where('numero_matricule', $noteData['matricule'])
                        ->where('classe_id', $request->classe_id)
                        ->first();

                    if (!$eleve) {
                        $errors[] = "Élève avec matricule {$noteData['matricule']} non trouvé";
                        continue;
                    }

                    // Créer la note
                    Notes::create([
                        'eleve_id' => $eleve->id,
                        'classe_id' => $request->classe_id,
                        'matiere_id' => $request->matiere_id,
                        'note' => $noteData['note'],
                        'note_sur' => 20,
                        'type_evaluation' => $request->type_evaluation,
                        'date_evaluation' => $request->date_evaluation,
                        'periode' => $request->periode,
                        'annee_scolaire' => $request->annee_scolaire ?? AnneeScolaire::courante(),
                        
                    ]);

                    $importedCount++;

                } catch (\Exception $e) {
                    $this->rethrowIfMeaningful($e);
                    $errors[] = "Erreur pour l'élève {$noteData['matricule']}: " . $e->getMessage();
                }
            }

            // 5. Vérifier s'il y a eu des importations
            if ($importedCount === 0) {
                DB::rollBack();
                return response()->json([
                    'success' => false,
                    'message' => 'Aucune note n\'a pu être importée',
                    'errors' => $errors
                ], 400);
            }

            // 6. Valider la transaction
            DB::commit();

            // 7. Retourner la réponse
            return response()->json([
                'success' => true,
                'message' => "$importedCount notes ont été importées avec succès",
                'count' => $importedCount,
                'warnings' => $errors
            ]);

} catch (\Exception $e) {
            $this->rethrowIfMeaningful($e);
            DB::rollBack();
            \Illuminate\Support\Facades\Log::error('Erreur import notes: ' . $e->getMessage());
            
            return response()->json([
                'success' => false,
                'message' => $this->clientErrorMessage($e, 'Erreur lors de l\'importation')
            ], 500);
        }
    }

    /**
     * Importer des notes depuis un fichier CSV
     * 
     * Format attendu : matricule,note,type_evaluation (optionnel)
     * Le type_evaluation par défaut est 'Interrogation'
     */
    public function importCsv(Request $request)
    {
        try {
            $validator = Validator::make($request->all(), [
                'classe_id' => 'required|school_exists:classes,id',
                'matiere_id' => 'required|school_exists:matieres,id',
                'periode' => 'required|in:Trimestre 1,Trimestre 2,Trimestre 3',
                'type_evaluation' => 'nullable|in:Devoir1,Devoir2,Interrogation',
                'date_evaluation' => 'nullable|date',
                'file' => 'required|file|mimes:csv,txt|max:2048',
            ]);

            if ($validator->fails()) {
                return response()->json([
                    'success' => false,
                    'message' => 'Données invalides',
                    'errors' => $validator->errors()
                ], 400);
            }

            $file = $request->file('file');
            $handle = fopen($file->getRealPath(), 'r');
            
            if (!$handle) {
                return response()->json([
                    'success' => false,
                    'message' => 'Impossible de lire le fichier CSV'
                ], 400);
            }

            // Lire l'en-tête
            $header = fgetcsv($handle);
            if (!$header) {
                fclose($handle);
                return response()->json([
                    'success' => false,
                    'message' => 'Fichier CSV vide'
                ], 400);
            }

            // Normaliser les en-têtes
            $header = array_map('strtolower', array_map('trim', $header));
            
            // Mapping des colonnes attendues
            $colMatricule = array_search('matricule', $header);
            $colNote = array_search('note', $header);
            $colTypeEval = array_search('type_evaluation', $header);
            $colDateEval = array_search('date_evaluation', $header);

            if ($colMatricule === false || $colNote === false) {
                fclose($handle);
                return response()->json([
                    'success' => false,
                    'message' => 'Colonnes obligatoires manquantes : matricule, note'
                ], 400);
            }

            $typeEvaluation = $request->input('type_evaluation', 'Interrogation');
            $dateEvaluation = $request->input('date_evaluation', now()->format('Y-m-d'));
            $importedCount = 0;
            $errors = [];

            DB::beginTransaction();

            while (($row = fgetcsv($handle)) !== false) {
                if (empty(array_filter($row))) continue; // Ligne vide

                $matricule = trim($row[$colMatricule] ?? '');
                $note = trim($row[$colNote] ?? '');

                if (!$matricule || $note === '') {
                    $errors[] = "Ligne ignorée : matricule ou note manquant";
                    continue;
                }

                $noteValue = (float) $note;
                if ($noteValue < 0 || $noteValue > 20) {
                    $errors[] = "Note invalide pour matricule {$matricule} : {$noteValue}";
                    continue;
                }

                $eleve = Eleve::where('numero_matricule', $matricule)
                    ->where('classe_id', $request->classe_id)
                    ->first();

                if (!$eleve) {
                    $errors[] = "Élève avec matricule {$matricule} non trouvé dans cette classe";
                    continue;
                }

                $typeEval = $row[$colTypeEval] ?? $request->input('type_evaluation', 'Interrogation');
                $dateEval = $row[$colDateEval] ?? $request->input('date_evaluation', now()->format('Y-m-d'));

                Notes::create([
                    'eleve_id' => $eleve->id,
                    'classe_id' => $request->classe_id,
                    'matiere_id' => $request->matiere_id,
                    'note' => $noteValue,
                    'note_sur' => 20,
                    'type_evaluation' => $typeEval,
                    'date_evaluation' => $dateEval,
                    'periode' => $request->periode,
                    'annee_scolaire' => $request->annee_scolaire ?? AnneeScolaire::courante(),
                ]);

                $importedCount++;
            }

            fclose($handle);

            if ($importedCount === 0) {
                DB::rollBack();
                return response()->json([
                    'success' => false,
                    'message' => 'Aucune note n\'a pu être importée',
                    'errors' => $errors
                ], 400);
            }

            DB::commit();

            return response()->json([
                'success' => true,
                'message' => "$importedCount notes ont été importées avec succès depuis CSV",
                'count' => $importedCount,
                'warnings' => $errors
            ]);

        } catch (\Exception $e) {
            DB::rollBack();
            $this->rethrowIfMeaningful($e);
            \Illuminate\Support\Facades\Log::error('Erreur import CSV notes: ' . $e->getMessage());
            
            return response()->json([
                'success' => false,
                'message' => $this->clientErrorMessage($e, 'Erreur lors de l\'importation CSV')
            ], 500);
        }
    }

    /**
     * Exporter les notes en XLSX
     */
    public function export(Request $request)
    {
        $this->authorize('viewAny', Notes::class);

        $filters = collect([
            'classe_id',
            'periode',
            'matiere_id',
        ])
            ->filter(fn($key) => $request->filled($key))
            ->mapWithKeys(fn($key) => [$key => $request->input($key)])
            ->toArray();

        $job = new \App\Jobs\ExportReportJob(
            auth()->user(),
            'notes',
            $filters,
            'csv',
        );
        dispatch($job);

        return response()->json([
            'success' => true,
            'message' => 'Export en cours, vous serez notifié',
        ]);
    }
}
