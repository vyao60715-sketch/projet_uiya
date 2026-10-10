<?php

namespace Tests\Feature\Api;

use App\Models\Categorie;
use App\Models\User;
use Database\Seeders\RolesPermissionsSeeder;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Http\UploadedFile;
use Illuminate\Support\Facades\Storage;
use Laravel\Sanctum\Sanctum;
use Tests\TestCase;

class BienTest extends TestCase
{
    use RefreshDatabase;

    private function userWithRole(string $role): User
    {
        $this->seed(RolesPermissionsSeeder::class);
        $user = User::factory()->create(['actif' => true]);
        $user->assignRole($role);

        return $user;
    }

    private function categorie(array $overrides = []): Categorie
    {
        return Categorie::create(array_merge([
            'nom' => 'Informatique',
            'code' => 'INF',
            'duree_garantie_mois' => 24,
            'periodicite_maintenance_mois' => 12,
        ], $overrides));
    }

    public function test_gestionnaire_can_create_bien_with_auto_generated_fields(): void
    {
        $gestionnaire = $this->userWithRole('gestionnaire');
        $categorie = $this->categorie();
        Sanctum::actingAs($gestionnaire, ['*']);

        $response = $this->postJson('/api/biens', [
            'designation' => 'Ordinateur portable Dell',
            'categorie_id' => $categorie->id,
            'etat' => 'Neuf',
            'date_acquisition' => '2026-01-15',
        ]);

        $response->assertStatus(201)
            ->assertJsonPath('data.numero_inventaire', 'UIYA-INF-2026-0001')
            ->assertJsonPath('data.statut', 'Disponible')
            ->assertJsonPath('data.fin_garantie', '2028-01-15T00:00:00.000000Z')
            ->assertJsonPath('data.prochaine_maintenance', '2027-01-15T00:00:00.000000Z');

        $this->assertNotNull($response->json('data.uuid_qr'));
    }

    public function test_numero_inventaire_is_sequential_per_category(): void
    {
        $gestionnaire = $this->userWithRole('gestionnaire');
        $categorie = $this->categorie();
        Sanctum::actingAs($gestionnaire, ['*']);

        $payload = [
            'categorie_id' => $categorie->id,
            'etat' => 'Neuf',
            'date_acquisition' => '2026-01-15',
        ];

        $r1 = $this->postJson('/api/biens', [...$payload, 'designation' => 'Bien 1']);
        $r2 = $this->postJson('/api/biens', [...$payload, 'designation' => 'Bien 2']);

        $this->assertSame('UIYA-INF-2026-0001', $r1->json('data.numero_inventaire'));
        $this->assertSame('UIYA-INF-2026-0002', $r2->json('data.numero_inventaire'));
        $this->assertNotSame($r1->json('data.uuid_qr'), $r2->json('data.uuid_qr'));
    }

    public function test_responsable_cannot_create_bien(): void
    {
        $responsable = $this->userWithRole('responsable');
        $categorie = $this->categorie();
        Sanctum::actingAs($responsable, ['*']);

        $response = $this->postJson('/api/biens', [
            'designation' => 'Bien interdit',
            'categorie_id' => $categorie->id,
            'etat' => 'Neuf',
            'date_acquisition' => '2026-01-15',
        ]);

        $response->assertStatus(403);
        $this->assertDatabaseMissing('biens', ['designation' => 'Bien interdit']);
    }

    public function test_creation_validates_required_fields(): void
    {
        $gestionnaire = $this->userWithRole('gestionnaire');
        Sanctum::actingAs($gestionnaire, ['*']);

        $response = $this->postJson('/api/biens', []);

        $response->assertStatus(422)
            ->assertJsonValidationErrors(['designation', 'categorie_id', 'etat', 'date_acquisition']);
    }

    public function test_creation_rejects_non_image_photo(): void
    {
        $gestionnaire = $this->userWithRole('gestionnaire');
        $categorie = $this->categorie();
        Sanctum::actingAs($gestionnaire, ['*']);

        $response = $this->postJson('/api/biens', [
            'designation' => 'Bien avec mauvais fichier',
            'categorie_id' => $categorie->id,
            'etat' => 'Neuf',
            'date_acquisition' => '2026-01-15',
            'photo' => UploadedFile::fake()->create('document.pdf', 100),
        ]);

        $response->assertStatus(422)->assertJsonValidationErrors(['photo']);
    }

