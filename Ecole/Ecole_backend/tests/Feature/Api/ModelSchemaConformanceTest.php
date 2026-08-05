<?php

namespace Tests\Feature\Api;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\Schema;
use Tests\TestCase;

/**
 * Chaque modèle doit désigner une table et des colonnes qui existent.
 *
 * Cette classe de défaut ne se voit pas en lisant le code : un `$table` déduit
 * de travers ou un `$fillable` qui nomme une colonne absente n'attire l'œil
 * nulle part, et se manifeste comme une erreur SQL sur la première page qui
 * interroge le modèle. Trois exemples trouvés ainsi :
 *
 *   - `ConsultationMedicale` visait `consultation_medicales` (singulier sur le
 *     premier mot) alors que la table est `consultations_medicales` : les
 *     consultations de l'infirmier et le compteur du tableau de bord étaient
 *     inutilisables.
 *   - `Coefficients` visait `coefficients`, qui n'existe pas — c'est
 *     `coefficient_matieres`. `BulletinController` et `SeriesController`
 *     interrogeaient un modèle mort.
 *   - `EmploiDuTemps` rendait assignable `class_id` quand la colonne est
 *     `classe_id`, et `PaiementEleve` exposait trois colonnes absentes.
 *
 * Le balayage porte sur tous les modèles, pas sur une liste : une liste
 * oublierait le prochain modèle ajouté, ce qui est précisément le moment où ce
 * contrôle sert.
 */
class ModelSchemaConformanceTest extends TestCase
{
    use RefreshDatabase;

    /**
     * Modèles délibérément exclus, avec la raison.
     *
     * @var array<string, string>
     */
    private const EXCLUDED = [
        // Les modèles tenant de stancl/tenancy vivent dans la base du tenant,
        // pas dans celle-ci : leur table est absente du schéma central.
        \App\Models\SaaS\Tenant::class => 'base tenant, hors schéma central',
    ];

    /** @return array<int, class-string<Model>> */
    private function eloquentModels(): array
    {
        $models = [];

        $files = new \RecursiveIteratorIterator(
            new \RecursiveDirectoryIterator(app_path('Models'))
        );

        foreach ($files as $file) {
            if (!$file->isFile() || $file->getExtension() !== 'php') {
                continue;
            }

            $relative = str_replace([app_path('Models') . '/', '.php'], '', $file->getPathname());
            $class    = 'App\\Models\\' . str_replace('/', '\\', $relative);

            if (!class_exists($class)) {
                continue;
            }

            $reflection = new \ReflectionClass($class);

            if ($reflection->isAbstract() || !$reflection->isSubclassOf(Model::class)) {
                continue;
            }

            if (array_key_exists($class, self::EXCLUDED)) {
                continue;
            }

            $models[] = $class;
        }

        sort($models);

        return $models;
    }

    /** @test */
    public function chaque_modele_designe_une_table_existante()
    {
        $models = $this->eloquentModels();

        // Garde-fou : si la découverte casse, le test passerait à vide.
        $this->assertGreaterThan(50, count($models), 'La découverte des modèles a échoué');

        $missing = [];

        foreach ($models as $class) {
            $table = (new $class)->getTable();

            if (!Schema::hasTable($table)) {
                $missing[] = class_basename($class) . ' → ' . $table;
            }
        }

        $this->assertSame(
            [],
            $missing,
            "Ces modèles visent une table qui n'existe pas :\n  " . implode("\n  ", $missing)
        );
    }

    /** @test */
    public function aucun_fillable_ne_nomme_une_colonne_absente()
    {
        $ghosts = [];

        foreach ($this->eloquentModels() as $class) {
            $model = new $class;
            $table = $model->getTable();

            if (!Schema::hasTable($table)) {
                continue; // déjà signalé par le test précédent
            }

            $columns = Schema::getColumnListing($table);

            foreach ($model->getFillable() as $attribute) {
                // Un attribut virtuel légitime possède un mutateur ; sans
                // mutateur ni colonne, l'assignation est silencieusement perdue.
                if (in_array($attribute, $columns, true)) {
                    continue;
                }

                $mutator = 'set' . str_replace('_', '', ucwords($attribute, '_')) . 'Attribute';

                if (method_exists($model, $mutator)) {
                    continue;
                }

                $ghosts[] = class_basename($class) . '::$fillable → ' . $table . '.' . $attribute;
            }
        }

        sort($ghosts);

        $this->assertSame(
            [],
            $ghosts,
            "Ces attributs sont assignables mais n'existent nulle part — l'écriture est perdue en silence :\n  "
                . implode("\n  ", $ghosts)
        );
    }
}
