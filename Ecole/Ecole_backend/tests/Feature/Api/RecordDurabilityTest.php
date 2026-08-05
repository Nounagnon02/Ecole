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
     * Le pendant de `SchoolDeactivationTest`, un cran plus bas.
     *
     * 22 tables cascadaient vers `eleves` ou `etudiants` : une seule suppression
     * effaçait notes, absences, paiements, moyennes, dossier médical,
     * vaccinations, emprunts, bourses, certificats, rendez-vous, inscriptions aux
     * examens, diplômes. Ce test mesurait cette dette ; il vérifie désormais
     * qu'elle est éteinte, `2026_08_05_100100_restrict_student_deletion` ayant
     * basculé les 22 contraintes en RESTRICT.
     */
    public function aucune_table_ne_cascade_vers_un_dossier_eleve_ou_etudiant()
    {
        $cascading = [];

        foreach (Schema::getTables() as $table) {
            foreach (Schema::getForeignKeys($table['name']) as $fk) {
                $target = strtolower((string) ($fk['foreign_table'] ?? ''));

                if (in_array($target, ['eleves', 'etudiants'], true)
                    && strtolower((string) ($fk['on_delete'] ?? '')) === 'cascade') {
                    $cascading[] = $table['name'] . '.' . implode(',', $fk['columns'] ?? []) . ' → ' . $target;
                }
            }
        }

        sort($cascading);

        $this->assertSame(
            [],
            $cascading,
            "Ces contraintes effaceraient un dossier scolaire :\n  " . implode("\n  ", $cascading)
        );
    }

    /** @test */
    public function un_dossier_eleve_peut_etre_desactive_plutot_que_supprime()
    {
        // La contrepartie indispensable du RESTRICT : sans voie de sortie, on
        // aurait seulement rendu toute radiation impossible.
        $this->assertTrue(Schema::hasColumn('eleves', 'statut'));
        $this->assertTrue(Schema::hasColumn('eleves', 'deleted_at'));
        $this->assertTrue(Schema::hasColumn('etudiants', 'statut'));
        $this->assertTrue(Schema::hasColumn('etudiants', 'deleted_at'));
    }
}
