<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class Categorie extends Model
{
    protected $table = 'categories';

    protected $fillable = ['nom', 'code', 'duree_garantie_mois', 'periodicite_maintenance_mois'];
}
