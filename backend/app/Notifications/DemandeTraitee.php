<?php

namespace App\Notifications;

use App\Models\Demande;
use Illuminate\Bus\Queueable;
use Illuminate\Contracts\Queue\ShouldQueue;
use Illuminate\Notifications\Messages\MailMessage;
use Illuminate\Notifications\Notification;

class DemandeTraitee extends Notification implements ShouldQueue
{
    use Queueable;

    public function __construct(
        public Demande $demande,
        public string $resultat,
    ) {}

    public function via(object $notifiable): array
    {
        return ['database', 'mail'];
    }

    public function toMail(object $notifiable): MailMessage
    {
        $label = $this->resultat === 'validee' ? 'validée' : 'rejetée';

        $message = (new MailMessage)
            ->subject("Demande #{$this->demande->id} {$label}")
            ->line("Votre demande sur le bien {$this->demande->bien?->numero_inventaire} a été {$label}.");

        if ($this->resultat === 'rejetee' && $this->demande->decision_motif) {
            $message->line("Motif : {$this->demande->decision_motif}");
        }

        return $message;
    }

    public function toArray(object $notifiable): array
    {
        return [
            'type' => 'demande_traitee',
            'demande_id' => $this->demande->id,
            'bien_id' => $this->demande->bien_id,
            'numero_inventaire' => $this->demande->bien?->numero_inventaire,
            'resultat' => $this->resultat,
            'decision_motif' => $this->demande->decision_motif,
            'message' => $this->resultat === 'validee'
                ? "Votre demande sur {$this->demande->bien?->numero_inventaire} a été validée."
                : "Votre demande sur {$this->demande->bien?->numero_inventaire} a été rejetée.",
        ];
    }
}
