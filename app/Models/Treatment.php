<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class Treatment extends Model
{
    use HasFactory;

    protected $fillable = [
        'user_id',
        'name',
        'type',
        'dose',
        'notes',
        'administered_at',
    ];

    protected function casts(): array
    {
        return [
            'administered_at' => 'datetime',
        ];
    }

    /**
     * Get the user that owns the treatment.
     */
    public function user(): BelongsTo
    {
        return $this->belongsTo(User::class);
    }

    /**
     * Scope to filter by treatment name.
     */
    public function scopeTreatmentName($query, $name)
    {
        return $query->where('name', $name);
    }

    /**
     * Scope to filter by date range.
     */
    public function scopeBetweenDates($query, $startDate, $endDate)
    {
        return $query->whereBetween('administered_at', [$startDate, $endDate]);
    }

    /**
     * Scope to get treatments within a specific time window after this treatment.
     */
    public function scopeWithinHoursAfter($query, $baseDateTime, $hours)
    {
        $endTime = $baseDateTime->copy()->addHours($hours);
        return $query->whereBetween('administered_at', [$baseDateTime, $endTime]);
    }
}
