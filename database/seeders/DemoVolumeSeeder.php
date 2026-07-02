<?php

namespace Database\Seeders;

use App\Models\Permission;
use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Facades\Schema;

class DemoVolumeSeeder extends Seeder
{
    private const CUSTOMER_COUNT = 2000;

    private const PRODUCT_COUNT = 5000;

    public function run(): void
    {
        $this->call(RbacSeeder::class);

        DB::transaction(function (): void {
            $roleIds = $this->seedRoles();
            $this->seedUsers($roleIds);
            $customerIds = $this->seedCustomers();
            $this->seedProducts($customerIds);
        });
    }

    private function seedRoles(): array
    {
        $now = now();
        $roles = [
            'it' => [
                'name' => 'IT',
                'description' => 'Full technical and administrative access',
                'permissions' => Permission::query()->pluck('slug')->all(),
            ],
            'head' => [
                'name' => 'Head',
                'description' => 'Production oversight and reporting access',
                'permissions' => [
                    'customer.view', 'customer.create', 'customer.update',
                    'product.view', 'product.create', 'product.update', 'product.delete', 'product.print', 'product.reprint',
                    'printing.view', 'printing.update',
                    'template.view', 'template.manage',
                    'report.view', 'report.export',
                ],
            ],
            'staff' => [
                'name' => 'Staff',
                'description' => 'Daily production encoding and printing access',
                'permissions' => [
                    'customer.view',
                    'product.view', 'product.create', 'product.update',
                    'printing.view', 'printing.update',
                    'template.view',
                    'report.view',
                ],
            ],
        ];

        $roleIds = [];
        foreach ($roles as $slug => $roleData) {
            DB::table('roles')->updateOrInsert(
                ['slug' => $slug],
                [
                    'name' => $roleData['name'],
                    'description' => $roleData['description'],
                    'created_at' => $now,
                    'updated_at' => $now,
                ],
            );

            $roleId = (int) DB::table('roles')->where('slug', $slug)->value('id');
            $permissionIds = DB::table('permissions')
                ->whereIn('slug', $roleData['permissions'])
                ->pluck('id');

            DB::table('permission_role')->where('role_id', $roleId)->delete();
            DB::table('permission_role')->insert(
                $permissionIds->map(fn ($permissionId) => [
                    'role_id' => $roleId,
                    'permission_id' => $permissionId,
                ])->all(),
            );

            $roleIds[$slug] = $roleId;
        }

        return $roleIds;
    }

    private function seedUsers(array $roleIds): void
    {
        $now = now();
        $password = Hash::make('password');
        $users = [
            ['role' => 'it', 'number' => 1],
            ['role' => 'it', 'number' => 2],
            ['role' => 'head', 'number' => 1],
            ...array_map(fn (int $number) => ['role' => 'staff', 'number' => $number], range(1, 5)),
        ];

        foreach ($users as $userData) {
            $role = $userData['role'];
            $number = $userData['number'];
            $username = $role.$number;

            DB::table('users')->updateOrInsert(
                ['username' => $username],
                [
                    'employee_code' => strtoupper($role).'-'.str_pad((string) $number, 3, '0', STR_PAD_LEFT),
                    'name' => str($role)->title().' User '.$number,
                    'email' => $username.'@prodlabel.local',
                    'email_verified_at' => $now,
                    'password' => $password,
                    'status' => 'active',
                    'uses_custom_permissions' => false,
                    'locked_at' => null,
                    'deleted_at' => null,
                    'created_at' => $now,
                    'updated_at' => $now,
                ],
            );

            $userId = (int) DB::table('users')->where('username', $username)->value('id');
            DB::table('role_user')->where('user_id', $userId)->delete();
            DB::table('role_user')->insert([
                'role_id' => $roleIds[$role],
                'user_id' => $userId,
            ]);
        }
    }

    private function seedCustomers(): array
    {
        $now = now();
        $faker = fake();

        foreach (array_chunk(range(1, self::CUSTOMER_COUNT), 500) as $numbers) {
            $rows = array_map(function (int $number) use ($faker, $now): array {
                $code = 'DEMO-CUST-'.str_pad((string) $number, 4, '0', STR_PAD_LEFT);

                return [
                    'name' => $faker->company().' '.$number,
                    'code' => $code,
                    'address' => $faker->address(),
                    'contact_person' => $faker->name(),
                    'contact_number' => $faker->phoneNumber(),
                    'email' => strtolower($code).'@example.test',
                    'status' => $number % 20 === 0 ? 'inactive' : 'active',
                    'remarks' => 'Generated by DemoVolumeSeeder',
                    'created_at' => $now,
                    'updated_at' => $now,
                ];
            }, $numbers);

            DB::table('customers')->upsert(
                $rows,
                ['code'],
                ['name', 'address', 'contact_person', 'contact_number', 'email', 'status', 'remarks', 'updated_at'],
            );
        }

        return DB::table('customers')
            ->where('code', 'like', 'DEMO-CUST-%')
            ->orderBy('code')
            ->pluck('id')
            ->map(fn ($id) => (int) $id)
            ->all();
    }

    private function seedProducts(array $customerIds): void
    {
        $now = now();
        $faker = fake();
        $areas = ['Assembly', 'Molding', 'Inspection', 'Injection'];
        $units = ['Piece', 'Box', 'Pack', 'Set'];
        $customerCount = count($customerIds);
        $hasQuantity = Schema::hasColumn('products', 'quantity');

        foreach (array_chunk(range(1, self::PRODUCT_COUNT), 500) as $numbers) {
            $rows = array_map(function (int $number) use ($areas, $customerCount, $customerIds, $faker, $hasQuantity, $now, $units): array {
                $sequence = str_pad((string) $number, 5, '0', STR_PAD_LEFT);

                $row = [
                    'product_id' => 'DEMO-PRD-'.$sequence,
                    'customer_id' => $customerIds[($number - 1) % $customerCount],
                    'area' => $areas[($number - 1) % count($areas)],
                    'part_number' => '75-0231-02',
                    'pi_number' => '25-'.$sequence,
                    'sku' => 'SKU-'.$sequence,
                    'name' => $faker->words(3, true).' '.$number,
                    'description' => 'Generated demo product '.$number,
                    'unit_of_measure' => $units[($number - 1) % count($units)],
                    'products_per_box' => $number % 4 === 1 ? null : (($number % 48) + 1),
                    'packing_quantity' => ($number % 250) + 1,
                    'batch_number' => 'BATCH-'.str_pad((string) (($number % 100) + 1), 3, '0', STR_PAD_LEFT),
                    'lot_number' => 'LOT-'.str_pad((string) (($number % 500) + 1), 4, '0', STR_PAD_LEFT),
                    'created_at' => $now,
                    'updated_at' => $now,
                ];

                if ($hasQuantity) {
                    $row['quantity'] = ($number % 1000) + 1;
                }

                return $row;
            }, $numbers);

            DB::table('products')->upsert(
                $rows,
                ['product_id'],
                array_values(array_filter([
                    'customer_id', 'area', 'part_number', 'pi_number', 'sku', 'name', 'description',
                    'unit_of_measure', 'products_per_box', 'packing_quantity', 'batch_number', 'lot_number', 'updated_at',
                    $hasQuantity ? 'quantity' : null,
                ])),
            );
        }
    }
}
