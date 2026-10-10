<?php

namespace Tests\Feature\Api;

use App\Models\Bien;
use App\Models\Categorie;
use App\Models\Demande;
use App\Models\Service;
use App\Models\User;
use App\Services\BienStatutService;
use Database\Seeders\RolesPermissionsSeeder;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Laravel\Sanctum\Sanctum;
use Tests\TestCase;

class DemandeTest extends TestCase
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
            'nom'                         => 'Informatique',
            'code'                        => 'INF',
            'duree_garantie_mois'         => 0,
            'periodicite_maintenance_mois' => 0,
        ]);

        $bien = Bien::create([
            'designation'    => 'Ordinateur portable',
            'categorie_id'   => $categorie->id,
            'etat'           => 'Bon',
            'date_acquisition' => '2026-01-01',
        ]);

        if ($statut !== 'Disponible') {
            BienStatutService::changer($bien, $statut);
        }

        return $bien->fresh();
    }

    // ─── RG-07 : seul un responsable peut créer une demande ───────────────────

    public function test_responsable_peut_creer_demande_panne(): void
    {
        $responsable = $this->userWithRole('responsable');
        $bien = $this->bien();
        Sanctum::actingAs($responsable, ['*']);

        $response = $this->postJson('/api/demandes', [
            'bien_id' => $bien->id,
            'type'    => 'panne',
            'motif'   => 'Écran cassé',
        ]);

        $response->assertStatus(201);
        $this->assertDatabaseHas('demandes', [
            'bien_id'      => $bien->id,
            'type'         => 'panne',
            'statut'       => 'soumise',
            'demandeur_id' => $responsable->id,
        ]);
    }

    public function test_agent_ne_peut_pas_creer_demande(): void
    {
        $agent = $this->userWithRole('agent');
        $bien  = $this->bien();
        Sanctum::actingAs($agent, ['*']);

        $this->postJson('/api/demandes', [
            'bien_id' => $bien->id,
            'type'    => 'panne',
            'motif'   => 'Test',
        ])->assertStatus(403);
    }

    // ─── Circuit complet : soumise → validée (panne) ─────────────────────────

    public function test_gestionnaire_peut_valider_demande_panne(): void
    {
        $responsable  = $this->userWithRole('responsable');
        $gestionnaire = $this->userWithRole('gestionnaire');
        $bien         = $this->bien();

        $demande = Demande::create([
            'bien_id'      => $bien->id,
            'type'         => 'panne',
            'motif'        => 'Écran cassé',
            'statut'       => 'soumise',
            'demandeur_id' => $responsable->id,
        ]);

        Sanctum::actingAs($gestionnaire, ['*']);

        $this->postJson("/api/demandes/{$demande->id}/valider")
            ->assertStatus(200);

        $this->assertDatabaseHas('demandes', [
            'id'     => $demande->id,
            'statut' => 'validee',
        ]);

        // Le bien doit passer en maintenance
        $this->assertDatabaseHas('biens', [
            'id'     => $bien->id,
            'statut' => 'En maintenance',
        ]);
    }

    public function test_gestionnaire_peut_valider_demande_perte(): void
    {
        $responsable  = $this->userWithRole('responsable');
        $gestionnaire = $this->userWithRole('gestionnaire');
        $bien         = $this->bien();

        $demande = Demande::create([
            'bien_id'      => $bien->id,
            'type'         => 'perte',
            'motif'        => 'Bien introuvable',
            'statut'       => 'soumise',
            'demandeur_id' => $responsable->id,
        ]);

        Sanctum::actingAs($gestionnaire, ['*']);

        $this->postJson("/api/demandes/{$demande->id}/valider")
            ->assertStatus(200);

        $this->assertDatabaseHas('biens', [
            'id'     => $bien->id,
            'statut' => 'Perdu',
        ]);
    }

    // ─── RG-08 : rejet exige un motif ────────────────────────────────────────

    public function test_rejet_sans_motif_retourne_422(): void
    {
        $responsable  = $this->userWithRole('responsable');
        $gestionnaire = $this->userWithRole('gestionnaire');
        $bien         = $this->bien();

        $demande = Demande::create([
            'bien_id'      => $bien->id,
            'type'         => 'panne',
            'motif'        => 'Test',
            'statut'       => 'soumise',
            'demandeur_id' => $responsable->id,
        ]);

        Sanctum::actingAs($gestionnaire, ['*']);

        $this->postJson("/api/demandes/{$demande->id}/rejeter", [])
            ->assertStatus(422)
            ->assertJsonValidationErrors(['motif']);
    }

    public function test_gestionnaire_peut_rejeter_demande_avec_motif(): void
    {
        $responsable  = $this->userWithRole('responsable');
        $gestionnaire = $this->userWithRole('gestionnaire');
        $bien         = $this->bien();

        $demande = Demande::create([
            'bien_id'      => $bien->id,
            'type'         => 'panne',
            'motif'        => 'Test',
            'statut'       => 'soumise',
            'demandeur_id' => $responsable->id,
        ]);

        Sanctum::actingAs($gestionnaire, ['*']);

        $this->postJson("/api/demandes/{$demande->id}/rejeter", [
            'motif' => 'Demande incomplète, manque le bon de signalement.',
        ])->assertStatus(200);

        $this->assertDatabaseHas('demandes', [
            'id'     => $demande->id,
            'statut' => 'rejetee',
        ]);

        // Le bien reste inchangé
        $this->assertDatabaseHas('biens', ['id' => $bien->id, 'statut' => 'Disponible']);
    }

    // ─── Impossible de valider une demande déjà traitée ──────────────────────

    public function test_impossible_valider_demande_deja_validee(): void
    {
        $responsable  = $this->userWithRole('responsable');
        $gestionnaire = $this->userWithRole('gestionnaire');
        $bien         = $this->bien();

        $demande = Demande::create([
            'bien_id'      => $bien->id,
            'type'         => 'panne',
            'motif'        => 'Test',
            'statut'       => 'validee',
            'demandeur_id' => $responsable->id,
        ]);

        Sanctum::actingAs($gestionnaire, ['*']);

        $this->postJson("/api/demandes/{$demande->id}/valider")
            ->assertStatus(422);
    }

    // ─── Lecture filtrée par rôle (RG-07) ────────────────────────────────────

    public function test_responsable_voit_seulement_ses_demandes(): void
    {
        $r1 = $this->userWithRole('responsable');
        $r2 = $this->userWithRole('responsable');
        $bien = $this->bien();

        Demande::create(['bien_id' => $bien->id, 'type' => 'panne', 'motif' => 'A', 'statut' => 'soumise', 'demandeur_id' => $r1->id]);
        Demande::create(['bien_id' => $bien->id, 'type' => 'panne', 'motif' => 'B', 'statut' => 'soumise', 'demandeur_id' => $r2->id]);

        Sanctum::actingAs($r1, ['*']);

        $response = $this->getJson('/api/demandes')->assertStatus(200);
        $ids = collect($response->json('data'))->pluck('demandeur_id')->unique()->values();
        $this->assertEquals([$r1->id], $ids->all());
    }

    public function test_gestionnaire_voit_toutes_les_demandes(): void
    {
        $r1 = $this->userWithRole('responsable');
        $r2 = $this->userWithRole('responsable');
        $gestionnaire = $this->userWithRole('gestionnaire');
        $bien = $this->bien();

        Demande::create(['bien_id' => $bien->id, 'type' => 'panne', 'motif' => 'A', 'statut' => 'soumise', 'demandeur_id' => $r1->id]);
        Demande::create(['bien_id' => $bien->id, 'type' => 'panne', 'motif' => 'B', 'statut' => 'soumise', 'demandeur_id' => $r2->id]);

        Sanctum::actingAs($gestionnaire, ['*']);

        $response = $this->getJson('/api/demandes')->assertStatus(200);
        $this->assertCount(2, $response->json('data'));
    }
}
