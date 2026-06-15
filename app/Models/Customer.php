<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsToMany;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Illuminate\Database\Eloquent\SoftDeletes;

class Customer extends Model
{
    use HasFactory, SoftDeletes;

    protected $fillable = [
        'name',
        'code',
        'address',
        'contact_person',
        'contact_number',
        'email',
        'status',
        'remarks',
        'created_by',
        'updated_by',
        'deleted_by',
    ];

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
