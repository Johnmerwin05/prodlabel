# Labeling Management System ERD

Core relationships:

```mermaid
erDiagram
    USERS ||--o{ ROLE_USER : has
    ROLES ||--o{ ROLE_USER : assigned
    ROLES ||--o{ PERMISSION_ROLE : grants
    PERMISSIONS ||--o{ PERMISSION_ROLE : included
    CUSTOMERS ||--o{ PRODUCTS : owns
    CUSTOMERS ||--o{ CUSTOMER_TEMPLATES : assigned
    TEMPLATES ||--o{ CUSTOMER_TEMPLATES : assigned
    TEMPLATES ||--o{ TEMPLATE_VERSIONS : versions
    TEMPLATES ||--o{ TEMPLATE_ELEMENTS : contains
    CUSTOMERS ||--o{ PRODUCT_PRINTS : prints
    TEMPLATES ||--o{ PRODUCT_PRINTS : renders
    PRODUCT_PRINTS ||--o{ PRODUCT_PRINT_ITEMS : contains
    PRODUCTS ||--o{ PRODUCT_PRINT_ITEMS : printed
    PRODUCTS ||--o{ PRODUCT_REPRINTS : reprinted
    USERS ||--o{ AUDIT_LOGS : performs
    USERS ||--o{ ACTIVITY_LOGS : performs
```

High-volume indexes are placed on customer/status/date access paths, product SKU/customer lookups, print job status, audit polymorphic lookups, and template assignment joins.
