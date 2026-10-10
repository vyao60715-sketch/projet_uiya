<?php

namespace Tests\Feature\Api;

use App\Models\Bien;
use App\Models\Campagne;
use App\Models\Categorie;
use App\Models\User;
use Database\Seeders\RolesPermissionsSeeder;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Laravel\Sanctum\Sanctum;
use Tests\TestCase;

class CampagneTest extends TestCase
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

    private function bien(): Bien
    {
        $categorie = Categorie::create([
            'nom' => 'Info', 'code' => 'INF',
            'duree_garantie_mois' => 0, 'periodicite_maintenance_mois' => 0,
        ]);
        return Bien::create([
            'designation' => 'PC', 'categorie_id' => $categorie->id,
            'etat' => 'Bon', 'date_acquisition' => '2026-01-01',
        ]);
    }

    // ─── Création ────────────────────────────────────────────────────────────

    public function test_gestionnaire_peut_creer_campagne(): void
    {
        $gestionnaire = $this->userWithRole('gestionnaire');
        Sanctum::actingAs($gestionnaire, ['*']);

        $this->postJson('/api/inventaires', ['nom' => 'Inventaire annuel 2026'])
            ->assertStatus(201)
            ->assertJsonPath('data.nom', 'Inventaire annuel 2026')
            ->assertJsonPath('data.statut', 'en_cours');
    }

    public function test_agent_ne_peut_pas_creer_campagne(): void
    {
        $agent = $this->userWithRole('agent');
        Sanctum::actingAs($agent, ['*']);

        $this->postJson('/api/inventaires', ['nom' => 'Test'])
            ->assertStatus(403);
    }

    public function test_une_seule_campagne_en_cours_a_la_fois(): void
    {
        $gestionnaire = $this->userWithRole('gestionnaire');
        Sanctum::actingAs($gestionnaire, ['*']);

        Campagne::create([
            'nom' => 'Camp 1', 'statut' => 'en_cours',
            'date_debut' => now(), 'cree_par' => $gestionnaire->id,
        ]);

        $this->postJson('/api/inventaires', ['nom' => 'Camp 2'])
            ->assertStatus(422);
    }

    // ─── Synchronisation idempotente ─────────────────────────────────────────

    public function test_sync_enregistre_controle(): void
    {
        $agent = $this->userWithRole('agent');
        $bien  = $this->bien();
        Sanctum::actingAs($agent, ['*']);

        $gestionnaire = $this->userWithRole('gestionnaire');
        $campagne = Campagne::create([
            'nom' => 'Test sync', 'statut' => 'en_cours',
            'date_debut' => now(), 'cree_par' => $gestionnaire->id,
        ]);

        $this->postJson("/api/inventaires/{$campagne->id}/sync", [
            'controles' => [[
                'uuid_qr' => $bien->uuid_qr,
                'resultat' => 'present',
            ]],
        ])->assertStatus(200);

        $this->assertDatabaseHas('controles_inventaire', [
            'campagne_id' => $campagne->id,
            'bien_id'     => $bien->id,
            'resultat'    => 'present',
        ]);
    }

    public function test_sync_idempotente(): void
    {
        $agent = $this->userWithRole('agent');
        $bien  = $this->bien();
        Sanctum::actingAs($agent, ['*']);

        $gestionnaire = $this->userWithRole('gestionnaire');
        $campagne = Campagne::create([
            'nom' => 'Idempotent', 'statut' => 'en_cours',
            'date_debut' => now(), 'cree_par' => $gestionnaire->id,
        ]);

        // Première sync
        $this->postJson("/api/inventaires/{$campagne->id}/sync", [
            'controles' => [['uuid_qr' => $bien->uuid_qr, 'resultat' => 'present']],
        ]);

        // Deuxième sync avec un résultat différent → doit écraser
        $this->postJson("/api/inventaires/{$campagne->id}/sync", [
            'controles' => [['uuid_qr' => $bien->uuid_qr, 'resultat' => 'deplace', 'salle_constatee' => 'Salle 101']],
        ])->assertStatus(200);

        $this->assertDatabaseHas('controles_inventaire', [
            'campagne_id'    => $campagne->id,
            'bien_id'        => $bien->id,
            'resultat'       => 'deplace',
            'salle_constatee' => 'Salle 101',
        ]);

        // Un seul enregistrement (pas de doublon)
        $this->assertEquals(
            1,
            \App\Models\ControleInventaire::where('campagne_id', $campagne->id)->count()
        );
    }

    // ─── Clôture et rapport d'écarts ─────────────────────────────────────────

    public function test_cloture_produit_rapport(): void
    {
        $gestionnaire = $this->userWithRole('gestionnaire');
        $bien = $this->bien();
        Sanctum::actingAs($gestionnaire, ['*']);

        $campagne = Campagne::create([
            'nom' => 'Clôture test', 'statut' => 'en_cours',
            'date_debut' => now(), 'cree_par' => $gestionnaire->id,
        ]);

        // Syncer le bien comme absent
        \App\Models\ControleInventaire::create([
            'campagne_id' => $campagne->id,
            'bien_id'     => $bien->id,
            'resultat'    => 'absent',
            'controle_par' => $gestionnaire->id,
        ]);

        $response = $this->postJson("/api/inventaires/{$campagne->id}/cloturer")
            ->assertStatus(200);

        $data = $response->json('data');
        $this->assertEquals('cloturee', Campagne::find($campagne->id)->statut);
        $this->assertArrayHasKey('nb_absents', $data);
        $this->assertEquals(1, $data['nb_absents']);
    }

    public function test_impossible_sync_campagne_cloturee(): void
    {
        $agent = $this->userWithRole('agent');
        $bien  = $this->bien();
        Sanctum::actingAs($agent, ['*']);

        $gestionnaire = $this->userWithRole('gestionnaire');
        $campagne = Campagne::create([
            'nom' => 'Cloturée', 'statut' => 'cloturee',
            'date_debut' => now(), 'cree_par' => $gestionnaire->id,
        ]);

        $this->postJson("/api/inventaires/{$campagne->id}/sync", [
            'controles' => [['uuid_qr' => $bien->uuid_qr, 'resultat' => 'present']],
        ])->assertStatus(422);
    }
}
