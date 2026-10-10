<?php

namespace Tests\Feature\Api;

use App\Models\Bien;
use App\Models\Categorie;
use App\Models\Maintenance;
use App\Models\User;
use App\Services\BienStatutService;
use Database\Seeders\RolesPermissionsSeeder;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Laravel\Sanctum\Sanctum;
use Tests\TestCase;

class MaintenanceTest extends TestCase
{
    use RefreshDatabase;

    private function userWithRole(string $role): User
    {
        $this->seed(RolesPermissionsSeeder::class);
        $user = User::factory()->create(['actif' => true]);
        $user->assignRole($role);

        return $user;
    }

    private function bien(string $statut = 'Disponible'): Bien
    {
        $categorie = Categorie::create([
            'nom'                         => 'Informatique',
            'code'                        => 'INF',
            'duree_garantie_mois'         => 0,
            'periodicite_maintenance_mois' => 0,
        ]);

        $bien = Bien::create([
            'designation'     => 'Serveur',
            'categorie_id'    => $categorie->id,
            'etat'            => 'Bon',
            'date_acquisition' => '2026-01-01',
        ]);

        if ($statut !== 'Disponible') {
            BienStatutService::changer($bien, $statut);
        }

        return $bien->fresh();
    }

    // ─── Planification ────────────────────────────────────────────────────────

    public function test_gestionnaire_peut_planifier_maintenance_preventive(): void
    {
        $gestionnaire = $this->userWithRole('gestionnaire');
        $bien         = $this->bien();
        Sanctum::actingAs($gestionnaire, ['*']);

        $response = $this->postJson('/api/maintenances', [
            'bien_id'    => $bien->id,
            'type'       => 'preventive',
            'date_prevue' => now()->addDays(7)->toDateString(),
        ]);

        $response->assertStatus(201);
        $this->assertDatabaseHas('maintenances', [
            'bien_id' => $bien->id,
            'type'    => 'preventive',
            'statut'  => 'planifiee',
        ]);

        // Bien reste disponible (maintenance préventive planifiée, pas encore commencée)
        $this->assertDatabaseHas('biens', ['id' => $bien->id, 'statut' => 'Disponible']);
    }

    public function test_maintenance_corrective_demarre_immediatement(): void
    {
        $gestionnaire = $this->userWithRole('gestionnaire');
        $bien         = $this->bien();
        Sanctum::actingAs($gestionnaire, ['*']);

        $response = $this->postJson('/api/maintenances', [
            'bien_id'    => $bien->id,
            'type'       => 'corrective',
            'date_prevue' => now()->toDateString(),
        ]);

        $response->assertStatus(201);

        // Corrective → démarre automatiquement
        $this->assertDatabaseHas('maintenances', [
            'bien_id' => $bien->id,
            'type'    => 'corrective',
            'statut'  => 'en_cours',
        ]);

        // Bien passe En maintenance
        $this->assertDatabaseHas('biens', ['id' => $bien->id, 'statut' => 'En maintenance']);
    }

    // ─── Clôture : bien revient Disponible ───────────────────────────────────

    public function test_cloture_maintenance_remet_bien_disponible(): void
    {
        $gestionnaire = $this->userWithRole('gestionnaire');
        $bien         = $this->bien();
        Sanctum::actingAs($gestionnaire, ['*']);

        // Planifier une corrective (passe bien En maintenance)
        $response = $this->postJson('/api/maintenances', [
            'bien_id'    => $bien->id,
            'type'       => 'corrective',
            'date_prevue' => now()->toDateString(),
        ]);
        $maintenanceId = $response->json('data.id');

        // Clôturer avec un résultat
        $this->putJson("/api/maintenances/{$maintenanceId}", [
            'resultat' => 'Remplacement de la carte mère. Bien opérationnel.',
        ])->assertStatus(200);

        $this->assertDatabaseHas('maintenances', [
            'id'     => $maintenanceId,
            'statut' => 'terminee',
        ]);

        // Bien revient Disponible
        $this->assertDatabaseHas('biens', ['id' => $bien->id, 'statut' => 'Disponible']);
    }

    public function test_mise_a_jour_sans_resultat_ne_cloture_pas(): void
    {
        $gestionnaire = $this->userWithRole('gestionnaire');
        $bien         = $this->bien();
        Sanctum::actingAs($gestionnaire, ['*']);

        $response = $this->postJson('/api/maintenances', [
            'bien_id'    => $bien->id,
            'type'       => 'corrective',
            'date_prevue' => now()->toDateString(),
        ]);
        $maintenanceId = $response->json('data.id');

        // Mise à jour sans résultat : maintenance reste en_cours
        $this->putJson("/api/maintenances/{$maintenanceId}", [
            'pieces' => 'Câbles de remplacement commandés',
        ])->assertStatus(200);

        $this->assertDatabaseHas('maintenances', [
            'id'     => $maintenanceId,
            'statut' => 'en_cours',
        ]);

        $this->assertDatabaseHas('biens', ['id' => $bien->id, 'statut' => 'En maintenance']);
    }

    // ─── Accès : agent ne peut pas gérer les maintenances ────────────────────

    public function test_agent_ne_peut_pas_planifier_maintenance(): void
    {
        $agent = $this->userWithRole('agent');
        $bien  = $this->bien();
        Sanctum::actingAs($agent, ['*']);

        $this->postJson('/api/maintenances', [
            'bien_id'    => $bien->id,
            'type'       => 'preventive',
            'date_prevue' => now()->addDays(7)->toDateString(),
        ])->assertStatus(403);
    }

    // ─── Sous garantie auto-calculée ─────────────────────────────────────────

    public function test_sous_garantie_auto_calculee(): void
    {
        $gestionnaire = $this->userWithRole('gestionnaire');
        Sanctum::actingAs($gestionnaire, ['*']);

        $categorie = Categorie::create([
            'nom' => 'Électronique', 'code' => 'ELE',
            'duree_garantie_mois' => 24, 'periodicite_maintenance_mois' => 0,
        ]);

        // Bien acheté il y a 6 mois → encore sous garantie
        $bien = Bien::create([
            'designation'        => 'Vidéoprojecteur',
            'categorie_id'       => $categorie->id,
            'etat'               => 'Bon',
            'date_acquisition'   => now()->subMonths(6)->toDateString(),
            'duree_garantie_mois' => 24,
        ]);
        $bien = $bien->fresh();

        $response = $this->postJson('/api/maintenances', [
            'bien_id'    => $bien->id,
            'type'       => 'corrective',
            'date_prevue' => now()->toDateString(),
        ]);

        $response->assertStatus(201);
        $this->assertTrue((bool) $response->json('data.sous_garantie'));
    }
}
