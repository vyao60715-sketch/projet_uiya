<?php

namespace App\Notifications;

use App\Models\Bien;
use Illuminate\Bus\Queueable;
use Illuminate\Contracts\Queue\ShouldQueue;
use Illuminate\Notifications\Messages\MailMessage;
use Illuminate\Notifications\Notification;

class AlerteGarantie extends Notification implements ShouldQueue
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
            'type'            => 'alerte_garantie',
            'bien_id'         => $this->bien->id,
            'designation'     => $this->bien->designation,
            'numero'          => $this->bien->numero_inventaire,
            'jours_restants'  => $this->joursRestants,
            'fin_garantie'    => $this->bien->fin_garantie?->toDateString(),
        ];
    }

    public function toMail(object $notifiable): MailMessage
    {
        return (new MailMessage)
            ->subject("Garantie expirante – {$this->bien->numero_inventaire}")
            ->line("La garantie du bien **{$this->bien->designation}** ({$this->bien->numero_inventaire}) expire dans **{$this->joursRestants} jour(s)**.")
            ->line("Date d'expiration : {$this->bien->fin_garantie?->format('d/m/Y')}.")
            ->action('Voir le bien', config('app.frontend_url').'/biens/'.$this->bien->id);
    }
}
