<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class ControleInventaire extends Model
{
    protected $table = 'controles_inventaire';

    protected $fillable = [
        'campagne_id', 'bien_id',
        'resultat', 'salle_constatee', 'remarque',
        'controle_par', 'controle_le',
    ];

    protected $casts = [
        'controle_le' => 'datetime',
    ];

    public function campagne(): BelongsTo
    {
        return $this->belongsTo(Campagne::class);
    }

    public function bien(): BelongsTo
    {
        return $this->belongsTo(Bien::class);
    }

    public function controlePar(): BelongsTo
    {
        return $this->belongsTo(User::class, 'controle_par');
    }
}
