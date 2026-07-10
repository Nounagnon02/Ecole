<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('audit_logs', function (Blueprint $table) {
            $table->id();
            $table->foreignId('user_id')->nullable()->constrained()->nullOnDelete();
            $table->foreignId('ecole_id')->nullable()->constrained()->nullOnDelete();
            $table->string('event'); // created, updated, deleted, login, export, etc.
            $table->string('auditable_type'); // model class name
            $table->unsignedBigInteger('auditable_id'); // model ID
            $table->json('old_values')->nullable(); // before state
            $table->json('new_values')->nullable(); // after state
            $table->string('ip_address', 45)->nullable();
            $table->string('user_agent')->nullable();
            $table->timestamps();

            // Index for fast lookups
            $table->index(['auditable_type', 'auditable_id']);
            $table->index(['user_id']);
            $table->index(['event']);
            $table->index(['created_at']);
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('audit_logs');
    }
};
