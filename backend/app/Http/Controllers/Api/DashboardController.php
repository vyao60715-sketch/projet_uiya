<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Bien;
use App\Models\Demande;
use App\Models\Maintenance;
use App\Models\Service;
use App\Models\User;
use Illuminate\Http\Request;

class DashboardController extends Controller
{
    public function index(Request $request)
    {
        $user = $request->user();

        $indicateurs = [];

        if ($user->hasRole('admin')) {
            $indicateurs = [
                'utilisateurs' => User::count(),
                'services' => Service::count(),
            ];
        }

        if ($user->hasAnyRole(['admin', 'gestionnaire'])) {
            $indicateurs = array_merge($indicateurs, [
                'total' => Bien::count(),
                'disponibles' => Bien::where('statut', 'Disponible')->count(),
                'affectes' => Bien::where('statut', 'Affecté')->count(),
                'enPret' => Bien::where('statut', 'En prêt')->count(),
                'maintenance' => Bien::where('statut', 'En maintenance')->count(),
                'perdus' => Bien::where('statut', 'Perdu')->count(),
                'reformes' => Bien::where('statut', 'Réformé')->count(),
                'correctivesEnCours' => Maintenance::where('type', 'corrective')->where('statut', 'en_cours')->count(),
                'demandesAttente' => Demande::where('statut', 'soumise')->count(),
                'demandes' => Demande::where('statut', 'soumise')
                    ->with('bien')
                    ->latest()
                    ->take(5)
                    ->get()
                    ->map(fn (Demande $d) => [
                        'label' => ucfirst($d->type).' – '.($d->bien?->designation ?? ''),
                        'service' => $d->bien?->numero_inventaire,
                        'variant' => 'warn',
                        'statut' => 'Soumise',
                    ]),
            ]);
        }

        return response()->json([
            'data' => [
                'roles' => $user->getRoleNames(),
                'indicateurs' => $indicateurs,
            ],
            'message' => null,
            'errors' => null,
        ]);
    }

    public function notifications(Request $request)
    {
        $notifications = $request->user()->notifications()->take(20)->get();

        return response()->json([
            'data' => $notifications,
            'message' => null,
            'errors' => null,
        ]);
    }

    public function marquerLue(Request $request, string $id)
    {
        $notification = $request->user()->notifications()->findOrFail($id);
        $notification->markAsRead();

        return response()->json([
            'data' => null,
            'message' => 'Notification marquée comme lue.',
            'errors' => null,
        ]);
    }
}
