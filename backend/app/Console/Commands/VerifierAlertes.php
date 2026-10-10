<?php

namespace App\Console\Commands;

use App\Models\Affectation;
use App\Models\Bien;
use App\Models\User;
use App\Notifications\AlerteGarantie;
use App\Notifications\AlerteMaintenance;
use App\Notifications\AlertePret;
use Illuminate\Console\Command;
use Illuminate\Support\Carbon;

class VerifierAlertes extends Command
{
    protected $signature   = 'uiya:alertes';
    protected $description = 'Envoie les alertes quotidiennes : garanties J-30, maintenances J-15, prêts J-1/J/retard';

    public function handle(): int
    {
        $gestionnaires = User::role(['admin', 'gestionnaire'])->get();

        $this->alertesGaranties($gestionnaires);
        $this->alertesMaintenances($gestionnaires);
        $this->alertesPrets($gestionnaires);

        $this->info('Alertes envoyées.');

        return self::SUCCESS;
    }

    private function alertesGaranties($gestionnaires): void
    {
        $cible = Carbon::today()->addDays(30)->toDateString();

        Bien::whereDate('fin_garantie', $cible)->each(function (Bien $bien) use ($gestionnaires) {
            foreach ($gestionnaires as $user) {
                $user->notify(new AlerteGarantie($bien, 30));
            }
        });
    }

    private function alertesMaintenances($gestionnaires): void
    {
        $cible = Carbon::today()->addDays(15)->toDateString();

        Bien::whereDate('prochaine_maintenance', $cible)->each(function (Bien $bien) use ($gestionnaires) {
            foreach ($gestionnaires as $user) {
                $user->notify(new AlerteMaintenance($bien, 15));
            }
        });
    }

    private function alertesPrets($gestionnaires): void
    {
        $today    = Carbon::today();
        $demain   = Carbon::tomorrow()->toDateString();
        $ajd      = $today->toDateString();

        // J-1 : retour prévu demain
        Affectation::with('bien')
            ->where('type', 'pret')
            ->whereNull('date_retour_effective')
            ->whereDate('date_retour_prevue', $demain)
            ->each(fn (Affectation $a) => $this->notifierPret($a, 'demain', $gestionnaires));

        // J0 : retour prévu aujourd'hui
        Affectation::with('bien')
            ->where('type', 'pret')
            ->whereNull('date_retour_effective')
            ->whereDate('date_retour_prevue', $ajd)
            ->each(fn (Affectation $a) => $this->notifierPret($a, 'aujourd_hui', $gestionnaires));

        // Retard : date dépassée
        Affectation::with('bien')
            ->where('type', 'pret')
            ->whereNull('date_retour_effective')
            ->whereDate('date_retour_prevue', '<', $ajd)
            ->each(fn (Affectation $a) => $this->notifierPret($a, 'retard', $gestionnaires));
    }

    private function notifierPret(Affectation $affectation, string $niveau, $gestionnaires): void
    {
        foreach ($gestionnaires as $user) {
            $user->notify(new AlertePret($affectation, $niveau));
        }

        // Notifier aussi le responsable du prêt
        if ($affectation->responsable_id) {
            $responsable = User::find($affectation->responsable_id);
            $responsable?->notify(new AlertePret($affectation, $niveau));
        }
    }
}
