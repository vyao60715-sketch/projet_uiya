<?php

namespace App\Http\Requests;

use Illuminate\Foundation\Http\FormRequest;

class CampagneStoreRequest extends FormRequest
{
    public function authorize(): bool { return true; }

    public function rules(): array
    {
        return [
            'nom'             => ['required', 'string', 'max:255'],
            'description'     => ['nullable', 'string', 'max:2000'],
            'date_debut'      => ['nullable', 'date'],
            'date_fin_prevue' => ['nullable', 'date', 'after_or_equal:date_debut'],
            'service_id'      => ['nullable', 'exists:services,id'],
        ];
    }
}
