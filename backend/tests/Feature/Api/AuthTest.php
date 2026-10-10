<?php

namespace Tests\Feature\Api;

use App\Models\User;
use Database\Seeders\RolesPermissionsSeeder;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\Hash;
use Tests\TestCase;

class AuthTest extends TestCase
{
    use RefreshDatabase;

    private function makeUser(array $overrides = []): User
    {
        $this->seed(RolesPermissionsSeeder::class);

        $user = User::factory()->create(array_merge([
            'password' => Hash::make('Password123'),
            'actif' => true,
        ], $overrides));

        $user->assignRole('gestionnaire');

        return $user;
    }

    public function test_login_succeeds_with_valid_credentials(): void
    {
        $user = $this->makeUser();

        $response = $this->postJson('/api/login', [
            'email' => $user->email,
            'password' => 'Password123',
        ]);

        $response->assertStatus(200)
            ->assertJsonPath('data.user.email', $user->email)
            ->assertJsonStructure(['data' => ['user', 'token'], 'message', 'errors']);
    }

    public function test_login_fails_with_wrong_password(): void
    {
        $user = $this->makeUser();

        $response = $this->postJson('/api/login', [
            'email' => $user->email,
            'password' => 'wrong-password',
        ]);

        $response->assertStatus(422);
    }

    public function test_login_rejects_invalid_payload(): void
    {
        $response = $this->postJson('/api/login', [
            'email' => 'not-an-email',
        ]);

        $response->assertStatus(422);
    }

    public function test_account_is_blocked_after_five_failed_attempts(): void
    {
        $user = $this->makeUser();

        for ($i = 0; $i < 5; $i++) {
            $this->postJson('/api/login', [
                'email' => $user->email,
                'password' => 'wrong-password',
            ]);
        }

        $response = $this->postJson('/api/login', [
            'email' => $user->email,
            'password' => 'Password123',
        ]);

        $response->assertStatus(423);
        $this->assertNotNull($user->refresh()->bloque_jusqu_a);
    }

    public function test_profile_requires_authentication(): void
    {
        $response = $this->getJson('/api/user');

        $response->assertStatus(401);
    }

    public function test_authenticated_user_can_fetch_profile(): void
    {
        $user = $this->makeUser();
        $token = $user->createToken('test')->plainTextToken;

        $this->withHeader('Authorization', "Bearer $token")
            ->getJson('/api/user')
            ->assertStatus(200)
            ->assertJsonPath('data.email', $user->email);
    }

    public function test_logout_revokes_the_token(): void
    {
        $user = $this->makeUser();
        $accessToken = $user->createToken('test');
        $token = $accessToken->plainTextToken;

        $this->withHeader('Authorization', "Bearer $token")
            ->postJson('/api/logout')
            ->assertStatus(200);

        $this->assertDatabaseMissing('personal_access_tokens', [
            'id' => $accessToken->accessToken->id,
        ]);
    }
}
