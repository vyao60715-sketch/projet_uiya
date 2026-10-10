<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Http\Requests\AffecterRequest;
use App\Http\Requests\PreterRequest;
use App\Http\Requests\RetourRequest;
use App\Http\Requests\TransfererRequest;
use App\Models\Bien;
use App\Services\AffectationService;

class AffectationController extends Controller
{
    public function affecter(AffecterRequest $request, Bien $bien)
    {
        $affectation = AffectationService::affecter($bien, $request->validated());
        $affectation->load(['service', 'salle', 'responsable']);

        return response()->json([
            'data' => ['bien' => $bien->fresh(), 'affectation' => $affectation],
            'message' => 'Bien affecté.',
            'errors' => null,
        ], 201);
    }

    public function transferer(TransfererRequest $request, Bien $bien)
    {
        $affectation = AffectationService::transferer($bien, $request->validated());
        $affectation->load(['service', 'salle', 'responsable']);

        return response()->json([
            'data' => ['bien' => $bien->fresh(), 'affectation' => $affectation],
            'message' => 'Bien transféré.',
            'errors' => null,
        ], 201);
    }

    public function preter(PreterRequest $request, Bien $bien)
    {
        $affectation = AffectationService::preter($bien, $request->validated());
        $affectation->load(['service', 'salle', 'responsable']);

        return response()->json([
            'data' => ['bien' => $bien->fresh(), 'affectation' => $affectation],
            'message' => 'Bien prêté.',
            'errors' => null,
        ], 201);
    }

    public function retour(RetourRequest $request, Bien $bien)
    {
        $bien = AffectationService::retour($bien, $request->validated('motif'));

        return response()->json([
            'data' => ['bien' => $bien],
            'message' => 'Retour enregistré.',
            'errors' => null,
        ]);
    }

    public function historique(Bien $bien)
    {
        $mouvements = $bien->mouvements()->with('auteur')->get();

        return response()->json([
            'data' => $mouvements,
            'message' => null,
            'errors' => null,
        ]);
    }
}
