<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Normalise le profil Maternelle & Primaire.
     *
     * La table était créée sous un nom avec une faute de frappe
     * (`enseignants_martenel_primaire`) et portait la colonne `class_id` alors
     * que partout ailleurs la clé de classe s'appelle `classe_id` (les
     * `eleves` ont déjà été migrés en 2026_08_06_113845).
     *
     * Sur MySQL >= 8.0.3 le renommage de colonne est natif et la contrainte
     * de clé étrangère suit automatiquement la nouvelle colonne ; sur les
     * versions antérieures Laravel reconstruit la table en préservant la
     * contrainte.
     */
    public function up(): void
    {
        Schema::rename('enseignants_martenel_primaire', 'enseignants_maternelle_primaire');

        Schema::table('enseignants_maternelle_primaire', function (Blueprint $table) {
            $table->renameColumn('class_id', 'classe_id');
        });
    }

    public function down(): void
    {
        Schema::table('enseignants_maternelle_primaire', function (Blueprint $table) {
            $table->renameColumn('classe_id', 'class_id');
        });

        Schema::rename('enseignants_maternelle_primaire', 'enseignants_martenel_primaire');
    }
};
