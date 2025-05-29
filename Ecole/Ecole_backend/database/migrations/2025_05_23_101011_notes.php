
<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up()
    {
        Schema::create('notes', function (Blueprint $table) {
            $table->id();
            $table->unsignedBigInteger('eleve_id');
            $table->unsignedBigInteger('classe_id');
            $table->unsignedBigInteger('matiere_id');
            $table->unsignedBigInteger('enseignant_id');
            $table->decimal('note', 4, 2); // Note sur 20
            $table->decimal('note_sur', 4, 2)->default(20); // Note sur combien
            $table->string('type_evaluation')->nullable(); // Devoir, Composition, etc.
            $table->text('commentaire')->nullable();
            $table->date('date_evaluation');
            $table->string('periode')->nullable(); // 1er trimestre, 2ème semestre, etc.
            $table->timestamps();

            $table->foreign('eleve_id')->references('id')->on('eleves')->onDelete('cascade');
            $table->foreign('classe_id')->references('id')->on('classes')->onDelete('cascade');
            $table->foreign('matiere_id')->references('id')->on('matieres')->onDelete('cascade');
            $table->foreign('enseignant_id')->references('id')->on('enseignants')->onDelete('cascade');
            
            $table->index(['eleve_id', 'matiere_id', 'periode']);
        });
    }

    public function down()
    {
        Schema::dropIfExists('notes');
    }
};
