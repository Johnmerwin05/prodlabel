# UI Guidelines

## Design Principles

- Modern
- Clean
- Professional
- Fast
- Responsive

Do not redesign existing pages unless requested.

---

## Layout

Use:

```text
Sidebar
Top Navigation
Content Area
```

---

## Tables

All tables must support:

- Pagination
- Search
- Sorting
- Filters
- Column Visibility
- Bulk Actions

Use Shadcn Data Table Pattern.

---

## Customer Management

Features:

- Create
- Update
- Soft Delete
- Restore
- Assign Label Templates

---

## User Management

Features:

- Create
- Update
- Soft Delete
- Role Management
- Permission Management

---

## Product Management

Features:

- Manual Product Entry
- Excel Upload
- Download Template
- Bulk Print
- Bulk Reprint
- Print History

Visual Indicators:

```text
Printed
Not Printed
Reprinted
```

---

## Label Designer

Must include:

- Drag & Drop Builder
- Property Panel
- Canvas Preview
- Layer Management

Elements:

- Text
- Barcode
- QR Code
- Rectangle
- Line
- Circle
- Image
- Border

---

## Label Layout Preview

Support:

- A3
- A4
- Custom Size

Configuration:

- Rows
- Columns
- Outer Margins
- Inner Gaps

Example:

```text
A3

3 Columns
4 Rows

Custom Margins
```

---

## Loading States

Use:

- Skeleton Components

Never show blank pages.

---

## Notifications

Use Sonner.

Examples:

- Save Success
- Import Success
- Print Started
- Print Completed
- Validation Error

---

## Empty States

Every page must have:

- Empty State
- Error State
- Loading State

---

## Accessibility

- Keyboard Navigation
- Focus States
- Proper Labels
- ARIA Compliance
