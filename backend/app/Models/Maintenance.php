<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class Maintenance extends Model
{
    protected $table = 'maintenances';

    protected $fillable = [
        'bien_id', 'type', 'statut', 'date_prevue', 'date_realisee',
        'prestataire_id', 'cout', 'pieces', 'resultat', 'sous_garantie',
        'demande_id', 'cree_par',
    ];

    protected $casts = [
        'date_prevue' => 'date',
        'date_realisee' => 'datetime',
        'cout' => 'integer',
        'sous_garantie' => 'boolean',
    ];

    public function bien(): BelongsTo
    {
        return $this->belongsTo(Bien::class);
    }

    public function prestataire(): BelongsTo
    {
        return $this->belongsTo(Fournisseur::class, 'prestataire_id');
    }

    public function demande(): BelongsTo
    {
        return $this->belongsTo(Demande::class);
    }

    public function creePar(): BelongsTo
    {
        return $this->belongsTo(User::class, 'cree_par');
    }
}