    public function test_photo_is_stored_privately_and_served_through_controlled_route(): void
    {
        Storage::fake('local');
        $gestionnaire = $this->userWithRole('gestionnaire');
        $categorie = $this->categorie();
        Sanctum::actingAs($gestionnaire, ['*']);

        $response = $this->post('/api/biens', [
            'designation' => 'Bien avec photo',
            'categorie_id' => $categorie->id,
            'etat' => 'Neuf',
            'date_acquisition' => '2026-01-15',
            'photo' => UploadedFile::fake()->image('photo.jpg'),
        ]);

        $response->assertStatus(201);
        $path = $response->json('data.photo');
        Storage::disk('local')->assertExists($path);

        $this->getJson("/api/biens/{$response->json('data.id')}/photo")->assertStatus(200);
    }

    public function test_search_finds_bien_by_designation_or_numero(): void
    {
        $gestionnaire = $this->userWithRole('gestionnaire');
        $categorie = $this->categorie();
        Sanctum::actingAs($gestionnaire, ['*']);

        $this->postJson('/api/biens', ['designation' => 'Chaise visiteur', 'categorie_id' => $categorie->id, 'etat' => 'Bon', 'date_acquisition' => '2026-01-01']);
        $this->postJson('/api/biens', ['designation' => 'Ordinateur portable', 'categorie_id' => $categorie->id, 'etat' => 'Bon', 'date_acquisition' => '2026-01-01']);

        $response = $this->getJson('/api/biens?q=Chaise');

        $response->assertStatus(200);
        $this->assertCount(1, $response->json('data'));
        $this->assertSame('Chaise visiteur', $response->json('data.0.designation'));
    }

    public function test_show_by_uuid_returns_the_bien(): void
    {
        $gestionnaire = $this->userWithRole('gestionnaire');
        $categorie = $this->categorie();
        Sanctum::actingAs($gestionnaire, ['*']);

        $created = $this->postJson('/api/biens', [
            'designation' => 'Bien scanné', 'categorie_id' => $categorie->id,
            'etat' => 'Bon', 'date_acquisition' => '2026-01-01',
        ])->json('data');

        $response = $this->getJson("/api/biens/qr/{$created['uuid_qr']}");

        $response->assertStatus(200)->assertJsonPath('data.id', $created['id']);
    }

    public function test_show_by_unknown_uuid_returns_404(): void
    {
        $agent = $this->userWithRole('agent');
        Sanctum::actingAs($agent, ['*']);

        $this->getJson('/api/biens/qr/00000000-0000-0000-0000-000000000000')->assertStatus(404);
    }

    public function test_guest_cannot_access_biens(): void
    {
        $this->getJson('/api/biens')->assertStatus(401);
    }

    public function test_etiquette_endpoint_returns_a_pdf(): void
    {
        $gestionnaire = $this->userWithRole('gestionnaire');
        $categorie = $this->categorie();
        Sanctum::actingAs($gestionnaire, ['*']);

        $bien = $this->postJson('/api/biens', [
            'designation' => 'Bien étiqueté', 'categorie_id' => $categorie->id,
            'etat' => 'Bon', 'date_acquisition' => '2026-01-01',
        ])->json('data');

        $response = $this->get("/api/biens/{$bien['id']}/etiquette");

        $response->assertStatus(200);
        $this->assertSame('application/pdf', $response->headers->get('content-type'));
    }

    public function test_gestionnaire_can_delete_bien(): void
    {
        $gestionnaire = $this->userWithRole('gestionnaire');
        $categorie = $this->categorie();
        Sanctum::actingAs($gestionnaire, ['*']);

        $bien = $this->postJson('/api/biens', [
            'designation' => 'Bien à supprimer', 'categorie_id' => $categorie->id,
            'etat' => 'Bon', 'date_acquisition' => '2026-01-01',
        ])->json('data');

        $this->deleteJson("/api/biens/{$bien['id']}")->assertStatus(200);
        $this->assertDatabaseMissing('biens', ['id' => $bien['id']]);
    }
}
