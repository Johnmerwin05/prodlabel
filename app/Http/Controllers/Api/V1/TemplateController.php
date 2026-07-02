<?php

namespace App\Http\Controllers\Api\V1;

use App\Http\Controllers\Controller;
use App\Http\Requests\Templates\StoreTemplateRequest;
use App\Http\Requests\Templates\UpdateTemplateRequest;
use App\Http\Resources\TemplateResource;
use App\Models\LabelTemplate;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Storage;

class TemplateController extends Controller
{
    public function index(Request $request)
    {
        abort_unless($request->user()?->hasPermission('template.view'), 403);

        $templates = LabelTemplate::query()
            ->with(['customers:id,name,code', 'elements', 'creator:id,name'])
            ->withCount('customers')
            ->when($request->boolean('with_trashed'), fn ($query) => $query->withTrashed())
            ->when($request->input('search'), function ($query, string $search): void {
                $query->where('name', 'like', "%{$search}%");
            })
            ->when($request->input('status'), function ($query, string|array $status): void {
                is_array($status)
                    ? $query->whereIn('status', $status)
                    : $query->where('status', $status);
            })
            ->when($request->integer('customer_id'), function ($query, int $customerId): void {
                $query->whereHas('customers', fn ($query) => $query->where('customers.id', $customerId));
            })
            ->latest()
            ->paginate($request->integer('per_page', 10));

        return TemplateResource::collection($templates);
    }

    public function store(StoreTemplateRequest $request): TemplateResource
    {
        return new TemplateResource($this->persist(new LabelTemplate(), $request->validated(), $request)->load(['customers', 'elements', 'creator']));
    }

    public function show(Request $request, LabelTemplate $template): TemplateResource
    {
        abort_unless($request->user()?->hasPermission('template.view'), 403);

        return new TemplateResource($template->load(['customers', 'elements', 'creator']));
    }

    public function update(UpdateTemplateRequest $request, LabelTemplate $template): TemplateResource
    {
        return new TemplateResource($this->persist($template, $request->validated(), $request)->load(['customers', 'elements', 'creator']));
    }

    public function uploadImage(Request $request)
    {
        abort_unless($request->user()?->hasPermission('template.manage'), 403);

        $data = $request->validate([
            'image' => ['required', 'image', 'max:5120'],
        ]);

        $path = $data['image']->store('template-images', 'public');

        abort_unless($path, 422, 'Unable to upload template image.');

        return response()->json([
            'data' => [
                'url' => Storage::disk('public')->url($path),
                'path' => $path,
            ],
        ]);
    }

    public function destroy(Request $request, LabelTemplate $template)
    {
        abort_unless($request->user()?->hasPermission('template.archive'), 403);

        $template->forceFill([
            'status' => 'archived',
            'archived_by' => $request->user()?->id,
            'archived_at' => now(),
        ])->save();
        $template->delete();

        return response()->noContent();
    }

    public function restore(Request $request, int $template): TemplateResource
    {
        abort_unless($request->user()?->hasPermission('template.manage'), 403);

        $model = LabelTemplate::withTrashed()->findOrFail($template);
        $model->restore();
        $model->forceFill([
            'status' => 'draft',
            'archived_by' => null,
            'archived_at' => null,
        ])->save();

        return new TemplateResource($model->load(['customers', 'elements', 'creator']));
    }

    public function duplicate(Request $request, LabelTemplate $template): TemplateResource
    {
        abort_unless($request->user()?->hasPermission('template.manage'), 403);

        return DB::transaction(function () use ($request, $template): TemplateResource {
            $template->load(['customers', 'elements']);
            $copy = $template->replicate(['archived_at', 'archived_by', 'deleted_at']);
            $copy->name = $template->name.' Copy';
            $copy->status = 'draft';
            $copy->current_version = 1;
            $copy->created_by = $request->user()?->id;
            $copy->updated_by = $request->user()?->id;
            $copy->save();

            $copy->customers()->sync($template->customers->mapWithKeys(fn ($customer) => [
                $customer->id => [
                    'area' => $customer->pivot?->area,
                    'is_default' => (bool) $customer->pivot?->is_default,
                ],
            ])->all());
            foreach ($template->elements as $element) {
                $copy->elements()->create($element->only(['type', 'name', 'payload', 'z_index']));
            }
            $copy->versions()->create([
                'version' => 1,
                'settings' => $copy->settings,
                'elements' => $copy->elements()->get()->map(fn ($element) => $element->only(['type', 'name', 'payload', 'z_index']))->all(),
                'created_by' => $request->user()?->id,
            ]);

            return new TemplateResource($copy->load(['customers', 'elements', 'creator']));
        });
    }

    private function persist(LabelTemplate $template, array $data, Request $request): LabelTemplate
    {
        return DB::transaction(function () use ($template, $data, $request): LabelTemplate {
            $isNew = ! $template->exists;
            $template->fill([
                'name' => $data['name'],
                'status' => $data['status'],
                'paper_size' => $data['paper_size'],
                'orientation' => $data['orientation'],
                'width_mm' => $data['width_mm'] ?? null,
                'height_mm' => $data['height_mm'] ?? null,
                'settings' => $data['settings'],
                'updated_by' => $request->user()?->id,
            ]);
            if ($isNew) {
                $template->created_by = $request->user()?->id;
                $template->current_version = 1;
            } else {
                $template->current_version = max(1, (int) $template->current_version + 1);
            }
            $template->save();

            $assignments = collect($data['customer_assignments'] ?? [])
                ->mapWithKeys(fn (array $assignment) => [
                    $assignment['customer_id'] => ['area' => $assignment['area']],
                ])
                ->all();
            $template->customers()->sync($assignments ?: ($data['customer_ids'] ?? []));
            $template->elements()->delete();
            foreach ($data['elements'] ?? [] as $index => $element) {
                $payload = $element['payload'];
                abort_if(
                    isset($payload['src']) && is_string($payload['src']) && str_starts_with($payload['src'], 'data:image'),
                    422,
                    'Image attachments must be uploaded before saving the template.',
                );

                $template->elements()->create([
                    'type' => $element['type'],
                    'name' => $element['name'] ?? null,
                    'payload' => $payload,
                    'z_index' => $element['z_index'] ?? $index,
                ]);
            }
            $template->versions()->create([
                'version' => $template->current_version,
                'settings' => $template->settings,
                'elements' => $data['elements'] ?? [],
                'created_by' => $request->user()?->id,
            ]);

            return $template;
        });
    }
}
