<?php

namespace App\Services;

use App\Models\Classe;
use App\Models\Note;
use Illuminate\Support\Facades\DB;

/**
 * NotesService — Gestion des notes et calcul des moyennes
 */
class NotesService extends BaseService
{
    protected function model(): string
    {
        return Note::class;
    }

    protected function creationRules(): array
    {
        return [
            'eleve_id' => 'required|exists:eleves,id',
            'matiere_id' => 'required|exists:matieres,id',
            'valeur' => 'required|numeric|min:0|max:20',
            'periode_id' => 'required|exists:periodes,id',
            'type_evaluation_id' => 'nullable|exists:type_evaluations,id',
            'date' => 'required|date',
            'appreciation' => 'nullable|string|max:500',
        ];
    }

    protected function defaultRelations(): array
    {
        return ['eleve', 'matiere', 'periode'];
    }

    /**
     * Calcule la moyenne générale d'un élève
     */
    public function moyenneEleve(int $eleveId, ?int $periodeId = null): float
    {
        $query = Note::where('eleve_id', $eleveId);
        if ($periodeId) {
            $query->where('periode_id', $periodeId);
        }
        return round($query->avg('valeur') ?? 0, 2);
    }

    /**
     * Calcule la moyenne d'une classe pour une matière
     */
    public function moyenneClasseMatiere(int $classeId, int $matiereId, ?int $periodeId = null): float
    {
        $query = Note::whereHas('eleve', fn($q) => $q->where('classe_id', $classeId))
            ->where('matiere_id', $matiereId);
        if ($periodeId) {
            $query->where('periode_id', $periodeId);
        }
        return round($query->avg('valeur') ?? 0, 2);
    }

    /**
     * Import de notes en masse
     */
    public function importMass(array $notes): array
    {
        $imported = 0;
        $errors = [];

        DB::transaction(function () use ($notes, &$imported, &$errors) {
            foreach ($notes as $index => $data) {
                try {
                    Note::create([
                        'eleve_id' => $data['eleve_id'],
                        'matiere_id' => $data['matiere_id'],
                        'valeur' => $data['valeur'],
                        'periode_id' => $data['periode_id'] ?? null,
                        'type_evaluation_id' => $data['type_evaluation_id'] ?? null,
                        'date' => $data['date'] ?? now(),
                        'appreciation' => $data['appreciation'] ?? null,
                    ]);
                    $imported++;
                } catch (\Exception $e) {
                    $errors[] = "Ligne " . ($index + 1) . " : " . $e->getMessage();
                }
            }
        });

        return ['imported' => $imported, 'errors' => $errors];
    }
}
