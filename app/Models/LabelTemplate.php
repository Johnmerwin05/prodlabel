<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\BelongsToMany;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Illuminate\Database\Eloquent\SoftDeletes;

class LabelTemplate extends Model
{
    use SoftDeletes;

    protected $table = 'templates';

    protected $fillable = [
        'name',
        'status',
        'paper_size',
        'orientation',
        'width_mm',
        'height_mm',
        'settings',
        'current_version',
        'created_by',
        'updated_by',
        'archived_by',
        'archived_at',
    ];

    protected function casts(): array
    {
        return [
            'settings' => 'array',
            'archived_at' => 'datetime',
        ];
    }

    public function customers(): BelongsToMany
    {
        return $this->belongsToMany(Customer::class, 'customer_templates', 'template_id', 'customer_id')
            ->withPivot('is_default')
            ->withTimestamps();
    }

    public function versions(): HasMany
    {
        return $this->hasMany(TemplateVersion::class, 'template_id');
    }

    public function elements(): HasMany
    {
        return $this->hasMany(TemplateElement::class, 'template_id')->orderBy('z_index');
    }

    public function creator(): BelongsTo
    {
        return $this->belongsTo(User::class, 'created_by');
    }
}
