<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Http\Requests\CampagneStoreRequest;
use App\Http\Requests\ControleSyncRequest;
use App\Models\Campagne;
use App\Services\CampagneService;
use Illuminate\Http\Request;
use Illuminate\Validation\ValidationException;

class CampagneController extends Controller
{
    public function index(Request $request)
    {
        $query = Campagne::query()->with(['service', 'creePar'])->orderByDesc('created_at');

        if ($request->filled('statut')) {
            $query->where('statut', $request->statut);
        }

        return response()->json([
            'data'    => $query->get()->map(fn (Campagne $c) => $this->format($c)),
            'message' => null,
            'errors'  => null,
        ]);
    }

    public function store(CampagneStoreRequest $request)
    {
        // Une seule campagne en cours à la fois
        if (Campagne::where('statut', 'en_cours')->exists()) {
            throw ValidationException::withMessages([
                'statut' => ['Une campagne est déjà en cours. Clôturez-la avant d\'en créer une nouvelle.'],
            ]);
        }

        $campagne = CampagneService::creer($request->validated(), $request->user());
        $campagne->load(['service', 'creePar']);

        return response()->json([
            'data'    => $this->format($campagne),
            'message' => 'Campagne créée.',
            'errors'  => null,
        ], 201);
    }

    public function show(Campagne $campagne)
    {
        $campagne->load(['service', 'creePar']);

        return response()->json([
            'data'    => array_merge(
                $this->format($campagne),
                ['rapport' => CampagneService::rapport($campagne)]
            ),
            'message' => null,
            'errors'  => null,
        ]);
    }

    public function sync(ControleSyncRequest $request, Campagne $campagne)
    {
        try {
            $resultats = CampagneService::synchroniser($campagne, $request->validated('controles'), $request->user());
        } catch (\RuntimeException $e) {
            throw ValidationException::withMessages(['statut' => [$e->getMessage()]]);
        }

        return response()->json([
            'data'    => $resultats,
            'message' => count($resultats).' contrôle(s) synchronisé(s).',
            'errors'  => null,
        ]);
    }

    public function cloturer(Request $request, Campagne $campagne)
    {
        try {
            $rapport = CampagneService::cloturer($campagne, $request->user());
        } catch (\RuntimeException $e) {
            throw ValidationException::withMessages(['statut' => [$e->getMessage()]]);
        }

        return response()->json([
            'data'    => $rapport,
            'message' => 'Campagne clôturée.',
            'errors'  => null,
        ]);
    }

    public function rapport(Campagne $campagne)
    {
        return response()->json([
            'data'    => CampagneService::rapport($campagne),
            'message' => null,
            'errors'  => null,
        ]);
    }

    private function format(Campagne $c): array
    {
        $total     = $c->nb_biens_attendus;
        $controles = $c->nb_controles;

        return [
            'id'               => $c->id,
            'nom'              => $c->nom,
            'description'      => $c->description,
            'statut'           => $c->statut,
            'date_debut'       => $c->date_debut?->toDateString(),
            'date_fin_prevue'  => $c->date_fin_prevue?->toDateString(),
            'date_cloture'     => $c->date_cloture?->toDateString(),
            'service'          => $c->service?->nom,
            'cree_par'         => $c->creePar?->name,
            'total'            => $total,
            'controles'        => $controles,
            'pct'              => $total > 0 ? round(($controles / $total) * 100) : 0,
        ];
    }
}
