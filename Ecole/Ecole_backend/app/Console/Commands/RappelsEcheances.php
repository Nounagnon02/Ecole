<?php

namespace App\Console\Commands;

use App\Models\PaiementEleve;
use App\Support\AvisParents;
use App\Support\SchoolContext;
use Illuminate\Console\Command;
use Illuminate\Support\Facades\DB;

/**
 * Rappel SMS des échéances à 7 jours et à 1 jour (lot 7.1), une fois par jour.
 */
class RappelsEcheances extends Command
{
    protected $signature = 'ecole:rappels-echeances';

    protected $description = 'Envoie aux parents le rappel des échéances dues dans 7 jours et demain';

    public function handle(): int
    {
        $envois = 0;
        $echeances = PaiementEleve::withoutGlobalScopes()
            ->where('montant_restant', '>', 0)
            ->whereIn(DB::raw('DATE(date_paiement)'), [now()->addDays(7)->toDateString(), now()->addDay()->toDateString()])
            ->get();

        foreach ($echeances as $echeance) {
            $envois += SchoolContext::for((int) $echeance->ecole_id, function () use ($echeance) {
                $eleve = $echeance->eleve()->with('user:id,name,prenom')->first();

                return $eleve ? AvisParents::envoyer($eleve, 'echeance', [
                    'reste' => AvisParents::fcfa((float) $echeance->montant_restant), 'libelle' => $echeance->type_paiement ?? 'scolarité',
                    'date' => $echeance->date_paiement->format('d/m/Y'),
                ]) : 0;
            });
        }

        $this->info("{$envois} rappel(s) confiés à l’envoi.");

        return self::SUCCESS;
    }
}
