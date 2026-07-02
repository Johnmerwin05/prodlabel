<?php

namespace App\DTOs;

final readonly class PrintRequestData
{
    public function __construct(
        public int $customerId,
        public string $productionDate,
        public int $printQuantity,
        public array $productIds,
        public ?string $reprintReason = null,
    ) {
    }

    public static function fromArray(array $data): self
    {
        return new self(
            customerId: (int) $data['customer_id'],
            productionDate: $data['production_date'],
            printQuantity: (int) $data['print_quantity'],
            productIds: array_map('intval', $data['product_ids']),
            reprintReason: $data['reprint_reason'] ?? null,
        );
    }
}
