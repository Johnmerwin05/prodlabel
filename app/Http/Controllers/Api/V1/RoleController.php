<?php

namespace App\Http\Controllers\Api\V1;

use App\Http\Controllers\Controller;
use App\Http\Requests\Roles\StoreRoleRequest;
use App\Http\Requests\Roles\UpdateRoleRequest;
use App\Http\Resources\RoleResource;
use App\Models\Permission;
use App\Models\Role;
use App\Services\AuditLogService;
use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\AnonymousResourceCollection;

class RoleController extends Controller
{
    public function index(Request $request): AnonymousResourceCollection
    {
        $this->authorize('viewAny', Role::class);

        $roles = Role::query()
            ->withCount('users')
            ->when($request->filled('search'), function ($query) use ($request): void {
                $search = $request->string('search')->toString();
                $query->where(function ($query) use ($search): void {
                    $query->where('name', 'like', "%{$search}%")
                        ->orWhere('slug', 'like', "%{$search}%")
                        ->orWhere('description', 'like', "%{$search}%");
                });
            })
            ->orderBy('name')
            ->paginate($request->integer('per_page', 10))
            ->withQueryString();

        return RoleResource::collection($roles);
    }

    public function permissions(Request $request)
    {
        $this->authorize('viewAny', Role::class);

        return response()->json([
            'data' => Permission::query()
                ->select('id', 'name', 'slug', 'module')
                ->orderBy('module')
                ->orderBy('name')
                ->get(),
        ]);
    }

    public function store(StoreRoleRequest $request, AuditLogService $audit): RoleResource
    {
        $role = Role::create($request->validated())->loadCount('users');

        $audit->audit('role.created', $role, [], $role->toArray(), $request);

        return new RoleResource($role);
    }

    public function update(UpdateRoleRequest $request, Role $role, AuditLogService $audit): RoleResource
    {
        $before = $role->toArray();
        $role->update($request->validated());
        $role->loadCount('users');
        $audit->audit('role.updated', $role, $before, $role->toArray(), $request);

        return new RoleResource($role);
    }

    public function destroy(Request $request, Role $role, AuditLogService $audit)
    {
        $this->authorize('delete', $role);
        abort_if($role->users()->exists(), 422, 'This role is assigned to users and cannot be deleted.');

        $before = $role->load('permissions')->toArray();
        $audit->audit('role.deleted', $role, $before, [], $request);
        $role->delete();

        return response()->noContent();
    }
}
