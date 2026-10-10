<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class Salle extends Model
{
    protected $table = 'salles';

    protected $fillable = ['nom', 'code', 'batiment_id'];

    public function batiment(): BelongsTo
    {
        return $this->belongsTo(Batiment::class);
    }
}
