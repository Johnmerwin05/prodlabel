<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class TemplateElement extends Model
{
    protected $fillable = ['template_id', 'type', 'name', 'payload', 'z_index'];

    protected function casts(): array
    {
        return ['payload' => 'array'];
    }

    public function template(): BelongsTo
    {
        return $this->belongsTo(LabelTemplate::class, 'template_id');
    }
}
