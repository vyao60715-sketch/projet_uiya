<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Categorie;
use App\Services\AuditService;
use Illuminate\Http\Request;

class CategorieController extends Controller
{
    public function index()
    {
        return response()->json([
            'data' => Categorie::orderBy('nom')->get(),
            'message' => null,
            'errors' => null,
        ]);
    }

    public function store(Request $request)
    {
        $data = $request->validate([
            'nom' => ['required', 'string', 'max:255', 'unique:categories,nom'],
            'code' => ['required', 'string', 'max:10', 'alpha', 'unique:categories,code'],
            'duree_garantie_mois' => ['nullable', 'integer', 'min:0'],
            'periodicite_maintenance_mois' => ['nullable', 'integer', 'min:0'],
        ]);
        $data['code'] = strtoupper($data['code']);
        $data['duree_garantie_mois'] ??= 0;
        $data['periodicite_maintenance_mois'] ??= 0;

        $categorie = Categorie::create($data);

        AuditService::enregistrer('creation', 'categories', $categorie->id, null, $categorie->toArray());

        return response()->json([
            'data' => $categorie,
            'message' => 'Catégorie créée.',
            'errors' => null,
        ], 201);
    }

    public function update(Request $request, Categorie $categorie)
    {
        $data = $request->validate([
            'nom' => ['required', 'string', 'max:255', 'unique:categories,nom,'.$categorie->id],
            'code' => ['required', 'string', 'max:10', 'alpha', 'unique:categories,code,'.$categorie->id],
            'duree_garantie_mois' => ['nullable', 'integer', 'min:0'],
            'periodicite_maintenance_mois' => ['nullable', 'integer', 'min:0'],
        ]);
        $data['code'] = strtoupper($data['code']);
        $data['duree_garantie_mois'] ??= 0;
        $data['periodicite_maintenance_mois'] ??= 0;

        $avant = $categorie->toArray();
        $categorie->update($data);

        AuditService::enregistrer('modification', 'categories', $categorie->id, $avant, $categorie->toArray());

        return response()->json([
            'data' => $categorie,
            'message' => 'Catégorie modifiée.',
            'errors' => null,
        ]);
    }

    public function destroy(Categorie $categorie)
    {
        $avant = $categorie->toArray();
        $categorie->delete();

        AuditService::enregistrer('suppression', 'categories', $categorie->id, $avant, null);

        return response()->json([
            'data' => null,
            'message' => 'Catégorie supprimée.',
            'errors' => null,
        ]);
    }
}
