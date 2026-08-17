<?php

namespace App\Services;

use Endroid\QrCode\Builder\Builder;
use Endroid\QrCode\Writer\SvgWriter;

class QrCodeService
{
    public function generateSvg(string $data, int $size = 200): string
    {
        $result = Builder::create()
            ->data($data)
            ->writer(new SvgWriter())
            ->size($size)
            ->margin(10)
            ->build();

        return $result->getString();
    }

    public function bulletinVerificationUrl(int $bulletinId, string $ecoleSlug): string
    {
        $appUrl = config('app.url', 'http://localhost');

        return "{$appUrl}/bulletins/verify/{$ecoleSlug}/{$bulletinId}";
    }

    public function forBulletin(int $bulletinId, string $ecoleSlug, int $size = 120): string
    {
        return $this->generateSvg(
            $this->bulletinVerificationUrl($bulletinId, $ecoleSlug),
            $size
        );
    }
}
