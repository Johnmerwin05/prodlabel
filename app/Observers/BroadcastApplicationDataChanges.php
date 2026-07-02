<?php

namespace App\Observers;

use App\Events\ApplicationDataChanged;
use Illuminate\Contracts\Events\ShouldHandleEventsAfterCommit;
use Illuminate\Database\Eloquent\Model;

class BroadcastApplicationDataChanges implements ShouldHandleEventsAfterCommit
{
    public function created(Model $model): void
    {
        $this->broadcast($model, 'created');
    }

    public function updated(Model $model): void
    {
        $this->broadcast($model, 'updated');
    }

    public function deleted(Model $model): void
    {
        $this->broadcast($model, 'deleted');
    }

    public function restored(Model $model): void
    {
        $this->broadcast($model, 'restored');
    }

    private function broadcast(Model $model, string $action): void
    {
        ApplicationDataChanged::dispatch(
            match ($model::class) {
                \App\Models\Customer::class => 'customer',
                \App\Models\Product::class => 'product',
                \App\Models\LabelTemplate::class => 'template',
                \App\Models\ProductPrint::class => 'print',
                \App\Models\User::class => 'user',
                \App\Models\Role::class => 'role',
                \App\Models\Permission::class => 'permission',
                default => class_basename($model),
            },
            $action,
            $model->getKey(),
        );
    }
}
