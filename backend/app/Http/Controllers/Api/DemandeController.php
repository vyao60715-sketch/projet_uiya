<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Http\Requests\DemandeRejeterRequest;
use App\Http\Requests\DemandeStoreRequest;
use App\Models\Bien;
use App\Models\Demande;
use App\Services\DemandeService;
use Illuminate\Http\Request;
use Illuminate\Validation\ValidationException;

class DemandeController extends Controller
{
    public function index(Request $request)
    {
        $query = Demande::query()->with(['bien', 'demandeur', 'serviceDestination'])->orderByDesc('created_at');

        $user = $request->user();

        // RG-07 : un responsable ne suit que ses propres demandes.
        if ($user->hasRole('responsable') && ! $user->hasAnyRole(['admin', 'gestionnaire'])) {
            $query->where('demandeur_id', $user->id);
        }

        if ($request->filled('statut')) {
            $query->where('statut', $request->statut);
        }

        return response()->json([
            'data' => $query->get(),
            'message' => null,
            'errors' => null,
        ]);
    }

    public function store(DemandeStoreRequest $request)
    {
        $data = $request->validated();
        $bien = Bien::findOrFail($data['bien_id']);
        $user = $request->user();

        // RG-07 : un responsable n'agit que sur les biens de son service.
        if ($user->hasRole('responsable') && ! $user->hasAnyRole(['admin', 'gestionnaire'])) {
            $serviceActuel = $bien->affectationActuelle?->service_id;
            if ($serviceActuel !== $user->service_id) {
                throw ValidationException::withMessages([
                    'bien_id' => ["Vous ne pouvez faire une demande que sur un bien affecté à votre service."],
                ]);
            }
        }

        if ($request->hasFile('photo')) {
            $data['photo'] = $request->file('photo')->store('demandes', 'local');
        }

        $demande = DemandeService::creer($bien, $data, $user);
        $demande->load(['bien', 'demandeur', 'serviceDestination']);

        return response()->json([
            'data' => $demande,
            'message' => 'Demande soumise.',
            'errors' => null,
        ], 201);
    }

    public function valider(Request $request, Demande $demande)
    {
        $demande = DemandeService::valider($demande, $request->user());
        $demande->load(['bien', 'demandeur']);

        return response()->json([
            'data' => $demande,
            'message' => 'Demande validée.',
            'errors' => null,
        ]);
    }

    public function rejeter(DemandeRejeterRequest $request, Demande $demande)
    {
        $demande = DemandeService::rejeter($demande, $request->user(), $request->validated('motif'));
        $demande->load(['bien', 'demandeur']);

        return response()->json([
            'data' => $demande,
            'message' => 'Demande rejetée.',
            'errors' => null,
        ]);
    }
}
