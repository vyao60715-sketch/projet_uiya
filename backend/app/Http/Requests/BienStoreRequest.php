<?php

namespace App\Http\Requests;

use Illuminate\Foundation\Http\FormRequest;

class BienStoreRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    public function rules(): array
    {
        return [
            'designation' => ['required', 'string', 'max:255'],
            'categorie_id' => ['required', 'exists:categories,id'],
            'marque' => ['nullable', 'string', 'max:255'],
            'modele' => ['nullable', 'string', 'max:255'],
            'numero_serie' => ['nullable', 'string', 'max:255'],
            'fournisseur_id' => ['nullable', 'exists:fournisseurs,id'],
            'date_acquisition' => ['required', 'date', 'before_or_equal:today'],
            'prix' => ['nullable', 'integer', 'min:0'],
            'etat' => ['required', 'in:Neuf,Bon,Moyen,Dégradé,Hors service'],
            'duree_garantie_mois' => ['nullable', 'integer', 'min:0', 'max:240'],
            'observations' => ['nullable', 'string', 'max:2000'],
            'photo' => ['nullable', 'image', 'mimes:jpeg,png', 'max:2048'],
        ];
    }
}
