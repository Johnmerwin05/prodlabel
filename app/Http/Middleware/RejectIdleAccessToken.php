<?php

namespace App\Http\Middleware;

use Closure;
use Illuminate\Http\Request;
use Illuminate\Support\Carbon;
use Laravel\Sanctum\PersonalAccessToken;
use Symfony\Component\HttpFoundation\Response;

class RejectIdleAccessToken
{
    public function handle(Request $request, Closure $next): Response
    {
        $bearerToken = $request->bearerToken();

        if (! $bearerToken) {
            return $next($request);
        }

        $accessToken = PersonalAccessToken::findToken($bearerToken);
        $lastActivityAt = $this->lastActivityAt($request) ?? $accessToken?->last_used_at ?? $accessToken?->created_at;
        $idleTimeoutMinutes = (int) config('sanctum.idle_expiration', 60);

        if ($accessToken && $lastActivityAt && $lastActivityAt->lte(now()->subMinutes($idleTimeoutMinutes))) {
            $accessToken->delete();

            return response()->json(['message' => 'Your session has expired.'], 401);
        }

        $response = $next($request);

        if ($accessToken && $response->getStatusCode() < 400) {
            $accessToken->forceFill(['last_used_at' => $lastActivityAt ?? now()])->save();
        }

        return $response;
    }

    private function lastActivityAt(Request $request): ?Carbon
    {
        $value = $request->header('X-Last-Activity-At');

        if (! is_numeric($value)) {
            return null;
        }

        return Carbon::createFromTimestamp((int) floor(((int) $value) / 1000));
    }
}
