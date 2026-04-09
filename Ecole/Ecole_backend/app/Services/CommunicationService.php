<?php

namespace App\Services;

use Illuminate\Support\Facades\Log;
use Illuminate\Support\Facades\Http;

class CommunicationService
{
    /**
     * Envoie un SMS à un numéro spécifique.
     * 
     * @param string $to Numéro au format international (ex: +229XXXXXXXX)
     * @param string $message Contenu du message
     * @return bool
     */
    public function sendSms(string $to, string $message)
    {
        Log::info("Envoi SMS à {$to}: {$message}");

        // Simulation d'intégration avec un fournisseur béninois (ex: iSend)
        $apiKey = config('services.sms.key');
        if (!$apiKey) {
            return true; // Mode simulation
        }

        try {
            // Exemple d'appel API
            // $response = Http::post('https://api.isend.bj/v1/sms/send', [
            //     'to' => $to,
            //     'message' => $message,
            //     'key' => $apiKey
            // ]);
            // return $response->successful();
            return true;
        } catch (\Exception $e) {
            Log::error("Erreur SMS: " . $e->getMessage());
            return false;
        }
    }

    /**
     * Envoie un message WhatsApp.
     */
    public function sendWhatsApp(string $to, string $message)
    {
        Log::info("Envoi WhatsApp à {$to}: {$message}");

        // Placeholder pour Twilio ou WhatsApp Business API
        return true;
    }

    /**
     * Envoi automatique lors d'un événement (ex: paiement)
     */
    public function notifyPayment(string $to, $amount, $studentName)
    {
        $message = "ECOLE: Paiement de {$amount} FCFA reçu pour l'élève {$studentName}. Merci de votre confiance.";
        return $this->sendSms($to, $message);
    }
}
