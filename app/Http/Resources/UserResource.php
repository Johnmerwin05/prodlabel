<?php

namespace App\Http\Resources;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

class UserResource extends JsonResource
{
    public function toArray(Request $request): array
    {
        return [
            'id' => $this->id,
            'employee_code' => $this->employee_code,
            'username' => $this->username,
            'name' => $this->name,
            'email' => $this->email,
            'status' => $this->status,
            'locked_at' => $this->locked_at?->toISOString(),
            'deleted_at' => $this->deleted_at?->toISOString(),
            'roles' => $this->whenLoaded('roles', fn () => $this->roles->map(fn ($role) => [
                'id' => $role->id,
                'name' => $role->name,
                'slug' => $role->slug,
            ])->values()),
            'permissions' => $this->whenLoaded('roles', fn () => $this->permissions()),
            'permission_ids' => $this->whenLoaded('roles', fn () => $this->uses_custom_permissions
                ? $this->directPermissions->pluck('id')->values()
                : $this->roles->flatMap(fn ($role) => $role->permissions->pluck('id'))->unique()->values()),
            'uses_custom_permissions' => $this->uses_custom_permissions,
            'created_at' => $this->created_at?->toISOString(),
            'updated_at' => $this->updated_at?->toISOString(),
        ];
    }
}
