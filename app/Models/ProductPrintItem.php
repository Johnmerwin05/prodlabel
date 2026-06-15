<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class ProductPrintItem extends Model
{
    protected $fillable = ['product_print_id', 'product_id', 'status', 'rendered_payload', 'failure_reason'];

    protected function casts(): array
    {
        return ['rendered_payload' => 'array'];
    }

    public function print(): BelongsTo
    {
        return $this->belongsTo(ProductPrint::class, 'product_print_id');
    }

    public function product(): BelongsTo
    {
        return $this->belongsTo(Product::class);
    }
}
