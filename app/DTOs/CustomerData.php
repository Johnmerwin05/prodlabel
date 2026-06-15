<?php

namespace App\DTOs;

final readonly class CustomerData
{
    public function __construct(
        public string $name,
        public string $code,
        public ?string $address,
        public ?string $contactPerson,
        public ?string $contactNumber,
        public ?string $email,
        public string $status,
        public ?string $remarks,
        public array $templateIds = [],
    ) {
    }

    public static function fromArray(array $data): self
    {
        return new self(
            name: $data['name'],
            code: $data['code'],
            address: $data['address'] ?? null,
            contactPerson: $data['contact_person'] ?? null,
            contactNumber: $data['contact_number'] ?? null,
            email: $data['email'] ?? null,
            status: $data['status'] ?? 'active',
            remarks: $data['remarks'] ?? null,
            templateIds: $data['template_ids'] ?? [],
        );
    }

    public function toModelPayload(?int $userId = null): array
    {
        return [
            'name' => $this->name,
            'code' => $this->code,
            'address' => $this->address,
            'contact_person' => $this->contactPerson,
            'contact_number' => $this->contactNumber,
            'email' => $this->email,
            'status' => $this->status,
            'remarks' => $this->remarks,
            'updated_by' => $userId,
        ];
    }
}
