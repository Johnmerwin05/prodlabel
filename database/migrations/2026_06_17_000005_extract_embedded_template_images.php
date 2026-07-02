<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Storage;
use Illuminate\Support\Str;

return new class extends Migration
{
    public function up(): void
    {
        DB::table('template_elements')
            ->where('type', 'image')
            ->orderBy('id')
            ->chunkById(50, function ($elements): void {
                foreach ($elements as $element) {
                    $payload = json_decode($element->payload, true);
                    if (! is_array($payload)) {
                        continue;
                    }

                    $payload = $this->extractImageFromPayload($payload);

                    DB::table('template_elements')
                        ->where('id', $element->id)
                        ->update(['payload' => json_encode($payload)]);
                }
            });

        DB::table('template_versions')
            ->orderBy('id')
            ->chunkById(25, function ($versions): void {
                foreach ($versions as $version) {
                    $elements = json_decode($version->elements, true);
                    if (! is_array($elements)) {
                        continue;
                    }

                    $changed = false;
                    foreach ($elements as &$element) {
                        if (($element['type'] ?? null) !== 'image') {
                            continue;
                        }

                        $payload = $element['payload'] ?? null;
                        if (! is_array($payload)) {
                            continue;
                        }

                        $updatedPayload = $this->extractImageFromPayload($payload);
                        if ($updatedPayload !== $payload) {
                            $element['payload'] = $updatedPayload;
                            $changed = true;
                        }
                    }
                    unset($element);

                    if ($changed) {
                        DB::table('template_versions')
                            ->where('id', $version->id)
                            ->update(['elements' => json_encode($elements)]);
                    }
                }
            });
    }

    public function down(): void
    {
        //
    }

    private function extractImageFromPayload(array $payload): array
    {
        $src = $payload['src'] ?? null;
        if (! is_string($src) || ! str_starts_with($src, 'data:image/')) {
            return $payload;
        }

        if (! preg_match('/^data:image\/(?<type>png|jpe?g|gif|webp|svg\+xml);base64,(?<data>.+)$/i', $src, $matches)) {
            $payload['src'] = '';

            return $payload;
        }

        $extension = strtolower($matches['type']);
        $extension = $extension === 'jpeg' ? 'jpg' : $extension;
        $extension = $extension === 'svg+xml' ? 'svg' : $extension;

        $binary = base64_decode($matches['data'], true);
        if ($binary === false) {
            $payload['src'] = '';

            return $payload;
        }

        $path = 'template-images/'.Str::uuid().'.'.$extension;
        Storage::disk('public')->put($path, $binary);
        $payload['src'] = Storage::disk('public')->url($path);

        return $payload;
    }
};
