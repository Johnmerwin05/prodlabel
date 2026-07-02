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
        'area',
        'part_number',
        'pi_number',
        'sku',
        'name',
        'description',
        'unit_of_measure',
        'products_per_box',
        'packing_quantity',
        'batch_number',
        'lot_number',
        'manufacturing_date',
        'expiration_date',
        'created_by',
        'updated_by',
        'deleted_by',
    ];

    protected function casts(): array
    {
        return [
            'manufacturing_date' => 'date',
            'expiration_date' => 'date',
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
