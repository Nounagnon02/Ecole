<?php

use App\Services\Billing\FedaPayProvider;
use App\Support\FedaPayWebhook;
use Illuminate\Support\Facades\Http;

/*
 * Contrat réel de FedaPay, relevé sur le bac à sable le 2026-11-11.
 *
 * Les tests simulaient jusque-là une passerelle imaginaire : réponse sous la
 * clé `transaction`, lien sous `url`, authentification Basic, montants en
 * centimes. Le vrai service répond sous `v1/transaction`, donne le lien dans
 * `payment_url`, n'accepte que `Authorization: Bearer`, et compte le franc CFA
 * à l'unité. Aucun paiement réel ne pouvait donc aboutir, et le premier qui
 * l'aurait fait aurait débité cent fois le montant.
 */

function reponseFedaPay(array $champs = []): array
{
    return ['v1/transaction' => $champs + [
        'klass' => 'v1/transaction', 'id' => 542132, 'reference' => 'trx_CEk_1794425328047',
        'amount' => 25000, 'status' => 'pending', 'mode' => null,
        'payment_token' => 'jeton', 'payment_url' => 'https://sandbox-process.fedapay.com/jeton',
    ]];
}

beforeEach(function () {
    config(['billing.fedapay.secret_key' => 'sk_sandbox_test', 'billing.fedapay.sandbox' => true]);
    cache()->flush();
});

it('ouvre une transaction : jeton Bearer, francs à l’unité, lien lu dans payment_url', function () {
    Http::fake(['sandbox-api.fedapay.com/v1/transactions' => Http::response(reponseFedaPay())]);

    $resultat = (new FedaPayProvider)->initializePayment([
        'amount' => 25000, 'description' => 'Scolarité', 'reference' => 'PAY_7_abc',
        'callback_url' => 'https://ecole.test/api/payments/callback', 'metadata' => ['payment_id' => 7],
    ]);

    expect($resultat)->toMatchArray([
        'success' => true, 'transaction_id' => 542132,
        'payment_url' => 'https://sandbox-process.fedapay.com/jeton',
    ]);

    Http::assertSent(fn ($requete) => $requete->hasHeader('Authorization', 'Bearer sk_sandbox_test')
        && $requete['amount'] === 25000
        && $requete['currency'] === ['iso' => 'XOF']
        && $requete['merchant_reference'] === 'PAY_7_abc'
        && $requete['custom_metadata'] === ['payment_id' => 7]);
});

it('relit une transaction approuvée, montant à l’unité et opérateur', function () {
    Http::fake(['sandbox-api.fedapay.com/v1/transactions/542132' => Http::response(
        reponseFedaPay(['status' => 'approved', 'mode' => 'mtn_open'])
    )]);

    expect((new FedaPayProvider)->verifyPayment('542132'))->toMatchArray([
        'success' => true, 'status' => 'completed', 'amount' => 25000.0, 'payment_method' => 'mtn_open',
    ]);
});

it('range chaque statut FedaPay dans la bonne issue', function (string $statut, string $attendu) {
    Http::fake(['*' => Http::response(reponseFedaPay(['status' => $statut]))]);

    expect((new FedaPayProvider)->verifyPayment('542132')['status'])->toBe($attendu);
})->with([
    ['approved', 'completed'], ['transferred', 'completed'],
    ['pending', 'pending'],
    ['declined', 'failed'], ['canceled', 'failed'], ['expired', 'failed'],
    ['refunded', 'failed'],
]);

it('signale une clé refusée sans la confondre avec une panne', function () {
    Http::fake(['*' => Http::response(['message' => "Erreur d'authentification."], 401)]);

    $resultat = (new FedaPayProvider)->initializePayment(['amount' => 1000, 'reference' => 'R']);

    expect($resultat['success'])->toBeFalse()->and($resultat['error'])->toBe("Erreur d'authentification.");
});

/*
 * Webhook. FedaPay signe « horodatage.corps » et envoie
 * `X-FEDAPAY-SIGNATURE: t=<horodatage>,s=<hmac sha256>`. L'événement porte la
 * transaction directement dans `entity` (relevé sur /v1/events), pas dans
 * `entity.transaction`.
 */

it('accepte une signature FedaPay valide et récente', function () {
    $corps = '{"name":"transaction.approved"}';
    $t = time();
    $entete = "t={$t},s=".hash_hmac('sha256', "{$t}.{$corps}", 'wh_secret');

    expect(FedaPayWebhook::signatureValide($corps, $entete, 'wh_secret'))->toBeTrue();
});

it('refuse une signature fausse, rejouée, mal formée ou sans secret', function (callable $cas) {
    [$corps, $entete, $secret] = $cas();

    expect(FedaPayWebhook::signatureValide($corps, $entete, $secret))->toBeFalse();
})->with([
    'autre secret' => [fn () => ['{}', 't='.time().',s='.hash_hmac('sha256', time().'.{}', 'autre'), 'wh_secret']],
    'corps modifié' => [fn () => ['{"a":2}', 't='.time().',s='.hash_hmac('sha256', time().'.{"a":1}', 'wh_secret'), 'wh_secret']],
    'vieille de 10 minutes' => [fn () => ['{}', 't='.(time() - 600).',s='.hash_hmac('sha256', (time() - 600).'.{}', 'wh_secret'), 'wh_secret']],
    'sans horodatage' => [fn () => ['{}', hash_hmac('sha256', '{}', 'wh_secret'), 'wh_secret']],
    'en-tête absent' => [fn () => ['{}', null, 'wh_secret']],
    'secret vide' => [fn () => ['{}', 't='.time().',s='.hash_hmac('sha256', time().'.{}', ''), '']],
]);

it('lit la transaction d’un événement réel comme de l’ancienne forme', function () {
    $reel = ['name' => 'transaction.approved', 'object' => 'transaction', 'entity' => ['id' => 542132, 'status' => 'approved']];
    $ancien = ['entity' => ['transaction' => ['id' => 'FEDA-1', 'status' => 'declined']]];

    expect(FedaPayWebhook::transaction($reel))->toBe(['id' => '542132', 'status' => 'approved'])
        ->and(FedaPayWebhook::transaction($ancien))->toBe(['id' => 'FEDA-1', 'status' => 'declined'])
        ->and(FedaPayWebhook::transaction(['name' => 'customer.created', 'object' => 'customer', 'entity' => ['id' => 3]]))->toBeNull()
        ->and(FedaPayWebhook::transaction([]))->toBeNull();
});
