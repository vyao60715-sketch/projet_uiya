<?php

namespace Tests\Feature\Api;

use App\Models\Affectation;
use App\Models\Bien;
use App\Models\Categorie;
use App\Models\Maintenance;
use App\Models\Service;
use App\Models\User;
use App\Services\AuditService;
use Database\Seeders\RolesPermissionsSeeder;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Laravel\Sanctum\Sanctum;
use Tests\TestCase;

class RapportTest extends TestCase
{
    use RefreshDatabase;

    protected function setUp(): void
    {
        parent::setUp();
        $this->seed(RolesPermissionsSeeder::class);
    }

    private function userWithRole(string $role): User
    {
        $user = User::factory()->create(['actif' => true]);
        $user->assignRole($role);
        return $user;
    }

    private ?int $categorieId = null;

    private function bien(?int $serviceId = null): Bien
    {
        if (! $this->categorieId) {
            $cat = Categorie::create([
                'nom' => 'Info', 'code' => 'INF',
                'duree_garantie_mois' => 24,
                'periodicite_maintenance_mois' => 12,
            ]);
            $this->categorieId = $cat->id;
        }
        return Bien::create([
            'designation' => 'PC Test', 'categorie_id' => $this->categorieId,
            'etat' => 'Bon', 'date_acquisition' => '2025-01-01',
            'service_id' => $serviceId,
        ]);
    }

    // ─── Droits d'accès ───────────────────────────────────────────────────────

    public function test_agent_ne_peut_pas_acceder_aux_rapports(): void
    {
        $agent = $this->userWithRole('agent');
        Sanctum::actingAs($agent, ['*']);

        $this->getJson('/api/rapports/biens')->assertStatus(403);
    }

    public function test_gestionnaire_peut_acceder_aux_rapports(): void
    {
        $gestionnaire = $this->userWithRole('gestionnaire');
        Sanctum::actingAs($gestionnaire, ['*']);

        $this->getJson('/api/rapports/biens')
            ->assertStatus(200)
            ->assertJsonStructure(['data' => ['biens', 'stats']]);
    }

    // ─── Rapport biens ────────────────────────────────────────────────────────

    public function test_rapport_biens_contient_les_bons_chiffres(): void
    {
        $gestionnaire = $this->userWithRole('gestionnaire');
        Sanctum::actingAs($gestionnaire, ['*']);

        // 2 biens disponibles + 1 en maintenance
        $this->bien(); $this->bien();
        $bienMaint = $this->bien();
        $bienMaint->update(['statut' => 'En maintenance']);

        $data = $this->getJson('/api/rapports/biens')
            ->assertStatus(200)
            ->json('data');

        $this->assertEquals(3, $data['stats']['total']);
        $this->assertEquals(2, $data['stats']['disponibles']);
        $this->assertEquals(1, $data['stats']['maintenance']);
    }

    public function test_rapport_biens_filtre_par_service(): void
    {
        $gestionnaire = $this->userWithRole('gestionnaire');
        Sanctum::actingAs($gestionnaire, ['*']);

        $service = Service::create(['nom' => 'Informatique', 'code' => 'INFO']);
        $this->bien($service->id);
        $this->bien(); // pas de service

        $data = $this->getJson("/api/rapports/biens?service_id={$service->id}")
            ->assertStatus(200)
            ->json('data');

        $this->assertEquals(1, $data['stats']['total']);
    }

    // ─── Rapport mouvements ───────────────────────────────────────────────────

    public function test_rapport_mouvements_retourne_les_affectations(): void
    {
        $gestionnaire = $this->userWithRole('gestionnaire');
        Sanctum::actingAs($gestionnaire, ['*']);

        $service = Service::create(['nom' => 'DSI', 'code' => 'DSI']);
        $bien = $this->bien();
        Affectation::create([
            'bien_id'         => $bien->id,
            'responsable_id'  => $gestionnaire->id,
            'service_id'      => $service->id,
            'type'            => 'pret',
            'date_retour_prevue' => now()->addDays(7)->toDateString(),
        ]);

        $data = $this->getJson('/api/rapports/mouvements')
            ->assertStatus(200)
            ->json('data');

        $this->assertGreaterThanOrEqual(1, $data['total']);
    }

