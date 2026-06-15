<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class TemplateVersion extends Model
{
    protected $fillable = ['template_id', 'version', 'settings', 'elements', 'created_by'];

    protected function casts(): array
    {
        return ['settings' => 'array', 'elements' => 'array'];
    }

    public function template(): BelongsTo
    {
        return $this->belongsTo(LabelTemplate::class, 'template_id');
    }
}
