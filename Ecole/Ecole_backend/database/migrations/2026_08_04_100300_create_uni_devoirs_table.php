<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

/**
 * University assignments, and their submissions.
 *
 * Modelled on the scholastic `devoirs` + `devoir_eleve` pair, with two
 * deliberate differences.
 *
 * ## The assignment hangs off a subject, not a class
 *
 * `devoirs.classe_id` is the anchor at school: a class is a fixed cohort that
 * sits every subject together. A university has no such cohort — the audience of
 * an assignment is *whoever takes this UE*, which is the filière of the
 * `uni_matieres` row. So `matiere_id` is required and there is no class key.
 * That is also why this table reaches no cycle and takes no `ScopedToCycle`.
 *
 * ## The submission points at a student, not a user account
 *
 * `devoir_eleve.eleve_id` is a foreign key to `users`, not to `eleves` — the
 * scholastic pivot links accounts. Here it links `etudiants`, the academic
 * record. A submission and its mark are academic facts that must survive the
 * account being closed, and the newly added `etudiants.user_id` is what resolves
 * the signed-in caller to their record.
 */
return new class extends Migration
{
    public function up(): void
    {
        Schema::create('uni_devoirs', function (Blueprint $table) {
            $table->id();

            // restrictOnDelete, never cascade: a school is deactivated, not
            // deleted (2026_08_03_100000_restrict_school_deletion).
            $table->foreignId('ecole_id')->constrained('ecoles')->restrictOnDelete();

            $table->foreignId('matiere_id')->constrained('uni_matieres')->cascadeOnDelete();

            // Who published it. The subject already names its lecturer
            // (`uni_matieres.enseignant_id`); this records the account that
            // acted, which is what ownership checks compare against.
            $table->foreignId('created_by')->nullable()->constrained('users')->nullOnDelete();

            $table->string('titre');
            $table->text('description')->nullable();

            // devoir | projet | examen | exercice | rapport
            $table->string('type')->default('devoir');
            // haute | moyenne | basse
            $table->string('priorite')->default('moyenne');
            // a_faire | en_cours | termine
            $table->string('statut')->default('en_cours');

            $table->dateTime('date_limite')->nullable();
            $table->boolean('publie')->default(true);

            $table->timestamps();

            $table->index(['ecole_id', 'date_limite'], 'uni_devoirs_school_deadline_index');
            $table->index(['ecole_id', 'matiere_id'], 'uni_devoirs_school_subject_index');
        });

        Schema::create('uni_devoir_etudiant', function (Blueprint $table) {
            $table->id();
            $table->foreignId('devoir_id')->constrained('uni_devoirs')->cascadeOnDelete();
            // `restrictOnDelete` : `Etudiant` est en suppression dure, donc la
            // cascade effaçait tout le travail rendu et toutes les notes d'un
            // étudiant à l'instant où l'on supprimait sa fiche. Même principe que
            // pour l'établissement : on désactive, on ne supprime pas. La
            // suppression échoue désormais franchement au lieu d'effacer un
            // dossier académique.
            $table->foreignId('etudiant_id')->constrained('etudiants')->restrictOnDelete();

            $table->text('reponse')->nullable();
            $table->string('fichier')->nullable();
            $table->boolean('rendu')->default(false);
            $table->dateTime('date_remise')->nullable();
            $table->decimal('note', 5, 2)->nullable();
            $table->text('commentaire')->nullable();

            $table->timestamps();

            // One submission per student per assignment; re-submitting updates
            // the row rather than adding a second one.
            $table->unique(['devoir_id', 'etudiant_id']);
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('uni_devoir_etudiant');
        Schema::dropIfExists('uni_devoirs');
    }
};
