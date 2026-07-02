<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsToMany;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Illuminate\Database\Eloquent\SoftDeletes;
use Illuminate\Support\Facades\Cache;

class Customer extends Model
{
    use HasFactory, SoftDeletes;

    protected static function booted(): void
    {
        foreach (['created', 'updated', 'deleted', 'restored'] as $event) {
            static::$event(function (): void {
                Cache::forget('customer-options:v1');
                Cache::forget('customer-options:v2');
            });
        }
    }

    protected $fillable = [
        'name',
        'code',
        'address',
        'contact_person',
        'contact_number',
        'email',
        'status',
        'remarks',
        'serial_number_prefix',
        'serial_number_format',
        'serial_number_next_sequence',
        'serial_number_resets_yearly',
        'serial_number_sequence_year',
        'created_by',
        'updated_by',
        'deleted_by',
    ];

    protected function casts(): array
    {
        return [
            'serial_number_next_sequence' => 'integer',
            'serial_number_resets_yearly' => 'boolean',
            'serial_number_sequence_year' => 'integer',
        ];
    }

    public function templates(): BelongsToMany
    {
        return $this->belongsToMany(LabelTemplate::class, 'customer_templates', 'customer_id', 'template_id')
            ->withPivot('is_default')
            ->withTimestamps();
    }

    public function products(): HasMany
    {
        return $this->hasMany(Product::class);
    }
}
