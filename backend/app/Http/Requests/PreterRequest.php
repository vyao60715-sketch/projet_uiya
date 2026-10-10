<?php

namespace App\Http\Requests;

use Illuminate\Foundation\Http\FormRequest;

class PreterRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    public function rules(): array
    {
        return [
            'service_id' => ['required', 'exists:services,id'],
            'salle_id' => ['nullable', 'exists:salles,id'],
            'responsable_id' => ['nullable', 'exists:users,id'],
            // RG-04 : un prêt a toujours une date de retour.
            'date_retour_prevue' => ['required', 'date', 'after:today'],
            'motif' => ['nullable', 'string', 'max:500'],
        ];
    }
}
