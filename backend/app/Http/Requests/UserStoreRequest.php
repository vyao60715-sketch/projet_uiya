<?php

namespace App\Http\Requests;

use Illuminate\Foundation\Http\FormRequest;

class UserStoreRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    public function rules(): array
    {
        return [
            'name' => ['required', 'string', 'max:255'],
            'email' => ['required', 'email', 'unique:users,email'],
            'password' => ['required', 'string', 'min:8'],
            'service_id' => ['nullable', 'exists:services,id'],
            'role' => ['required', 'in:admin,gestionnaire,responsable,agent'],
            'actif' => ['boolean'],
        ];
    }
}
