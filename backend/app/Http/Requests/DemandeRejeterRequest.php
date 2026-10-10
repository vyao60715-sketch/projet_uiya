<?php

namespace App\Http\Requests;

use Illuminate\Foundation\Http\FormRequest;

class DemandeRejeterRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    public function rules(): array
    {
        return [
            // RG-08 : un rejet de demande est toujours motivé.
            'motif' => ['required', 'string', 'max:1000'],
        ];
    }
}
