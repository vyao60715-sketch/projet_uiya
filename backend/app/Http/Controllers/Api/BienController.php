<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Http\Requests\BienStoreRequest;
use App\Http\Requests\BienUpdateRequest;
use App\Models\Bien;
use App\Services\AuditService;
use App\Services\QrService;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Storage;

class BienController extends Controller
{
    public function index(Request $request)
    {
        $query = Bien::query()->with(['categorie', 'fournisseur'])->orderByDesc('created_at');

        if ($request->filled('q')) {
            $q = $request->q;
            $query->where(function ($w) use ($q) {
                $w->where('designation', 'like', "%{$q}%")
                    ->orWhere('numero_inventaire', 'like', "%{$q}%")
                    ->orWhere('numero_serie', 'like', "%{$q}%");
            });
        }

        if ($request->filled('categorie_id')) {
            $query->where('categorie_id', $request->categorie_id);
        }

        if ($request->filled('statut')) {
            $query->where('statut', $request->statut);
        }

        return response()->json([
            'data' => $query->paginate(20)->items(),
            'message' => null,
            'errors' => null,
        ]);
    }

    public function store(BienStoreRequest $request)
    {
        $data = $request->validated();

        if ($request->hasFile('photo')) {
            $data['photo'] = $request->file('photo')->store('biens', 'local');
        }

        $bien = Bien::create($data);
        $bien->load(['categorie', 'fournisseur']);

        AuditService::enregistrer('creation', 'biens', $bien->id, null, $bien->toArray());

        return response()->json([
            'data' => $bien,
            'message' => 'Bien enregistré.',
            'errors' => null,
        ], 201);
    }

    public function show(Bien $bien)
    {
        $bien->load(['categorie', 'fournisseur', 'creePar']);

        return response()->json([
            'data' => $bien,
            'message' => null,
            'errors' => null,
        ]);
    }

    public function showByUuid(string $uuid)
    {
        $bien = Bien::where('uuid_qr', $uuid)->with(['categorie', 'fournisseur'])->firstOrFail();

        AuditService::enregistrer('consultation_qr', 'biens', $bien->id);

        return response()->json([
            'data' => $bien,
            'message' => null,
            'errors' => null,
        ]);
    }

    public function update(BienUpdateRequest $request, Bien $bien)
    {
        $data = $request->validated();
        $avant = $bien->toArray();

        if ($request->hasFile('photo')) {
            if ($bien->photo) {
                Storage::disk('local')->delete($bien->photo);
            }
            $data['photo'] = $request->file('photo')->store('biens', 'local');
        }

        $bien->update($data);
        $bien->load(['categorie', 'fournisseur']);

        AuditService::enregistrer('modification', 'biens', $bien->id, $avant, $bien->toArray());

        return response()->json([
            'data' => $bien,
            'message' => 'Bien modifié.',
            'errors' => null,
        ]);
    }

    public function destroy(Bien $bien)
    {
        $avant = $bien->toArray();

        if ($bien->photo) {
            Storage::disk('local')->delete($bien->photo);
        }

        $bien->delete();

        AuditService::enregistrer('suppression', 'biens', $bien->id, $avant, null);

        return response()->json([
            'data' => null,
            'message' => 'Bien supprimé.',
            'errors' => null,
        ]);
    }

    public function photo(Bien $bien)
    {
        if (! $bien->photo || ! Storage::disk('local')->exists($bien->photo)) {
            abort(404);
        }

        return Storage::disk('local')->response($bien->photo);
    }

    public function etiquette(Bien $bien)
    {
        $pdf = \Barryvdh\DomPDF\Facade\Pdf::loadView('etiquettes.unite', [
            'bien' => $bien,
            'qr' => QrService::svg($bien, 121),
        ])->setPaper('a4');

        return $pdf->stream("etiquette-{$bien->numero_inventaire}.pdf");
    }

    public function etiquettesPlanche(Request $request)
    {
        $ids = array_filter(explode(',', (string) $request->query('ids')));

        $biens = Bien::whereIn('id', $ids)->get();

        $pdf = \Barryvdh\DomPDF\Facade\Pdf::loadView('etiquettes.planche', [
            'biens' => $biens->map(fn (Bien $b) => ['bien' => $b, 'qr' => QrService::svg($b, 121)]),
        ])->setPaper('a4');

        return $pdf->stream('etiquettes-planche.pdf');
    }
}
