<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

/**
 * `livres.annee_publication` : `YEAR` → entier.
 *
 * Le type `YEAR` de MySQL ne couvre que 1901–2155. Une bibliothèque scolaire
 * cataloguant Les Misérables (1862) ou tout classique antérieur à 1901 voyait
 * l'insertion rejetée — « Out of range value ». Le défaut ne s'était jamais vu
 * parce que la suite de tests tourne sur SQLite, où les types sont indicatifs
 * et où 1862 passe sans broncher (cf. audit P2.1).
 *
 * `smallint` non signé couvre 0–65535 : large pour toute date de publication,
 * et plus étroit qu'un `integer`. La validation du contrôleur
 * (`BibliothecaireController`) reste `integer`, elle borne déjà côté entrée.
 */
return new class extends Migration
{
    public function up(): void
    {
        Schema::table('livres', function (Blueprint $table) {
            $table->unsignedSmallInteger('annee_publication')->change();
        });
    }

    public function down(): void
    {
        Schema::table('livres', function (Blueprint $table) {
            $table->year('annee_publication')->change();
        });
    }
};
