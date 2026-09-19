<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Table `bulletins` : archive immuable du bulletin d'un élève.
     *
     * Un enregistrement par (élève, période, année scolaire) est créé au
     * verrouillage du bulletin (POST /api/bulletins/verrouiller) à partir de
     * l'instantané `moyennes`. La mention est calculée à la création, le JSON
     * `data` porte le détail par matière, et `pdf_path` accueillera le PDF
     * généré plus tard (génération hors périmètre de ce chantier).
     *
     * L'invariant de durabilité est conservé : la clé étrangère sur `eleves`
     * est RESTRICT, un dossier d'élève ne se supprime pas.
     */
    public function up(): void
    {
        Schema::create('bulletins', function (Blueprint $table) {
            $table->id();
            $table->foreignId('eleve_id')->constrained('eleves')->restrictOnDelete();
            $table->foreignId('classe_id')->constrained('classes')->cascadeOnDelete();
            $table->string('periode');
            $table->string('annee_scolaire');
            $table->decimal('moyenne_generale', 5, 2);
            $table->unsignedSmallInteger('rang');
            $table->unsignedInteger('total_eleves')->nullable();
            $table->string('mention')->nullable();
            $table->json('data')->nullable();
            $table->text('appreciation')->nullable();
            $table->string('pdf_path')->nullable();
            $table->boolean('publie')->default(false);
            $table->timestamp('publie_le')->nullable();
            $table->foreignId('created_by')->nullable()->constrained('users')->nullOnDelete();
            $table->foreignId('ecole_id')->constrained('ecoles')->restrictOnDelete();
            $table->timestamps();

            $table->unique(['eleve_id', 'periode', 'annee_scolaire', 'ecole_id'], 'bulletins_eleve_periode_annee_unique');
            $table->index(['classe_id', 'periode', 'annee_scolaire'], 'bulletins_classe_periode_annee_index');
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('bulletins');
    }
};
