<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Batiment;
use App\Services\AuditService;
use Illuminate\Http\Request;

class BatimentController extends Controller
{
    public function index()
    {
        return response()->json([
            'data' => Batiment::orderBy('nom')->get(),
            'message' => null,
            'errors' => null,
        ]);
    }

    public function store(Request $request)
    {
        $data = $request->validate([
            'nom' => ['required', 'string', 'max:255'],
            'code' => ['required', 'string', 'max:50', 'unique:batiments,code'],
        ]);

        $batiment = Batiment::create($data);

        AuditService::enregistrer('creation', 'batiments', $batiment->id, null, $batiment->toArray());

        return response()->json([
            'data' => $batiment,
            'message' => 'Bâtiment créé.',
            'errors' => null,
        ], 201);
    }

    public function update(Request $request, Batiment $batiment)
    {
        $data = $request->validate([
            'nom' => ['required', 'string', 'max:255'],
            'code' => ['required', 'string', 'max:50', 'unique:batiments,code,'.$batiment->id],
        ]);

        $avant = $batiment->toArray();
        $batiment->update($data);

        AuditService::enregistrer('modification', 'batiments', $batiment->id, $avant, $batiment->toArray());

        return response()->json([
            'data' => $batiment,
            'message' => 'Bâtiment modifié.',
            'errors' => null,
        ]);
    }

    public function destroy(Batiment $batiment)
    {
        $avant = $batiment->toArray();
        $batiment->delete();

        AuditService::enregistrer('suppression', 'batiments', $batiment->id, $avant, null);

        return response()->json([
            'data' => null,
            'message' => 'Bâtiment supprimé.',
            'errors' => null,
        ]);
    }
}
