<?php

namespace App\Services;

class CurrencyService
{
    private array $currencies = [
        'FCFA' => ['symbol' => 'FCFA', 'decimals' => 0, 'name' => 'Franc CFA'],
        'EUR'  => ['symbol' => '€', 'decimals' => 2, 'name' => 'Euro'],
        'USD'  => ['symbol' => '$', 'decimals' => 2, 'name' => 'US Dollar'],
        'XOF'  => ['symbol' => 'CFA', 'decimals' => 0, 'name' => 'Franc CFA BCEAO'],
    ];

    private array $ratesToEUR = [
        'FCFA' => 655.957,
        'EUR'  => 1.0,
        'USD'  => 0.92,
        'XOF'  => 655.957,
    ];

    public function convert(float $amount, string $from, string $to): float
    {
        $from = strtoupper($from);
        $to = strtoupper($to);

        if (!isset($this->ratesToEUR[$from]) || !isset($this->ratesToEUR[$to])) {
            throw new \InvalidArgumentException("Unsupported currency: {$from} or {$to}");
        }

        if ($from === $to) {
            return $amount;
        }

        $amountInEUR = $amount / $this->ratesToEUR[$from];
        $converted = $amountInEUR * $this->ratesToEUR[$to];

        $decimals = $this->currencies[$to]['decimals'];

        return round($converted, $decimals);
    }

    public function format(float $amount, string $currency): string
    {
        $currency = strtoupper($currency);

        if (!isset($this->currencies[$currency])) {
            throw new \InvalidArgumentException("Unsupported currency: {$currency}");
        }

        $info = $this->currencies[$currency];
        $symbol = $info['symbol'];
        $decimals = $info['decimals'];

        $formatted = number_format($amount, $decimals, ',', ' ');

        return "{$formatted} {$symbol}";
    }

    public function getCurrencies(): array
    {
        return $this->currencies;
    }

    public function getSymbol(string $currency): string
    {
        $currency = strtoupper($currency);

        if (!isset($this->currencies[$currency])) {
            throw new \InvalidArgumentException("Unsupported currency: {$currency}");
        }

        return $this->currencies[$currency]['symbol'];
    }

    public function getDefaultCurrency(): string
    {
        return config('app.currency', 'FCFA');
    }
}
