<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Affectation;
use App\Models\Bien;
use App\Models\Demande;
use App\Models\Maintenance;
use App\Models\Service;
use App\Models\User;
use Illuminate\Http\Request;
use Illuminate\Support\Carbon;

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
                        'label'   => ucfirst($d->type).' – '.($d->bien?->designation ?? ''),
                        'service' => $d->bien?->numero_inventaire,
                        'variant' => 'warn',
                        'statut'  => 'Soumise',
                    ]),
                'alertes' => $this->buildAlertes(),
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

    private function buildAlertes(): array
    {
        $alertes = [];

        // Garanties expirant dans 30 jours
        Bien::whereNotNull('fin_garantie')
            ->whereDate('fin_garantie', '>=', Carbon::today())
            ->whereDate('fin_garantie', '<=', Carbon::today()->addDays(30))
            ->orderBy('fin_garantie')
            ->take(5)
            ->each(function (Bien $b) use (&$alertes) {
                $jours = (int) Carbon::today()->diffInDays($b->fin_garantie);
                $alertes[] = [
                    'type'    => 'garantie',
                    'label'   => $b->designation,
                    'num'     => $b->numero_inventaire,
                    'info'    => "Garantie J-{$jours}",
                    'variant' => $jours <= 7 ? 'bad' : 'warn',
                ];
            });

        // Maintenances préventives dans 15 jours
        Bien::whereNotNull('prochaine_maintenance')
            ->whereDate('prochaine_maintenance', '>=', Carbon::today())
            ->whereDate('prochaine_maintenance', '<=', Carbon::today()->addDays(15))
            ->orderBy('prochaine_maintenance')
            ->take(5)
            ->each(function (Bien $b) use (&$alertes) {
                $jours = (int) Carbon::today()->diffInDays($b->prochaine_maintenance);
                $alertes[] = [
                    'type'    => 'maintenance',
                    'label'   => $b->designation,
                    'num'     => $b->numero_inventaire,
                    'info'    => "Maintenance J-{$jours}",
                    'variant' => 'warn',
                ];
            });

        // Prêts en retard ou dus aujourd'hui
        Affectation::with('bien')
            ->where('type', 'pret')
            ->whereNull('date_retour_effective')
            ->whereDate('date_retour_prevue', '<=', Carbon::today())
            ->orderBy('date_retour_prevue')
            ->take(5)
            ->each(function (Affectation $a) use (&$alertes) {
                $retard = (int) Carbon::parse($a->date_retour_prevue)->diffInDays(Carbon::today());
                $alertes[] = [
                    'type'    => 'pret',
                    'label'   => $a->bien?->designation ?? '—',
                    'num'     => $a->bien?->numero_inventaire ?? '',
                    'info'    => $retard === 0 ? 'Retour aujourd\'hui' : "Retard {$retard}j",
                    'variant' => $retard === 0 ? 'warn' : 'bad',
                ];
            });

        return $alertes;
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
