<?php

namespace App\DTOs;

final readonly class ProductData
{
    public function __construct(
        public string $productId,
        public int $customerId,
        public string $sku,
        public string $name,
        public int $quantity,
        public ?string $description = null,
        public ?string $batchNumber = null,
        public ?string $lotNumber = null,
        public ?string $manufacturingDate = null,
        public ?string $expirationDate = null,
        public string $status = 'draft',
    ) {
    }

    public static function fromArray(array $data): self
    {
        return new self(
            productId: $data['product_id'],
            customerId: (int) $data['customer_id'],
            sku: $data['sku'],
            name: $data['name'],
            quantity: (int) $data['quantity'],
            description: $data['description'] ?? null,
            batchNumber: $data['batch_number'] ?? null,
            lotNumber: $data['lot_number'] ?? null,
            manufacturingDate: $data['manufacturing_date'] ?? null,
            expirationDate: $data['expiration_date'] ?? null,
            status: $data['status'] ?? 'draft',
        );
    }

    public function toModelPayload(?int $userId = null): array
    {
        return [
            'product_id' => $this->productId,
            'customer_id' => $this->customerId,
            'sku' => $this->sku,
            'name' => $this->name,
            'description' => $this->description,
            'quantity' => $this->quantity,
            'batch_number' => $this->batchNumber,
            'lot_number' => $this->lotNumber,
            'manufacturing_date' => $this->manufacturingDate,
            'expiration_date' => $this->expirationDate,
            'status' => $this->status,
            'updated_by' => $userId,
        ];
    }
}
