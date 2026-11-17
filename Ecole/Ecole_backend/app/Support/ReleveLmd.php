<?php

namespace App\Support;

use Illuminate\Support\Collection;

/**
 * Relevé de notes universitaire (système LMD), calculé pour l'affichage.
 *
 * - Contrôle continu d'une UE : moyenne de ses notes de CC et de TP.
 * - Moyenne d'une UE : (1 − p) × contrôle continu + p × examen, p étant la
 *   part de l'examen (`config('universite.poids_examen')`). Sans examen, la
 *   moyenne du contrôle continu est affichée, marquée incomplète : l'UE n'est
 *   alors ni validée ni ajournée. Sans contrôle continu, l'examen seul compte.
 * - UE validée : moyenne complète au moins égale au seuil (10/20).
 * - Semestre : moyenne des UE complètes pondérée par leurs crédits ; crédits
 *   acquis = crédits des UE validées.
 *
 * La compensation entre UE n'est pas calculée : elle dépend du règlement de
 * l'établissement et de la délibération du jury.
 */
final class ReleveLmd
{
    public function __construct(
        private readonly float $poidsExamen,
        private readonly float $seuil,
    ) {}

    public static function selonConfiguration(): self
    {
        return new self((float) config('universite.poids_examen', 0.6), (float) config('universite.seuil_validation', 10));
    }

    /**
     * @param  Collection  $ues    UE (Matiere) avec `semestre` et `enseignant` chargés
     * @param  Collection  $notes  notes (Note) de l'étudiant sur ces UE
     */
    public function calculer(Collection $ues, Collection $notes): array
    {
        $notesParUe = $notes->groupBy('matiere_id');

        return $ues
            ->groupBy(fn ($ue) => $ue->semestre_id ?? 0)
            ->map(function (Collection $uesDuSemestre) use ($notesParUe) {
                $lignes = $uesDuSemestre
                    ->sortBy('code')
                    ->map(fn ($ue) => $this->ue($ue, $notesParUe->get($ue->id, collect())))
                    ->values();

                $completes = $lignes->where('complete', true);
                $credits = $completes->sum('credit');

                return [
                    'semestre_id' => $uesDuSemestre->first()->semestre_id,
                    'libelle' => $uesDuSemestre->first()->semestre?->libelle ?? 'Semestre',
                    'ues' => $lignes->all(),
                    'moyenne' => $credits > 0
                        ? round($completes->sum(fn ($l) => $l['moyenne'] * $l['credit']) / $credits, 2)
                        : null,
                    'credits_total' => (int) $lignes->sum('credit'),
                    'credits_acquis' => (int) $lignes->where('validee', true)->sum('credit'),
                    'complet' => $lignes->isNotEmpty() && $lignes->every(fn ($l) => $l['complete']),
                ];
            })
            ->sortBy('libelle')
            ->values()
            ->all();
    }

    private function ue($ue, Collection $notes): array
    {
        $continu = $notes->whereIn('type', ['CC', 'TP']);
        $examens = $notes->where('type', 'Examen');

        $cc = $continu->isNotEmpty() ? round($continu->avg(fn ($n) => (float) $n->note), 2) : null;
        $examen = $examens->isNotEmpty() ? round($examens->avg(fn ($n) => (float) $n->note), 2) : null;

        $moyenne = match (true) {
            $cc !== null && $examen !== null => round((1 - $this->poidsExamen) * $cc + $this->poidsExamen * $examen, 2),
            $examen !== null => $examen,
            default => $cc,
        };
        $complete = $examen !== null;

        return [
            'matiere_id' => $ue->id,
            'code' => $ue->code,
            'intitule' => $ue->intitule,
            'credit' => (int) $ue->credit,
            'enseignant' => $ue->enseignant ? trim($ue->enseignant->prenom . ' ' . $ue->enseignant->nom) : null,
            'notes' => $notes
                ->sortBy(fn ($n) => array_search($n->type, ['CC', 'TP', 'Examen'], true) . '|' . $n->date_evaluation?->format('Y-m-d'))
                ->map(fn ($n) => ['type' => $n->type, 'note' => (float) $n->note, 'date' => $n->date_evaluation?->format('Y-m-d')])
                ->values()
                ->all(),
            'controle_continu' => $cc,
            'examen' => $examen,
            'moyenne' => $moyenne,
            'complete' => $complete,
            'validee' => $complete ? $moyenne >= $this->seuil : null,
        ];
    }
}
