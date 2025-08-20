<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class Alert extends Model
{
    use HasFactory;

    protected $fillable = [
        'user_id',
        'type',
        'severity',
        'summary',
        'details',
        'generated_at',
        'resolved_at',
    ];

    protected function casts(): array
    {
        return [
            'details' => 'array',
            'generated_at' => 'datetime',
            'resolved_at' => 'datetime',
            'severity' => 'integer',
        ];
    }

    /**
     * Get the user that owns the alert.
     */
    public function user(): BelongsTo
    {
        return $this->belongsTo(User::class);
    }

    /**
     * Scope to filter by alert type.
     */
    public function scopeType($query, $type)
    {
        return $query->where('type', $type);
    }

    /**
     * Scope to get unresolved alerts.
     */
    public function scopeUnresolved($query)
    {
        return $query->whereNull('resolved_at');
    }

    /**
     * Scope to get resolved alerts.
     */
    public function scopeResolved($query)
    {
        return $query->whereNotNull('resolved_at');
    }

    /**
     * Scope to order by severity (highest first).
     */
    public function scopeBySeverity($query)
    {
        return $query->orderBy('severity', 'desc');
    }

    /**
     * Mark alert as resolved.
     */
    public function resolve()
    {
        $this->update(['resolved_at' => now()]);
    }

    /**
     * Check if alert is resolved.
     */
    public function isResolved(): bool
    {
        return !is_null($this->resolved_at);
    }
}
