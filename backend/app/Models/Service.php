<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\HasMany;

class Service extends Model
{
    protected $table = 'services';

    protected $fillable = ['nom', 'code'];

    public function users(): HasMany
    {
        return $this->hasMany(User::class);
    }
}
