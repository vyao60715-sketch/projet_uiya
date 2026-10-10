<?php

namespace Tests\Feature\Api;

use App\Models\Bien;
use App\Models\Categorie;
use App\Models\Service;
use App\Models\User;
use App\Services\BienStatutService;
use Database\Seeders\RolesPermissionsSeeder;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Laravel\Sanctum\Sanctum;
use Tests\TestCase;

class AffectationTest extends TestCase
{
    use RefreshDatabase;

    private function userWithRole(string $role): User
    {
        $this->seed(RolesPermissionsSeeder::class);
        $user = User::factory()->create(['actif' => true]);
        $user->assignRole($role);

        return $user;
    }

    private function service(): Service
    {
        return Service::create(['nom' => 'Scolarité', 'code' => 'SCO']);
    }

    private function bien(string $statut = 'Disponible'): Bien
    {
        $categorie = Categorie::create([
            'nom' => 'Informatique', 'code' => 'INF',
            'duree_garantie_mois' => 0, 'periodicite_maintenance_mois' => 0,
        ]);

        $bien = Bien::create([
            'designation' => 'Ordinateur portable',
            'categorie_id' => $categorie->id,
            'etat' => 'Bon',
            'date_acquisition' => '2026-01-01',
        ]);

        if ($statut !== 'Disponible') {
            BienStatutService::changer($bien, $statut);
        }

        return $bien->fresh();
    }

    public function test_gestionnaire_can_affecter_bien_disponible(): void
    {
        $gestionnaire = $this->userWithRole('gestionnaire');
        $service = $this->service();
        $bien = $this->bien();
        Sanctum::actingAs($gestionnaire, ['*']);

        $response = $this->postJson("/api/biens/{$bien->id}/affecter", ['service_id' => $service->id]);

        $response->assertStatus(201)
            ->assertJsonPath('data.bien.statut', 'Affecté')
            ->assertJsonPath('data.affectation.service_id', $service->id);

        $this->assertDatabaseHas('mouvements', [
            'bien_id' => $bien->id, 'type' => 'affectation', 'origine' => 'Disponible',
        ]);
    }

    public function test_cannot_affecter_bien_already_affecte(): void
    {
        $gestionnaire = $this->userWithRole('gestionnaire');
        $service = $this->service();
        $bien = $this->bien('Affecté');
        Sanctum::actingAs($gestionnaire, ['*']);

        $response = $this->postJson("/api/biens/{$bien->id}/affecter", ['service_id' => $service->id]);

        $response->assertStatus(422);
    }

    public function test_cannot_affecter_bien_en_maintenance(): void
    {
        $gestionnaire = $this->userWithRole('gestionnaire');
        $service = $this->service();
        $bien = $this->bien('En maintenance');
        Sanctum::actingAs($gestionnaire, ['*']);

        $response = $this->postJson("/api/biens/{$bien->id}/affecter", ['service_id' => $service->id]);

        $response->assertStatus(422);
        $this->assertSame('En maintenance', $bien->fresh()->statut);
    }

    public function test_gestionnaire_can_transferer_bien_affecte(): void
    {
        $gestionnaire = $this->userWithRole('gestionnaire');
        $service1 = $this->service();
        $service2 = Service::create(['nom' => 'Comptabilité', 'code' => 'CPT']);
        $bien = $this->bien();
        Sanctum::actingAs($gestionnaire, ['*']);

        $this->postJson("/api/biens/{$bien->id}/affecter", ['service_id' => $service1->id]);
        $response = $this->postJson("/api/biens/{$bien->id}/transferer", ['service_id' => $service2->id]);

        $response->assertStatus(201)
            ->assertJsonPath('data.bien.statut', 'Affecté')
            ->assertJsonPath('data.affectation.service_id', $service2->id);

        $this->assertDatabaseCount('affectations', 2);
        $this->assertDatabaseHas('mouvements', ['bien_id' => $bien->id, 'type' => 'transfert']);
    }

    public function test_cannot_transferer_bien_disponible(): void
    {
        $gestionnaire = $this->userWithRole('gestionnaire');
        $service = $this->service();
        $bien = $this->bien();
        Sanctum::actingAs($gestionnaire, ['*']);

        $response = $this->postJson("/api/biens/{$bien->id}/transferer", ['service_id' => $service->id]);

        $response->assertStatus(422);
    }

    public function test_preter_requires_date_retour_prevue(): void
    {
        $gestionnaire = $this->userWithRole('gestionnaire');
        $service = $this->service();
        $bien = $this->bien();
        Sanctum::actingAs($gestionnaire, ['*']);

        $response = $this->postJson("/api/biens/{$bien->id}/preter", ['service_id' => $service->id]);

        $response->assertStatus(422)->assertJsonValidationErrors(['date_retour_prevue']);
    }

    public function test_preter_then_retour_cycle(): void
    {
        $gestionnaire = $this->userWithRole('gestionnaire');
        $service = $this->service();
        $bien = $this->bien();
        Sanctum::actingAs($gestionnaire, ['*']);

        $this->postJson("/api/biens/{$bien->id}/preter", [
            'service_id' => $service->id,
            'date_retour_prevue' => now()->addDays(10)->toDateString(),
        ])->assertStatus(201)->assertJsonPath('data.bien.statut', 'En prêt');

        $response = $this->postJson("/api/biens/{$bien->id}/retour", []);

        $response->assertStatus(200)->assertJsonPath('data.bien.statut', 'Disponible');

        $this->assertDatabaseHas('mouvements', ['bien_id' => $bien->id, 'type' => 'pret']);
        $this->assertDatabaseHas('mouvements', ['bien_id' => $bien->id, 'type' => 'retour']);
    }

    public function test_responsable_cannot_affecter_bien(): void
    {
        $responsable = $this->userWithRole('responsable');
        $service = $this->service();
        $bien = $this->bien();
        Sanctum::actingAs($responsable, ['*']);

        $response = $this->postJson("/api/biens/{$bien->id}/affecter", ['service_id' => $service->id]);

        $response->assertStatus(403);
    }

    public function test_historique_lists_mouvements_for_the_bien(): void
    {
        $gestionnaire = $this->userWithRole('gestionnaire');
        $service = $this->service();
        $bien = $this->bien();
        Sanctum::actingAs($gestionnaire, ['*']);

        $this->postJson("/api/biens/{$bien->id}/affecter", ['service_id' => $service->id]);

        $response = $this->getJson("/api/biens/{$bien->id}/historique");

        $response->assertStatus(200);
        $this->assertCount(1, $response->json('data'));
        $this->assertSame('affectation', $response->json('data.0.type'));
    }
}
