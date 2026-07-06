<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('tenants', function (Blueprint $table) {
            $table->string('name')->nullable()->after('id');
            $table->string('slug')->nullable()->unique()->after('name');
            $table->string('domain')->nullable()->after('slug');
            $table->foreignId('plan_id')->nullable()->constrained('plans')->nullOnDelete()->after('domain');
            $table->string('status')->default('trial')->after('plan_id');
            $table->string('school_type')->nullable()->after('status');
        });
    }

    public function down(): void
    {
        Schema::table('tenants', function (Blueprint $table) {
            $table->dropColumn(['name', 'slug', 'domain', 'plan_id', 'status', 'school_type']);
        });
    }
};
