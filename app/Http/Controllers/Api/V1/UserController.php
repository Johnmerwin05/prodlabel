<?php

namespace App\Http\Controllers\Api\V1;

use App\Http\Controllers\Controller;
use App\Http\Requests\Users\ResetUserPasswordRequest;
use App\Http\Requests\Users\StoreUserRequest;
use App\Http\Requests\Users\UpdateUserRequest;
use App\Http\Resources\UserResource;
use App\Models\Role;
use App\Models\User;
use App\Services\UserService;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Hash;

class UserController extends Controller
{
    public function roles(Request $request)
    {
        $this->authorize('viewAny', User::class);

        return response()->json([
            'data' => Role::query()->select('id', 'name', 'slug')->orderBy('name')->get(),
        ]);
    }

    public function index(Request $request)
    {
        $this->authorize('viewAny', User::class);

        $users = User::query()
            ->with('roles:id,name,slug')
            ->withTrashed($request->boolean('with_trashed'))
            ->when($request->filled('search'), function ($query) use ($request): void {
                $search = $request->string('search')->toString();
                $query->where(function ($query) use ($search): void {
                    $query->where('name', 'like', "%{$search}%")
                        ->orWhere('username', 'like', "%{$search}%")
                        ->orWhere('email', 'like', "%{$search}%")
                        ->orWhere('employee_code', 'like', "%{$search}%");
                });
            })
            ->when($request->filled('status'), function ($query) use ($request): void {
                $statuses = array_filter((array) $request->input('status'));
                $query->whereIn('status', $statuses);
            })
            ->when($request->filled('role'), function ($query) use ($request): void {
                $roles = array_filter((array) $request->input('role'));
                $query->whereHas('roles', fn ($query) => $query->whereIn('slug', $roles));
            })
            ->latest()
            ->paginate((int) $request->integer('per_page', 10))
            ->withQueryString();

        return UserResource::collection($users);
    }

    public function store(StoreUserRequest $request, UserService $service): UserResource
    {
        return new UserResource($service->create($request->validated(), $request));
    }

    public function show(User $user): UserResource
    {
        $this->authorize('view', $user);

        return new UserResource($user->load('roles'));
    }

    public function update(UpdateUserRequest $request, User $user, UserService $service): UserResource
    {
        return new UserResource($service->update($user, $request->validated(), $request));
    }

    public function destroy(Request $request, User $user)
    {
        $this->authorize('delete', $user);

        $user->forceFill(['deleted_by' => $request->user()?->id])->save();
        $user->delete();

        return response()->noContent();
    }

    public function restore(Request $request, int $user): UserResource
    {
        $model = User::withTrashed()->findOrFail($user);
        $this->authorize('restore', $model);
        $model->restore();

        return new UserResource($model->load('roles'));
    }

    public function lock(Request $request, User $user): UserResource
    {
        $this->authorize('lock', $user);

        $user->forceFill([
            'status' => 'locked',
            'locked_at' => now(),
            'updated_by' => $request->user()?->id,
        ])->save();

        return new UserResource($user->refresh()->load('roles'));
    }

    public function unlock(Request $request, User $user): UserResource
    {
        $this->authorize('lock', $user);

        $user->forceFill([
            'status' => 'active',
            'locked_at' => null,
            'updated_by' => $request->user()?->id,
        ])->save();

        return new UserResource($user->refresh()->load('roles'));
    }

    public function resetPassword(ResetUserPasswordRequest $request, User $user): UserResource
    {
        $user->forceFill([
            'password' => Hash::make($request->validated('password')),
            'updated_by' => $request->user()?->id,
        ])->save();

        return new UserResource($user->refresh()->load('roles'));
    }
}
