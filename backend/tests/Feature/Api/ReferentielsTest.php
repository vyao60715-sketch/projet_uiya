<?php

namespace Tests\Feature\Api;

use App\Models\User;
use Database\Seeders\RolesPermissionsSeeder;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Laravel\Sanctum\Sanctum;
use Tests\TestCase;

class ReferentielsTest extends TestCase
{
    use RefreshDatabase;

    private function userWithRole(string $role): User
    {
        $this->seed(RolesPermissionsSeeder::class);
        $user = User::factory()->create(['actif' => true]);
        $user->assignRole($role);

        return $user;
    }

    public function test_admin_can_create_service(): void
    {
        $admin = $this->userWithRole('admin');
        Sanctum::actingAs($admin, ['*']);

        $response = $this->postJson('/api/services', [
            'nom' => 'Service Test',
            'code' => 'TST',
        ]);

        $response->assertStatus(201)
            ->assertJsonPath('data.code', 'TST');

        $this->assertDatabaseHas('services', ['code' => 'TST']);
    }

    public function test_responsable_cannot_create_service(): void
    {
        $responsable = $this->userWithRole('responsable');
        Sanctum::actingAs($responsable, ['*']);

        $response = $this->postJson('/api/services', [
            'nom' => 'Service Interdit',
            'code' => 'INT',
        ]);

        $response->assertStatus(403);
        $this->assertDatabaseMissing('services', ['code' => 'INT']);
    }

    public function test_service_creation_validates_input(): void
    {
        $admin = $this->userWithRole('admin');
        Sanctum::actingAs($admin, ['*']);

        $response = $this->postJson('/api/services', [
            'nom' => '',
        ]);

        $response->assertStatus(422)
            ->assertJsonValidationErrors(['nom', 'code']);
    }

    public function test_any_authenticated_user_can_list_services(): void
    {
        $agent = $this->userWithRole('agent');
        Sanctum::actingAs($agent, ['*']);

        $this->getJson('/api/services')->assertStatus(200);
    }

    public function test_guest_cannot_list_services(): void
    {
        $this->getJson('/api/services')->assertStatus(401);
    }
}
