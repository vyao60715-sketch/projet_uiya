<?php

namespace App\Services;

use App\Models\Bien;
use App\Models\Maintenance;

/**
 * EF-29 (planification) et EF-30 (interventions). Une corrective démarrée
 * met le bien En maintenance (RG-05) ; la clôture le repasse Disponible.
 */
class MaintenanceService
{
    public static function planifier(Bien $bien, array $data): Maintenance
    {
        $demarreMaintenant = $data['type'] === 'corrective';

        $maintenance = Maintenance::create([
            'bien_id' => $bien->id,
            'type' => $data['type'],
            'statut' => $demarreMaintenant ? 'en_cours' : 'planifiee',
            'date_prevue' => $data['date_prevue'],
            'prestataire_id' => $data['prestataire_id'] ?? null,
            'sous_garantie' => $bien->fin_garantie && now()->lt($bien->fin_garantie),
            'demande_id' => $data['demande_id'] ?? null,
            'cree_par' => auth()->id(),
        ]);

        if ($demarreMaintenant && $bien->statut !== 'En maintenance') {
            BienStatutService::changer($bien, 'En maintenance', 'maintenance_demarree');
        }

        AuditService::enregistrer('creation', 'maintenances', $maintenance->id, null, $maintenance->toArray());

        return $maintenance;
    }

    public static function mettreAJour(Maintenance $maintenance, array $data): Maintenance
    {
        $avant = $maintenance->toArray();
        $cloture = ! empty($data['resultat']) && $maintenance->statut !== 'terminee';

        $maintenance->fill([
            'prestataire_id' => $data['prestataire_id'] ?? $maintenance->prestataire_id,
            'cout' => $data['cout'] ?? $maintenance->cout,
            'pieces' => $data['pieces'] ?? $maintenance->pieces,
            'resultat' => $data['resultat'] ?? $maintenance->resultat,
        ]);

        if ($cloture) {
            $maintenance->statut = 'terminee';
            $maintenance->date_realisee = now();
        }

        $maintenance->save();

        $bien = $maintenance->bien;
        if ($cloture && $bien->statut === 'En maintenance') {
            BienStatutService::changer($bien, 'Disponible', 'maintenance_terminee');
        }

        AuditService::enregistrer('modification', 'maintenances', $maintenance->id, $avant, $maintenance->fresh()->toArray());

        return $maintenance->fresh();
    }
}
