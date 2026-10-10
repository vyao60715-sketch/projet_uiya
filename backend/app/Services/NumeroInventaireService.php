<?php

namespace App\Services;

use App\Models\Bien;
use App\Models\Categorie;
use Illuminate\Support\Facades\DB;

class NumeroInventaireService
{
    public static function generer(Categorie $categorie): string
    {
        $annee = now()->year;
        $prefixe = sprintf('UIYA-%s-%d-', $categorie->code, $annee);

        return DB::transaction(function () use ($prefixe) {
            $dernier = Bien::where('numero_inventaire', 'like', $prefixe.'%')
                ->lockForUpdate()
                ->orderByDesc('numero_inventaire')
                ->first();

            $sequence = $dernier
                ? ((int) substr($dernier->numero_inventaire, strlen($prefixe))) + 1
                : 1;

            return $prefixe.str_pad((string) $sequence, 4, '0', STR_PAD_LEFT);
        });
    }
}
