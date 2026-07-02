<?php

namespace App\DTOs;

final readonly class ProductData
{
    public function __construct(
        public ?string $productId,
        public int $customerId,
        public string $area,
        public string $partNumber,
        public string $piNumber,
        public ?string $sku,
        public string $name,
        public string $unitOfMeasure,
        public int $packingQuantity = 1,
        public ?string $description = null,
        public ?string $batchNumber = null,
        public ?string $lotNumber = null,
        public ?string $manufacturingDate = null,
        public ?string $expirationDate = null,
    ) {
    }

    public static function fromArray(array $data): self
    {
        return new self(
            productId: $data['product_id'] ?? null,
            customerId: (int) $data['customer_id'],
            area: $data['area'],
            partNumber: $data['part_number'],
            piNumber: $data['pi_number'],
            sku: $data['sku'] ?? null,
            name: $data['name'],
            unitOfMeasure: $data['unit_of_measure'],
            packingQuantity: isset($data['packing_quantity']) ? (int) $data['packing_quantity'] : 1,
            description: $data['description'] ?? null,
            batchNumber: $data['batch_number'] ?? null,
            lotNumber: $data['lot_number'] ?? null,
            manufacturingDate: $data['manufacturing_date'] ?? null,
            expirationDate: $data['expiration_date'] ?? null,
        );
    }

    public function toModelPayload(?int $userId = null): array
    {
        return [
            'product_id' => $this->productId,
            'customer_id' => $this->customerId,
            'area' => $this->area,
            'part_number' => $this->partNumber,
            'pi_number' => $this->piNumber,
            'sku' => $this->sku,
            'name' => $this->name,
            'description' => $this->description,
            'unit_of_measure' => $this->unitOfMeasure,
            'packing_quantity' => $this->packingQuantity,
            'batch_number' => $this->batchNumber,
            'lot_number' => $this->lotNumber,
            'manufacturing_date' => $this->manufacturingDate,
            'expiration_date' => $this->expirationDate,
            'updated_by' => $userId,
        ];
    }
}
