<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Pièce jointe d'un message (parcours 5 de la mission, R-31, 16/11/2026).
     * Le fichier vit sur le disque privé ; seuls l'expéditeur et le
     * destinataire peuvent le télécharger. Colonnes nullables : les messages
     * existants n'en ont pas.
     */
    public function up(): void
    {
        Schema::table('messages', function (Blueprint $table) {
            $table->string('piece_jointe_chemin')->nullable();
            $table->string('piece_jointe_nom')->nullable();
            $table->string('piece_jointe_type', 100)->nullable();
            $table->unsignedInteger('piece_jointe_taille')->nullable();
        });
    }

    public function down(): void
    {
        Schema::table('messages', function (Blueprint $table) {
            $table->dropColumn(['piece_jointe_chemin', 'piece_jointe_nom', 'piece_jointe_type', 'piece_jointe_taille']);
        });
    }
};
