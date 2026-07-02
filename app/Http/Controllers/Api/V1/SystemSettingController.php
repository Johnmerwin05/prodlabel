<?php

namespace App\Http\Controllers\Api\V1;

use App\Http\Controllers\Controller;
use App\Models\SystemSetting;
use App\Services\AuditLogService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Storage;
use Illuminate\Support\Str;

class SystemSettingController extends Controller
{
    public function show(): JsonResponse
    {
        return response()->json(['data' => $this->payload(SystemSetting::current())]);
    }

    public function update(Request $request, AuditLogService $audit): JsonResponse
    {
        abort_unless($request->user()?->hasPermission('settings.manage'), 403);

        $data = $request->validate([
            'system_name' => ['required', 'string', 'max:80'],
            'system_tagline' => ['required', 'string', 'max:140'],
            'footer_content' => ['required', 'string', 'max:255'],
            'color_palette' => ['required', 'in:blue,green,purple,amber'],
            'favicon' => ['nullable', 'file', 'mimes:png,jpg,jpeg,webp,ico', 'max:2048'],
            'remove_favicon' => ['nullable', 'boolean'],
        ]);

        $settings = SystemSetting::current();
        $oldValues = $settings->only([
            'system_name', 'system_tagline', 'footer_content', 'favicon_path', 'color_palette',
        ]);

        if ($request->boolean('remove_favicon')) {
            if ($settings->favicon_path) {
                Storage::disk('public')->delete($settings->favicon_path);
            }

            $data['favicon_path'] = null;
        } elseif ($request->hasFile('favicon')) {
            $oldFavicon = $settings->favicon_path;
            $data['favicon_path'] = $request->file('favicon')->store('system', 'public');

            if ($oldFavicon && $oldFavicon !== $data['favicon_path']) {
                Storage::disk('public')->delete($oldFavicon);
            }
        }

        unset($data['favicon']);
        unset($data['remove_favicon']);
        $settings->fill($data);
        $settings->updated_by = $request->user()?->id;
        $settings->save();

        $audit->audit('updated', $settings, $oldValues, $settings->only(array_keys($oldValues)), $request);

        return response()->json(['data' => $this->payload($settings->fresh())]);
    }

    private function payload(SystemSetting $settings): array
    {
        return [
            'system_name' => $settings->system_name,
            'system_tagline' => $settings->system_tagline,
            'footer_content' => $settings->footer_content,
            'favicon_url' => $settings->favicon_path
                ? '/storage/'.(string) Str::of($settings->favicon_path)->ltrim('/')
                : null,
            'color_palette' => $settings->color_palette,
            'updated_at' => $settings->updated_at?->toISOString(),
        ];
    }
}
