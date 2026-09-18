<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

/**
 * Index sur les colonnes réellement filtrées par l'application.
 *
 * Complète 2026_07_10_104554_add_performance_indexes : 8 migrations sur 88
 * déclaraient un index, alors que ces colonnes sont dans le chemin chaud de la
 * messagerie, des bulletins et des dashboards (cf. audit P5).
 */
return new class extends Migration
{
    /**
     * [table => [[colonnes], nom_index]]
     */
    private function definitions(): array
    {
        return [
            // Messagerie : boîte de réception et compteur de non-lus.
            'messages' => [
                [['destinataire', 'lu'], 'messages_destinataire_lu_index'],
                [['expediteur'], 'messages_expediteur_index'],
            ],
            // Notes : agrégats par matière/période et classements.
            'notes' => [
                [['matiere_id', 'periode'], 'notes_matiere_periode_index'],
                [['eleve_id', 'periode'], 'notes_eleve_periode_index'],
                [['type_evaluation'], 'notes_type_evaluation_index'],
            ],
            // Utilisateurs : filtrage par rôle au sein d'un établissement.
            'users' => [
                [['ecole_id', 'role'], 'users_ecole_role_index'],
                [['is_active'], 'users_is_active_index'],
            ],
            'evenements' => [
                [['date_debut'], 'evenements_date_debut_index'],
            ],
            'devoir_eleve' => [
                [['eleve_id', 'rendu'], 'devoir_eleve_eleve_rendu_index'],
            ],
            'eleves' => [
                [['class_id'], 'eleves_class_id_index'],
                [['serie_id'], 'eleves_serie_id_index'],
            ],
            'moyennes' => [
                [['eleve_id', 'periode'], 'moyennes_eleve_periode_index'],
            ],
            'payments' => [
                [['status', 'paid_at'], 'payments_status_paid_at_index'],
            ],
        ];
    }

    public function up(): void
    {
        foreach ($this->definitions() as $table => $index) {
            if (!Schema::hasTable($table)) {
                continue;
            }

            foreach ($index as [$colonnes, $nom]) {
                // On ne crée l'index que si toutes ses colonnes existent :
                // le schéma varie selon les migrations déjà appliquées.
                $manquante = false;
                foreach ($colonnes as $colonne) {
                    if (!Schema::hasColumn($table, $colonne)) {
                        $manquante = true;
                        break;
                    }
                }

                if ($manquante) {
                    continue;
                }

                Schema::table($table, function (Blueprint $blueprint) use ($colonnes, $nom) {
                    $blueprint->index($colonnes, $nom);
                });
            }
        }
    }

    public function down(): void
    {
        foreach ($this->definitions() as $table => $index) {
            if (!Schema::hasTable($table)) {
                continue;
            }

            foreach ($index as [, $nom]) {
                Schema::table($table, function (Blueprint $blueprint) use ($nom) {
                    $blueprint->dropIndex($nom);
                });
            }
        }
    }
};
