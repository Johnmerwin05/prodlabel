<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Illuminate\Database\Eloquent\SoftDeletes;

class Product extends Model
{
    use SoftDeletes;

    protected $fillable = [
        'product_id',
        'customer_id',
        'sku',
        'name',
        'description',
        'quantity',
        'batch_number',
        'lot_number',
        'manufacturing_date',
        'expiration_date',
        'status',
        'print_count',
        'last_printed_at',
        'created_by',
        'updated_by',
        'deleted_by',
    ];

    protected function casts(): array
    {
        return [
            'manufacturing_date' => 'date',
            'expiration_date' => 'date',
            'last_printed_at' => 'datetime',
        ];
    }

    public function customer(): BelongsTo
    {
        return $this->belongsTo(Customer::class);
    }

    public function printItems(): HasMany
    {
        return $this->hasMany(ProductPrintItem::class);
    }

    public function reprints(): HasMany
    {
        return $this->hasMany(ProductReprint::class);
    }
}
