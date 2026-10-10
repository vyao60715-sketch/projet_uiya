<?php

namespace App\Notifications;

use App\Models\Affectation;
use Illuminate\Bus\Queueable;
use Illuminate\Contracts\Queue\ShouldQueue;
use Illuminate\Notifications\Messages\MailMessage;
use Illuminate\Notifications\Notification;

class AlertePret extends Notification implements ShouldQueue
{
    use Queueable;

    public function __construct(public Affectation $affectation, public string $niveau) {}

    public function via(object $notifiable): array
    {
        return ['database', 'mail'];
    }

    public function toArray(object $notifiable): array
    {
        return [
            'type'                => 'alerte_pret',
            'affectation_id'      => $this->affectation->id,
            'bien_id'             => $this->affectation->bien_id,
            'designation'         => $this->affectation->bien?->designation,
            'numero'              => $this->affectation->bien?->numero_inventaire,
            'niveau'              => $this->niveau, // demain | aujourd_hui | retard
            'date_retour_prevue'  => $this->affectation->date_retour_prevue?->toDateString(),
        ];
    }

    public function toMail(object $notifiable): MailMessage
    {
        $bien = $this->affectation->bien;
        $date = $this->affectation->date_retour_prevue?->format('d/m/Y');

        $ligne = match ($this->niveau) {
            'demain'      => "Le retour du bien **{$bien->designation}** ({$bien->numero_inventaire}) est prévu **demain** ({$date}).",
            'aujourd_hui' => "Le retour du bien **{$bien->designation}** ({$bien->numero_inventaire}) est prévu **aujourd'hui** ({$date}).",
            'retard'      => "Le bien **{$bien->designation}** ({$bien->numero_inventaire}) n'a pas été retourné à la date prévue ({$date}).",
            default       => '',
        };

        return (new MailMessage)
            ->subject("Prêt en cours – {$bien->numero_inventaire}")
            ->line($ligne)
            ->action('Voir le bien', config('app.frontend_url').'/biens/'.$bien->id);
    }
}
