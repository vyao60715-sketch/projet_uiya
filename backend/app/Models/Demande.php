<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class Demande extends Model
{
    protected $table = 'demandes';

    protected $fillable = [
        'bien_id', 'type', 'motif', 'photo',
        'service_destination_id', 'salle_destination_id',
        'statut', 'decision_motif', 'demandeur_id', 'traite_par', 'traite_le',
    ];

    protected $casts = [
        'traite_le' => 'datetime',
    ];

    public function bien(): BelongsTo
    {
        return $this->belongsTo(Bien::class);
    }

    public function serviceDestination(): BelongsTo
    {
        return $this->belongsTo(Service::class, 'service_destination_id');
    }

    public function salleDestination(): BelongsTo
    {
        return $this->belongsTo(Salle::class, 'salle_destination_id');
    }

    public function demandeur(): BelongsTo
    {
        return $this->belongsTo(User::class, 'demandeur_id');
    }

    public function traitePar(): BelongsTo
    {
        return $this->belongsTo(User::class, 'traite_par');
    }
}
