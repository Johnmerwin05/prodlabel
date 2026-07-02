# Label Engine Specification

## Purpose

The Label Engine is the core component of the Production Labeling System.

It allows administrators to create dynamic label templates that can be assigned to customers and used when printing products.

The engine must support:

- Dynamic label design
- Variable data printing
- Barcode generation
- QR Code generation
- Custom paper sizes
- A3 and A4 layouts
- Multiple labels per page
- Drag-and-drop designer
- Template versioning
- Real-time preview

---

# Architecture Overview

```text
Customer
    ↓
Assigned Template
    ↓
Product Data
    ↓
Label Engine
    ↓
Render Labels
    ↓
Print / PDF Export
```

---

# Core Concepts

## Customer

A customer can have one or more assigned label templates.

Example:

```text
Customer A
 ├── Template 1
 ├── Template 2

Customer B
 └── Template 3
```

---

## Product

Product data acts as the source for variable data fields.

Example:

```json
{
    "product_id": "1001",
    "product_code": "ABC123",
    "product_name": "Product Name",
    "quantity": 50,
    "batch_no": "BATCH001"
}
```

---

## Label Template

A label template defines:

- Paper Size
- Layout
- Margins
- Elements
- Variable Fields

Template must be stored as JSON.

---

# Supported Paper Sizes

## Standard

- A3
- A4
- Letter
- Legal

## Custom

User-defined:

```json
{
    "width": 297,
    "height": 420
}
```

Unit:

```text
Millimeters (mm)
```

---

# Layout Configuration

## Grid Layout

Support:

```text
Rows
Columns
```

Example:

```text
A3

3 Columns
4 Rows
```

Result:

```text
[1][2][3]
[4][5][6]
[7][8][9]
[10][11][12]
```

---

# Margin Configuration

## Outer Margins

Support:

```text
Top
Left
Right
Bottom
```

Example:

```text
Top: 3mm
Left: 3mm
Right: 3mm
Bottom: 3mm
```

---

## Inner Gaps

Support:

```text
Horizontal Gap
Vertical Gap
```

Example:

```text
Horizontal: 2mm
Vertical: 2mm
```

---

# Supported Elements

## Text

Properties:

```json
{
    "type": "text",
    "x": 10,
    "y": 20,
    "fontSize": 12,
    "fontWeight": "bold",
    "value": "{{product_name}}"
}
```

---

## Barcode

Supported Formats:

- Code128
- Code39
- EAN13
- EAN8
- UPC

Properties:

```json
{
    "type": "barcode",
    "format": "CODE128",
    "width": 100,
    "height": 40
}
```

---

## QR Code

Properties:

```json
{
    "type": "qrcode",
    "width": 80,
    "height": 80
}
```

---

## Rectangle

Properties:

```json
{
    "type": "rectangle",
    "width": 100,
    "height": 50,
    "borderWidth": 1
}
```

---

## Circle

Properties:

```json
{
    "type": "circle",
    "radius": 20
}
```

---

## Line

Properties:

```json
{
    "type": "line",
    "length": 100
}
```

---

## Image

Properties:

```json
{
    "type": "image",
    "url": "..."
}
```

---

# Dynamic Variables

## Product Variables

Available:

```text
{{product_id}}
{{product_code}}
{{product_name}}
{{quantity}}
{{batch_no}}
{{created_at}}
```

---

## Customer Variables

Available:

```text
{{customer_name}}
{{customer_code}}
```

---

## System Variables

Available:

```text
{{current_date}}
{{current_time}}
{{printed_by}}
```

---

# Dynamic Barcode Data

Users can build barcode values using static and dynamic values.

Example:

```text
CUSTOM-
{{product_id}}
-
{{product_name}}
-
{{quantity}}
```

Rendered:

```text
CUSTOM-1001-Product Name-50
```

---

# Dynamic QR Data

Users can build QR content using:

- Text
- Variables
- Multiple Fields

Example:

```text
{{product_code}}
|
{{product_name}}
|
{{quantity}}
```

Rendered:

```text
ABC123|Product Name|50
```

---

# Drag and Drop Builder

The designer must support:

- Drag Elements
- Resize Elements
- Move Elements
- Duplicate Elements
- Delete Elements
- Multi Select
- Layer Ordering

---

# Layer Management

Support:

```text
Bring Forward
Send Backward
Bring To Front
Send To Back
```

---

# Alignment Tools

Support:

```text
Align Left
Align Right
Align Top
Align Bottom
Center Horizontal
Center Vertical
```

---

# Snap System

Support:

```text
Grid Snap
Element Snap
Guide Lines
```

---

# Template Versioning

Every template update creates a version.

Example:

```text
Template 1

Version 1
Version 2
Version 3
```

Users can restore previous versions.

---

# Print Workflow

1. User selects customer
2. System loads assigned template
3. User selects products
4. Label Engine renders labels
5. PDF generated
6. Print job created
7. Audit trail stored

---

# Reprint Workflow

When reprinting:

```text
is_reprint = true
```

Store:

- Original Print Date
- Reprint Date
- Reprinted By
- Reason

---

# Rendering Rules

Render Order:

```text
Background
Shapes
Images
Barcodes
QR Codes
Text
```

---

# Preview System

Support:

- Real-time preview
- Zoom In
- Zoom Out
- Fit Width
- Fit Page

---

# Export Support

Supported:

- PDF
- PNG
- JPEG

---

# Performance Requirements

Templates must support:

- 10,000+ products
- Batch printing
- Queue processing
- Redis caching

Large print jobs must be processed through queues.

---

# Audit Requirements

Log:

- Template Created
- Template Updated
- Template Deleted
- Template Assigned
- Product Printed
- Product Reprinted
- Print Failed

Store:

- User
- Timestamp
- Action
- Metadata

---

# Future Compatibility

The engine must be extensible for:

- RFID Labels
- NFC Labels
- Thermal Printers
- Zebra Printers
- Multi-Language Labels
- Customer-Specific Components
