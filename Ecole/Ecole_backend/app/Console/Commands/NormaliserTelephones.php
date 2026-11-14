<?php

namespace App\Console\Commands;

use App\Support\BeninPhone;
use Illuminate\Console\Command;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

/**
 * Convertit les numéros enregistrés à 8 chiffres au format à 10 chiffres
 * (+229 01…), seul valide au Bénin depuis le 01/01/2025 (audit du 14/11,
 * BUG-012).
 *
 * L'envoi des SMS et la connexion savaient déjà convertir à la volée, mais
 * les fiches gardaient l'ancien numéro : affiché tel quel, recopié tel quel.
 * Ne touche qu'aux numéros à 8 chiffres (avec ou sans indicatif) : un
 * numéro à 10 chiffres, vide ou illisible reste comme il est. Rejouable.
 *
 *   php artisan ecole:normaliser-telephones --dry-run   # ce qui changerait
 *   php artisan ecole:normaliser-telephones             # appliquer
 */
class NormaliserTelephones extends Command
{
    protected $signature = 'ecole:normaliser-telephones {--dry-run : Compter sans rien écrire}';

    protected $description = 'Convertit au format +229 01… les numéros encore enregistrés à 8 chiffres';

    /** Colonnes de numéros de téléphone, par table. */
    private const COLONNES = [
        'users' => 'telephone',
        'ecoles' => 'phone',
        'personnels' => 'telephone',
        'etudiants' => 'telephone',
        'uni_enseignants' => 'telephone',
        'universites' => 'telephone',
    ];

    public function handle(): int
    {
        $essai = (bool) $this->option('dry-run');
        $total = 0;

        if ($essai) {
            $this->info('Essai à blanc : rien ne sera écrit.');
        }

        foreach (self::COLONNES as $table => $colonne) {
            if (! Schema::hasTable($table) || ! Schema::hasColumn($table, $colonne)) {
                continue;
            }

            $convertis = 0;
            DB::table($table)->whereNotNull($colonne)->orderBy('id')
                ->chunkById(500, function ($lignes) use ($table, $colonne, $essai, &$convertis) {
                    foreach ($lignes as $ligne) {
                        $nouveau = self::conversion($ligne->{$colonne});
                        if ($nouveau === null) {
                            continue;
                        }
                        $convertis++;
                        if (! $essai) {
                            DB::table($table)->where('id', $ligne->id)->update([$colonne => $nouveau]);
                        }
                    }
                });

            if ($convertis > 0) {
                $this->line(sprintf('  %s.%s : %d numéro(s)', $table, $colonne, $convertis));
            }
            $total += $convertis;
        }

        $this->info(sprintf('%d numéro(s) %s.', $total, $essai ? 'à convertir' : 'converti(s)'));

        return self::SUCCESS;
    }

    /** Le numéro au format +22901…, s'il s'agit d'un ancien numéro à 8 chiffres ; sinon null. */
    public static function conversion(?string $brut): ?string
    {
        $chiffres = preg_replace('/^(\+|00)/', '', preg_replace('/[\s.\-()]/', '', (string) $brut));

        if (! preg_match('/^\d+$/', $chiffres)) {
            return null;
        }

        $local = strlen($chiffres) === 11 && str_starts_with($chiffres, BeninPhone::COUNTRY_CODE)
            ? substr($chiffres, 3)
            : $chiffres;

        return strlen($local) === 8 ? BeninPhone::normalize($brut) : null;
    }
}
