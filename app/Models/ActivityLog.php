<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class ActivityLog extends Model
{
    protected $fillable = ['user_id', 'activity', 'module', 'properties', 'ip_address', 'device'];

    protected function casts(): array
    {
        return ['properties' => 'array'];
    }
}
