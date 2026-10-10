<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Fournisseur;
use App\Services\AuditService;
use Illuminate\Http\Request;

class FournisseurController extends Controller
{
    public function index()
    {
        return response()->json([
            'data' => Fournisseur::orderBy('nom')->get(),
            'message' => null,
            'errors' => null,
        ]);
    }

    public function store(Request $request)
    {
        $data = $request->validate([
            'nom' => ['required', 'string', 'max:255'],
            'contact' => ['nullable', 'string', 'max:255'],
            'type' => ['required', 'in:fournisseur,prestataire'],
        ]);

        $fournisseur = Fournisseur::create($data);

        AuditService::enregistrer('creation', 'fournisseurs', $fournisseur->id, null, $fournisseur->toArray());

        return response()->json([
            'data' => $fournisseur,
            'message' => 'Fournisseur créé.',
            'errors' => null,
        ], 201);
    }

    public function update(Request $request, Fournisseur $fournisseur)
    {
        $data = $request->validate([
            'nom' => ['required', 'string', 'max:255'],
            'contact' => ['nullable', 'string', 'max:255'],
            'type' => ['required', 'in:fournisseur,prestataire'],
        ]);

        $avant = $fournisseur->toArray();
        $fournisseur->update($data);

        AuditService::enregistrer('modification', 'fournisseurs', $fournisseur->id, $avant, $fournisseur->toArray());

        return response()->json([
            'data' => $fournisseur,
            'message' => 'Fournisseur modifié.',
            'errors' => null,
        ]);
    }

    public function destroy(Fournisseur $fournisseur)
    {
        $avant = $fournisseur->toArray();
        $fournisseur->delete();

        AuditService::enregistrer('suppression', 'fournisseurs', $fournisseur->id, $avant, null);

        return response()->json([
            'data' => null,
            'message' => 'Fournisseur supprimé.',
            'errors' => null,
        ]);
    }
}
