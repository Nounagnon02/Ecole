<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        if (!Schema::hasTable('eleves')) {
            return;
        }

        // Check if class_id exists and classe_id doesn't
        if (Schema::hasColumn('eleves', 'class_id') && !Schema::hasColumn('eleves', 'classe_id')) {
            Schema::table('eleves', function (Blueprint $table) {
                $table->renameColumn('class_id', 'classe_id');
            });
        }
    }

    public function down(): void
    {
        if (!Schema::hasTable('eleves')) {
            return;
        }

        if (Schema::hasColumn('eleves', 'classe_id') && !Schema::hasColumn('eleves', 'class_id')) {
            Schema::table('eleves', function (Blueprint $table) {
                $table->renameColumn('classe_id', 'class_id');
            });
        }
    }
};