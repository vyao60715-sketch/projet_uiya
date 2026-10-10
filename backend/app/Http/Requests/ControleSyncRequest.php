<?php

namespace App\Http\Requests;

use Illuminate\Foundation\Http\FormRequest;

class ControleSyncRequest extends FormRequest
{
    public function authorize(): bool { return true; }

    public function rules(): array
    {
        return [
            'controles'                   => ['required', 'array', 'min:1'],
            'controles.*.uuid_qr'         => ['nullable', 'string'],
            'controles.*.bien_id'         => ['nullable', 'integer'],
            'controles.*.resultat'        => ['required', 'in:present,absent,deplace,deteriore'],
            'controles.*.salle_constatee' => ['nullable', 'string', 'max:255'],
            'controles.*.remarque'        => ['nullable', 'string', 'max:1000'],
            'controles.*.controle_le'     => ['nullable', 'date'],
        ];
    }
}
