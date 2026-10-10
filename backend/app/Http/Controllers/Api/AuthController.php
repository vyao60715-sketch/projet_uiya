<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Http\Requests\LoginRequest;
use App\Models\User;
use App\Services\AuditService;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Facades\Password;
use Illuminate\Validation\ValidationException;

class AuthController extends Controller
{
    private const MAX_TENTATIVES = 5;

    private const DUREE_BLOCAGE_MINUTES = 15;

    public function login(LoginRequest $request)
    {
        $user = User::where('email', $request->email)->first();

        if (! $user) {
            throw ValidationException::withMessages([
                'email' => ['Identifiants incorrects.'],
            ]);
        }

        if ($user->bloque_jusqu_a && $user->bloque_jusqu_a->isFuture()) {
            return response()->json([
                'data' => null,
                'message' => 'Compte temporairement bloqué suite à plusieurs échecs. Réessayez plus tard.',
                'errors' => null,
            ], 423);
        }

        if (! $user->actif) {
            return response()->json([
                'data' => null,
                'message' => 'Compte désactivé. Contactez un administrateur.',
                'errors' => null,
            ], 403);
        }

        if (! Hash::check($request->password, $user->password)) {
            $user->increment('tentatives_echouees');

            if ($user->tentatives_echouees >= self::MAX_TENTATIVES) {
                $user->forceFill([
                    'bloque_jusqu_a' => now()->addMinutes(self::DUREE_BLOCAGE_MINUTES),
                ])->save();
            }

            AuditService::enregistrer('connexion_echouee', 'users', $user->id);

            throw ValidationException::withMessages([
                'email' => ['Identifiants incorrects.'],
            ]);
        }

        $user->forceFill([
            'tentatives_echouees' => 0,
            'bloque_jusqu_a' => null,
        ])->save();

        $token = $user->createToken('web', expiresAt: now()->addHours(8));

        AuditService::enregistrer('connexion', 'users', $user->id);

        return response()->json([
            'data' => [
                'user' => $this->formatUser($user),
                'token' => $token->plainTextToken,
            ],
            'message' => 'Connexion réussie.',
            'errors' => null,
        ]);
    }

    public function logout(Request $request)
    {
        AuditService::enregistrer('deconnexion', 'users', $request->user()->id);

        $request->user()->currentAccessToken()->delete();

        return response()->json([
            'data' => null,
            'message' => 'Déconnexion réussie.',
            'errors' => null,
        ]);
    }

    public function forgotPassword(Request $request)
    {
        $request->validate(['email' => ['required', 'email']]);

        $status = Password::sendResetLink($request->only('email'));

        return response()->json([
            'data' => null,
            'message' => $status === Password::RESET_LINK_SENT
                ? 'Lien de réinitialisation envoyé par e-mail.'
                : 'Impossible d\'envoyer le lien de réinitialisation.',
            'errors' => null,
        ]);
    }

    public function profile(Request $request)
    {
        return response()->json([
            'data' => $this->formatUser($request->user()),
            'message' => null,
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
            'permissions' => $user->getAllPermissions()->pluck('name'),
        ];
    }
}
