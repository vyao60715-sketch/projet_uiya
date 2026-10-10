<?php

namespace App\Http\Requests;

use Illuminate\Foundation\Http\FormRequest;

class AffecterRequest extends FormRequest
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
            'motif' => ['nullable', 'string', 'max:500'],
        ];
    }
}
