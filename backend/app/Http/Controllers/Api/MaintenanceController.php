<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Http\Requests\MaintenanceStoreRequest;
use App\Http\Requests\MaintenanceUpdateRequest;
use App\Models\Bien;
use App\Models\Maintenance;
use App\Services\MaintenanceService;
use Illuminate\Http\Request;

class MaintenanceController extends Controller
{
    public function index(Request $request)
    {
        $query = Maintenance::query()->with(['bien', 'prestataire'])->orderByDesc('date_prevue');

        if ($request->filled('statut')) {
            $query->where('statut', $request->statut);
        }

        if ($request->filled('bien_id')) {
            $query->where('bien_id', $request->bien_id);
        }

        return response()->json([
            'data' => $query->get(),
            'message' => null,
            'errors' => null,
        ]);
    }

    public function store(MaintenanceStoreRequest $request)
    {
        $bien = Bien::findOrFail($request->validated('bien_id'));
        $maintenance = MaintenanceService::planifier($bien, $request->validated());
        $maintenance->load(['bien', 'prestataire']);

        return response()->json([
            'data' => $maintenance,
            'message' => 'Maintenance planifiée.',
            'errors' => null,
        ], 201);
    }

    public function update(MaintenanceUpdateRequest $request, Maintenance $maintenance)
    {
        $maintenance = MaintenanceService::mettreAJour($maintenance, $request->validated());
        $maintenance->load(['bien', 'prestataire']);

        return response()->json([
            'data' => $maintenance,
            'message' => 'Maintenance mise à jour.',
            'errors' => null,
        ]);
    }
}
