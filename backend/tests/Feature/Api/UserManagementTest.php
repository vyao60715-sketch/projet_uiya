<?php

namespace Tests\Feature\Api;

use App\Models\User;
use Database\Seeders\RolesPermissionsSeeder;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Laravel\Sanctum\Sanctum;
use Tests\TestCase;

class UserManagementTest extends TestCase
{
    use RefreshDatabase;

    private function userWithRole(string $role): User
    {
        $this->seed(RolesPermissionsSeeder::class);
        $user = User::factory()->create(['actif' => true]);
        $user->assignRole($role);

        return $user;
    }

    public function test_admin_can_create_user_with_role(): void
    {
        $admin = $this->userWithRole('admin');
        Sanctum::actingAs($admin, ['*']);

        $response = $this->postJson('/api/users', [
            'name' => 'Nouveau Gestionnaire',
            'email' => 'gestionnaire@uiya.ci',
            'password' => 'Password123',
            'role' => 'gestionnaire',
        ]);

        $response->assertStatus(201)
            ->assertJsonPath('data.email', 'gestionnaire@uiya.ci');

        $this->assertDatabaseHas('users', ['email' => 'gestionnaire@uiya.ci']);
    }

    public function test_non_admin_cannot_manage_users(): void
    {
        $gestionnaire = $this->userWithRole('gestionnaire');
        Sanctum::actingAs($gestionnaire, ['*']);

        $this->getJson('/api/users')->assertStatus(403);
        $this->postJson('/api/users', [
            'name' => 'X', 'email' => 'x@x.ci', 'password' => 'Password123', 'role' => 'agent',
        ])->assertStatus(403);
    }

    public function test_user_creation_validates_input(): void
    {
        $admin = $this->userWithRole('admin');
        Sanctum::actingAs($admin, ['*']);

        $response = $this->postJson('/api/users', [
            'name' => '',
            'email' => 'not-an-email',
            'password' => 'short',
            'role' => 'role-inexistant',
        ]);

        $response->assertStatus(422)
            ->assertJsonValidationErrors(['name', 'email', 'password', 'role']);
    }

    public function test_user_creation_rejects_duplicate_email(): void
    {
        $admin = $this->userWithRole('admin');
        $existing = User::factory()->create(['email' => 'duplicate@uiya.ci']);
        Sanctum::actingAs($admin, ['*']);

        $response = $this->postJson('/api/users', [
            'name' => 'Doublon',
            'email' => $existing->email,
            'password' => 'Password123',
            'role' => 'agent',
        ]);

        $response->assertStatus(422)->assertJsonValidationErrors(['email']);
    }
}
