<?php

namespace App\Services;

use App\Models\Affectation;
use App\Models\Bien;
use App\Models\Mouvement;
use App\Models\Salle;
use App\Models\Service;
use Illuminate\Support\Facades\DB;
use Illuminate\Validation\ValidationException;

/**
 * Service central des affectations et mouvements (EF-20 à EF-23).
 * Respecte RG-03 (une seule affectation active à la fois), RG-04 (un prêt a
 * toujours une date de retour) et RG-05 (bien en maintenance/perdu/réformé
 * non affectable), en s'appuyant sur BienStatutService pour les statuts.
 */
class AffectationService
{
    public static function affecter(Bien $bien, array $data): Affectation
    {
        if ($bien->statut !== 'Disponible') {
            throw ValidationException::withMessages([
                'statut' => ["Seul un bien Disponible peut être affecté (statut actuel : {$bien->statut})."],
            ]);
        }

        return DB::transaction(function () use ($bien, $data) {
            $affectation = Affectation::create([
                'bien_id' => $bien->id,
                'service_id' => $data['service_id'],
                'salle_id' => $data['salle_id'] ?? null,
                'responsable_id' => $data['responsable_id'] ?? null,
                'type' => 'permanente',
                'date_debut' => now(),
            ]);

            BienStatutService::changer($bien, 'Affecté', 'affectation');

            self::enregistrerMouvement($bien, 'affectation', 'Disponible', self::libelle($affectation), $data['motif'] ?? null);

            return $affectation;
        });
    }

    public static function transferer(Bien $bien, array $data): Affectation
    {
        if ($bien->statut !== 'Affecté') {
            throw ValidationException::withMessages([
                'statut' => ["Seul un bien Affecté peut être transféré (statut actuel : {$bien->statut})."],
            ]);
        }

        return DB::transaction(function () use ($bien, $data) {
            $ancienne = $bien->affectationActuelle;
            $origine = $ancienne ? self::libelle($ancienne) : 'Disponible';

            if ($ancienne) {
                $ancienne->update(['date_retour_effective' => now()]);
            }

            $affectation = Affectation::create([
                'bien_id' => $bien->id,
                'service_id' => $data['service_id'],
                'salle_id' => $data['salle_id'] ?? null,
                'responsable_id' => $data['responsable_id'] ?? null,
                'type' => 'permanente',
                'date_debut' => now(),
            ]);

            self::enregistrerMouvement($bien, 'transfert', $origine, self::libelle($affectation), $data['motif'] ?? null);

            return $affectation;
        });
    }

    public static function preter(Bien $bien, array $data): Affectation
    {
        if ($bien->statut !== 'Disponible') {
            throw ValidationException::withMessages([
                'statut' => ["Seul un bien Disponible peut être prêté (statut actuel : {$bien->statut})."],
            ]);
        }

        return DB::transaction(function () use ($bien, $data) {
            $affectation = Affectation::create([
                'bien_id' => $bien->id,
                'service_id' => $data['service_id'],
                'salle_id' => $data['salle_id'] ?? null,
                'responsable_id' => $data['responsable_id'] ?? null,
                'type' => 'pret',
                'date_debut' => now(),
                'date_retour_prevue' => $data['date_retour_prevue'],
            ]);

            BienStatutService::changer($bien, 'En prêt', 'pret');

            self::enregistrerMouvement($bien, 'pret', 'Disponible', self::libelle($affectation), $data['motif'] ?? null);

            return $affectation;
        });
    }

    public static function retour(Bien $bien, ?string $motif = null): Bien
    {
        if ($bien->statut !== 'En prêt') {
            throw ValidationException::withMessages([
                'statut' => ["Seul un bien En prêt peut être retourné (statut actuel : {$bien->statut})."],
            ]);
        }

        return DB::transaction(function () use ($bien, $motif) {
            $affectation = $bien->affectationActuelle;
            $origine = $affectation ? self::libelle($affectation) : 'En prêt';

            if ($affectation) {
                $affectation->update(['date_retour_effective' => now()]);
            }

            BienStatutService::changer($bien, 'Disponible', 'retour');

            self::enregistrerMouvement($bien, 'retour', $origine, 'Disponible', $motif);

            return $bien->fresh();
        });
    }

    private static function libelle(Affectation $affectation): string
    {
        $service = $affectation->service ?? Service::find($affectation->service_id);
        $salle = $affectation->salle_id ? ($affectation->salle ?? Salle::find($affectation->salle_id)) : null;

        return $service?->nom.($salle ? ' · '.$salle->nom : '');
    }

    private static function enregistrerMouvement(Bien $bien, string $type, ?string $origine, ?string $destination, ?string $motif): Mouvement
    {
        return Mouvement::create([
            'bien_id' => $bien->id,
            'type' => $type,
            'origine' => $origine,
            'destination' => $destination,
            'motif' => $motif,
            'auteur_id' => auth()->id(),
            'date' => now(),
        ]);
    }
}
