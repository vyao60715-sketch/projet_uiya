<?php

namespace App\Http\Requests;

use Illuminate\Foundation\Http\FormRequest;

class RetourRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    public function rules(): array
    {
        return [
            'motif' => ['nullable', 'string', 'max:500'],
        ];
    }
}
