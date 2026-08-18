<?php

namespace App\Services;

use Illuminate\Support\Facades\Http;
use Illuminate\Support\Facades\Log;

class SmsService
{
    private string $apiKey;
    private string $username;
    private string $shortcode;
    private string $baseUrl;

    public function __construct()
    {
        $this->apiKey = config('services.africastalking.api_key', '');
        $this->username = config('services.africastalking.username', '');
        $this->shortcode = config('services.africastalking.shortcode', '');
        $this->baseUrl = 'https://api.africastalking.com/version1';
    }

    /**
     * Send a single SMS via Africa's Talking HTTP API.
     */
    public function send(string $to, string $message): array
    {
        $to = $this->normalizePhone($to);

        if ($to === null) {
            Log::warning('SMS: numéro de téléphone invalide', ['raw' => $to]);
            return ['success' => false, 'message_id' => null, 'error' => 'Numéro de téléphone invalide (format: +229XXXXXXXX).'];
        }

        if (empty($this->apiKey) || empty($this->username)) {
            Log::error('SMS: credentials Africa\'s Talking manquants');
            return ['success' => false, 'message_id' => null, 'error' => 'Credentials SMS non configurés.'];
        }

        try {
            $response = Http::withHeaders([
                'apiKey' => $this->apiKey,
                'Content-Type' => 'application/x-www-form-urlencoded',
            ])->timeout(15)->post("{$this->baseUrl}/messaging", [
                'username' => $this->username,
                'to' => $to,
                'message' => $message,
                ...(empty($this->shortcode) ? [] : ['from' => $this->shortcode]),
            ]);

            $body = $response->json();

            if ($response->successful() && data_get($body, 'SMSMessageData.Recipients', []) !== []) {
                $recipients = data_get($body, 'SMSMessageData.Recipients', []);
                $firstRecipient = $recipients[0] ?? [];
                $messageId = data_get($firstRecipient, 'messageId', '');
                $status = data_get($firstRecipient, 'status', '');

                if ($status === 'Success') {
                    Log::info('SMS envoyé', ['to' => $to, 'message_id' => $messageId]);
                    return ['success' => true, 'message_id' => $messageId, 'error' => null];
                }

                $error = data_get($firstRecipient, 'status', 'Échec de l\'envoi');
                Log::warning('SMS échoué', ['to' => $to, 'status' => $error]);
                return ['success' => false, 'message_id' => null, 'error' => $error];
            }

            $errorMessage = data_get($body, 'SMSMessageData.Message', 'Réponse inattendue de l\'API');
            Log::error('SMS: réponse API invalide', ['to' => $to, 'response' => $body]);
            return ['success' => false, 'message_id' => null, 'error' => $errorMessage];
        } catch (\Illuminate\Http\Client\ConnectionException $e) {
            Log::error('SMS: timeout', ['to' => $to]);
            return ['success' => false, 'message_id' => null, 'error' => 'Délai d\'attente dépassé. Réessayez plus tard.'];
        } catch (\Exception $e) {
            Log::error('SMS: exception', ['to' => $to, 'exception' => $e->getMessage()]);
            return ['success' => false, 'message_id' => null, 'error' => 'Erreur interne lors de l\'envoi du SMS.'];
        }
    }

    /**
     * Send bulk SMS to multiple recipients.
     */
    public function sendBulk(array $recipients, string $message): array
    {
        $sent = 0;
        $failed = 0;
        $details = [];

        foreach ($recipients as $phone) {
            $result = $this->send($phone, $message);
            $details[$phone] = $result;

            if ($result['success']) {
                $sent++;
            } else {
                $failed++;
            }
        }

        Log::info('SMS bulk terminé', ['sent' => $sent, 'failed' => $failed, 'total' => count($recipients)]);

        return ['sent' => $sent, 'failed' => $failed, 'details' => $details];
    }

    /**
     * Pre-built template: payment reminder.
     */
    public function paymentReminder(string $phone, string $parentName, string $studentName, string $amount): array
    {
        $message = "Cher/Chère {$parentName}, rappel de paiement de {$amount} FCFA pour {$studentName}. Merci.";
        return $this->send($phone, $message);
    }

    /**
     * Pre-built template: absence alert.
     */
    public function absenceAlert(string $phone, string $parentName, string $studentName, string $date): array
    {
        $message = "Absence de {$studentName} le {$date}. Contactez l'établissement.";
        return $this->send($phone, $message);
    }

    /**
     * Pre-built template: grades posted.
     */
    public function gradePosted(string $phone, string $parentName, string $studentName, string $period): array
    {
        $message = "Les notes de {$studentName} pour {$period} sont disponibles.";
        return $this->send($phone, $message);
    }

    /**
     * Normalize phone to +229XXXXXXXX format (Bénin).
     */
    private function normalizePhone(string $phone): ?string
    {
        $phone = trim($phone);

        // Already correct: +229XXXXXXXX
        if (preg_match('/^\+229\d{8}$/', $phone)) {
            return $phone;
        }

        // Without +: 229XXXXXXXX
        if (preg_match('/^229\d{8}$/', $phone)) {
            return '+' . $phone;
        }

        // Local 8-digit number
        if (preg_match('/^\d{8}$/', $phone)) {
            return '+229' . $phone;
        }

        return null;
    }
}
