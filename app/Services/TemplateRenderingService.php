<?php

namespace App\Services;

use App\Models\LabelTemplate;
use App\Models\Product;

class TemplateRenderingService
{
    public function render(LabelTemplate $template, Product $product): array
    {
        $variables = $this->variables($product);

        return [
            'template' => [
                'id' => $template->id,
                'version' => $template->current_version,
                'settings' => $template->settings,
            ],
            'elements' => $template->elements->map(function ($element) use ($variables): array {
                $payload = $this->replaceVariables($element->payload, $variables);

                return [
                    'id' => $element->id,
                    'type' => $element->type,
                    'name' => $element->name,
                    'z_index' => $element->z_index,
                    'payload' => $payload,
                ];
            })->all(),
        ];
    }

    private function variables(Product $product): array
    {
        return [
            'product_id' => $product->product_id,
            'product_name' => $product->name,
            'sku' => $product->sku,
            'quantity' => (string) $product->quantity,
            'batch_no' => (string) $product->batch_number,
            'lot_no' => (string) $product->lot_number,
            'manufacturing_date' => optional($product->manufacturing_date)->toDateString(),
            'expiration_date' => optional($product->expiration_date)->toDateString(),
            'customer_name' => $product->customer?->name,
        ];
    }

    private function replaceVariables(mixed $value, array $variables): mixed
    {
        if (is_array($value)) {
            return array_map(fn ($item) => $this->replaceVariables($item, $variables), $value);
        }

        if (! is_string($value)) {
            return $value;
        }

        return preg_replace_callback('/{{\s*([a-zA-Z0-9_]+)\s*}}/', fn ($matches) => $variables[$matches[1]] ?? '', $value);
    }
}
