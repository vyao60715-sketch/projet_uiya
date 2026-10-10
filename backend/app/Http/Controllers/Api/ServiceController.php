<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Service;
use App\Services\AuditService;
use Illuminate\Http\Request;

class ServiceController extends Controller
{
    public function index()
    {
        return response()->json([
            'data' => Service::orderBy('nom')->get(),
            'message' => null,
            'errors' => null,
        ]);
    }

    public function store(Request $request)
    {
        $data = $request->validate([
            'nom' => ['required', 'string', 'max:255'],
            'code' => ['required', 'string', 'max:50', 'unique:services,code'],
        ]);

        $service = Service::create($data);

        AuditService::enregistrer('creation', 'services', $service->id, null, $service->toArray());

        return response()->json([
            'data' => $service,
            'message' => 'Service créé.',
            'errors' => null,
        ], 201);
    }

    public function update(Request $request, Service $service)
    {
        $data = $request->validate([
            'nom' => ['required', 'string', 'max:255'],
            'code' => ['required', 'string', 'max:50', 'unique:services,code,'.$service->id],
        ]);

        $avant = $service->toArray();
        $service->update($data);

        AuditService::enregistrer('modification', 'services', $service->id, $avant, $service->toArray());

        return response()->json([
            'data' => $service,
            'message' => 'Service modifié.',
            'errors' => null,
        ]);
    }

    public function destroy(Service $service)
    {
        $avant = $service->toArray();
        $service->delete();

        AuditService::enregistrer('suppression', 'services', $service->id, $avant, null);

        return response()->json([
            'data' => null,
            'message' => 'Service supprimé.',
            'errors' => null,
        ]);
    }
}
