<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Support\Facades\DB;

return new class extends Migration
{
    public function up(): void
    {
        $now = now();
        $permissions = [
            'printing.view' => 'Printing View',
            'printing.update' => 'Printing Edit',
        ];

        foreach ($permissions as $slug => $name) {
            DB::table('permissions')->updateOrInsert(
                ['slug' => $slug],
                ['name' => $name, 'module' => 'printing', 'created_at' => $now, 'updated_at' => $now],
            );
        }

        $sourcePermissionId = DB::table('permissions')->where('slug', 'product.print')->value('id');
        $permissionIds = DB::table('permissions')->whereIn('slug', array_keys($permissions))->pluck('id');

        if ($sourcePermissionId) {
            $roleIds = DB::table('permission_role')->where('permission_id', $sourcePermissionId)->pluck('role_id');
            foreach ($roleIds as $roleId) {
                foreach ($permissionIds as $permissionId) {
                    DB::table('permission_role')->insertOrIgnore([
                        'role_id' => $roleId,
                        'permission_id' => $permissionId,
                    ]);
                }
            }

            $userIds = DB::table('permission_user')->where('permission_id', $sourcePermissionId)->pluck('user_id');
            foreach ($userIds as $userId) {
                foreach ($permissionIds as $permissionId) {
                    DB::table('permission_user')->insertOrIgnore([
                        'user_id' => $userId,
                        'permission_id' => $permissionId,
                    ]);
                }
            }
        }
    }

    public function down(): void
    {
        $permissionIds = DB::table('permissions')
            ->whereIn('slug', ['printing.view', 'printing.update'])
            ->pluck('id');

        DB::table('permission_user')->whereIn('permission_id', $permissionIds)->delete();
        DB::table('permission_role')->whereIn('permission_id', $permissionIds)->delete();
        DB::table('permissions')->whereIn('id', $permissionIds)->delete();
    }
};
