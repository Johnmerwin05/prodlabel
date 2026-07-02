<?php

namespace App\Services;

use App\Models\LabelTemplate;

class CustomerTemplateService
{
    public function publishedForCustomer(int $customerId, string $area): ?LabelTemplate
    {
        return LabelTemplate::query()
            ->where('status', 'published')
            ->whereHas('customers', fn ($query) => $query
                ->where('customers.id', $customerId)
                ->where('customer_templates.area', $area))
            ->with(['customers' => fn ($query) => $query
                ->where('customers.id', $customerId)
                ->where('customer_templates.area', $area)])
            ->get()
            ->sortByDesc(fn (LabelTemplate $template) => (bool) $template->customers->first()?->pivot?->is_default)
            ->first();
    }
}
