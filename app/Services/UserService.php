<?php

namespace App\Services;

use App\Models\User;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Hash;

class UserService
{
    public function create(array $data, Request $request): User
    {
        return DB::transaction(function () use ($data, $request): User {
            $roleIds = $data['role_ids'];
            unset($data['role_ids']);

            $data['password'] = Hash::make($data['password']);
            $data['locked_at'] = $data['status'] === 'locked' ? now() : null;
            $data['created_by'] = $request->user()?->id;
            $data['updated_by'] = $request->user()?->id;

            $user = User::create($data);
            $user->roles()->sync($roleIds);

            return $user->load('roles');
        });
    }

    public function update(User $user, array $data, Request $request): User
    {
        return DB::transaction(function () use ($user, $data, $request): User {
            $roleIds = $data['role_ids'];
            unset($data['role_ids']);

            if (blank($data['password'] ?? null)) {
                unset($data['password']);
            } else {
                $data['password'] = Hash::make($data['password']);
            }

            $data['locked_at'] = $data['status'] === 'locked' ? ($user->locked_at ?? now()) : null;
            $data['updated_by'] = $request->user()?->id;

            $user->update($data);
            $user->roles()->sync($roleIds);

            return $user->refresh()->load('roles');
        });
    }
}
