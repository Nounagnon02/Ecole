
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
            $table->foreignId('eleve_id')->constrained('eleves')->onDelete('cascade');
            $table->foreignId('classe_id')->constrained('classes')->onDelete('cascade');
            $table->foreignId('matiere_id')->constrained('matieres')->onDelete('cascade');
            $table->decimal('note', 5, 2);
            $table->decimal('note_sur', 5, 2)->default(20);
            $table->enum('type_evaluation', ['Devoir1', 'Devoir2', 'Interrogation', '1ère evaluation', '2ème evaluation', '3ème evaluation', '4ème evaluation', '5ème evaluation', '6ème evaluation']);
            $table->date('date_evaluation');
            $table->enum('periode', ['Semestre 1', 'Semestre 2']);
            $table->text('observation')->nullable();
            $table->foreignId('created_by')->nullable()->constrained('users');
            $table->timestamps();
            
            // Index pour améliorer les performances
            $table->index(['eleve_id', 'matiere_id', 'periode']);
        });
    }

    public function down()
    {
        Schema::dropIfExists('notes');
    }
};
