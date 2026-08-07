<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        // Le pivot parent ↔ élève devient une filiation enrichie :
        // rôle dans la famille, parent primaire (contact de référence),
        // tuteur légal.
        Schema::table('eleves_parents', function (Blueprint $table) {
            $table->enum('role', ['père', 'mère', 'tuteur', 'correspondant'])
                ->nullable()
                ->after('eleve_id');
            $table->boolean('is_primary')->default(false)->after('role');
            $table->boolean('is_guardian')->default(false)->after('is_primary');
        });
    }

    public function down(): void
    {
        Schema::table('eleves_parents', function (Blueprint $table) {
            $table->dropColumn(['role', 'is_primary', 'is_guardian']);
        });
    }
};