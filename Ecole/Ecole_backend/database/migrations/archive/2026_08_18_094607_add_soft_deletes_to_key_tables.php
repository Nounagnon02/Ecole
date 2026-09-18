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
            'enseignants',
            'classes',
            'matieres',
            'devoirs',
            'absences',
            'communications',
            'cahier_de_textes',
            'emplois_du_temps',
            'bulletins',
            'sanctions',
            'depenses',
        ];

        foreach ($tables as $table) {
            if (Schema::hasTable($table) && !Schema::hasColumn($table, 'deleted_at')) {
                Schema::table($table, function (Blueprint $table) {
                    $table->softDeletes();
                });
            }
        }
    }

    public function down(): void
    {
        $tables = [
            'notes',
            'paiements',
            'enseignants',
            'classes',
            'matieres',
            'devoirs',
            'absences',
            'communications',
            'cahier_de_textes',
            'emplois_du_temps',
            'bulletins',
            'sanctions',
            'depenses',
        ];

        foreach ($tables as $table) {
            if (Schema::hasTable($table) && Schema::hasColumn($table, 'deleted_at')) {
                Schema::table($table, function (Blueprint $table) {
                    $table->dropSoftDeletes();
                });
            }
        }
    }
};
