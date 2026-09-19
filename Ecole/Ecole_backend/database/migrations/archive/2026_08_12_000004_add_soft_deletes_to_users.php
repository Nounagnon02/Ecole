<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Suppression douce des comptes.
     *
     * Un compte supprimé en dur déclenche des suppressions en cascade sur
     * `eleves`, `enseignants`, `parents`, `notifications`, etc. : toute
     * l'histoire scolaire (notes, paiements, communications) disparaissait
     * avec lui. Avec `deleted_at`, un compte supprimé :
     *  - ne peut plus se connecter (Eloquant exclut les lignes supprimées),
     *  - garde ses données et ses profils (FK intactes),
     *  - reste révocable/consultable par le personnel.
     */
    public function up(): void
    {
        Schema::table('users', function (Blueprint $table) {
            $table->softDeletes();
        });
    }

    public function down(): void
    {
        Schema::table('users', function (Blueprint $table) {
            $table->dropSoftDeletes();
        });
    }
};
