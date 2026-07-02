# API Rules

## API Structure

Version all APIs.

```text
/api/v1
```

Example:

```text
/api/v1/customers
/api/v1/users
/api/v1/products
/api/v1/labels
/api/v1/reports
```

---

## Response Format

Success:

```json
{
    "success": true,
    "message": "Product created successfully",
    "data": {}
}
```

Error:

```json
{
    "success": false,
    "message": "Validation failed",
    "errors": {}
}
```

---

## Pagination

Always use:

```json
{
    "data": [],
    "meta": {},
    "links": {}
}
```

---

## Validation

Use Form Requests.

Never validate in Controllers.

---

## Filtering

Support:

```text
search
status
customer_id
date_from
date_to
```

---

## Bulk Operations

Support:

- Bulk Print
- Bulk Reprint
- Bulk Delete
- Bulk Restore

---

## Excel Import

Requirements:

- Template download endpoint
- Validation endpoint
- Import endpoint
- Import history endpoint

---

## Reports

Endpoints:

```text
/reports/products
/reports/print-history
/reports/reprints
/reports/customers
```

---

## Real-Time Updates

Broadcast:

- Print progress
- Import progress
- Queue progress
