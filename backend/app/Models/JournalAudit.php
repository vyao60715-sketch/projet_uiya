<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class JournalAudit extends Model
{
    protected $table = 'journal_audit';

    public $timestamps = false;

    protected $fillable = ['user_id', 'action', 'entite', 'entite_id', 'avant', 'apres', 'ip', 'date'];

    protected $casts = [
        'avant' => 'array',
        'apres' => 'array',
        'date' => 'datetime',
    ];

    public function user(): BelongsTo
    {
        return $this->belongsTo(User::class);
    }
}
