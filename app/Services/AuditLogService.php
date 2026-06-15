<?php

namespace App\Services;

use App\Models\ActivityLog;
use App\Models\AuditLog;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Http\Request;

class AuditLogService
{
    public function audit(string $event, Model $model, array $oldValues = [], array $newValues = [], ?Request $request = null): void
    {
        AuditLog::create([
            'event' => $event,
            'auditable_type' => $model::class,
            'auditable_id' => $model->getKey(),
            'user_id' => $request?->user()?->id,
            'old_values' => $oldValues,
            'new_values' => $newValues,
            'ip_address' => $request?->ip(),
            'user_agent' => $request?->userAgent(),
        ]);
    }

    public function activity(string $module, string $activity, array $properties = [], ?Request $request = null): void
    {
        ActivityLog::create([
            'user_id' => $request?->user()?->id,
            'module' => $module,
            'activity' => $activity,
            'properties' => $properties,
            'ip_address' => $request?->ip(),
            'device' => $request?->userAgent(),
        ]);
    }
}
