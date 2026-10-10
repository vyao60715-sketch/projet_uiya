<?php

namespace App\Models;

use App\Services\NumeroInventaireService;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Illuminate\Database\Eloquent\Relations\HasOne;
use Illuminate\Support\Str;

class Bien extends Model
{
    use HasFactory;

    protected $table = 'biens';

    protected $fillable = [
        'designation', 'categorie_id', 'marque', 'modele', 'numero_serie',
        'fournisseur_id', 'date_acquisition', 'prix', 'etat', 'statut',
        'duree_garantie_mois', 'photo', 'observations', 'cree_par',
    ];

    protected $casts = [
        'date_acquisition' => 'date',
        'fin_garantie' => 'date',
        'prochaine_maintenance' => 'date',
        'prix' => 'integer',
        'duree_garantie_mois' => 'integer',
        'categorie_id' => 'integer',
        'fournisseur_id' => 'integer',
    ];

    protected static function booted(): void
    {
        static::creating(function (Bien $bien) {
            $bien->uuid_qr ??= (string) Str::uuid();
            $bien->statut ??= 'Disponible';
            $bien->cree_par ??= auth()->id();

            $categorie = $bien->categorie ?? Categorie::find($bien->categorie_id);

            if (! $bien->numero_inventaire && $categorie) {
                $bien->numero_inventaire = NumeroInventaireService::generer($categorie);
            }

            if ($bien->duree_garantie_mois === null && $categorie) {
                $bien->duree_garantie_mois = $categorie->duree_garantie_mois;
            }

            if ($bien->date_acquisition) {
                $acquisition = \Carbon\Carbon::parse($bien->date_acquisition);

                if ($bien->duree_garantie_mois) {
                    $bien->fin_garantie = $acquisition->copy()->addMonths((int) $bien->duree_garantie_mois);
                }

                if ($categorie && $categorie->periodicite_maintenance_mois) {
                    $bien->prochaine_maintenance = $acquisition->copy()->addMonths((int) $categorie->periodicite_maintenance_mois);
                }
            }
        });
    }

    public function categorie(): BelongsTo
    {
        return $this->belongsTo(Categorie::class);
    }

    public function fournisseur(): BelongsTo
    {
        return $this->belongsTo(Fournisseur::class);
    }

    public function creePar(): BelongsTo
    {
        return $this->belongsTo(User::class, 'cree_par');
    }

    public function affectations(): HasMany
    {
        return $this->hasMany(Affectation::class);
    }

    public function affectationActuelle(): HasOne
    {
        return $this->hasOne(Affectation::class)->whereNull('date_retour_effective')->latestOfMany();
    }

    public function mouvements(): HasMany
    {
        return $this->hasMany(Mouvement::class)->orderByDesc('date');
    }

    public function demandes(): HasMany
    {
        return $this->hasMany(Demande::class);
    }

    public function maintenances(): HasMany
    {
        return $this->hasMany(Maintenance::class);
    }
}
