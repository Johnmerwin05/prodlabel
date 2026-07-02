<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class SystemSetting extends Model
{
    protected $fillable = [
        'system_name',
        'system_tagline',
        'footer_content',
        'favicon_path',
        'color_palette',
        'updated_by',
    ];

    public static function current(): self
    {
        return static::query()->firstOrCreate(['id' => 1], [
            'system_name' => 'ProdLabel',
            'system_tagline' => 'Production label control',
            'footer_content' => 'Tugon Technology Inc. All rights reserved.',
            'color_palette' => 'blue',
        ]);
    }
}
