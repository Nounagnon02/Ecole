<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

/**
 * Un mot de passe provisoire (inscription, import) est connu de l'agent qui
 * l'a remis : tant qu'il n'a pas été remplacé par son titulaire, le compte
 * n'est pas vraiment le sien. Ce drapeau cantonne le compte au changement de
 * mot de passe (cf. EnsurePasswordChanged).
 */
return new class extends Migration
{
    public function up(): void
    {
        Schema::table('users', function (Blueprint $table) {
            $table->boolean('password_change_required')->default(false)->after('password');
        });
    }

    public function down(): void
    {
        Schema::table('users', function (Blueprint $table) {
            $table->dropColumn('password_change_required');
        });
    }
};
