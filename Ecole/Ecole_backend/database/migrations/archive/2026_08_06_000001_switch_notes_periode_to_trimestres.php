<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Passe le secondaire/primaire du calendrier « Semestre 1/2 » (module
     * universitaire) aux 3 trimestres béninois (référentiel MESTFP/MEMP).
     *
     * La colonne est détendue en `string` d'abord (sans contrainte CHECK) pour
     * pouvoir migrer les anciennes valeurs « Semestre X » — un `enum → enum`
     * rejetterait la copie de données côté SQLite et tronquerait côté MySQL.
     * La validité est ensuite garantie par la règle `in:Trimestre 1..3` des
     * contrôleurs (NotesController, BulletinController).
     */
    public function up(): void
    {
        Schema::table('notes', function (Blueprint $table) {
            $table->string('periode')->change();
        });

        DB::table('notes')->where('periode', 'Semestre 1')->update(['periode' => 'Trimestre 1']);
        DB::table('notes')->where('periode', 'Semestre 2')->update(['periode' => 'Trimestre 2']);
    }

    public function down(): void
    {
        DB::table('notes')->whereIn('periode', ['Trimestre 1', 'Trimestre 2'])->update([
            'periode' => DB::raw("CASE periode WHEN 'Trimestre 1' THEN 'Semestre 1' ELSE 'Semestre 2' END"),
        ]);
        DB::table('notes')->where('periode', 'Trimestre 3')->update(['periode' => 'Semestre 2']);

        Schema::table('notes', function (Blueprint $table) {
            $table->enum('periode', ['Semestre 1', 'Semestre 2'])->change();
        });
    }
};
