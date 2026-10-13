<?php

namespace App\Http\Controllers\Api;

use App\Exports\BiensExport;
use App\Http\Controllers\Controller;
use App\Models\Affectation;
use App\Models\Bien;
use App\Models\Campagne;
use App\Models\Maintenance;
use App\Models\Service;
use Barryvdh\DomPDF\Facade\Pdf;
use Illuminate\Http\Request;
use Illuminate\Support\Carbon;
use Maatwebsite\Excel\Facades\Excel;

class RapportController extends Controller
{
    // ─── GET /rapports/biens ─────────────────────────────────────────────────
    public function biens(Request $request)
    {
        $q = Bien::with(['categorie', 'service'])
            ->when($request->service_id, fn ($q) => $q->where('service_id', $request->service_id))
            ->when($request->statut,     fn ($q) => $q->where('statut', $request->statut))
            ->when($request->etat,       fn ($q) => $q->where('etat', $request->etat))
            ->orderBy('numero_inventaire');

        $biens = $q->get()->map(fn (Bien $b) => [
            'id'                  => $b->id,
            'numero_inventaire'   => $b->numero_inventaire,
            'designation'         => $b->designation,
            'categorie'           => $b->categorie?->nom,
            'service'             => $b->service?->nom,
            'statut'              => $b->statut,
            'etat'                => $b->etat,
            'valeur_acquisition'  => $b->valeur_acquisition,
            'date_acquisition'    => $b->date_acquisition?->format('d/m/Y'),
            'fin_garantie'        => $b->fin_garantie?->format('d/m/Y'),
            'sous_garantie'       => $b->sous_garantie,
        ]);

        $stats = [
            'total'       => $biens->count(),
            'disponibles' => $biens->where('statut', 'Disponible')->count(),
            'affectes'    => $biens->where('statut', 'Affecté')->count(),
            'maintenance' => $biens->where('statut', 'En maintenance')->count(),
            'perdus'      => $biens->where('statut', 'Perdu')->count(),
            'reformes'    => $biens->where('statut', 'Réformé')->count(),
        ];

        return response()->json(['data' => compact('biens', 'stats'), 'message' => null, 'errors' => null]);
    }

    // ─── GET /rapports/biens/export/excel ────────────────────────────────────
    public function biensExcel(Request $request)
    {
        return Excel::download(new BiensExport($request->all()), 'rapport-biens.xlsx');
    }

    // ─── GET /rapports/biens/export/pdf ──────────────────────────────────────
    public function biensPdf(Request $request)
    {
        $biens = Bien::with(['categorie', 'service'])
            ->when($request->service_id, fn ($q) => $q->where('service_id', $request->service_id))
            ->when($request->statut,     fn ($q) => $q->where('statut', $request->statut))
            ->orderBy('numero_inventaire')
            ->get();

        $pdf = Pdf::loadView('pdf.rapport-biens', compact('biens'))
            ->setPaper('a4', 'landscape');

        return $pdf->download('rapport-biens.pdf');
    }

    // ─── GET /rapports/mouvements ────────────────────────────────────────────
    public function mouvements(Request $request)
    {
        $debut = $request->date_debut ? Carbon::parse($request->date_debut) : Carbon::now()->subDays(30);
        $fin   = $request->date_fin   ? Carbon::parse($request->date_fin)   : Carbon::now();

        $rows = Affectation::with(['bien', 'responsable', 'service'])
            ->whereBetween('created_at', [$debut->startOfDay(), $fin->endOfDay()])
            ->when($request->type,       fn ($q) => $q->where('type', $request->type))
            ->when($request->service_id, fn ($q) => $q->where('service_id', $request->service_id))
            ->orderBy('created_at', 'desc')
            ->get()
            ->map(fn (Affectation $a) => [
                'date'             => $a->created_at->format('d/m/Y H:i'),
                'type'             => ucfirst($a->type),
                'bien'             => $a->bien?->designation,
                'numero'           => $a->bien?->numero_inventaire,
                'service'          => $a->service?->nom,
                'utilisateur'      => $a->responsable?->name,
                'date_retour_prevue' => $a->date_retour_prevue?->format('d/m/Y'),
                'retourne'         => $a->date_retour_effective !== null,
            ]);

        return response()->json(['data' => ['mouvements' => $rows, 'total' => $rows->count()], 'message' => null, 'errors' => null]);
    }

    // ─── GET /rapports/maintenances ──────────────────────────────────────────
    public function maintenances(Request $request)
    {
        $rows = Maintenance::with(['bien', 'creePar'])
            ->when($request->statut, fn ($q) => $q->where('statut', $request->statut))
            ->when($request->type,   fn ($q) => $q->where('type', $request->type))
            ->orderBy('created_at', 'desc')
            ->get()
            ->map(fn (Maintenance $m) => [
                'id'               => $m->id,
                'bien'             => $m->bien?->designation,
                'numero'           => $m->bien?->numero_inventaire,
                'type'             => ucfirst($m->type),
                'statut'           => ucfirst(str_replace('_', ' ', $m->statut)),
                'date_prevue'      => $m->date_prevue?->format('d/m/Y'),
                'date_fin'         => $m->date_realisee?->format('d/m/Y'),
                'technicien'       => $m->creePar?->name,
                'cout'             => $m->cout,
                'resultat'         => $m->resultat,
            ]);

        $stats = [
            'total'      => $rows->count(),
            'en_cours'   => $rows->where('statut', 'En cours')->count(),
            'planifiees' => $rows->where('statut', 'Planifiee')->count(),
            'terminees'  => $rows->where('statut', 'Terminee')->count(),
            'cout_total' => $rows->sum('cout'),
        ];

        return response()->json(['data' => compact('rows', 'stats'), 'message' => null, 'errors' => null]);
    }

