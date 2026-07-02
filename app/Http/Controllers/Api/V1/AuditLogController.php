<?php

namespace App\Http\Controllers\Api\V1;

use App\Http\Controllers\Controller;
use App\Models\ActivityLog;
use App\Models\AuditLog;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Pagination\LengthAwarePaginator;
use Illuminate\Support\Facades\DB;

class AuditLogController extends Controller
{
    public function index(Request $request): JsonResponse
    {
        abort_unless($request->user()?->hasPermission('audit.view'), 403);

        $filters = $request->validate([
            'search' => ['nullable', 'string', 'max:255'],
            'module' => ['nullable', 'string', 'max:100'],
            'action' => ['nullable', 'string', 'max:100'],
            'date_from' => ['nullable', 'date'],
            'date_to' => ['nullable', 'date', 'after_or_equal:date_from'],
            'page' => ['nullable', 'integer', 'min:1'],
            'per_page' => ['nullable', 'integer', 'in:10,25,50,100'],
        ]);

        $auditLogs = DB::table('audit_logs')->select([
            DB::raw("'audit' as source"),
            'audit_logs.id',
            'audit_logs.user_id',
            'audit_logs.event as action',
            'audit_logs.auditable_type as module',
            'audit_logs.auditable_type as subject_type',
            'audit_logs.auditable_id as subject_id',
            'audit_logs.old_values',
            'audit_logs.new_values',
            DB::raw('NULL as properties'),
            'audit_logs.ip_address',
            'audit_logs.user_agent',
            'audit_logs.created_at',
        ]);

        $activities = DB::table('activity_logs')->select([
            DB::raw("'activity' as source"),
            'activity_logs.id',
            'activity_logs.user_id',
            'activity_logs.activity as action',
            'activity_logs.module',
            DB::raw('NULL as subject_type'),
            DB::raw('NULL as subject_id'),
            DB::raw('NULL as old_values'),
            DB::raw('NULL as new_values'),
            'activity_logs.properties',
            'activity_logs.ip_address',
            'activity_logs.device as user_agent',
            'activity_logs.created_at',
        ]);

        $query = DB::query()
            ->fromSub($auditLogs->unionAll($activities), 'logs')
            ->leftJoin('users', 'users.id', '=', 'logs.user_id')
            ->select('logs.*', 'users.name as user_name', 'users.username', 'users.email')
            ->when($filters['search'] ?? null, function ($query, string $search): void {
                $query->where(function ($query) use ($search): void {
                    $query
                        ->where('logs.action', 'like', "%{$search}%")
                        ->orWhere('logs.ip_address', 'like', "%{$search}%")
                        ->orWhere('users.name', 'like', "%{$search}%")
                        ->orWhere('users.username', 'like', "%{$search}%")
                        ->orWhere('users.email', 'like', "%{$search}%");
                });
            })
            ->when($filters['module'] ?? null, fn ($query, string $module) => $query->where('logs.module', 'like', "%{$module}%"))
            ->when($filters['action'] ?? null, fn ($query, string $action) => $query->where('logs.action', 'like', "%{$action}%"))
            ->when($filters['date_from'] ?? null, fn ($query, string $date) => $query->whereDate('logs.created_at', '>=', $date))
            ->when($filters['date_to'] ?? null, fn ($query, string $date) => $query->whereDate('logs.created_at', '<=', $date))
            ->orderByDesc('logs.created_at')
            ->orderByDesc('logs.id');

        /** @var LengthAwarePaginator $logs */
        $logs = $query->paginate($filters['per_page'] ?? 10);
        $logs->through(fn (object $log): array => $this->transform($log));

        return response()->json([
            'data' => $logs->items(),
            'meta' => [
                'current_page' => $logs->currentPage(),
                'last_page' => $logs->lastPage(),
                'per_page' => $logs->perPage(),
                'total' => $logs->total(),
            ],
            'filters' => [
                'modules' => $this->modules(),
            ],
        ]);
    }

    private function transform(object $log): array
    {
        $module = $log->source === 'audit'
            ? str(class_basename($log->module))->snake()->replace('_', ' ')->toString()
            : $log->module;

        return [
            'id' => $log->source.'-'.$log->id,
            'source' => $log->source,
            'action' => $log->action,
            'module' => $module,
            'description' => $this->description($log),
            'user' => $log->user_id ? [
                'id' => (int) $log->user_id,
                'name' => $log->user_name ?? 'Deleted user',
                'username' => $log->username,
                'email' => $log->email,
            ] : null,
            'subject' => $log->subject_type ? [
                'type' => class_basename($log->subject_type),
                'id' => (int) $log->subject_id,
            ] : null,
            'old_values' => $this->json($log->old_values),
            'new_values' => $this->json($log->new_values),
            'properties' => $this->json($log->properties),
            'ip_address' => $log->ip_address,
            'user_agent' => $log->user_agent,
            'created_at' => $log->created_at,
        ];
    }

    private function description(object $log): string
    {
        $properties = $this->json($log->properties);
        if (is_string($properties['description'] ?? null)) {
            return $properties['description'];
        }

        $subject = class_basename($log->subject_type ?? 'record');
        $event = str($log->action)->after('.')->replace(['_', '-'], ' ')->toString();

        return trim(($log->user_name ?? 'System')." {$event} {$subject} #{$log->subject_id}");
    }

    private function json(?string $value): array
    {
        return $value ? (json_decode($value, true) ?: []) : [];
    }

    private function modules(): array
    {
        $activityModules = ActivityLog::query()->distinct()->orderBy('module')->pluck('module');
        $auditModules = AuditLog::query()->distinct()->pluck('auditable_type')
            ->map(fn (string $type) => str(class_basename($type))->snake()->replace('_', ' ')->toString());

        return $activityModules->merge($auditModules)->filter()->unique()->sort()->values()->all();
    }

}
