<?php

namespace App\Support;

use App\Models\Eleve;
use App\Models\User;
use App\Services\SmsService;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Log;

/**
 * SMS aux parents sur les événements de la scolarité (lot 7.1).
 *
 * Chaque parent rattaché à l'élève et joignable reçoit le message, sauf s'il
 * a désactivé ce type d'avis. L'envoi passe par la file d'attente. Sans
 * fournisseur configuré, SmsService consigne au lieu d'envoyer.
 */
final class AvisParents
{
    public const TYPES = ['absences', 'notes', 'echeances', 'recus', 'convocations'];

    private const MODELES = [
        'fr' => [
            'absence' => '{ecole} : {eleve} est noté(e) {statut} le {date}. Contactez l’école en cas d’erreur.',
            'bulletin' => '{ecole} : le bulletin du {periode} de {eleve} est disponible. Moyenne {moyenne}/20, rang {rang}.',
            'recu' => '{ecole} : paiement de {montant} FCFA reçu pour {eleve} ({libelle}). Reste à payer : {reste} FCFA. Réf. {reference}.',
            'echeance' => '{ecole} : rappel, {reste} FCFA restent à payer pour {eleve} ({libelle}) avant le {date}.',
            'convocation' => '{ecole} : vous êtes attendu(e) le {date} à {heure} pour {eleve}. Motif : {motif}.',
            // Relances de la direction (tableau « décisions »).
            'retard' => '{ecole} : {reste} FCFA restent dus pour {eleve} ({libelle}), échéance du {date} dépassée. Merci de régulariser ou de contacter l’école.',
            'absences_a_justifier' => '{ecole} : {nombre} absence(s) de {eleve} restent à justifier. Merci de contacter l’école.',
        ],
        'en' => [
            'absence' => '{ecole}: {eleve} was marked {statut} on {date}. Contact the school if this is wrong.',
            'bulletin' => '{ecole}: {eleve}’s report card for {periode} is available. Average {moyenne}/20, rank {rang}.',
            'recu' => '{ecole}: payment of {montant} FCFA received for {eleve} ({libelle}). Left to pay: {reste} FCFA. Ref. {reference}.',
            'echeance' => '{ecole}: reminder, {reste} FCFA left to pay for {eleve} ({libelle}) before {date}.',
            'convocation' => '{ecole}: you are expected on {date} at {heure} about {eleve}. Reason: {motif}.',
            'retard' => '{ecole}: {reste} FCFA still due for {eleve} ({libelle}), past the {date} deadline. Please settle or contact the school.',
            'absences_a_justifier' => '{ecole}: {nombre} absence(s) of {eleve} still need a reason. Please contact the school.',
        ],
    ];

    private const TYPE_PAR_MODELE = [
        'absence' => 'absences', 'bulletin' => 'notes', 'recu' => 'recus', 'echeance' => 'echeances', 'convocation' => 'convocations',
        'retard' => 'echeances', 'absences_a_justifier' => 'absences',
    ];

    /** Avertir les parents de l'élève. Rend le nombre de messages confiés à l'envoi. */
    public static function envoyer(Eleve $eleve, string $modele, array $valeurs): int
    {
        $type = self::TYPE_PAR_MODELE[$modele];
        // Sans utilisateur connecté (commande planifiée), le scope d'école de
        // `users` ne trouverait personne : le téléphone est lu sans lui.
        $parents = $eleve->parents()->with(['user' => fn ($q) => $q->withoutGlobalScopes()->select('id', 'telephone')])
            ->get()->pluck('user')->filter(fn ($u) => $u && BeninPhone::isValid($u->telephone));
        $ecole = DB::table('ecoles')->where('id', $eleve->ecole_id)->value('nom') ?? 'École';
        $nomEleve = trim(($eleve->user?->prenom ?? '').' '.($eleve->user?->name ?? ''));
        $envois = 0;

        foreach ($parents as $parent) {
            $prefs = self::preferences($parent);
            if (! $prefs[$type]) {
                continue;
            }
            $texte = strtr(self::MODELES[$prefs['langue']][$modele] ?? self::MODELES['fr'][$modele],
                collect(['ecole' => $ecole, 'eleve' => $nomEleve] + $valeurs)->mapWithKeys(fn ($v, $k) => ['{'.$k.'}' => (string) $v])->all());
            $telephone = $parent->telephone;

            // File d'attente : avec un worker, l'appel d'une classe n'attend pas
            // les SMS ; sans (QUEUE_CONNECTION=sync), l'envoi est immédiat.
            // Un avis ne doit jamais faire échouer le geste qui l'envoie (appel,
            // bulletin, encaissement) : une file indisponible est consignée —
            // sans le numéro ni le texte, qui sont des données personnelles.
            try {
                $tache = dispatch(function () use ($telephone, $texte) {
                    $resultat = app(SmsService::class)->send($telephone, $texte);
                    if (! $resultat['success']) {
                        Log::warning('Avis SMS non envoyé', ['erreur' => $resultat['error']]);
                    }
                });
                unset($tache); // la mise en file a lieu ici, dans le try
                $envois++;
            } catch (\Throwable $e) {
                Log::error('Avis SMS non confié à la file', ['modele' => $modele, 'erreur' => $e::class]);
            }
        }

        return $envois;
    }

    /** Préférences du parent, avec les valeurs par défaut (tout activé, français). */
    public static function preferences(User $user): array
    {
        $ligne = DB::table('preferences_notifications')->where('user_id', $user->id)->first();

        return [
            'absences' => (bool) ($ligne->absences ?? true),
            'notes' => (bool) ($ligne->notes ?? true),
            'echeances' => (bool) ($ligne->echeances ?? true),
            'recus' => (bool) ($ligne->recus ?? true),
            'convocations' => (bool) ($ligne->convocations ?? true),
            'langue' => in_array($ligne->langue ?? 'fr', ['fr', 'en'], true) ? ($ligne->langue ?? 'fr') : 'fr',
        ];
    }

    public static function fcfa(float $montant): string
    {
        return number_format($montant, 0, ',', ' ');
    }
}