    // ─── GET /rapports/garanties ─────────────────────────────────────────────
    public function garanties(Request $request)
    {
        $horizon = (int) ($request->jours ?? 90);

        $biens = Bien::with(['categorie', 'service'])
            ->whereNotNull('fin_garantie')
            ->whereDate('fin_garantie', '>=', Carbon::today())
            ->whereDate('fin_garantie', '<=', Carbon::today()->addDays($horizon))
            ->orderBy('fin_garantie')
            ->get()
            ->map(fn (Bien $b) => [
                'numero'      => $b->numero_inventaire,
                'designation' => $b->designation,
                'categorie'   => $b->categorie?->nom,
                'service'     => $b->service?->nom,
                'fin_garantie' => $b->fin_garantie?->format('d/m/Y'),
                'jours_restants' => (int) Carbon::today()->diffInDays($b->fin_garantie),
            ]);

        return response()->json(['data' => ['biens' => $biens, 'total' => $biens->count()], 'message' => null, 'errors' => null]);
    }

    // ─── GET /rapports/inventaire ────────────────────────────────────────────
    public function inventaire(Request $request)
    {
        $campagnes = Campagne::with(['service', 'creePar'])
            ->when($request->statut, fn ($q) => $q->where('statut', $request->statut))
            ->orderBy('date_debut', 'desc')
            ->get()
            ->map(fn (Campagne $c) => [
                'id'             => $c->id,
                'nom'            => $c->nom,
                'statut'         => $c->statut,
                'service'        => $c->service?->nom ?? 'Tous services',
                'date_debut'     => $c->date_debut?->format('d/m/Y'),
                'date_cloture'   => $c->date_cloture?->format('d/m/Y'),
                'nb_attendus'    => $c->nb_biens_attendus,
                'nb_controles'   => $c->nb_controles,
                'pct'            => $c->nb_biens_attendus > 0
                    ? round($c->nb_controles / $c->nb_biens_attendus * 100)
                    : 0,
            ]);

        return response()->json(['data' => ['campagnes' => $campagnes], 'message' => null, 'errors' => null]);
    }

    // ─── GET /rapports/reformes ──────────────────────────────────────────────
    public function reformes(Request $request)
    {
        $biens = Bien::with(['categorie', 'service'])
            ->whereIn('statut', ['Réformé', 'Perdu'])
            ->when($request->statut, fn ($q) => $q->where('statut', $request->statut))
            ->orderBy('updated_at', 'desc')
            ->get()
            ->map(fn (Bien $b) => [
                'numero'          => $b->numero_inventaire,
                'designation'     => $b->designation,
                'categorie'       => $b->categorie?->nom,
                'service'         => $b->service?->nom,
                'statut'          => $b->statut,
                'valeur'          => $b->valeur_acquisition,
                'date_acquisition' => $b->date_acquisition?->format('d/m/Y'),
            ]);

        return response()->json(['data' => ['biens' => $biens, 'total' => $biens->count()], 'message' => null, 'errors' => null]);
    }

    // ─── GET /rapports/statistiques ──────────────────────────────────────────
    public function statistiques()
    {
        $parStatut = Bien::selectRaw('statut, COUNT(*) as nb')
            ->groupBy('statut')
            ->pluck('nb', 'statut');

        $parService = Bien::with('service')
            ->selectRaw('service_id, COUNT(*) as nb')
            ->groupBy('service_id')
            ->get()
            ->map(fn ($row) => [
                'service' => Service::find($row->service_id)?->nom ?? 'Non affecté',
                'nb'      => $row->nb,
            ]);

        $parCategorie = Bien::with('categorie')
            ->selectRaw('categorie_id, COUNT(*) as nb')
            ->groupBy('categorie_id')
            ->get()
            ->map(fn ($row) => [
                'categorie' => $row->categorie?->nom ?? '—',
                'nb'        => $row->nb,
            ]);

        $evolutionAcquisitions = Bien::whereNotNull('date_acquisition')
            ->where('date_acquisition', '>=', Carbon::now()->subYear())
            ->get(['date_acquisition'])
            ->groupBy(fn (Bien $b) => $b->date_acquisition->format('Y-m'))
            ->map(fn ($group, $key) => ['mois' => $key, 'nb' => $group->count()])
            ->values();

        return response()->json([
            'data' => compact('parStatut', 'parService', 'parCategorie', 'evolutionAcquisitions'),
            'message' => null,
            'errors'  => null,
        ]);
    }
}
