<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Illuminate\Database\Eloquent\SoftDeletes;

class ProductPrint extends Model
{
    use SoftDeletes;

    protected $fillable = [
        'job_uuid',
        'customer_id',
        'template_id',
        'production_date',
        'print_quantity',
        'print_count',
        'requested_by',
        'status',
        'total_products',
        'completed_products',
        'failed_products',
        'metadata',
        'started_at',
        'completed_at',
    ];

    protected function casts(): array
    {
        return [
            'metadata' => 'array',
            'print_count' => 'integer',
            'production_date' => 'date',
            'started_at' => 'datetime',
            'completed_at' => 'datetime',
        ];
    }

    public function customer(): BelongsTo
    {
        return $this->belongsTo(Customer::class);
    }

    public function template(): BelongsTo
    {
        return $this->belongsTo(LabelTemplate::class, 'template_id');
    }

    public function items(): HasMany
    {
        return $this->hasMany(ProductPrintItem::class);
    }
}
