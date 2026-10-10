<?php

namespace App\Services;

use App\Models\Bien;
use SimpleSoftwareIO\QrCode\Facades\QrCode;

class QrService
{
    public static function url(Bien $bien): string
    {
        $base = rtrim(config('app.frontend_url', env('FRONTEND_URL', 'http://localhost:5173')), '/');

        return "{$base}/biens/scan/{$bien->uuid_qr}";
    }

    public static function svg(Bien $bien, int $taille = 220): string
    {
        return QrCode::format('svg')->size($taille)->margin(1)->generate(self::url($bien));
    }

    public static function png(Bien $bien, int $taille = 220): string
    {
        return QrCode::format('png')->size($taille)->margin(1)->generate(self::url($bien));
    }
}
