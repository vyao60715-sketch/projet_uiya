<?php

namespace App\Services;

use App\Models\Bien;
use Illuminate\Validation\ValidationException;

/**
 * Seul point d'entrée autorisé pour changer le statut d'un bien (D-04).
 * Transitions : Disponible → Affecté / En prêt → En maintenance → Perdu / Réformé.
 */
class BienStatutService
{
    private const TRANSITIONS = [
        'Disponible' => ['Affecté', 'En prêt', 'En maintenance', 'Perdu', 'Réformé'],
        'Affecté' => ['Disponible', 'En prêt', 'En maintenance', 'Perdu', 'Réformé'],
        'En prêt' => ['Disponible', 'Affecté', 'En maintenance', 'Perdu', 'Réformé'],
        'En maintenance' => ['Disponible', 'Affecté', 'Perdu', 'Réformé'],
        'Perdu' => ['Réformé', 'Disponible'],
        'Réformé' => [],
    ];

    public static function peutTransitioner(string $de, string $vers): bool
    {
        return in_array($vers, self::TRANSITIONS[$de] ?? [], true);
    }

    public static function changer(Bien $bien, string $nouveauStatut, ?string $action = null): Bien
    {
        if (! self::peutTransitioner($bien->statut, $nouveauStatut)) {
            throw ValidationException::withMessages([
                'statut' => ["Transition de statut non autorisée : {$bien->statut} → {$nouveauStatut}."],
            ]);
        }

        $avant = $bien->toArray();
        $bien->statut = $nouveauStatut;
        $bien->save();

        AuditService::enregistrer($action ?? 'changement_statut', 'biens', $bien->id, $avant, $bien->toArray());

        return $bien;
    }
}
