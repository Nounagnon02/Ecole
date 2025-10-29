<?php

namespace App\Services;

use App\Models\{Eleve, Note};

class BulletinService
{
    /**
     * MATERNELLE/PRIMAIRE : Évaluations 1 à 5
     * Chaque matière a 5 évaluations dans la période
     */
    public function bulletinMaternellePrimaire($eleveId, $periode)
    {
        $eleve = Eleve::with(['classe', 'notes.matiere'])->findOrFail($eleveId);
        $notes = $eleve->notes()->where('periode', $periode)->with('matiere')->get();
        
        $evaluations = $notes->groupBy('matiere.nom')->map(function ($notesMatiere, $matiere) {
            $evaluationsMatiere = [];
            
            foreach (['1ère evaluation', '2ème evaluation', '3ème evaluation', '4ème evaluation', '5ème evaluation'] as $type) {
                $note = $notesMatiere->where('type_evaluation', $type)->first();
                $evaluationsMatiere[] = [
                    'type' => $type,
                    'note' => $note ? $note->note : null,
                    'rang' => $note ? $this->calculerRang($note) : null
                ];
            }
            
            return ['matiere' => $matiere, 'evaluations' => $evaluationsMatiere];
        })->values();

        return ['eleve' => $eleve, 'periode' => $periode, 'evaluations' => $evaluations];
    }

    /**
     * SECONDAIRE : Système moyennes avec coefficients
     * Devoir1 + Devoir2 + Interrogations → Moyenne matière → Moyenne générale
     */
    public function bulletinSecondaire($eleveId, $periode)
    {
        $eleve = Eleve::with(['classe', 'notes.matiere'])->findOrFail($eleveId);
        $notes = $eleve->notes()->where('periode', $periode)->with('matiere')->get();
        
        $moyennesParMatiere = $notes->groupBy('matiere_id')->map(function ($notesMatiere) use ($eleve) {
            $matiere = $notesMatiere->first()->matiere;
            
            // Moyennes par type d'évaluation
            $devoir1 = $this->moyenneType($notesMatiere, 'Devoir1');
            $devoir2 = $this->moyenneType($notesMatiere, 'Devoir2');
            $interrogations = $this->moyenneType($notesMatiere, 'Interrogation');
            
            // Moyenne matière = (Devoir1 + Devoir2 + Moy_Interros) / 3
            $moyenne = collect([$devoir1, $devoir2, $interrogations])->filter()->avg() ?: 0;
            
            $coefficient = $this->getCoefficient($matiere->id, $eleve->classe_id);
            
            return [
                'matiere' => $matiere->nom,
                'coefficient' => $coefficient,
                'details' => ['devoir1' => $devoir1, 'devoir2' => $devoir2, 'moyenne_interrogations' => $interrogations],
                'moyenne' => round($moyenne, 2),
                'moyenne_ponderee' => round($moyenne * $coefficient, 2),
                'rang' => $this->calculerRang($notesMatiere->first())
            ];
        })->values();

        // Moyenne générale = Σ(moyenne × coeff) / Σ(coeff)
        $totalPoints = $moyennesParMatiere->sum('moyenne_ponderee');
        $totalCoeff = $moyennesParMatiere->sum('coefficient');
        $moyenneGenerale = $totalCoeff > 0 ? $totalPoints / $totalCoeff : 0;

        return [
            'eleve' => $eleve,
            'periode' => $periode,
            'moyennes_par_matiere' => $moyennesParMatiere,
            'moyenne_generale' => round($moyenneGenerale, 2),
            'rang' => $this->calculerRangGeneral($eleve, $periode, $moyenneGenerale)
        ];
    }

    private function moyenneType($notes, $type)
    {
        $notesType = $notes->where('type_evaluation', $type);
        if ($notesType->isEmpty()) return null;
        
        return round($notesType->map(fn($n) => ($n->note / $n->note_sur) * 20)->avg(), 2);
    }

    private function getCoefficient($matiereId, $classeId)
    {
        $relation = \DB::table('classe_matiere')
            ->where('classe_id', $classeId)
            ->where('matiere_id', $matiereId)
            ->first();
        return $relation ? $relation->coefficient : 1;
    }

    private function calculerRang($note)
    {
        if (!$note) return null;
        
        $notes = Note::where('matiere_id', $note->matiere_id)
            ->where('periode', $note->periode)
            ->whereHas('eleve', fn($q) => $q->where('classe_id', $note->eleve->classe_id))
            ->orderBy('note', 'desc')
            ->pluck('note');
            
        return ['position' => $notes->search($note->note) + 1, 'total_eleves' => $notes->count()];
    }

    private function calculerRangGeneral($eleve, $periode, $moyenne)
    {
        // Calculer moyennes de tous les élèves de la classe
        $elevesClasse = Eleve::where('classe_id', $eleve->classe_id)->get();
        $moyennes = $elevesClasse->map(fn($e) => $this->bulletinSecondaire($e->id, $periode)['moyenne_generale'])
            ->sort()->reverse();
            
        return ['position' => $moyennes->search($moyenne) + 1, 'total_eleves' => $moyennes->count()];
    }
}