<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Run the migrations.
     *
     * @return void
     */
    public function up()
    {
        //
        Schema::create('paiements', function (Blueprint $table) {
            $table->id();
            $table->foreignId('parents_id')->constrained()->onDelete('cascade');
            $table->foreignId('eleves_id')->constrained()->onDelete('cascade');
            $table->decimal('montant', 10, 2);
            $table->string('mode_paiement');
            $table->dateTime('date_paiement');
            $table->timestamps();
        });
        Schema::create('paiement_details', function (Blueprint $table) {
            $table->id();
            $table->foreignId('paiement_id')->constrained('paiements')->onDelete('cascade');
            $table->string('description')->nullable();
            $table->decimal('montant', 10, 2);
            $table->timestamps();
        });
        Schema::create('paiement_status', function (Blueprint $table) {
            $table->id();
            $table->foreignId('paiement_id')->constrained('paiements')->onDelete('cascade');
            $table->string('status'); // e.g., 'pending', 'completed', 'failed'
            $table->timestamps();
        });
        Schema::create('paiement_retries', function (Blueprint $table) {
            $table->id();
            $table->foreignId('paiement_id')->constrained('paiements')->onDelete('cascade');
            $table->integer('retry_count')->default(0);
            $table->dateTime('last_retry_at')->nullable();
            $table->timestamps();
        });
        Schema::create('paiement_notifications', function (Blueprint $table) {
            $table->id();
            $table->foreignId('paiement_id')->constrained('paiements')->onDelete('cascade');
            $table->string('notification_type'); // e.g., 'email', 'sms'
            $table->boolean('is_sent')->default(false);
            $table->dateTime('sent_at')->nullable();
            $table->timestamps();
        });
        Schema::create('paiement_logs', function (Blueprint $table) {
            $table->id();
            $table->foreignId('paiement_id')->constrained('paiements')->onDelete('cascade');
            $table->text('log_message');
            $table->dateTime('logged_at')->useCurrent();
            $table->timestamps();
        });
        Schema::create('paiement_audits', function (Blueprint $table) {
            $table->id();
            $table->foreignId('paiement_id')->constrained('paiements')->onDelete('cascade');
            $table->string('action'); // e.g., 'created', 'updated', 'deleted'
            $table->text('details')->nullable();
            $table->foreignId('user_id')->constrained()->onDelete('cascade'); //
            $table->timestamps();
        });
        Schema::create('paiement_refunds', function (Blueprint $table) {
            $table->id();
            $table->foreignId('paiement_id')->constrained('paiements')->onDelete('cascade');
            $table->decimal('refund_amount', 10, 2);
            $table->string('refund_reason')->nullable();
            $table->dateTime('refund_date')->nullable();
            $table->timestamps();
        });
        Schema::create('paiement_disputes', function (Blueprint $table) {
            $table->id();
            $table->foreignId('paiement_id')->constrained('paiements')->onDelete('cascade');
            $table->string('dispute_reason');
            $table->text('dispute_details')->nullable();
            $table->dateTime('dispute_date')->nullable();
            $table->timestamps();
        });
        Schema::create('paiement_invoices', function (Blueprint $table) {
            $table->id();
            $table->foreignId('paiement_id')->constrained('paiements')->onDelete('cascade');
            $table->string('invoice_number')->unique();
            $table->dateTime('invoice_date');
            $table->decimal('total_amount', 10, 2);
            $table->string('status'); // e.g., 'paid', 'unpaid', 'overdue'
            $table->timestamps();
        });
        Schema::create('paiement_receipts', function (Blueprint $table) {
            $table->id();
            $table->foreignId('paiement_id')->constrained('paiements')->onDelete('cascade');
            $table->string('receipt_number')->unique();
            $table->dateTime('receipt_date');
            $table->decimal('amount', 10, 2);
            $table->string('payment_method'); // e.g., 'credit_card', 'bank_transfer', 'cash'
            $table->timestamps();
        });
        Schema::create('paiement_schedules', function (Blueprint $table) {
            $table->id();
            $table->foreignId('paiement_id')->constrained('paiements')->onDelete('cascade');
            $table->dateTime('scheduled_date');
            $table->decimal('scheduled_amount', 10, 2);
            $table->string('status'); // e.g., 'scheduled', 'completed', 'cancelled'
            $table->timestamps();
        });
        Schema::create('paiement_methods', function (Blueprint $table) {
            $table->id();
            $table->string('method_name')->unique(); // e.g., 'credit_card', 'bank_transfer', 'paypal'
            $table->string('description')->nullable();
            $table->boolean('is_active')->default(true);
            $table->timestamps();
        });
        Schema::create('paiement_method_details', function (Blueprint $table) {
            $table->id();
            $table->foreignId('paiement_method_id')->constrained('paiement_methods')->onDelete('cascade');
            $table->string('detail_key'); // e.g., 'card_number', 'bank_account'
            $table->string('detail_value'); // e.g., '1234-5678-9012-3456', 'DE89370400440532013000'
            $table->timestamps();
        });
    }

    /**
     * Reverse the migrations.
     *
     * @return void
     */
    public function down()
    {
        //
    }
};
