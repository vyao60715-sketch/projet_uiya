<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Http\Requests\UserStoreRequest;
use App\Http\Requests\UserUpdateRequest;
use App\Models\User;
use App\Services\AuditService;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Hash;

class UserController extends Controller
{
    public function index(Request $request)
    {
        $query = User::query()->with('service')->orderBy('name');

        if ($request->filled('service_id')) {
            $query->where('service_id', $request->service_id);
        }

        $users = $query->get()->map(fn (User $user) => $this->formatUser($user));

        return response()->json([
            'data' => $users,
            'message' => null,
            'errors' => null,
        ]);
    }

    public function store(UserStoreRequest $request)
    {
        $data = $request->validated();

        $user = User::create([
            'name' => $data['name'],
            'email' => $data['email'],
            'password' => Hash::make($data['password']),
            'service_id' => $data['service_id'] ?? null,
            'actif' => $data['actif'] ?? true,
        ]);

        $user->syncRoles([$data['role']]);

        AuditService::enregistrer('creation', 'users', $user->id, null, $this->formatUser($user));

        return response()->json([
            'data' => $this->formatUser($user),
            'message' => 'Utilisateur créé.',
            'errors' => null,
        ], 201);
    }

    public function update(UserUpdateRequest $request, User $user)
    {
        $data = $request->validated();
        $avant = $this->formatUser($user);

        $user->fill([
            'name' => $data['name'],
            'email' => $data['email'],
            'service_id' => $data['service_id'] ?? null,
            'actif' => $data['actif'] ?? $user->actif,
        ]);

        if (! empty($data['password'])) {
            $user->password = Hash::make($data['password']);
        }

        $user->save();
        $user->syncRoles([$data['role']]);

        AuditService::enregistrer('modification', 'users', $user->id, $avant, $this->formatUser($user));

        return response()->json([
            'data' => $this->formatUser($user),
            'message' => 'Utilisateur modifié.',
            'errors' => null,
        ]);
    }

    public function destroy(User $user)
    {
        $avant = $this->formatUser($user);
        $user->delete();

        AuditService::enregistrer('suppression', 'users', $user->id, $avant, null);

        return response()->json([
            'data' => null,
            'message' => 'Utilisateur supprimé.',
            'errors' => null,
        ]);
    }

    private function formatUser(User $user): array
    {
        return [
            'id' => $user->id,
            'name' => $user->name,
            'email' => $user->email,
            'service_id' => $user->service_id,
            'actif' => $user->actif,
            'roles' => $user->getRoleNames(),
        ];
    }
}
