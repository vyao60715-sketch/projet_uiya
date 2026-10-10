<?php

namespace App\Services;

use App\Models\JournalAudit;
use Illuminate\Support\Facades\Request;

class AuditService
{
    public static function enregistrer(string $action, string $entite, ?int $entiteId, ?array $avant = null, ?array $apres = null): void
    {
        JournalAudit::create([
            'user_id' => auth()->id(),
            'action' => $action,
            'entite' => $entite,
            'entite_id' => $entiteId,
            'avant' => $avant,
            'apres' => $apres,
            'ip' => Request::ip(),
            'date' => now(),
        ]);
    }
}
