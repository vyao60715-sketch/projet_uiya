<?php

namespace App\Http\Requests;

use Illuminate\Foundation\Http\FormRequest;

class MaintenanceUpdateRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    public function rules(): array
    {
        return [
            'prestataire_id' => ['nullable', 'exists:fournisseurs,id'],
            'cout' => ['nullable', 'integer', 'min:0'],
            'pieces' => ['nullable', 'string', 'max:1000'],
            'resultat' => ['nullable', 'string', 'max:2000'],
        ];
    }
}
