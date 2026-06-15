# Enterprise Labeling Management System

## Backend Architecture

- API versioning: all endpoints live under `/api/v1`.
- Clean boundaries: controllers validate and authorize, DTOs carry input, services coordinate transactions, repositories own query construction, jobs handle long-running work.
- Data safety: soft deletes, `created_by`/`updated_by`/`deleted_by`, audit logs, activity logs, policy checks, rate limiting, and indexed query paths are built into the core tables.
- Scale path: product listing and print lookup queries are customer/status indexed; print execution runs through Redis queues; Reverb broadcasts progress by print UUID channel.
- Upload path: official Excel templates should be checksum/version validated, parsed into `product_uploads`, previewed, then committed in chunks through queue jobs.

## Label Designer

Templates contain paper settings, version snapshots, and ordered elements. Elements store a typed JSON payload for text, dynamic text, barcode, QR, line, rectangle, circle, image, logo, table, custom shape, and borders. The renderer walks payloads recursively and replaces `{{variable}}` tokens from product/customer data.

## Printing Engine

`PrintService` creates a `product_prints` batch and `product_print_items`, dispatches `ProcessPrintJob`, and immediately returns a `job_uuid`. The job renders each label, updates item status, increments product print counts, and broadcasts:

- `PrintStarted`
- `PrintProgress`
- `PrintCompleted`
- `PrintFailed`

## Security

Use Sanctum for API authentication, Laravel policies for authorization, RBAC permissions seeded by `RbacSeeder`, CSRF protection for browser flows, request validation for all mutation endpoints, secure upload MIME/checksum validation, and a virus-scan hook before committing uploaded files.

## Production Services

- MySQL for durable relational data.
- Redis for cache, queue, sessions, and broadcasting.
- Laravel Reverb for real-time progress.
- Horizon or a process manager for queue worker supervision.
- Object storage for uploaded source files and generated printable artifacts.
