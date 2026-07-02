<?php

namespace Database\Seeders;

use App\Models\Permission;
use App\Models\Role;
use Illuminate\Database\Seeder;

class RbacSeeder extends Seeder
{
    public function run(): void
    {
        $permissions = collect([
            'customer.view', 'customer.create', 'customer.update', 'customer.delete', 'customer.restore',
            'user.view', 'user.create', 'user.update', 'user.delete', 'user.restore', 'user.lock', 'user.reset-password',
            'product.view', 'product.create', 'product.update', 'product.delete', 'product.print', 'product.reprint',
            'printing.view', 'printing.update',
            'template.view', 'template.manage', 'template.archive',
            'report.view', 'report.export',
            'audit.view',
            'role.view', 'role.create', 'role.update', 'role.delete',
            'settings.manage',
        ])->mapWithKeys(fn (string $slug) => [$slug => Permission::firstOrCreate(
            ['slug' => $slug],
            ['name' => str($slug)->replace('.', ' ')->title(), 'module' => str($slug)->before('.')->toString()]
        )]);

        $roles = [
            'super-admin' => $permissions->keys()->all(),
            'admin' => $permissions->keys()->reject(fn ($slug) => $slug === 'audit.view')->all(),
            'production-supervisor' => ['customer.view', 'product.view', 'product.create', 'product.update', 'product.print', 'product.reprint', 'printing.view', 'printing.update', 'template.view', 'report.view'],
            'encoder' => ['customer.view', 'product.view', 'product.create', 'product.update', 'template.view'],
            'viewer' => ['customer.view', 'product.view', 'template.view', 'report.view'],
        ];

        foreach ($roles as $slug => $rolePermissions) {
            $role = Role::firstOrCreate(
                ['slug' => $slug],
                ['name' => str($slug)->replace('-', ' ')->title(), 'description' => "Default {$slug} role"]
            );

            $role->permissions()->sync($permissions->only($rolePermissions)->pluck('id')->all());
        }
    }
}
