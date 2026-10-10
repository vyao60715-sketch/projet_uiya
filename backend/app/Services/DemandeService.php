<?php

namespace App\Services;

use App\Models\Bien;
use App\Models\Demande;
use App\Models\User;
use App\Notifications\DemandeTraitee;
use Illuminate\Validation\ValidationException;

/**
 * Circuit de validation des demandes du responsable (EF-25 à EF-28).
 * RG-08 : un rejet est toujours motivé. D-07 : une perte n'est actée
 * qu'après vérification et validation explicite du gestionnaire, jamais
 * automatiquement à la simple soumission de la demande.
 */
class DemandeService
{
    public static function creer(Bien $bien, array $data, User $demandeur): Demande
    {
        $demande = Demande::create([
            'bien_id' => $bien->id,
            'type' => $data['type'],
            'motif' => $data['motif'],
            'photo' => $data['photo'] ?? null,
            'service_destination_id' => $data['service_destination_id'] ?? null,
            'salle_destination_id' => $data['salle_destination_id'] ?? null,
            'demandeur_id' => $demandeur->id,
            'statut' => 'soumise',
        ]);

        AuditService::enregistrer('creation', 'demandes', $demande->id, null, $demande->toArray());

        return $demande;
    }

    public static function valider(Demande $demande, User $gestionnaire): Demande
    {
        self::garantirSoumise($demande);

        $bien = $demande->bien;

        match ($demande->type) {
            'panne' => BienStatutService::changer($bien, 'En maintenance', 'demande_panne_validee'),
            'perte' => BienStatutService::changer($bien, 'Perdu', 'demande_perte_validee'),
            'transfert' => self::appliquerTransfert($demande, $bien),
        };

        $demande->update([
            'statut' => 'validee',
            'traite_par' => $gestionnaire->id,
            'traite_le' => now(),
        ]);

        self::notifierDemandeur($demande, 'validee');
        AuditService::enregistrer('validation', 'demandes', $demande->id, null, $demande->fresh()->toArray());

        return $demande->fresh();
    }

    public static function rejeter(Demande $demande, User $gestionnaire, string $motif): Demande
    {
        self::garantirSoumise($demande);

        $demande->update([
            'statut' => 'rejetee',
            'decision_motif' => $motif,
            'traite_par' => $gestionnaire->id,
            'traite_le' => now(),
        ]);

        self::notifierDemandeur($demande, 'rejetee');
        AuditService::enregistrer('rejet', 'demandes', $demande->id, null, $demande->fresh()->toArray());

        return $demande->fresh();
    }

    private static function garantirSoumise(Demande $demande): void
    {
        if ($demande->statut !== 'soumise') {
            throw ValidationException::withMessages([
                'statut' => ['Cette demande a déjà été traitée.'],
            ]);
        }
    }

    private static function appliquerTransfert(Demande $demande, Bien $bien): void
    {
        $data = [
            'service_id' => $demande->service_destination_id,
            'salle_id' => $demande->salle_destination_id,
            'motif' => "Suite à la demande #{$demande->id}",
        ];

        if ($bien->statut === 'Disponible') {
            AffectationService::affecter($bien, $data);
        } elseif ($bien->statut === 'Affecté') {
            AffectationService::transferer($bien, $data);
        } else {
            throw ValidationException::withMessages([
                'statut' => ["Le bien n'est pas dans un état permettant un transfert (statut actuel : {$bien->statut})."],
            ]);
        }
    }

    private static function notifierDemandeur(Demande $demande, string $resultat): void
    {
        $demande->demandeur?->notify(new DemandeTraitee($demande, $resultat));
    }
}
