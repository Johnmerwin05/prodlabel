# Database Conventions

## General Rules

- Use snake_case
- Use unsignedBigInteger foreign keys
- Use soft deletes
- Use timestamps

---

## Core Tables

### customers

```sql
id
name
code
status
created_at
updated_at
deleted_at
```

---

### users

```sql
id
name
email
password
status
created_at
updated_at
deleted_at
```

---

### label_templates

```sql
id
name
paper_size
width
height
outer_margin_top
outer_margin_left
outer_margin_right
outer_margin_bottom
inner_gap_horizontal
inner_gap_vertical
layout_json
status
created_at
updated_at
deleted_at
```

---

### customer_label_templates

```sql
id
customer_id
label_template_id
```

A customer can have multiple templates.

---

### products

```sql
id
customer_id
product_code
product_name
quantity
batch_no
remarks
is_printed
printed_at
created_at
updated_at
deleted_at
```

---

### print_jobs

```sql
id
customer_id
user_id
status
total_records
processed_records
started_at
completed_at
```

---

### print_job_items

```sql
id
print_job_id
product_id
printed_at
is_reprint
```

---

## Indexes

Required:

```sql
customer_id
product_code
batch_no
is_printed
status
created_at
```

---

## Soft Deletes

Always use:

```php
SoftDeletes
```

Never permanently delete records unless explicitly required.
