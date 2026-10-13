<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\JournalAudit;
use Illuminate\Http\Request;

class AuditController extends Controller
{
    public function index(Request $request)
    {
        $request->validate([
            'entite'   => 'nullable|string|max:50',
            'action'   => 'nullable|string|max:50',
            'user_id'  => 'nullable|integer|exists:users,id',
            'date_debut' => 'nullable|date',
            'date_fin'   => 'nullable|date',
            'per_page'   => 'nullable|integer|min:10|max:200',
        ]);

        $entries = JournalAudit::with('user')
            ->when($request->entite,    fn ($q) => $q->where('entite', $request->entite))
            ->when($request->action,    fn ($q) => $q->where('action', 'like', "%{$request->action}%"))
            ->when($request->user_id,   fn ($q) => $q->where('user_id', $request->user_id))
            ->when($request->date_debut, fn ($q) => $q->whereDate('date', '>=', $request->date_debut))
            ->when($request->date_fin,   fn ($q) => $q->whereDate('date', '<=', $request->date_fin))
            ->orderBy('date', 'desc')
            ->paginate($request->per_page ?? 50);

        return response()->json([
            'data'    => $entries->map(fn (JournalAudit $e) => [
                'id'        => $e->id,
                'date'      => $e->date->format('d/m/Y H:i:s'),
                'utilisateur' => $e->user?->name ?? 'Système',
                'action'    => $e->action,
                'entite'    => $e->entite,
                'entite_id' => $e->entite_id,
                'ip'        => $e->ip,
                'avant'     => $e->avant,
                'apres'     => $e->apres,
            ]),
            'meta'    => [
                'total'        => $entries->total(),
                'current_page' => $entries->currentPage(),
                'last_page'    => $entries->lastPage(),
                'per_page'     => $entries->perPage(),
            ],
            'message' => null,
            'errors'  => null,
        ]);
    }
}
