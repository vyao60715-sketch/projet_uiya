<?php

namespace App\Notifications;

use App\Models\Bien;
use Illuminate\Bus\Queueable;
use Illuminate\Contracts\Queue\ShouldQueue;
use Illuminate\Notifications\Messages\MailMessage;
use Illuminate\Notifications\Notification;

class AlerteMaintenance extends Notification implements ShouldQueue
{
    use Queueable;

    public function __construct(public Bien $bien, public int $joursRestants) {}

    public function via(object $notifiable): array
    {
        return ['database', 'mail'];
    }

    public function toArray(object $notifiable): array
    {
        return [
            'type'               => 'alerte_maintenance',
            'bien_id'            => $this->bien->id,
            'designation'        => $this->bien->designation,
            'numero'             => $this->bien->numero_inventaire,
            'jours_restants'     => $this->joursRestants,
            'prochaine_maintenance' => $this->bien->prochaine_maintenance?->toDateString(),
        ];
    }

    public function toMail(object $notifiable): MailMessage
    {
        return (new MailMessage)
            ->subject("Maintenance préventive – {$this->bien->numero_inventaire}")
            ->line("Une maintenance préventive est prévue dans **{$this->joursRestants} jour(s)** pour le bien **{$this->bien->designation}** ({$this->bien->numero_inventaire}).")
            ->line("Date prévue : {$this->bien->prochaine_maintenance?->format('d/m/Y')}.")
            ->action('Planifier la maintenance', config('app.frontend_url').'/maintenances');
    }
}
