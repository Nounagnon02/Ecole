<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

/**
 * The university calendar.
 *
 * The scholastic equivalent, `emplois_du_temps`, is a weekly grid: a `jour`
 * ("Lundi"), a start and an end. That shape is right for a class that meets the
 * same slot every week for a year. It is wrong here, and the frontend already
 * says so — the Planning page renders each entry with a day-of-month and a
 * month, sorts on an absolute date, and counts what falls "today". A weekday
 * string cannot answer any of those.
 *
 * So a university entry is a **dated session**, not a recurring slot. That also
 * matches what the module has to carry: an exam, a viva, a guest lecture and a
 * departmental meeting all happen once, on a date, and none of them fit a
 * weekly grid.
 *
 * ## Everything but the date is optional
 *
 * `matiere_id`, `enseignant_id`, `semestre_id`, `filiere_id` are all nullable
 * because the page's own type list demands it: a `reunion` has no subject, a
 * `conference` has no lecturer on staff, and a campus-wide `evenement` belongs
 * to no filière. A NULL `filiere_id` is read as *concerns everybody*, which is
 * how the student view resolves what to show.
 *
 * ## No cycle scope
 *
 * The cycle is a property of `classes.categorie_classe`, and no row here
 * reaches a `classes` row — the university hierarchy is
 * faculté → département → filière → semestre. `CONCEPTION_CLOISONNEMENT.md`
 * classes the whole university module among the 54 tables with no path to a
 * cycle, and adopting `ScopedToCycle` without a path is a fatal error by
 * design. Tenant scoping via `ecole_id` is the boundary that applies.
 */
return new class extends Migration
{
    public function up(): void
    {
        Schema::create('uni_emplois_du_temps', function (Blueprint $table) {
            $table->id();

            // restrictOnDelete, never cascade: a school is deactivated, not
            // deleted (2026_08_03_100000_restrict_school_deletion).
            $table->foreignId('ecole_id')->constrained('ecoles')->restrictOnDelete();

            $table->string('titre');

            // cours | td | tp | examen | soutenance | conference | reunion |
            // evenement — the frontend's TYPE_CONFIG keys.
            $table->string('type')->default('cours');

            $table->date('date');
            $table->time('heure_debut');
            $table->time('heure_fin');
            $table->string('salle')->nullable();

            // planifie | termine | annule
            $table->string('statut')->default('planifie');

            $table->foreignId('matiere_id')->nullable()->constrained('uni_matieres')->nullOnDelete();
            $table->foreignId('enseignant_id')->nullable()->constrained('uni_enseignants')->nullOnDelete();
            $table->foreignId('semestre_id')->nullable()->constrained('semestres')->nullOnDelete();
            $table->foreignId('filiere_id')->nullable()->constrained('filieres')->nullOnDelete();

            $table->timestamps();

            // Every read is "this school, this date range, sorted by date".
            $table->index(['ecole_id', 'date'], 'uni_planning_school_date_index');
            $table->index(['ecole_id', 'filiere_id'], 'uni_planning_school_filiere_index');
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('uni_emplois_du_temps');
    }
};
