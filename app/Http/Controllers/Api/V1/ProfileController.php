<?php

namespace App\Http\Controllers\Api\V1;

use App\Http\Controllers\Controller;
use App\Http\Requests\UpdateProfileRequest;
use App\Models\Permission;
use App\Models\User;
use App\Services\AuditLogService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Hash;
use Illuminate\Validation\ValidationException;

class ProfileController extends Controller
{
    public function show(Request $request): JsonResponse
    {
        return response()->json(['data' => $this->profile($request->user())]);
    }

    public function update(UpdateProfileRequest $request, AuditLogService $audit): JsonResponse
    {
        $user = $request->user();
        $data = $request->validated();

        if (! empty($data['password']) && ! Hash::check($data['current_password'] ?? '', $user->password)) {
            throw ValidationException::withMessages([
                'current_password' => ['The current password is incorrect.'],
            ]);
        }

        $before = $user->only(['employee_code', 'username', 'name', 'email']);
        $user->fill([
            'employee_code' => $data['employee_code'] ?? null,
            'username' => $data['username'],
            'name' => $data['name'],
            'email' => $data['email'],
            'updated_by' => $user->id,
        ]);
        if (! empty($data['password'])) {
            $user->password = $data['password'];
        }
        $user->save();

        $audit->audit('user.profile.updated', $user, $before, $user->only(['employee_code', 'username', 'name', 'email']), $request);

        return response()->json(['data' => $this->profile($user->refresh())]);
    }

    private function profile(User $user): array
    {
        $user->load('roles:id,name,slug');
        $permissionSlugs = $user->permissions();

        return [
            'id' => $user->id,
            'employee_code' => $user->employee_code,
            'username' => $user->username,
            'name' => $user->name,
            'email' => $user->email,
            'status' => $user->status,
            'roles' => $user->roles->map->only(['id', 'name', 'slug'])->values(),
            'permissions' => Permission::query()
                ->whereIn('slug', $permissionSlugs)
                ->select('id', 'name', 'slug', 'module')
                ->orderBy('module')
                ->orderBy('name')
                ->get(),
        ];
    }
}
