# Coding Standards

## General Principles

Follow:

- SOLID
- DRY
- KISS
- Clean Code
- Clean Architecture

---

## Naming Conventions

### React

Components:

```tsx
ProductTable.tsx;
CustomerForm.tsx;
LabelDesigner.tsx;
```

Hooks:

```tsx
useProducts.ts;
useCustomers.ts;
useLabels.ts;
```

Stores:

```tsx
useAuthStore.ts;
usePrintStore.ts;
```

### Laravel

Controllers:

```php
ProductController
CustomerController
LabelTemplateController
```

Services:

```php
ProductService
LabelService
PrintService
```

Repositories:

```php
ProductRepository
CustomerRepository
```

---

## TypeScript Rules

Always:

- Use strict mode
- Avoid any
- Create explicit interfaces
- Use reusable types

Bad:

```ts
const data: any;
```

Good:

```ts
interface Product {
    id: number;
    productCode: string;
}
```

---

## React Rules

- Functional Components only
- Custom hooks for business logic
- Components should remain presentational
- API calls must not exist directly in UI components

---

## Laravel Rules

- Validation through Form Requests
- Business logic through Services
- Database access through Repositories
- API responses through Resources

---

## Logging

Log:

- Printing
- Reprinting
- Imports
- Exports
- User Actions
- Authentication Events

Never log:

- Passwords
- Tokens
- Sensitive Data
