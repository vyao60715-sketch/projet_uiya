<?php

namespace App\Services;

use App\Models\Bien;
use App\Models\Campagne;
use App\Models\ControleInventaire;
use App\Models\User;
use Illuminate\Support\Carbon;
use Illuminate\Support\Facades\DB;

class CampagneService
{
    /**
     * Crée une nouvelle campagne et initialise nb_biens_attendus.
     */
    public static function creer(array $data, User $user): Campagne
    {
        $campagne = Campagne::create([
            'nom'             => $data['nom'],
            'description'     => $data['description'] ?? null,
            'date_debut'      => $data['date_debut'] ?? Carbon::today(),
            'date_fin_prevue' => $data['date_fin_prevue'] ?? null,
            'service_id'      => $data['service_id'] ?? null,
            'cree_par'        => $user->id,
            'statut'          => 'en_cours',
            'nb_biens_attendus' => self::compterBiens($data['service_id'] ?? null),
        ]);

        AuditService::enregistrer('creation', 'campagnes', $campagne->id, null, $campagne->toArray());

        return $campagne;
    }

    /**
     * Sync idempotente : enregistre ou met à jour un contrôle de bien.
     * Peut recevoir un tableau de contrôles (mode batch mobile).
     */
    public static function synchroniser(Campagne $campagne, array $controles, User $user): array
    {
        if ($campagne->statut !== 'en_cours') {
            throw new \RuntimeException('La campagne est clôturée.');
        }

        $resultats = [];

        DB::transaction(function () use ($campagne, $controles, $user, &$resultats) {
            foreach ($controles as $c) {
                $bien = Bien::where('uuid_qr', $c['uuid_qr'] ?? null)
                    ->orWhere('id', $c['bien_id'] ?? null)
                    ->first();

                if (! $bien) {
                    $resultats[] = ['uuid_qr' => $c['uuid_qr'] ?? null, 'statut' => 'bien_inconnu'];
                    continue;
                }

                ControleInventaire::updateOrCreate(
                    ['campagne_id' => $campagne->id, 'bien_id' => $bien->id],
                    [
                        'resultat'        => $c['resultat'] ?? 'present',
                        'salle_constatee' => $c['salle_constatee'] ?? null,
                        'remarque'        => $c['remarque'] ?? null,
                        'controle_par'    => $user->id,
                        'controle_le'     => $c['controle_le'] ?? Carbon::now(),
                    ]
                );

                $resultats[] = ['bien_id' => $bien->id, 'statut' => 'ok'];
            }

            // Mettre à jour le compteur
            $campagne->nb_controles = $campagne->controles()->count();
            $campagne->save();
        });

        return $resultats;
    }

    /**
     * Clôture la campagne et génère le rapport d'écarts.
     */
    public static function cloturer(Campagne $campagne, User $user): array
    {
        if ($campagne->statut !== 'en_cours') {
            throw new \RuntimeException('La campagne est déjà clôturée.');
        }

        $campagne->statut       = 'cloturee';
        $campagne->date_cloture = Carbon::today();
        $campagne->nb_controles = $campagne->controles()->count();
        $campagne->save();

        AuditService::enregistrer('cloture', 'campagnes', $campagne->id, null, ['statut' => 'cloturee']);

        return self::rapport($campagne);
    }

    /**
     * Rapport d'écarts : biens attendus vs contrôlés, avec détail par résultat.
     */
    public static function rapport(Campagne $campagne): array
    {
        $biens = self::biensScope($campagne->service_id)->get();
        $controles = $campagne->controles()->with('bien')->get()->keyBy('bien_id');

        $rapport = [
            'campagne_id'    => $campagne->id,
            'nom'            => $campagne->nom,
            'statut'         => $campagne->statut,
            'nb_attendus'    => $biens->count(),
            'nb_controles'   => $controles->count(),
            'nb_absents'     => 0,
            'nb_deplaces'    => 0,
            'nb_deteriores'  => 0,
            'nb_presents'    => 0,
            'ecarts'         => [],
        ];

        foreach ($biens as $bien) {
            $controle = $controles->get($bien->id);

            if (! $controle) {
                $rapport['nb_absents']++;
                $rapport['ecarts'][] = [
                    'bien_id'          => $bien->id,
                    'designation'      => $bien->designation,
                    'numero_inventaire' => $bien->numero_inventaire,
                    'resultat'         => 'non_controle',
                    'salle_constatee'  => null,
                    'remarque'         => null,
                ];
                continue;
            }

            match ($controle->resultat) {
                'absent'    => $rapport['nb_absents']++,
                'deplace'   => $rapport['nb_deplaces']++,
                'deteriore' => $rapport['nb_deteriores']++,
                default     => $rapport['nb_presents']++,
            };

            if ($controle->resultat !== 'present') {
                $rapport['ecarts'][] = [
                    'bien_id'          => $bien->id,
                    'designation'      => $bien->designation,
                    'numero_inventaire' => $bien->numero_inventaire,
                    'resultat'         => $controle->resultat,
                    'salle_constatee'  => $controle->salle_constatee,
                    'remarque'         => $controle->remarque,
                ];
            }
        }

        return $rapport;
    }

    // ─── helpers ─────────────────────────────────────────────────────────────

    private static function compterBiens(?int $serviceId): int
    {
        return self::biensScope($serviceId)->count();
    }

    private static function biensScope(?int $serviceId)
    {
        $query = Bien::whereNotIn('statut', ['Réformé', 'Perdu']);

        if ($serviceId) {
            $query->whereHas('affectationActuelle', fn ($q) => $q->where('service_id', $serviceId));
        }

        return $query;
    }
}
