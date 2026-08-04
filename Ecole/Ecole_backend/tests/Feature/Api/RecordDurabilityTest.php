<?php

namespace Tests\Feature\Api;

use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\Schema;
use Tests\TestCase;

/**
 * Les enregistrements ne disparaissent pas dans le sillage d'autre chose.
 *
 * Le principe posé pour l'établissement — on désactive, on ne supprime pas —
 * vaut pour tout dossier que quelqu'un pourrait vouloir relire. La règle
 * `ecole_id => restrictOnDelete` est déjà couverte par `SchoolDeactivationTest` ;
 * ce test couvre les cascades qui échappaient à cette règle parce qu'elles
 * portaient sur une *autre* colonne.
 *
 * Deux l'avaient réintroduite, et `User` comme `Etudiant` sont en suppression
 * dure, donc les deux étaient atteignables :
 *
 *   - `communications.auteur_id` cascadait vers `users` : supprimer le compte
 *     d'un membre du personnel effaçait toutes les annonces qu'il avait
 *     publiées. Une annonce est un enregistrement de l'établissement.
 *   - `uni_devoir_etudiant.etudiant_id` cascadait vers `etudiants` : supprimer
 *     la fiche d'un étudiant effaçait tout son travail rendu et ses notes.
 */
class RecordDurabilityTest extends TestCase
{
    use RefreshDatabase;

    /**
     * @return array<string, array{0: string, 1: string, 2: array<int, string>}>
     */
    public static function contraintes(): array
    {
        return [
            "une annonce survit à la suppression de son auteur" => [
                'communications', 'auteur_id', ['set null'],
            ],
            "le travail rendu d'un étudiant ne peut pas être effacé avec sa fiche" => [
                'uni_devoir_etudiant', 'etudiant_id', ['restrict', 'no action'],
            ],
        ];
    }

    /**
     * @test
     * @dataProvider contraintes
     */
    public function la_contrainte_ne_cascade_pas(string $table, string $column, array $accepted): void
    {
        $this->assertTrue(Schema::hasTable($table), "La table {$table} devrait exister");

        $rules = [];

        foreach (Schema::getForeignKeys($table) as $fk) {
            if (in_array($column, $fk['columns'] ?? [], true)) {
                $rules[] = strtolower((string) ($fk['on_delete'] ?? ''));
            }
        }

        $this->assertNotEmpty($rules, "{$table}.{$column} devrait porter une clé étrangère");

        foreach ($rules as $rule) {
            $this->assertContains(
                $rule,
                $accepted,
                "{$table}.{$column} est en '{$rule}' : une suppression y effacerait un dossier au lieu d'échouer"
            );
        }
    }

    /**
     * Les tables ajoutées avec le module universitaire et les annonces.
     *
     * Ce test garde ce lot-ci. Il ne prétend pas assainir l'existant : la mesure
     * ci-dessous montre que **22 tables héritées cascadent encore** vers
     * `eleves` ou `etudiants`, ce qui est un chantier distinct — cf.
     * `aucune_nouvelle_table_ne_cascade_vers_un_dossier_eleve` et le rapport
     * d'audit.
     */
    private const NOUVELLES_TABLES = [
        'communications',
        'uni_devoirs',
        'uni_devoir_etudiant',
        'uni_emplois_du_temps',
    ];

    /** @test */
    public function aucune_nouvelle_table_ne_cascade_vers_un_dossier_eleve()
    {
        $cascading = [];

        foreach (self::NOUVELLES_TABLES as $table) {
            if (!Schema::hasTable($table)) {
                continue;
            }

            foreach (Schema::getForeignKeys($table) as $fk) {
                $target = strtolower((string) ($fk['foreign_table'] ?? ''));

                if (!in_array($target, ['eleves', 'etudiants', 'users'], true)) {
                    continue;
                }

                if (strtolower((string) ($fk['on_delete'] ?? '')) === 'cascade') {
                    $cascading[] = $table . '.' . implode(',', $fk['columns'] ?? []) . ' → ' . $target;
                }
            }
        }

        $this->assertSame(
            [],
            $cascading,
            "Ces nouvelles contraintes effaceraient un dossier au lieu d'échouer : " . implode(', ', $cascading)
        );
    }

    /**
     * @test
     *
     * Mesure de la dette, pas une validation.
     *
     * 22 tables héritées cascadent vers `eleves` ou `etudiants` : supprimer un
     * élève efface ses notes, absences, paiements, moyennes, dossier médical,
     * vaccinations, emprunts, bourses, certificats et rendez-vous. C'est le même
     * défaut que les 62 cascades sur `ecole_id`, un cran plus bas.
     *
     * Il n'est pas corrigé ici parce que le corriger suppose d'abord une voie de
     * désactivation : `eleves` ne porte ni `status`, ni `deleted_at`, ni
     * `is_active`. Passer les 22 contraintes en `restrict` sans cela rendrait
     * simplement toute suppression d'élève impossible, sans alternative — ce que
     * `ecoles` a résolu par `status` + `SoftDeletes`.
     *
     * Le test échoue si le compte **augmente**. Il ne prétend pas que 22 soit
     * acceptable ; il empêche que ce soit 23 sans décision.
     */
    public function la_dette_de_cascade_sur_les_dossiers_eleves_ne_grandit_pas()
    {
        $cascading = [];

        foreach (Schema::getTables() as $table) {
            foreach (Schema::getForeignKeys($table['name']) as $fk) {
                $target = strtolower((string) ($fk['foreign_table'] ?? ''));

                if (in_array($target, ['eleves', 'etudiants'], true)
                    && strtolower((string) ($fk['on_delete'] ?? '')) === 'cascade') {
                    $cascading[] = $table['name'] . ' → ' . $target;
                }
            }
        }

        sort($cascading);

        $this->assertLessThanOrEqual(
            22,
            count($cascading),
            "La dette a grandi. Cascades vers un dossier élève/étudiant :\n  " . implode("\n  ", $cascading)
        );
    }
}
