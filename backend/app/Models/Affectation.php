<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class Affectation extends Model
{
    protected $table = 'affectations';

    protected $fillable = [
        'bien_id', 'service_id', 'salle_id', 'responsable_id',
        'type', 'date_debut', 'date_retour_prevue', 'date_retour_effective',
    ];

    protected $casts = [
        'date_debut' => 'datetime',
        'date_retour_prevue' => 'date',
        'date_retour_effective' => 'datetime',
    ];

    public function bien(): BelongsTo
    {
        return $this->belongsTo(Bien::class);
    }

    public function service(): BelongsTo
    {
        return $this->belongsTo(Service::class);
    }

    public function salle(): BelongsTo
    {
        return $this->belongsTo(Salle::class);
    }

    public function responsable(): BelongsTo
    {
        return $this->belongsTo(User::class, 'responsable_id');
    }
}
