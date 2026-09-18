<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        $tables = [
            'notes',
            'paiements',
            'eleves',
            'bulletins',
            'devoirs',
            'absences',
            'cahier_de_textes',
            'emplois_du_temps',
        ];

        foreach ($tables as $table) {
            if (!Schema::hasTable($table) || !Schema::hasColumn($table, 'ecole_id')) {
                continue;
            }

            $indexName = $table . '_ecole_id_index';

            $alreadyIndexed = false;
            foreach (Schema::getIndexes($table) as $index) {
                if ($index['name'] === $indexName || $index['columns'] === ['ecole_id']) {
                    $alreadyIndexed = true;
                    break;
                }
            }

            if (!$alreadyIndexed) {
                Schema::table($table, function (Blueprint $blueprint) use ($indexName) {
                    $blueprint->index('ecole_id', $indexName);
                });
            }
        }
    }

    public function down(): void
    {
        $tables = [
            'notes',
            'paiements',
            'eleves',
            'bulletins',
            'devoirs',
            'absences',
            'cahier_de_textes',
            'emplois_du_temps',
        ];

        foreach ($tables as $table) {
            if (!Schema::hasTable($table)) {
                continue;
            }

            $indexName = $table . '_ecole_id_index';

            $hasIndex = false;
            foreach (Schema::getIndexes($table) as $index) {
                if ($index['name'] === $indexName) {
                    $hasIndex = true;
                    break;
                }
            }

            if ($hasIndex) {
                Schema::table($table, function (Blueprint $blueprint) use ($indexName) {
                    $blueprint->dropIndex($indexName);
                });
            }
        }
    }
};
