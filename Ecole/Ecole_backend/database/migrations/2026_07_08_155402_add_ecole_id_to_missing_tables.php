<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    private array $tables = [
        'absences',
        'bourses',
        'certificats',
        'conseils_classe',
        'consultations_medicales',
        'dossiers_medicaux',
        'emplois_du_temps',
        'examens',
        'incidents',
        'matieres',
        'messages',
        'notifications',
        'notes',
        'periodes',
        'personnel',
        'rendez_vous',
        'sanctions',
        'series',
        'type_evaluations',
        'vaccinations',
        'uni_paiements',
    ];

    /**
     * Run the migrations.
     */
    public function up(): void
    {
        foreach ($this->tables as $tableName) {
            if (!Schema::hasColumn($tableName, 'ecole_id')) {
                Schema::table($tableName, function (Blueprint $table) {
                    $table->foreignId('ecole_id')
                        ->nullable()
                        ->constrained('ecoles')
                        ->onDelete('cascade')
                        ->after('id');
                });
            }
        }
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        foreach ($this->tables as $tableName) {
            if (Schema::hasColumn($tableName, 'ecole_id')) {
                Schema::table($tableName, function (Blueprint $table) {
                    $table->dropForeign(['ecole_id']);
                    $table->dropColumn('ecole_id');
                });
            }
        }
    }
};
