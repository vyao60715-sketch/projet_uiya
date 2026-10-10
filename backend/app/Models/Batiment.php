<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\HasMany;

class Batiment extends Model
{
    protected $table = 'batiments';

    protected $fillable = ['nom', 'code'];

    public function salles(): HasMany
    {
        return $this->hasMany(Salle::class);
    }
}
