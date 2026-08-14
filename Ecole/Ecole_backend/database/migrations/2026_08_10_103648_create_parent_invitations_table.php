<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Run the migrations.
     */
    public function up(): void
    {
        Schema::create('parent_invitations', function (Blueprint $table) {
            $table->id();
            // Restrict, pas cascade : une école se désactive, ne se supprime
            // pas (cf. SchoolDeactivationTest) — rien ne doit disparaître en
            // chaîne avec elle.
            $table->foreignId('ecole_id')->constrained()->restrictOnDelete();
            // Restrict aussi vers l'élève : un dossier scolaire ne s'efface
            // jamais en cascade (cf. RecordDurabilityTest).
            $table->foreignId('eleve_id')->constrained()->restrictOnDelete();
            $table->foreignId('created_by')->constrained('users')->cascadeOnDelete();
            $table->string('email')->index();
            $table->string('token', 64)->unique();
            $table->string('role')->nullable(); // père, mère, tuteur, correspondant
            $table->boolean('is_primary')->default(false);
            $table->boolean('is_guardian')->default(false);
            $table->boolean('is_accepted')->default(false);
            $table->timestamp('accepted_at')->nullable();
            $table->timestamp('expires_at');
            $table->timestamps();

            $table->unique(['eleve_id', 'email'], 'invite_unique_eleve_email');
            $table->index('token');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('parent_invitations');
    }
};