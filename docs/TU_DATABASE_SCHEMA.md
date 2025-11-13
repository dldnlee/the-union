# The Union Database Schema Documentation

## Overview

This document describes the database schema for The Union's e-commerce system. All tables use the `tu_` prefix to distinguish them from other application tables.

The system implements a flexible product variant architecture using an Entity-Attribute-Value (EAV) pattern, allowing products to have any combination of options (color, size, version, etc.) without schema changes.

---

## Table of Contents

1. [Product Tables](#product-tables)
2. [Option System](#option-system)
3. [Order Tables](#order-tables)
4. [Inventory Management](#inventory-management)
5. [Delivery Methods](#delivery-methods)
6. [Entity Relationships](#entity-relationships)
7. [Example Queries](#example-queries)

---

## Product Tables

### `tu_product`

The base product table containing core product information.

| Column | Type | Description |
|--------|------|-------------|
| `id` | uuid | Primary key (auto-generated) |
| `name` | varchar | Product name |
| `description` | text | Product description |
| `base_price` | numeric | Base price before variant adjustments |
| `created_at` | timestamptz | Record creation timestamp |
| `updated_at` | timestamptz | Last update timestamp |

**Example:**
```sql
{
  "id": "c5dc61e8-fbdf-4341-bc5d-37fcd5e28419",
  "name": "The Union 티셔츠",
  "description": "The Union에서 직접 제작한 티셔츠",
  "base_price": "10000.00"
}
```

---

### `tu_product_variant`

Represents specific variants of products (e.g., "Black T-Shirt, Size M").

| Column | Type | Description |
|--------|------|-------------|
| `id` | uuid | Primary key (auto-generated) |
| `product_id` | uuid | Foreign key to `tu_product` |
| `sku` | varchar | Unique stock keeping unit (e.g., "TSH-MED-BLK") |
| `price_adjustment` | numeric | Price adjustment from base price (default: 0) |
| `created_at` | timestamptz | Record creation timestamp |
| `updated_at` | timestamptz | Last update timestamp |

**Key Features:**
- Each variant has a unique SKU
- Final price = `product.base_price + variant.price_adjustment`
- Options are defined separately in the mapping table

**Example:**
```sql
{
  "id": "8b4fb5f4-65a5-4468-8abc-d7867d1f2a21",
  "product_id": "c5dc61e8-fbdf-4341-bc5d-37fcd5e28419",
  "sku": "TSH-MED-BLK",
  "price_adjustment": "0.00"
}
```

---

### `tu_variant_image`

Stores image URLs for product variants.

| Column | Type | Description |
|--------|------|-------------|
| `id` | uuid | Primary key (auto-generated) |
| `variant_id` | uuid | Foreign key to `tu_product_variant` |
| `image_url` | text | Full URL to image (Supabase Storage) |
| `sort_order` | integer | Display order (default: 0) |
| `is_main` | boolean | Main/primary image flag (default: false) |
| `created_at` | timestamptz | Record creation timestamp |
| `updated_at` | timestamptz | Last update timestamp |

**Key Features:**
- Multiple images per variant
- Ordered display via `sort_order`
- One primary image per variant via `is_main`

**Example:**
```sql
{
  "variant_id": "8b4fb5f4-65a5-4468-8abc-d7867d1f2a21",
  "image_url": "https://...supabase.co/storage/v1/object/public/umeki_products/tshirt_back.png",
  "sort_order": 0,
  "is_main": true
}
```

---

## Option System

The option system uses an Entity-Attribute-Value (EAV) pattern to provide maximum flexibility for product variants.

### `tu_option_type`

Defines the types of options available (e.g., color, size, version).

| Column | Type | Description |
|--------|------|-------------|
| `id` | uuid | Primary key (predefined UUIDs) |
| `name` | varchar | Option type name |
| `created_at` | timestamptz | Record creation timestamp |
| `updated_at` | timestamptz | Last update timestamp |

**Current Option Types:**
```sql
- id: 20000000-0000-0000-0000-000000000001, name: "color"
- id: 20000000-0000-0000-0000-000000000002, name: "size"
- id: 20000000-0000-0000-0000-000000000003, name: "version"
```

---

### `tu_option_value`

Stores specific values for each option type (e.g., "Red", "Large", "v2").

| Column | Type | Description |
|--------|------|-------------|
| `id` | uuid | Primary key (auto-generated) |
| `option_type_id` | uuid | Foreign key to `tu_option_type` |
| `value` | varchar | The option value |
| `created_at` | timestamptz | Record creation timestamp |
| `updated_at` | timestamptz | Last update timestamp |

**Examples:**
```sql
{
  "id": "7f69b9b8-d26c-449c-9813-f05d689dd2bd",
  "option_type_id": "20000000-0000-0000-0000-000000000001", // color
  "value": "#000000" // black
}

{
  "id": "183b6708-1d69-4f29-acee-b4d8fd6c1a7b",
  "option_type_id": "20000000-0000-0000-0000-000000000002", // size
  "value": "M"
}
```

---

### `tu_variant_option_map`

Maps variants to their option values (junction table).

| Column | Type | Description |
|--------|------|-------------|
| `variant_id` | uuid | Foreign key to `tu_product_variant` (composite PK) |
| `option_value_id` | uuid | Foreign key to `tu_option_value` (composite PK) |
| `created_at` | timestamptz | Record creation timestamp |

**Key Features:**
- Composite primary key ensures no duplicate mappings
- A variant can have multiple option values
- Each mapping links one variant to one specific option value

**Example:**
```sql
// Variant "TSH-MED-BLK" has color=#000000 AND size=M
{
  "variant_id": "8b4fb5f4-65a5-4468-8abc-d7867d1f2a21",
  "option_value_id": "7f69b9b8-d26c-449c-9813-f05d689dd2bd" // color: black
}
{
  "variant_id": "8b4fb5f4-65a5-4468-8abc-d7867d1f2a21",
  "option_value_id": "183b6708-1d69-4f29-acee-b4d8fd6c1a7b" // size: M
}
```

---

## Order Tables

### `tu_order`

Main order table containing customer and order information.

| Column | Type | Description | Constraints |
|--------|------|-------------|-------------|
| `id` | uuid | Primary key (auto-generated) | |
| `customer_name` | varchar | Customer's full name | |
| `customer_email` | varchar | Customer's email address | |
| `customer_phone` | varchar | Customer's phone number | |
| `customer_address` | text | Full shipping address | |
| `customs_code` | varchar | Personal customs clearance code (국제배송) | |
| `order_date` | timestamptz | Order creation date (default: now()) | |
| `total_amount` | numeric | Total order amount | |
| `status` | varchar | Order fulfillment status | 'Pending', 'Processing', 'Shipped', 'Delivered', 'Canceled' |
| `payment_status` | varchar | Payment status | 'Paid', 'Pending', 'Failed' |
| `delivery_method_id` | uuid | Foreign key to `tu_delivery_method` | |
| `created_at` | timestamptz | Record creation timestamp | |
| `updated_at` | timestamptz | Last update timestamp | |

**Status Flow:**
```
Order Status:    Pending → Processing → Shipped → Delivered
                    ↓
                 Canceled (any stage)

Payment Status:  Pending → Paid
                    ↓
                 Failed
```

---

### `tu_order_item`

Individual line items within an order.

| Column | Type | Description | Constraints |
|--------|------|-------------|-------------|
| `id` | uuid | Primary key (auto-generated) | |
| `order_id` | uuid | Foreign key to `tu_order` | |
| `variant_id` | uuid | Foreign key to `tu_product_variant` | |
| `quantity` | integer | Quantity ordered | Must be > 0 |
| `price_at_purchase` | numeric | Unit price at time of purchase | |
| `subtotal` | numeric | Line item subtotal (quantity × price) | |
| `sku_snapshot` | varchar | SKU snapshot at purchase time | |
| `created_at` | timestamptz | Record creation timestamp | |
| `updated_at` | timestamptz | Last update timestamp | |

**Key Features:**
- Captures price at purchase time (price history)
- Stores SKU snapshot to preserve product identity
- Subtotal calculation for easy order total computation

---

## Inventory Management

### `tu_inventory_stock`

Tracks available stock per variant and delivery method.

| Column | Type | Description | Constraints |
|--------|------|-------------|-------------|
| `id` | uuid | Primary key (auto-generated) | |
| `variant_id` | uuid | Foreign key to `tu_product_variant` | |
| `method_id` | uuid | Foreign key to `tu_delivery_method` | |
| `quantity_available` | integer | Available quantity (default: 0) | Must be >= 0 |
| `created_at` | timestamptz | Record creation timestamp | |
| `updated_at` | timestamptz | Last update timestamp | |

**Key Features:**
- Stock is tracked per variant AND delivery method
- Prevents negative stock with check constraint
- Allows different stock levels for local vs international shipping

**Example Use Case:**
```
Product: "The Union 티셔츠" (Black, M)
- Local shipping: 50 units available
- International shipping: 20 units available
- Onsite pickup: 10 units available
```

---

## Delivery Methods

### `tu_delivery_method`

Defines available delivery/fulfillment methods.

| Column | Type | Description |
|--------|------|-------------|
| `id` | uuid | Primary key (predefined UUIDs) |
| `name` | varchar | Method identifier |
| `description` | text | Human-readable description |
| `created_at` | timestamptz | Record creation timestamp |
| `updated_at` | timestamptz | Last update timestamp |

**Available Methods:**
```sql
{
  "id": "00000000-0000-0000-0000-000000000001",
  "name": "local",
  "description": "국내 배송"
}

{
  "id": "00000000-0000-0000-0000-000000000002",
  "name": "international",
  "description": "국제 발송"
}

{
  "id": "00000000-0000-0000-0000-000000000003",
  "name": "onsite",
  "description": "현장 수령"
}
```

---

## Entity Relationships

```
┌─────────────────┐
│   tu_product    │
│   (Base info)   │
└────────┬────────┘
         │ 1:N
         │
         ▼
┌─────────────────────────┐        ┌──────────────────┐
│  tu_product_variant     │◄──1:N──│ tu_variant_image │
│  (SKU, price adj.)      │        │  (Images)        │
└──────────┬──────────────┘        └──────────────────┘
           │ N:M
           │
           ▼
┌─────────────────────────┐
│ tu_variant_option_map   │
│  (Junction table)       │
└──────────┬──────────────┘
           │ N:1
           │
           ▼
┌─────────────────────────┐        ┌──────────────────┐
│   tu_option_value       │───N:1─►│ tu_option_type   │
│   (Specific values)     │        │ (color, size)    │
└─────────────────────────┘        └──────────────────┘


┌─────────────────┐
│    tu_order     │
│ (Order header)  │
└────────┬────────┘
         │ 1:N
         │
         ▼
┌─────────────────────────┐
│   tu_order_item         │
│   (Line items)          │
└──────────┬──────────────┘
           │ N:1
           │
           ▼
┌─────────────────────────┐
│  tu_product_variant     │
└─────────────────────────┘


┌─────────────────────────┐        ┌──────────────────────┐
│  tu_product_variant     │        │ tu_delivery_method   │
└──────────┬──────────────┘        └──────────┬───────────┘
           │                                   │
           │ N:1                          N:1 │
           └──────────┬────────────────────────┘
                      │
                      ▼
           ┌──────────────────────┐
           │ tu_inventory_stock   │
           │  (Stock per method)  │
           └──────────────────────┘
```

---

## Example Queries

### Get Product with All Variants and Options

```sql
SELECT
  p.id AS product_id,
  p.name AS product_name,
  p.base_price,
  v.id AS variant_id,
  v.sku,
  v.price_adjustment,
  (p.base_price + v.price_adjustment) AS final_price,
  ot.name AS option_type,
  ov.value AS option_value
FROM tu_product p
JOIN tu_product_variant v ON v.product_id = p.id
JOIN tu_variant_option_map vom ON vom.variant_id = v.id
JOIN tu_option_value ov ON ov.id = vom.option_value_id
JOIN tu_option_type ot ON ot.id = ov.option_type_id
WHERE p.id = 'c5dc61e8-fbdf-4341-bc5d-37fcd5e28419';
```

### Get Variant with Stock Levels by Delivery Method

```sql
SELECT
  v.sku,
  dm.name AS delivery_method,
  dm.description,
  ist.quantity_available
FROM tu_product_variant v
JOIN tu_inventory_stock ist ON ist.variant_id = v.id
JOIN tu_delivery_method dm ON dm.id = ist.method_id
WHERE v.id = '8b4fb5f4-65a5-4468-8abc-d7867d1f2a21';
```

### Get Order with Items and Product Details

```sql
SELECT
  o.id AS order_id,
  o.customer_name,
  o.order_date,
  o.status,
  o.payment_status,
  oi.quantity,
  oi.price_at_purchase,
  oi.subtotal,
  v.sku,
  p.name AS product_name
FROM tu_order o
JOIN tu_order_item oi ON oi.order_id = o.id
JOIN tu_product_variant v ON v.id = oi.variant_id
JOIN tu_product p ON p.id = v.product_id
WHERE o.id = '<order-uuid>';
```

### Get All Options for a Variant

```sql
SELECT
  v.sku,
  ot.name AS option_type,
  ov.value AS option_value
FROM tu_product_variant v
JOIN tu_variant_option_map vom ON vom.variant_id = v.id
JOIN tu_option_value ov ON ov.id = vom.option_value_id
JOIN tu_option_type ot ON ot.id = ov.option_type_id
WHERE v.id = '8b4fb5f4-65a5-4468-8abc-d7867d1f2a21';
```

### Create Complete Product with Variant

```sql
-- 1. Insert product
INSERT INTO tu_product (name, description, base_price)
VALUES ('New Product', 'Product description', 25000)
RETURNING id;

-- 2. Insert variant
INSERT INTO tu_product_variant (product_id, sku, price_adjustment)
VALUES ('<product-id>', 'PROD-001', 0)
RETURNING id;

-- 3. Insert option values if needed
INSERT INTO tu_option_value (option_type_id, value)
VALUES
  ('20000000-0000-0000-0000-000000000001', 'Red'),
  ('20000000-0000-0000-0000-000000000002', 'L')
RETURNING id;

-- 4. Map options to variant
INSERT INTO tu_variant_option_map (variant_id, option_value_id)
VALUES
  ('<variant-id>', '<color-value-id>'),
  ('<variant-id>', '<size-value-id>');

-- 5. Add inventory
INSERT INTO tu_inventory_stock (variant_id, method_id, quantity_available)
VALUES
  ('<variant-id>', '00000000-0000-0000-0000-000000000001', 100), -- local
  ('<variant-id>', '00000000-0000-0000-0000-000000000002', 50);  -- international
```

---

## Design Principles

### Why EAV Pattern?

The Entity-Attribute-Value pattern was chosen for the option system to provide:

1. **Flexibility**: Add new option types without schema changes
2. **Scalability**: Support any combination of options
3. **Maintainability**: Centralized option management
4. **Extensibility**: Easy to add new features (e.g., option groups, dependencies)

### Why Separate Inventory by Delivery Method?

Different delivery methods often have different stock:
- Local shipping may have warehouse stock
- International shipping may have limited allocated stock
- Onsite pickup may have event-specific inventory

### Price Snapshots

Order items capture `price_at_purchase` to:
- Maintain accurate historical records
- Prevent order totals from changing when prices update
- Support financial reporting and auditing

---

## Best Practices

### Creating New Products

1. Always create at least one variant per product
2. Assign a unique, meaningful SKU to each variant
3. Map all relevant options to the variant
4. Set inventory levels for each delivery method
5. Upload at least one image and mark it as `is_main`

### Managing Orders

1. Create order and order items in a transaction
2. Capture price and SKU at purchase time
3. Update inventory after successful payment
4. Update `order_status` and `payment_status` independently
5. Use `customs_code` for international orders

### Querying Data

1. Always join through the proper foreign keys
2. Use `LEFT JOIN` when optional relationships exist
3. Filter inactive/deleted variants if using soft deletes
4. Consider indexing `sku`, `order_date`, and `status` fields

---

## Future Enhancements

Potential additions to consider:

- **Soft deletes**: `is_active` or `deleted_at` columns
- **Discounts/Promotions**: Separate discount table
- **Product categories**: Category taxonomy
- **Shipping costs**: Calculated shipping based on method
- **Order history**: Change log table for order status changes
- **Reviews/Ratings**: Product review system
- **Wishlist**: Customer wishlist functionality
- **Stock reservations**: Temporary hold on inventory during checkout

---

## Version History

| Version | Date | Changes |
|---------|------|---------|
| 1.0 | 2025-11-13 | Initial documentation |

---

## Contact

For questions about this schema, please contact the development team.
