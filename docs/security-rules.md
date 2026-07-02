# Security Rules

## Authentication

Use:

- Laravel Sanctum

All APIs must be protected except login.

---

## Authorization

Use:

- Policies
- Gates

Permissions:

```text
customer.view
customer.create
customer.update
customer.delete

product.view
product.create
product.print
product.reprint

label.view
label.create
label.update

user.manage
```

---

## Input Validation

Validate all:

- Requests
- Query Parameters
- Imports

---

## SQL Injection

Never use:

```php
DB::raw($request->input('query'))
```

Use Query Builder or Eloquent.

---

## Mass Assignment

Always use:

```php
fillable
```

Never use:

```php
guarded = []
```

---

## File Upload Security

Validate:

- Extension
- Mime Type
- Size

Allowed:

```text
xlsx
xls
csv
```

---

## Audit Logging

Record:

- Login
- Logout
- Create
- Update
- Delete
- Print
- Reprint

---

## Rate Limiting

Apply to:

- Login
- Import
- Reports
- Print Operations
