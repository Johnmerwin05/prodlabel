# Frontend Architecture

## Architecture Pattern

Feature-Based Architecture

```text
src/
├── app/
├── routes/
├── shared/
├── features/
│
├── auth/
├── dashboard/
├── customers/
├── users/
├── products/
├── labels/
├── reports/
```

---

## Feature Structure

```text
features/products/

├── api/
├── components/
├── hooks/
├── pages/
├── schemas/
├── stores/
├── types/
├── utils/
└── routes/
```

---

## API Layer

```text
features/products/api/

create-product.ts
update-product.ts
delete-product.ts
get-products.ts
```

All API calls use:

- Axios Instance
- React Query

---

## State Management

### Zustand

Use for:

- Authentication
- Theme
- Print Queue
- Global Preferences

Do NOT use Zustand for server data.

---

## React Query

Use for:

- Customers
- Products
- Users
- Reports
- Labels

Benefits:

- Cache
- Retry
- Invalidation
- Optimistic Updates

---

## Forms

Use:

- React Hook Form
- Zod

Every form must have:

- Validation
- Loading State
- Error State
- Success Feedback

---

## Loading Experience

Every page must include:

- Skeleton Loading
- Empty State
- Error State

Never use:

```tsx
Loading...
```

Use Shadcn Skeleton Components.

---

## Route Structure

```text
/dashboard

/customers
/customers/create
/customers/:id/edit

/users
/users/create
/users/:id/edit

/products
/products/create
/products/import

/labels
/labels/create
/labels/designer

/reports
```

---

## Performance

Implement:

- Code Splitting
- Lazy Loading
- React.memo
- Query Caching
- Virtualized Tables when needed

---

## UI Requirements

Use:

- sidebar-07
- login-05

All tables must support:

- Pagination
- Search
- Sorting
- Filtering
- Bulk Actions

Use Shadcn Data Table Pattern.
