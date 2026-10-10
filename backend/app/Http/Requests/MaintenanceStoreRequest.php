<?php

namespace App\Http\Requests;

use Illuminate\Foundation\Http\FormRequest;

class MaintenanceStoreRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    public function rules(): array
    {
        return [
            'bien_id' => ['required', 'exists:biens,id'],
            'type' => ['required', 'in:preventive,corrective'],
            'date_prevue' => ['required', 'date'],
            'prestataire_id' => ['nullable', 'exists:fournisseurs,id'],
        ];
    }
}
