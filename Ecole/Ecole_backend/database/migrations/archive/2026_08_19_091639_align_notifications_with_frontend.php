<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('notifications', function (Blueprint $table) {
            $table->string('title')->nullable()->after('user_id');
            $table->text('message')->nullable()->change();
            $table->json('data')->nullable()->after('message');
            $table->timestamp('read_at')->nullable()->after('data');
        });

        // Backfill: convert lu=true → read_at=updated_at, lu=false → read_at=null
        DB::table('notifications')
            ->where('lu', true)
            ->update(['read_at' => DB::raw('updated_at')]);

        Schema::table('notifications', function (Blueprint $table) {
            $table->dropColumn('lu');
            $table->dropColumn('titre');
        });
    }

    public function down(): void
    {
        Schema::table('notifications', function (Blueprint $table) {
            $table->string('titre')->nullable()->after('user_id');
            $table->boolean('lu')->default(false)->after('titre');
        });

        DB::table('notifications')
            ->whereNotNull('read_at')
            ->update(['lu' => true]);

        Schema::table('notifications', function (Blueprint $table) {
            $table->dropColumn(['title', 'data', 'read_at']);
        });
    }
};
