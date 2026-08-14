<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Reconstruit `moyennes`, une table qui n'était qu'un stub (`eleves_id` +
     * `ecole_id`) sans aucune logique métier. Elle devient l'instantané
     * archivé du bulletin : moyenne et rang par matière, moyenne générale et
     * rang général, par élève et par période.
     *
     * Une ligne avec `matiere_id` NULL porte la moyenne générale et le rang
     * général de l'élève pour la période. La colonne `eleves_id` (pluriel)
     * est normalisée en `eleve_id` (singulier) comme partout ailleurs.
     *
     * L'invariant de durabilité est conservé : la clé étrangère sur `eleves`
     * est RESTRICT, un dossier d'élève ne se supprime pas.
     */
    public function up(): void
    {
        Schema::dropIfExists('moyennes');

        Schema::create('moyennes', function (Blueprint $table) {
            $table->id();
            $table->foreignId('eleve_id')->constrained('eleves')->restrictOnDelete();
            $table->foreignId('classe_id')->constrained('classes')->cascadeOnDelete();
            $table->foreignId('matiere_id')->nullable()->constrained('matieres')->cascadeOnDelete();
            $table->string('periode');
            $table->string('annee_scolaire')->nullable();
            $table->decimal('valeur', 5, 2);
            $table->decimal('coefficient', 5, 2)->nullable();
            $table->unsignedSmallInteger('rang')->nullable();
            $table->unsignedInteger('total_eleves')->nullable();
            $table->foreignId('created_by')->nullable()->constrained('users')->nullOnDelete();
            $table->foreignId('ecole_id')->constrained('ecoles')->restrictOnDelete();
            $table->timestamps();

            $table->index(['eleve_id', 'periode']);
            $table->index(['classe_id', 'periode']);
            $table->index('matiere_id');
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('moyennes');

        Schema::create('moyennes', function (Blueprint $table) {
            $table->id();
            $table->foreignId('eleves_id')->constrained('eleves')->restrictOnDelete();
            $table->foreignId('ecole_id')->constrained('ecoles')->cascadeOnDelete();
            $table->timestamps();
        });
    }
};
