<?php

namespace App\Services;

use App\Models\{Eleve, Notes};

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
            
            // Moyenne des seules évaluations présentes.
            // `filter()` sans callback écartait aussi les notes à 0 — un élève
            // ayant réellement 0 à un devoir le voyait ignoré, ce qui gonflait
            // sa moyenne. On ne filtre donc que les valeurs nulles.
            $moyenne = collect([$devoir1, $devoir2, $interrogations])
                ->filter(fn($v) => $v !== null)
                ->avg() ?? 0;
            
            $coefficient = $this->getCoefficient($matiere->id, $eleve->class_id, $eleve->serie_id);
            
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

    /**
     * Average of one evaluation type, brought back to a scale of 20.
     *
     * `note_sur` is writable, so a zero would have divided by zero here.
     */
    private function moyenneType($notes, $type)
    {
        $notesType = $notes->where('type_evaluation', $type);

        if ($notesType->isEmpty()) {
            return null;
        }

        return round($notesType->map(function ($n) {
            $scale = (float) ($n->note_sur ?: 20);

            return $scale > 0 ? ((float) $n->note / $scale) * 20 : 0.0;
        })->avg(), 2);
    }

    /**
     * Coefficient of a subject for a given class, and série when there is one.
     *
     * Three defects met here. The table was `classe_matiere`, singular, which
     * does not exist — every lookup threw, so the whole secondary report card
     * endpoint failed. Callers passed `$eleve->classe_id`, a column that does
     * not exist either (it is `class_id`), so the argument was always null. And
     * `DB::table()` bypasses the BelongsToEcole scope, which would have read
     * another school's coefficients once the first two were fixed.
     *
     * `serie_matieres` is the richer source (it keys on série *and* class) and
     * is what BulletinController already uses; `classe_matieres` is the
     * class-level fallback. Both are now filtered on the current school.
     */
    private function getCoefficient($matiereId, $classeId, $serieId = null): float
    {
        $ecoleId = auth()->user()?->ecole_id ?? session('ecole_id');

        if ($serieId) {
            $coefficient = \DB::table('serie_matieres')
                ->where('serie_id', $serieId)
                ->where('matiere_id', $matiereId)
                ->when($classeId, fn($q) => $q->where('classe_id', $classeId))
                ->when($ecoleId, fn($q) => $q->where('ecole_id', $ecoleId))
                ->value('coefficient');

            if ($coefficient) {
                return (float) $coefficient;
            }
        }

        $coefficient = \DB::table('classe_matieres')
            ->where('classe_id', $classeId)
            ->where('matiere_id', $matiereId)
            ->when($ecoleId, fn($q) => $q->where('ecole_id', $ecoleId))
            ->value('coefficient');

        return $coefficient ? (float) $coefficient : 1.0;
    }

    /**
     * Rank of a pupil within their class for one subject.
     *
     * Rewritten: the previous version ranked a single raw mark among the raw
     * marks of the whole class. Two problems. Marks are not comparable when
     * `note_sur` differs — 8/10 and 16/20 are the same performance but sorted
     * as 8 against 16 — so it compared subject *marks* rather than subject
     * *averages*. And `Collection::search()` returns false when the value is
     * absent, so `search(...) + 1` evaluated to 1: any failure silently
     * reported the pupil as first in the class.
     *
     * Now: average every pupil's marks for that subject on a scale of 20, sort
     * descending, and read the position. Ties share a rank. A pupil who cannot
     * be placed gets `position => null`, never 1.
     */
    private function calculerRang($note)
    {
        if (!$note || !$note->eleve) {
            return null;
        }

        $marks = Notes::where('matiere_id', $note->matiere_id)
            ->where('periode', $note->periode)
            ->whereHas('eleve', fn($q) => $q->where('class_id', $note->eleve->class_id))
            ->get(['eleve_id', 'note', 'note_sur']);

        $averages = $marks
            ->groupBy('eleve_id')
            ->map(fn($pupilMarks) => $this->averageOnTwenty($pupilMarks))
            ->sortDesc();

        return [
            'position'     => $this->positionOf($averages, $note->eleve_id),
            'total_eleves' => $averages->count(),
        ];
    }

    /**
     * Average a set of marks on a scale of 20, guarding a zero `note_sur`.
     */
    private function averageOnTwenty($marks): float
    {
        $values = $marks->map(function ($n) {
            $scale = (float) ($n->note_sur ?: 20);

            return $scale > 0 ? ((float) $n->note / $scale) * 20 : 0.0;
        });

        return $values->isEmpty() ? 0.0 : (float) $values->avg();
    }

    /**
     * 1-based position of a key in a descending-sorted map, or null.
     *
     * Equal averages share a position, as a ranking should. Returning null when
     * the key is absent is deliberate: the previous code returned 1, so a
     * miscomputation put every pupil top of the class.
     *
     * @param  \Illuminate\Support\Collection  $sortedDesc  key => average
     */
    private function positionOf($sortedDesc, $key): ?int
    {
        if (!$sortedDesc->has($key)) {
            return null;
        }

        $target = $sortedDesc->get($key);

        // Number of pupils strictly ahead, plus one.
        return $sortedDesc->filter(fn($value) => $value > $target + 0.001)->count() + 1;
    }

    private function calculerRangGeneral($eleve, $periode, $moyenne)
    {
        // Une seule passe pour toute la classe, pour éviter un N+1.
        $classmates = Eleve::with(['notes.matiere'])
            ->where('class_id', $eleve->class_id)
            ->get();

        // Moyenne générale pondérée de chaque élève, indexée par son id : c'est
        // ce qui permet de placer l'élève par sa clé plutôt qu'en cherchant sa
        // valeur — l'ancienne version faisait `search()` sur la moyenne, et un
        // échec de recherche renvoyait false, donc `position => 1`. Toute erreur
        // de calcul déclarait l'élève premier de sa classe.
        $averages = $classmates
            ->mapWithKeys(function ($pupil) use ($periode) {
                $marks = $pupil->notes->where('periode', $periode);
                $totalPoints = 0.0;
                $totalCoeff = 0.0;

                $marks->groupBy('matiere_id')->each(function ($subjectMarks) use (&$totalPoints, &$totalCoeff, $pupil) {
                    $subject = $subjectMarks->first()->matiere;

                    if (!$subject) {
                        return;
                    }

                    $devoir1  = $this->moyenneType($subjectMarks, 'Devoir1');
                    $devoir2  = $this->moyenneType($subjectMarks, 'Devoir2');
                    $interros = $this->moyenneType($subjectMarks, 'Interrogation');

                    // `filter()` sans callback écartait les notes à 0 : un élève
                    // ayant réellement 0 voyait la note ignorée, ce qui gonflait
                    // sa moyenne. On ne filtre que les valeurs nulles.
                    $subjectAverage = collect([$devoir1, $devoir2, $interros])
                        ->filter(fn($v) => $v !== null)
                        ->avg() ?? 0;

                    // `class_id`, pas `classe_id` — la colonne n'existe pas, donc
                    // le coefficient était toujours cherché avec null.
                    $coeff = $this->getCoefficient($subject->id, $pupil->class_id, $pupil->serie_id);

                    $totalPoints += $subjectAverage * $coeff;
                    $totalCoeff  += $coeff;
                });

                return [$pupil->id => $totalCoeff > 0 ? $totalPoints / $totalCoeff : 0.0];
            })
            ->sortDesc();

        return [
            'position'     => $this->positionOf($averages, $eleve->id),
            'total_eleves' => $averages->count(),
        ];
    }
}