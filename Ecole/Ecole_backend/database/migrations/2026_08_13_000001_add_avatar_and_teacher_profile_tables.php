<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Profil enseignant étendu (cf. audit F3) :
     *  - `users.avatar` : photo de profil ;
     *  - `enseignant_experiences` : parcours professionnel ;
     *  - `enseignant_matiere_maitrisee` : matières maîtrisées,
     *    distinct de `enseignant_matiere` qui est l'affectation
     *    réelle (classe + série + coefficient).
     */
    public function up()
    {
        if (!Schema::hasColumn('users', 'avatar')) {
            Schema::table('users', function (Blueprint $table) {
                // `text` : le front envoie la photo en data-URL (base64),
                // qui dépasse largement un VARCHAR(255).
                $table->text('avatar')->nullable()->after('telephone');
            });
        }

        Schema::create('enseignant_experiences', function (Blueprint $table) {
            $table->id();
            $table->foreignId('enseignant_id')->constrained('enseignants')->cascadeOnDelete();
            $table->string('poste');
            $table->string('etablissement')->nullable();
            $table->date('date_debut');
            $table->date('date_fin')->nullable();
            $table->string('description')->nullable();
            $table->timestamps();
        });

        Schema::create('enseignant_matiere_maitrisee', function (Blueprint $table) {
            $table->id();
            $table->foreignId('enseignant_id')->constrained('enseignants')->cascadeOnDelete();
            $table->foreignId('matiere_id')->constrained('matieres')->cascadeOnDelete();
            $table->timestamps();
            $table->unique(['enseignant_id', 'matiere_id']);
        });

        // Les deux tables portent `ecole_id` pour rester cloisonnées par le
        // trait `BelongsToEcole` (le même qui protège `enseignant_matiere`).
        // Comme partout ailleurs, la clé est RESTRICT : on ne cascade jamais
        // sur l'école, une suppression d'établissement doit échouer.
        foreach (['enseignant_experiences', 'enseignant_matiere_maitrisee'] as $table) {
            Schema::table($table, function (Blueprint $table) {
                $table->foreignId('ecole_id')->nullable()->constrained('ecoles')->restrictOnDelete();
            });
        }
    }

    /**
     * Reverse the migrations.
     *
     * @return void
     */
    public function down()
    {
        Schema::dropIfExists('enseignant_matiere_maitrisee');
        Schema::dropIfExists('enseignant_experiences');

        if (Schema::hasColumn('users', 'avatar')) {
            Schema::table('users', function (Blueprint $table) {
                $table->dropColumn('avatar');
            });
        }
    }
};
