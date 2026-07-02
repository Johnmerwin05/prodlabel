<?php

namespace App\Services;

use App\Models\LabelTemplate;
use App\Models\Product;

class TemplateRenderingService
{
    public function render(LabelTemplate $template, Product $product, array $context = []): array
    {
        $variables = $this->variables($product, $context);

        return [
            'template' => [
                'id' => $template->id,
                'version' => $template->current_version,
                'settings' => $template->settings,
            ],
            'elements' => $template->elements->filter(
                fn ($element): bool => $this->shouldDisplay($element->payload, $variables)
            )->map(function ($element) use ($variables): array {
                $payload = $this->replaceVariables($element->payload, $variables);
                unset($payload['visibilityCondition']);

                return [
                    'id' => $element->id,
                    'type' => $element->type,
                    'name' => $element->name,
                    'z_index' => $element->z_index,
                    'payload' => $payload,
                ];
            })->values()->all(),
        ];
    }

    private function shouldDisplay(array $payload, array $variables): bool
    {
        $condition = $payload['visibilityCondition'] ?? null;
        if (! is_array($condition)) {
            return true;
        }

        $variable = (string) ($condition['variable'] ?? '');
        $operator = (string) ($condition['operator'] ?? '');
        $actual = $variables[$variable] ?? null;
        $actualValue = $actual === null ? '' : (string) $actual;
        $expectedValue = (string) ($condition['value'] ?? '');
        $isEmpty = trim($actualValue) === '';

        return match ($operator) {
            'equals' => $actualValue === $expectedValue,
            'not_equals' => $actualValue !== $expectedValue,
            'is_empty' => $isEmpty,
            'is_not_empty' => ! $isEmpty,
            default => true,
        };
    }

    private function variables(Product $product, array $context = []): array
    {
        return [
            'product_id' => $product->product_id,
            'part_number' => $product->part_number,
            'pi_number' => $product->pi_number,
            'product_name' => $product->name,
            'reference_number' => $product->product_id ?: ($product->part_number ?: (string) $product->id),
            'sku' => $product->sku,
            'unit_of_measure' => $product->unit_of_measure,
            'products_per_box' => (string) $product->products_per_box,
            'packing_quantity' => (string) $product->packing_quantity,
            'label_quantity' => (string) ($context['label_quantity'] ?? ''),
            'batch_no' => (string) $product->batch_number,
            'batch_number' => (string) $product->batch_number,
            'lot_no' => (string) $product->lot_number,
            'lot_number' => (string) $product->lot_number,
            'manufacturing_date' => optional($product->manufacturing_date)->toDateString(),
            'expiration_date' => optional($product->expiration_date)->toDateString(),
            'production_date' => $context['production_date'] ?? '',
            'serial_number' => $context['serial_number'] ?? '',
            'customer_name' => $product->customer?->name,
            'customer_code' => $product->customer?->code,
            'date' => now()->toDateString(),
            'operator_name' => '',
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