    // ─── Rapport garanties ────────────────────────────────────────────────────

    public function test_rapport_garanties_inclut_bien_avec_garantie_proche(): void
    {
        $gestionnaire = $this->userWithRole('gestionnaire');
        Sanctum::actingAs($gestionnaire, ['*']);

        $bien = $this->bien();
        $bien->update(['fin_garantie' => now()->addDays(15)->toDateString()]);

        $data = $this->getJson('/api/rapports/garanties?jours=30')
            ->assertStatus(200)
            ->json('data');

        $this->assertEquals(1, $data['total']);
        $this->assertEquals($bien->numero_inventaire, $data['biens'][0]['numero']);
    }

    public function test_rapport_garanties_exclut_garantie_lointaine(): void
    {
        $gestionnaire = $this->userWithRole('gestionnaire');
        Sanctum::actingAs($gestionnaire, ['*']);

        $bien = $this->bien();
        $bien->update(['fin_garantie' => now()->addDays(200)->toDateString()]);

        $data = $this->getJson('/api/rapports/garanties?jours=90')
            ->assertStatus(200)
            ->json('data');

        $this->assertEquals(0, $data['total']);
    }

    // ─── Rapport maintenances ─────────────────────────────────────────────────

    public function test_rapport_maintenances_compte_correctement(): void
    {
        $gestionnaire = $this->userWithRole('gestionnaire');
        Sanctum::actingAs($gestionnaire, ['*']);

        $bien = $this->bien();
        Maintenance::create([
            'bien_id'     => $bien->id,
            'type'        => 'corrective',
            'statut'      => 'en_cours',
            'date_prevue' => now()->addDay()->toDateString(),
            'cree_par'    => $gestionnaire->id,
        ]);
        Maintenance::create([
            'bien_id'        => $bien->id,
            'type'           => 'preventive',
            'statut'         => 'terminee',
            'date_prevue'    => now()->subDay()->toDateString(),
            'date_realisee'  => now(),
            'resultat'       => 'RAS',
            'cree_par'       => $gestionnaire->id,
        ]);

        $data = $this->getJson('/api/rapports/maintenances')
            ->assertStatus(200)
            ->json('data');

        $this->assertEquals(2, $data['stats']['total']);
        $this->assertEquals(1, $data['stats']['en_cours']);
        $this->assertEquals(1, $data['stats']['terminees']);
    }

    // ─── Rapport statistiques ─────────────────────────────────────────────────

    public function test_rapport_statistiques_retourne_repartition(): void
    {
        $gestionnaire = $this->userWithRole('gestionnaire');
        Sanctum::actingAs($gestionnaire, ['*']);

        $this->bien();

        $this->getJson('/api/rapports/statistiques')
            ->assertStatus(200)
            ->assertJsonStructure(['data' => ['parStatut', 'parService', 'parCategorie']]);
    }

    // ─── Journal d'audit ──────────────────────────────────────────────────────

    public function test_admin_peut_voir_le_journal_audit(): void
    {
        $admin = $this->userWithRole('admin');
        Sanctum::actingAs($admin, ['*']);

        // Générer une entrée d'audit
        AuditService::enregistrer('create', 'Bien', 1, null, ['designation' => 'Test']);

        $this->getJson('/api/audit')
            ->assertStatus(200)
            ->assertJsonStructure(['data', 'meta' => ['total', 'current_page', 'last_page']]);
    }

    public function test_gestionnaire_ne_peut_pas_voir_le_journal_audit(): void
    {
        $gestionnaire = $this->userWithRole('gestionnaire');
        Sanctum::actingAs($gestionnaire, ['*']);

        $this->getJson('/api/audit')->assertStatus(403);
    }

    public function test_audit_filtre_par_entite(): void
    {
        $admin = $this->userWithRole('admin');
        Sanctum::actingAs($admin, ['*']);

        AuditService::enregistrer('create', 'Bien',  1, null, ['x' => 1]);
        AuditService::enregistrer('update', 'User', 2, ['a' => 1], ['a' => 2]);

        $data = $this->getJson('/api/audit?entite=Bien')
            ->assertStatus(200)
            ->json('data');

        $this->assertCount(1, $data);
        $this->assertEquals('Bien', $data[0]['entite']);
    }
}
