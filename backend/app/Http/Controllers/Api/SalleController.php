<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Salle;
use App\Services\AuditService;
use Illuminate\Http\Request;

class SalleController extends Controller
{
    public function index(Request $request)
    {
        $query = Salle::query()->with('batiment')->orderBy('nom');

        if ($request->filled('batiment_id')) {
            $query->where('batiment_id', $request->batiment_id);
        }

        return response()->json([
            'data' => $query->get(),
            'message' => null,
            'errors' => null,
        ]);
    }

    public function store(Request $request)
    {
        $data = $request->validate([
            'nom' => ['required', 'string', 'max:255'],
            'code' => ['required', 'string', 'max:50', 'unique:salles,code'],
            'batiment_id' => ['required', 'exists:batiments,id'],
        ]);

        $salle = Salle::create($data);

        AuditService::enregistrer('creation', 'salles', $salle->id, null, $salle->toArray());

        return response()->json([
            'data' => $salle,
            'message' => 'Salle créée.',
            'errors' => null,
        ], 201);
    }

    public function update(Request $request, Salle $salle)
    {
        $data = $request->validate([
            'nom' => ['required', 'string', 'max:255'],
            'code' => ['required', 'string', 'max:50', 'unique:salles,code,'.$salle->id],
            'batiment_id' => ['required', 'exists:batiments,id'],
        ]);

        $avant = $salle->toArray();
        $salle->update($data);

        AuditService::enregistrer('modification', 'salles', $salle->id, $avant, $salle->toArray());

        return response()->json([
            'data' => $salle,
            'message' => 'Salle modifiée.',
            'errors' => null,
        ]);
    }

    public function destroy(Salle $salle)
    {
        $avant = $salle->toArray();
        $salle->delete();

        AuditService::enregistrer('suppression', 'salles', $salle->id, $avant, null);

        return response()->json([
            'data' => null,
            'message' => 'Salle supprimée.',
            'errors' => null,
        ]);
    }
}
