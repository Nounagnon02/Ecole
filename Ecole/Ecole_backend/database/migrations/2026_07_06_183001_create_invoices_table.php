<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('invoices', function (Blueprint $table) {
            $table->id();
            $table->string('tenant_id'); // References tenant id (string)
            $table->foreignId('subscription_id')->nullable()->constrained()->nullOnDelete();
            $table->string('invoice_number')->unique();
            $table->string('status')->default('pending'); // pending, paid, failed, refunded, canceled
            $table->decimal('amount', 12, 2);
            $table->string('currency', 3)->default('XOF');
            $table->string('billing_cycle')->nullable(); // monthly, yearly
            $table->string('payment_provider')->nullable(); // cinetpay, fedapay, stripe
            $table->string('payment_provider_id')->nullable(); // Provider transaction ID
            $table->string('payment_method')->nullable();
            $table->timestamp('paid_at')->nullable();
            $table->timestamp('due_at')->nullable();
            $table->json('metadata')->nullable();
            $table->timestamps();

            $table->index(['tenant_id', 'status']);
            $table->index(['payment_provider', 'payment_provider_id']);
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('invoices');
    }
};
