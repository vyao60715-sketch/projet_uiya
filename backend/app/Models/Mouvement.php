<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class Mouvement extends Model
{
    protected $table = 'mouvements';

    public $timestamps = false;

    protected $fillable = ['bien_id', 'type', 'origine', 'destination', 'motif', 'auteur_id', 'date'];

    protected $casts = [
        'date' => 'datetime',
    ];

    public function bien(): BelongsTo
    {
        return $this->belongsTo(Bien::class);
    }

    public function auteur(): BelongsTo
    {
        return $this->belongsTo(User::class, 'auteur_id');
    }
}
