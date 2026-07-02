# Backend Architecture

## Architecture Pattern

Use Clean Architecture with Service and Repository Pattern.

```text
app/

├── Http/
│   ├── Controllers/
│   ├── Requests/
│   └── Resources/
│
├── Services/
│
├── Repositories/
│
├── Models/
│
├── Events/
├── Listeners/
├── Jobs/
├── Policies/
└── Exceptions/
```

---

## Controller Responsibilities

Controllers must:

- Receive requests
- Validate requests using Form Requests
- Call Services
- Return API Resources

Controllers must NOT:

- Contain business logic
- Access models directly

---

## Service Layer

Services contain all business logic.

Examples:

```php
CustomerService
UserService
ProductService
LabelTemplateService
PrintService
ReportService
ImportProductService
```

---

## Repository Layer

Repositories are responsible for database interaction.

Examples:

```php
CustomerRepository
UserRepository
ProductRepository
LabelTemplateRepository
PrintRepository
```

---

## Queue System

Use Redis Queues for:

- Product Import
- Bulk Printing
- PDF Generation
- Report Generation
- Barcode Generation
- QR Generation

Large jobs must never run synchronously.

---

## Real-Time Events

Use Laravel Reverb for:

- Print Progress
- Import Progress
- Report Generation Status
- Queue Status

Example:

```php
PrintJobStarted
PrintJobProgress
PrintJobCompleted
PrintJobFailed
```

---

## Label Engine

The label engine must support:

- Dynamic canvas
- Custom dimensions
- A3 layouts
- Multiple labels per page
- Variable data fields
- Barcode components
- QR components
- Text components
- Shape components
- Border components

Store template structure as JSON.

---

## Printing Workflow

1. User selects Customer
2. System loads assigned Label Template
3. User selects Products
4. System generates labels
5. Print Job created
6. Queue processing starts
7. Progress sent via Reverb
8. Print History stored

---

## Audit Trail

Track:

- Product Created
- Product Updated
- Product Printed
- Product Reprinted
- Customer Updated
- Label Updated
- User Login
- User Logout
