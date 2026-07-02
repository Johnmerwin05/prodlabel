<?php

namespace App\Http\Middleware;

use App\Services\AuditLogService;
use Closure;
use Illuminate\Http\Request;
use Symfony\Component\HttpFoundation\Response;

class LogUserActivity
{
    private const SENSITIVE_KEYS = [
        'password',
        'password_confirmation',
        'current_password',
        'token',
        'access_token',
        'authorization',
    ];

    public function __construct(private readonly AuditLogService $audit)
    {
    }

    public function handle(Request $request, Closure $next): Response
    {
        $response = $next($request);

        if (
            $request->user()
            && ! in_array($request->method(), ['GET', 'HEAD', 'OPTIONS'], true)
            && ! $request->is('broadcasting/auth')
            && ! $request->attributes->get('audit_recorded', false)
        ) {
            $module = $this->module($request);
            $action = $this->action($request, $module);

            $this->audit->activity($module, $action, [
                'description' => $this->description($request, $action),
                'method' => $request->method(),
                'path' => '/'.$request->path(),
                'route' => $request->route()?->getActionName(),
                'route_parameters' => $this->sanitize($request->route()?->parameters() ?? []),
                'request' => $this->sanitize($request->except(self::SENSITIVE_KEYS)),
                'status_code' => $response->getStatusCode(),
            ], $request);
        }

        return $response;
    }

    private function module(Request $request): string
    {
        $segment = (string) ($request->segments()[2] ?? 'system');

        return match ($segment) {
            'prints' => 'printing',
            'auth' => 'authentication',
            default => str($segment)->singular()->toString(),
        };
    }

    private function action(Request $request, string $module): string
    {
        $method = class_basename($request->route()?->getActionMethod() ?? strtolower($request->method()));
        $event = match ($method) {
            'store' => 'created',
            'update' => 'updated',
            'destroy' => 'deleted',
            'restore' => 'restored',
            'lock' => 'locked',
            'unlock' => 'unlocked',
            'resetPassword' => 'password_reset',
            'dispatch' => 'dispatched',
            'finalize' => 'finalized',
            'preview' => 'previewed',
            'reprintPreview' => 'reprint_previewed',
            'uploadImage' => 'image_uploaded',
            'duplicate' => 'duplicated',
            'logout' => 'logged_out',
            default => str($method)->snake()->toString(),
        };

        return "{$module}.{$event}";
    }

    private function description(Request $request, string $action): string
    {
        $user = $request->user();
        $readableAction = str($action)->after('.')->replace('_', ' ')->toString();

        return trim(($user?->name ?? 'System').' '.$readableAction);
    }

    private function sanitize(mixed $value, ?string $key = null): mixed
    {
        if ($key !== null && in_array(strtolower($key), self::SENSITIVE_KEYS, true)) {
            return '[REDACTED]';
        }

        if (! is_array($value)) {
            return is_object($value) && method_exists($value, 'getKey')
                ? $value->getKey()
                : $value;
        }

        return collect($value)
            ->map(fn (mixed $item, string|int $itemKey) => $this->sanitize($item, (string) $itemKey))
            ->all();
    }
}
