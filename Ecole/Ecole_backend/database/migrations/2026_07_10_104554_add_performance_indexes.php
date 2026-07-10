<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        // Notes: composite index for class+period filtering (classement, export)
        Schema::table('notes', function (Blueprint $table) {
            $table->index(['classe_id', 'periode'], 'notes_classe_periode_index');
        });

        // Absences: student+date lookup for individual absence history
        Schema::table('absences', function (Blueprint $table) {
            $table->index(['eleve_id', 'date'], 'absences_eleve_date_index');
        });

        // Paiements: student payment status & date-based revenue queries
        Schema::table('paiements', function (Blueprint $table) {
            $table->index(['eleve_id', 'statut_global'], 'paiements_eleve_statut_index');
            $table->index(['date_paiement', 'statut_global'], 'paiements_date_statut_index');
        });

        // Incidents: severity+date for alert detection
        Schema::table('incidents', function (Blueprint $table) {
            $table->index(['gravite', 'date'], 'incidents_gravite_date_index');
        });

        // Sanctions: student+date for sanction history queries
        Schema::table('sanctions', function (Blueprint $table) {
            $table->index(['eleve_id', 'date'], 'sanctions_eleve_date_index');
        });

        // Vaccinations: upcoming/overdue reminders
        Schema::table('vaccinations', function (Blueprint $table) {
            $table->index('date_rappel', 'vaccinations_date_rappel_index');
        });

        // Consultations: urgent visits by date
        Schema::table('consultations_medicales', function (Blueprint $table) {
            $table->index(['date', 'urgence'], 'consultations_date_urgence_index');
        });

        // Emprunts: overdue detection
        Schema::table('emprunts', function (Blueprint $table) {
            $table->index(['date_retour_prevue', 'date_retour_effective'], 'emprunts_retour_index');
        });
    }

    public function down(): void
    {
        Schema::table('notes', fn(Blueprint $t) => $t->dropIndex('notes_classe_periode_index'));
        Schema::table('absences', fn(Blueprint $t) => $t->dropIndex('absences_eleve_date_index'));
        Schema::table('paiements', fn(Blueprint $t) => $t->dropIndex('paiements_eleve_statut_index'));
        Schema::table('paiements', fn(Blueprint $t) => $t->dropIndex('paiements_date_statut_index'));
        Schema::table('incidents', fn(Blueprint $t) => $t->dropIndex('incidents_gravite_date_index'));
        Schema::table('sanctions', fn(Blueprint $t) => $t->dropIndex('sanctions_eleve_date_index'));
        Schema::table('vaccinations', fn(Blueprint $t) => $t->dropIndex('vaccinations_date_rappel_index'));
        Schema::table('consultations_medicales', fn(Blueprint $t) => $t->dropIndex('consultations_date_urgence_index'));
        Schema::table('emprunts', fn(Blueprint $t) => $t->dropIndex('emprunts_retour_index'));
    }
};
