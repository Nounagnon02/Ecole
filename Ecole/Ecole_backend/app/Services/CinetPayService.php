<?php
namespace App\Services;

use CinetPay\CinetPay;
use Illuminate\Support\Str;

class CinetPayService
{
    private string $siteId;
    private string $apiKey;
    private string $mode;
    private string $notifyUrl;
    private string $returnUrl;

    public function __construct()
    {
        $this->siteId    = config('cinetpay.site_id');
        $this->apiKey    = config('cinetpay.api_key');
        $this->mode      = config('cinetpay.mode');
        $this->notifyUrl = config('cinetpay.notify_url');
        $this->returnUrl = config('cinetpay.return_url');
    }

    /**
     * Build and return a CinetPay client instance
     */
    private function client(): CinetPay
    {
        return new CinetPay($this->siteId, $this->apiKey, $this->mode);
    }

    /**
     * Initiate a payment and return payment link
     */
    public function initiate(array $payload): array
    {
        $cp = $this->client();
        $transId = $payload['transaction_id'] ?? Str::uuid()->toString();

        $cp->setTransId($transId)
           ->setAmount((float)$payload['amount'])
           ->setCurrency(config('cinetpay.currency'))
           ->setDescription($payload['description'])
           ->setNotifyUrl($this->notifyUrl)
           ->setReturnUrl($this->returnUrl)
           ->setCustomerName($payload['customer_name'])
           ->setCustomerEmail($payload['customer_email'])
           ->setCustomerPhoneNumber($payload['customer_phone'])
           ->setChannels($payload['channels'] ?? 'ALL');

        $result = $cp->generatePaymentLink();

        if (isset($result['code']) && $result['code'] !== '201') {
            throw new \Exception($result['message'] ?? 'Erreur lors de la génération du lien de paiement');
        }

        return [
            'success'        => true,
            'payment_url'    => $result['data']['payment_url'] ?? null,
            'transaction_id' => $transId,
        ];
    }

    /**
     * Verify IPN signature from CinetPay
     */
    public function verifySignature(array $data): bool
    {
        return $this->client()->isValidSignature($data);
    }

    /**
     * Get status of a transaction
     */
    public function status(string $transId): array
    {
        $cp = $this->client();
        $cp->setTransId($transId)->getPayStatus();

        return [
            'status'   => ($cp->_cpm_result === '00') ? 'ACCEPTED' : 'FAILED',
            'amount'   => $cp->_cpm_amount,
            'currency' => $cp->_cpm_currency,
        ];
    }
}