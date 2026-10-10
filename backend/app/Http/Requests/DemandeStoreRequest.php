<?php

namespace App\Http\Requests;

use Illuminate\Foundation\Http\FormRequest;

class DemandeStoreRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    public function rules(): array
    {
        return [
            'bien_id' => ['required', 'exists:biens,id'],
            'type' => ['required', 'in:transfert,panne,perte'],
            'motif' => ['required', 'string', 'max:2000'],
            'photo' => ['nullable', 'image', 'mimes:jpeg,png', 'max:2048'],
            'service_destination_id' => ['required_if:type,transfert', 'nullable', 'exists:services,id'],
            'salle_destination_id' => ['nullable', 'exists:salles,id'],
        ];
    }
}
