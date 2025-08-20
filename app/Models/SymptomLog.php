<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class SymptomLog extends Model
{
    use HasFactory;

    protected $fillable = [
        'user_id',
        'symptom',
        'severity',
        'notes',
        'occurred_at',
    ];

    protected function casts(): array
    {
        return [
            'occurred_at' => 'datetime',
            'severity' => 'integer',
        ];
    }

    /**
     * Get the user that owns the symptom log.
     */
    public function user(): BelongsTo
    {
        return $this->belongsTo(User::class);
    }

    /**
     * Scope to filter by symptom type.
     */
    public function scopeSymptom($query, $symptom)
    {
        return $query->where('symptom', $symptom);
    }

    /**
     * Scope to filter by date range.
     */
    public function scopeBetweenDates($query, $startDate, $endDate)
    {
        return $query->whereBetween('occurred_at', [$startDate, $endDate]);
    }

    /**
     * Scope to filter by severity range.
     */
    public function scopeSeverityRange($query, $minSeverity, $maxSeverity = null)
    {
        if ($maxSeverity) {
            return $query->whereBetween('severity', [$minSeverity, $maxSeverity]);
        }
        return $query->where('severity', '>=', $minSeverity);
    }
}
