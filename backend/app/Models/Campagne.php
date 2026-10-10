<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;

class Campagne extends Model
{
    protected $fillable = [
        'nom', 'description', 'statut',
        'date_debut', 'date_fin_prevue', 'date_cloture',
        'service_id', 'cree_par',
        'nb_biens_attendus', 'nb_controles',
    ];

    protected $casts = [
        'date_debut'      => 'date',
        'date_fin_prevue' => 'date',
        'date_cloture'    => 'date',
        'nb_biens_attendus' => 'integer',
        'nb_controles'      => 'integer',
    ];

    public function service(): BelongsTo
    {
        return $this->belongsTo(Service::class);
    }

    public function creePar(): BelongsTo
    {
        return $this->belongsTo(User::class, 'cree_par');
    }

    public function controles(): HasMany
    {
        return $this->hasMany(ControleInventaire::class);
    }
}
