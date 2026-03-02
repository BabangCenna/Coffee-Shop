# ☕ KopiFlow — Coffee Shop Database

A complete, production-ready database schema for a coffee shop management system built on **Turso (LibSQL/SQLite)**. Designed to power a **Next.js** web dashboard and a **Flutter** mobile/POS app from a single database.

---

## Table of Contents

1. [Overview](#overview)
2. [Tech Stack](#tech-stack)
3. [Quick Start](#quick-start)
4. [Database Schema](#database-schema)
   - [Reference Tables](#reference-tables)
   - [Auth & Users (RBAC)](#auth--users-rbac)
   - [Inventory](#inventory)
   - [Menu & Recipes](#menu--recipes)
   - [Customers & Loyalty](#customers--loyalty)
   - [Orders](#orders)
5. [Entity Relationship Diagram](#entity-relationship-diagram)
6. [Roles & Permissions](#roles--permissions)
7. [Key Business Flows](#key-business-flows)
   - [Incoming Stock](#incoming-stock-flow)
   - [Customer Sale](#customer-sale-flow)
   - [Waste & Adjustment](#waste--adjustment-flow)
   - [Loyalty Points](#loyalty-points-flow)
   - [User Login & Auth](#user-login--auth-flow)
8. [Connecting with Next.js](#connecting-with-nextjs)
9. [Connecting with Flutter](#connecting-with-flutter)
10. [API Design Suggestions](#api-design-suggestions)
11. [Security Notes](#security-notes)
12. [Common Queries](#common-queries)
13. [Extending the Schema](#extending-the-schema)

---

## Overview

KopiFlow covers everything a coffee shop needs to manage:

- **Inventory** — products, stock levels, purchase orders, waste logging
- **Menu & Recipes** — drinks mapped to their raw ingredients so stock auto-deducts per brew
- **Orders** — sales tied to customers, with split support for packaged goods vs. brewed drinks
- **Loyalty** — customer points, tiers (Member / Silver / Gold), full earn/redeem audit trail
- **Users** — role-based access control (RBAC) with 6 default roles and granular permissions
- **Audit** — every stock change, order, login, and point transaction is traceable to a user and timestamp

**22 tables · 15 indexes · 6 roles · 21 permissions**

---

## Tech Stack

| Layer            | Technology                           | Notes                                     |
| ---------------- | ------------------------------------ | ----------------------------------------- |
| Database         | [Turso](https://turso.tech) (LibSQL) | SQLite-compatible, edge-replicated        |
| Web Backend      | Next.js (App Router)                 | API routes or Server Actions              |
| Web DB Client    | `@libsql/client`                     | Official Turso JS/TS client               |
| Mobile App       | Flutter                              | Dart HTTP client calling your Next.js API |
| Auth             | JWT or session tokens                | Stored in `user_sessions` table           |
| Password Hashing | argon2id / bcrypt                    | Never store plaintext passwords           |

> **Why Turso?** It gives you a proper SQLite database with HTTP access, edge replication, and a generous free tier. Your Next.js backend talks to it over HTTPS. Your Flutter app never touches the database directly — it always goes through your API.

---

## Quick Start

### 1. Create your Turso database

```bash
# Install Turso CLI
curl -sSfL https://get.tur.so/install.sh | bash

# Login
turso auth login

# Create the database
turso db create kopiflow

# Get your credentials
turso db show kopiflow        # note the URL
turso db tokens create kopiflow  # note the auth token
```

### 2. Run the schema

```bash
# Option A: pipe the file directly
turso db shell kopiflow < kopiflow_schema.sql

# Option B: open shell and paste
turso db shell kopiflow
# then paste the contents of kopiflow_schema.sql
```

### 3. Set your environment variables

```bash
# .env.local (Next.js)
TURSO_DATABASE_URL=libsql://your-db-name-yourname.turso.io
TURSO_AUTH_TOKEN=your-auth-token-here
```

### 4. Before going live — change the owner password

The seed data inserts an owner account with a placeholder hash. Before your first login, either:

**Option A** — Update via SQL with a real hash:

```sql
UPDATE users
SET password_hash = 'your_argon2_hash_here'
WHERE username = 'owner';
```

**Option B** — Delete the seeded account and create it through your app's registration flow, which should hash the password properly.

---

## Database Schema

### Reference Tables

These tables have no foreign keys and must exist before everything else.

#### `units`

Units of measurement used across products and recipes.

| Column | Type        | Notes                            |
| ------ | ----------- | -------------------------------- |
| `id`   | INTEGER PK  | Auto-increment                   |
| `name` | TEXT UNIQUE | e.g. `kilogram`, `gram`, `liter` |
| `abbr` | TEXT        | e.g. `kg`, `g`, `L`              |

**Seeded values:** kilogram, gram, liter, milliliter, pack, box, carton, piece, stick, sachet, bottle, can

#### `categories`

Product groupings with a type flag.

| Column       | Type        | Notes                               |
| ------------ | ----------- | ----------------------------------- |
| `id`         | INTEGER PK  | Auto-increment                      |
| `name`       | TEXT UNIQUE | e.g. `Roasted Coffee`, `Cigarettes` |
| `type`       | TEXT        | `sellable` / `consumable` / `both`  |
| `created_at` | TEXT        | ISO datetime                        |

**Type values explained:**

- `sellable` — sold as-is (cigarettes, packaged snacks)
- `consumable` — used to make something, never sold directly (milk, syrup, cups)
- `both` — roasted beans: sold in bags AND brewed into drinks

---

### Auth & Users (RBAC)

Role-Based Access Control. Permissions are rows in a table, not hardcoded — you can change access without touching your code.

#### `roles`

| Column         | Type        | Notes                                                             |
| -------------- | ----------- | ----------------------------------------------------------------- |
| `id`           | INTEGER PK  |                                                                   |
| `role_key`     | TEXT UNIQUE | `owner`, `manager`, `cashier`, `stock_clerk`, `barista`, `viewer` |
| `display_name` | TEXT        | Human-readable label                                              |
| `description`  | TEXT        | What this role is for                                             |
| `is_system`    | INTEGER     | `1` = cannot be deleted from UI                                   |
| `created_at`   | TEXT        |                                                                   |

#### `permissions`

| Column        | Type        | Notes                                                                                             |
| ------------- | ----------- | ------------------------------------------------------------------------------------------------- |
| `id`          | INTEGER PK  |                                                                                                   |
| `perm_key`    | TEXT UNIQUE | Dot-notation: `inventory.write`, `sales.read`                                                     |
| `module`      | TEXT        | `inventory`, `sales`, `loyalty`, `users`, `reports`, `kitchen`, `products`, `system`, `suppliers` |
| `action`      | TEXT        | `read`, `write`, `delete`, `approve`                                                              |
| `description` | TEXT        | Human-readable explanation                                                                        |

#### `role_permissions`

Join table linking roles to their allowed permissions.

| Column          | Type                     | Notes                                      |
| --------------- | ------------------------ | ------------------------------------------ |
| `id`            | INTEGER PK               |                                            |
| `role_id`       | INTEGER FK → roles       |                                            |
| `permission_id` | INTEGER FK → permissions |                                            |
| UNIQUE          |                          | `(role_id, permission_id)` — no duplicates |

#### `users`

| Column          | Type               | Notes                                      |
| --------------- | ------------------ | ------------------------------------------ |
| `id`            | INTEGER PK         |                                            |
| `full_name`     | TEXT               |                                            |
| `username`      | TEXT UNIQUE        | Login handle                               |
| `password_hash` | TEXT               | argon2id or bcrypt — NEVER plaintext       |
| `pin_hash`      | TEXT               | Optional 4–6 digit PIN for quick POS login |
| `role_id`       | INTEGER FK → roles |                                            |
| `is_active`     | INTEGER            | `1` = active, `0` = disabled (soft delete) |
| `phone`         | TEXT               | For contact / notifications                |
| `last_login_at` | TEXT               | Updated on each login                      |
| `created_by`    | INTEGER FK → users | Who created this account                   |
| `created_at`    | TEXT               |                                            |

#### `user_sessions`

Every login and logout is recorded here.

| Column          | Type               | Notes                                   |
| --------------- | ------------------ | --------------------------------------- |
| `id`            | INTEGER PK         |                                         |
| `user_id`       | INTEGER FK → users |                                         |
| `session_token` | TEXT UNIQUE        | Random token generated by your app      |
| `login_at`      | TEXT               |                                         |
| `logout_at`     | TEXT               | `NULL` = session still active           |
| `ip_address`    | TEXT               | Optional, for security audit            |
| `device_info`   | TEXT               | e.g. `iPad Counter 1`, `Manager Laptop` |

#### `shifts`

Optional but useful. Tracks when staff clock in/out and cash drawer amounts.

| Column         | Type               | Notes                         |
| -------------- | ------------------ | ----------------------------- |
| `id`           | INTEGER PK         |                               |
| `user_id`      | INTEGER FK → users |                               |
| `clock_in`     | TEXT               |                               |
| `clock_out`    | TEXT               | `NULL` = currently on shift   |
| `opening_cash` | REAL               | Cash drawer at start of shift |
| `closing_cash` | REAL               | Cash drawer at end of shift   |
| `notes`        | TEXT               | Handover notes for next shift |

---

### Inventory

#### `suppliers`

| Column         | Type       | Notes                                        |
| -------------- | ---------- | -------------------------------------------- |
| `id`           | INTEGER PK |                                              |
| `name`         | TEXT       |                                              |
| `contact_name` | TEXT       | Person to call                               |
| `phone`        | TEXT       |                                              |
| `address`      | TEXT       |                                              |
| `product_type` | TEXT       | `coffee`, `cigarettes`, `dairy`, `general` … |
| `notes`        | TEXT       |                                              |
| `is_active`    | INTEGER    | Soft delete                                  |
| `created_at`   | TEXT       |                                              |

#### `products`

Master catalog of everything you stock, sell, or use.

| Column            | Type                    | Notes                                    |
| ----------------- | ----------------------- | ---------------------------------------- |
| `id`              | INTEGER PK              |                                          |
| `name`            | TEXT                    | e.g. `Arabica Gayo 1kg`, `Sampoerna 16s` |
| `sku`             | TEXT UNIQUE             | Barcode or internal code (optional)      |
| `category_id`     | INTEGER FK → categories |                                          |
| `unit_id`         | INTEGER FK → units      |                                          |
| `cost_price`      | REAL                    | What you pay the supplier                |
| `selling_price`   | REAL                    | What the customer pays                   |
| `low_stock_alert` | REAL                    | Alert when stock ≤ this value            |
| `is_active`       | INTEGER                 | Soft delete                              |
| `notes`           | TEXT                    |                                          |
| `created_at`      | TEXT                    |                                          |

#### `stock`

Current quantity on hand per product per location.

| Column       | Type                  | Notes                         |
| ------------ | --------------------- | ----------------------------- |
| `id`         | INTEGER PK            |                               |
| `product_id` | INTEGER FK → products |                               |
| `quantity`   | REAL                  | Current amount                |
| `location`   | TEXT                  | `main`, `storage`, `fridge`   |
| `updated_at` | TEXT                  | Updated on every stock change |
| UNIQUE       |                       | `(product_id, location)`      |

#### `purchase_orders`

| Column        | Type                   | Notes                                |
| ------------- | ---------------------- | ------------------------------------ |
| `id`          | INTEGER PK             |                                      |
| `supplier_id` | INTEGER FK → suppliers |                                      |
| `status`      | TEXT                   | `pending` → `received` / `cancelled` |
| `total_cost`  | REAL                   | Sum of all items                     |
| `notes`       | TEXT                   |                                      |
| `ordered_at`  | TEXT                   |                                      |
| `received_at` | TEXT                   | Set when status → `received`         |
| `approved_by` | INTEGER FK → users     | Manager or owner who approved        |
| `created_by`  | INTEGER FK → users     | Who raised the PO                    |

#### `purchase_order_items`

Line items of a purchase order — one row per product.

| Column       | Type                         | Notes                           |
| ------------ | ---------------------------- | ------------------------------- |
| `id`         | INTEGER PK                   |                                 |
| `po_id`      | INTEGER FK → purchase_orders | CASCADE delete                  |
| `product_id` | INTEGER FK → products        |                                 |
| `quantity`   | REAL                         | Amount ordered                  |
| `unit_cost`  | REAL                         | Price per unit at time of order |

#### `stock_movements`

The complete audit log of every stock change. This is your source of truth.

| Column         | Type                  | Notes                                                     |
| -------------- | --------------------- | --------------------------------------------------------- |
| `id`           | INTEGER PK            |                                                           |
| `product_id`   | INTEGER FK → products |                                                           |
| `type`         | TEXT                  | `purchase` / `sale` / `waste` / `adjustment` / `transfer` |
| `quantity`     | REAL                  | Positive = stock in, negative = stock out                 |
| `note`         | TEXT                  | Reason or description                                     |
| `reference_id` | TEXT                  | e.g. `ORD-042`, `PO-007`                                  |
| `created_by`   | INTEGER FK → users    | Who performed this action                                 |
| `created_at`   | TEXT                  |                                                           |

---

### Menu & Recipes

#### `menu_items`

What appears on the customer-facing menu.

| Column       | Type       | Notes                                      |
| ------------ | ---------- | ------------------------------------------ |
| `id`         | INTEGER PK |                                            |
| `name`       | TEXT       | `Cappuccino`, `V60 Pour Over`, `Croissant` |
| `category`   | TEXT       | `coffee`, `non-coffee`, `food`             |
| `price`      | REAL       | Selling price                              |
| `is_active`  | INTEGER    | Soft delete / seasonal hide                |
| `notes`      | TEXT       |                                            |
| `created_at` | TEXT       |                                            |

#### `recipes`

Links a menu item to its raw ingredients with exact quantities. When a drink is sold, the app uses this to know which products to deduct from stock.

| Column         | Type                    | Notes                        |
| -------------- | ----------------------- | ---------------------------- |
| `id`           | INTEGER PK              |                              |
| `menu_item_id` | INTEGER FK → menu_items | CASCADE delete               |
| `product_id`   | INTEGER FK → products   | The ingredient               |
| `quantity`     | REAL                    | Amount used per serving      |
| `unit_id`      | INTEGER FK → units      | Unit of the quantity         |
| UNIQUE         |                         | `(menu_item_id, product_id)` |

**Example — Cappuccino recipe:**

```sql
INSERT INTO recipes (menu_item_id, product_id, quantity, unit_id) VALUES
  (1, 5,  18,  2),   -- 18g espresso blend
  (1, 8,  150, 4),   -- 150ml whole milk
  (1, 12, 10,  4);   -- 10ml vanilla syrup
```

---

### Customers & Loyalty

#### `customers`

| Column        | Type        | Notes                               |
| ------------- | ----------- | ----------------------------------- |
| `id`          | INTEGER PK  |                                     |
| `name`        | TEXT        |                                     |
| `phone`       | TEXT UNIQUE | Primary lookup key at counter       |
| `tier`        | TEXT        | `member` / `silver` / `gold`        |
| `total_spent` | REAL        | Lifetime cumulative spend in Rupiah |
| `notes`       | TEXT        | Allergies, preferences, etc.        |
| `created_at`  | TEXT        |                                     |

**Tier thresholds (set in app logic):**

- `member` — default (total_spent < Rp 1.000.000)
- `silver` — Rp 1.000.000 – Rp 4.999.999
- `gold` — Rp 5.000.000+

#### `loyalty_points`

Current point balance per customer. One row per customer. Fast read for POS.

| Column        | Type                          | Notes                 |
| ------------- | ----------------------------- | --------------------- |
| `id`          | INTEGER PK                    |                       |
| `customer_id` | INTEGER UNIQUE FK → customers | 1:1 with customers    |
| `balance`     | REAL                          | Current usable points |
| `updated_at`  | TEXT                          |                       |

#### `point_transactions`

Every point earn, redeem, expiry, and manual adjustment.

| Column        | Type                   | Notes                                   |
| ------------- | ---------------------- | --------------------------------------- |
| `id`          | INTEGER PK             |                                         |
| `customer_id` | INTEGER FK → customers |                                         |
| `type`        | TEXT                   | `earn` / `redeem` / `expire` / `adjust` |
| `points`      | REAL                   | Positive = added, negative = deducted   |
| `order_id`    | INTEGER FK → orders    | The sale that triggered this            |
| `note`        | TEXT                   | e.g. `Purchase Rp35.000`                |
| `created_by`  | INTEGER FK → users     | Staff who processed it                  |
| `created_at`  | TEXT                   |                                         |

**Earn rule example (1 point per Rp 1.000):**

```sql
-- points_earned = floor(total_amount / 1000)
-- for Rp 35.000 order: floor(35000 / 1000) = 35 points
```

---

### Orders

#### `orders`

One row per transaction. The header record of a sale.

| Column            | Type                   | Notes                                                 |
| ----------------- | ---------------------- | ----------------------------------------------------- |
| `id`              | INTEGER PK             |                                                       |
| `customer_id`     | INTEGER FK → customers | **Nullable** — anonymous walk-ins allowed             |
| `total_amount`    | REAL                   | Total paid                                            |
| `points_earned`   | REAL                   | Points added from this order                          |
| `points_redeemed` | REAL                   | Points used as discount                               |
| `payment_method`  | TEXT                   | `cash` / `qris` / `transfer` / `card`                 |
| `status`          | TEXT                   | `pending` / `in_progress` / `completed` / `cancelled` |
| `notes`           | TEXT                   |                                                       |
| `created_by`      | INTEGER FK → users     | Cashier who processed it                              |
| `created_at`      | TEXT                   |                                                       |

#### `order_items`

One row per item within an order. Supports both direct products and menu drinks.

| Column         | Type                    | Notes                                                      |
| -------------- | ----------------------- | ---------------------------------------------------------- |
| `id`           | INTEGER PK              |                                                            |
| `order_id`     | INTEGER FK → orders     | CASCADE delete                                             |
| `product_id`   | INTEGER FK → products   | For direct-sale items (cigarettes, packaged goods)         |
| `menu_item_id` | INTEGER FK → menu_items | For brewed drinks or food                                  |
| `quantity`     | REAL                    |                                                            |
| `unit_price`   | REAL                    | Price at time of sale                                      |
| `subtotal`     | REAL                    | `quantity × unit_price`                                    |
| CHECK          |                         | At least one of `product_id` or `menu_item_id` must be set |

---

## Entity Relationship Diagram

```
units ──────────────────────────────────── products ──── categories
                                               │
                              ┌────────────────┼─────────────────┐
                              │                │                  │
                        stock_movements      stock        purchase_order_items
                              │                                   │
                         created_by                         purchase_orders ── suppliers
                              │                                   │
                            users ──── roles ──── role_permissions ──── permissions
                              │
                         user_sessions
                         shifts
                              │
                           orders ──────────── customers ──── loyalty_points
                              │                    │
                         order_items          point_transactions
                              │
                    ┌─────────┴─────────┐
                 products           menu_items ──── recipes ──── products
```

---

## Roles & Permissions

### 6 Default Roles

| Role                | `role_key`    | Access Level                                          |
| ------------------- | ------------- | ----------------------------------------------------- |
| 👑 Owner / Admin    | `owner`       | Full access to everything                             |
| 📋 Manager          | `manager`     | All operations except user management & system config |
| 💳 Cashier          | `cashier`     | Sales, loyalty lookup, register customers             |
| 📦 Stock Clerk      | `stock_clerk` | Receive stock, log waste, draft POs — cannot approve  |
| ☕ Barista          | `barista`     | View order queue, update order status, view recipes   |
| 👁 Viewer / Auditor | `viewer`      | Read-only: reports, stock levels, order history       |

### Permission Matrix

| Permission            | Owner | Manager | Cashier | Stock Clerk | Barista | Viewer |
| --------------------- | :---: | :-----: | :-----: | :---------: | :-----: | :----: |
| `sales.write`         |  ✅   |   ✅    |   ✅    |     ❌      |   ❌    |   ❌   |
| `sales.read`          |  ✅   |   ✅    |   ✅    |     ❌      |   ❌    |   👁   |
| `sales.cancel`        |  ✅   |   ✅    |   ❌    |     ❌      |   ❌    |   ❌   |
| `sales.discount`      |  ✅   |   ✅    |   ❌    |     ❌      |   ❌    |   ❌   |
| `inventory.read`      |  ✅   |   ✅    |   ❌    |     ✅      |   ❌    |   👁   |
| `inventory.write`     |  ✅   |   ✅    |   ❌    |     ✅      |   ❌    |   ❌   |
| `inventory.approve`   |  ✅   |   ✅    |   ❌    |     ❌      |   ❌    |   ❌   |
| `inventory.delete`    |  ✅   |   ❌    |   ❌    |     ❌      |   ❌    |   ❌   |
| `products.write`      |  ✅   |   ✅    |   ❌    |     ❌      |   ❌    |   ❌   |
| `products.price_edit` |  ✅   |   ✅    |   ❌    |     ❌      |   ❌    |   ❌   |
| `loyalty.read`        |  ✅   |   ✅    |   ✅    |     ❌      |   ❌    |   ❌   |
| `loyalty.write`       |  ✅   |   ✅    |   ✅    |     ❌      |   ❌    |   ❌   |
| `loyalty.adjust`      |  ✅   |   ✅    |   ❌    |     ❌      |   ❌    |   ❌   |
| `reports.read`        |  ✅   |   ✅    |   ❌    |     ❌      |   ❌    |   👁   |
| `kitchen.read`        |  ✅   |   ✅    |   ✅    |     ✅      |   ✅    |   ❌   |
| `kitchen.write`       |  ✅   |   ✅    |   ❌    |     ❌      |   ✅    |   ❌   |
| `users.write`         |  ✅   |   ❌    |   ❌    |     ❌      |   ❌    |   ❌   |
| `users.read`          |  ✅   |   ✅    |   ❌    |     ❌      |   ❌    |   ❌   |
| `system.config`       |  ✅   |   ❌    |   ❌    |     ❌      |   ❌    |   ❌   |
| `suppliers.write`     |  ✅   |   ✅    |   ❌    |     ❌      |   ❌    |   ❌   |
| `suppliers.read`      |  ✅   |   ✅    |   ❌    |     ✅      |   ❌    |   ❌   |

### Checking a permission in SQL

```sql
-- Returns 1 if allowed, 0 if blocked
SELECT COUNT(*)
FROM role_permissions rp
JOIN permissions p ON rp.permission_id = p.id
JOIN users u ON rp.role_id = u.role_id
WHERE u.id = ? AND p.perm_key = 'inventory.write';
```

---

## Key Business Flows

### Incoming Stock Flow

When goods arrive from a supplier:

1. `INSERT` into `purchase_orders` — `status = 'pending'`
2. `INSERT` into `purchase_order_items` — one row per product with qty and unit cost
3. Goods physically arrive → `UPDATE purchase_orders SET status = 'received', received_at = datetime('now')`
4. `UPDATE stock SET quantity = quantity + ?` for each item received
5. `INSERT` into `stock_movements` with `type = 'purchase'`, positive quantity, `reference_id = 'PO-XXX'`

```sql
-- Step 4 & 5 for each line item
UPDATE stock
SET quantity = quantity + 10, updated_at = datetime('now')
WHERE product_id = 5 AND location = 'main';

INSERT INTO stock_movements (product_id, type, quantity, note, reference_id, created_by)
VALUES (5, 'purchase', 10, 'From CV Makmur', 'PO-001', 3);
```

---

### Customer Sale Flow

**Path A — Packaged / direct-sale item (cigarettes, bottled drink):**

1. Look up customer by phone (optional — anonymous sales allowed)
2. `INSERT` into `orders`
3. `INSERT` into `order_items` with `product_id` set
4. `UPDATE stock SET quantity = quantity - ?` for the product
5. `INSERT` into `stock_movements` with `type = 'sale'`, negative quantity
6. If customer identified → calculate points, `INSERT` into `point_transactions`, `UPDATE loyalty_points`

**Path B — Brewed drink (cappuccino, V60):**

1. Same steps 1–2
2. `INSERT` into `order_items` with `menu_item_id` set
3. Look up `recipes` for this menu item — get each ingredient and quantity
4. For each ingredient: `UPDATE stock` and `INSERT stock_movements`
5. Same loyalty steps as Path A

```sql
-- Check if enough stock before deducting
SELECT quantity FROM stock WHERE product_id = ? AND location = 'main';

-- Deduct
UPDATE stock SET quantity = quantity - 1, updated_at = datetime('now')
WHERE product_id = 5 AND location = 'main';

-- Log
INSERT INTO stock_movements (product_id, type, quantity, note, reference_id, created_by)
VALUES (5, 'sale', -1, 'Sampoerna 16 x1', 'ORD-042', 2);

-- Earn points (1 point per Rp 1.000)
INSERT INTO point_transactions (customer_id, type, points, order_id, note, created_by)
VALUES (12, 'earn', 35, 42, 'Purchase Rp35.000', 2);

UPDATE loyalty_points
SET balance = balance + 35, updated_at = datetime('now')
WHERE customer_id = 12;

-- Update lifetime spend + auto-tier
UPDATE customers
SET total_spent = total_spent + 35000,
    tier = CASE
      WHEN total_spent + 35000 >= 5000000 THEN 'gold'
      WHEN total_spent + 35000 >= 1000000 THEN 'silver'
      ELSE 'member'
    END
WHERE id = 12;
```

---

### Waste & Adjustment Flow

```sql
-- Expired milk (waste)
INSERT INTO stock_movements (product_id, type, quantity, note, created_by)
VALUES (8, 'waste', -2, 'Oat milk expired 2025-03-01', 3);

UPDATE stock SET quantity = quantity - 2, updated_at = datetime('now')
WHERE product_id = 8 AND location = 'fridge';

-- Physical count correction (adjustment)
-- System says 15 packs, physical count shows 12 → insert -3
INSERT INTO stock_movements (product_id, type, quantity, note, created_by)
VALUES (5, 'adjustment', -3, 'Physical count 2025-03-01', 3);

UPDATE stock SET quantity = quantity - 3, updated_at = datetime('now')
WHERE product_id = 5 AND location = 'main';
```

---

### Loyalty Points Flow

**Earn** (on every completed order with a known customer):

```sql
-- points = floor(total_amount / 1000)
INSERT INTO point_transactions (customer_id, type, points, order_id, note)
VALUES (12, 'earn', 35, 42, 'Purchase Rp35.000');

UPDATE loyalty_points SET balance = balance + 35 WHERE customer_id = 12;
```

**Redeem** (customer uses points as discount):

```sql
-- Check balance first
SELECT balance FROM loyalty_points WHERE customer_id = 12;

-- 100 points = Rp 1.000 discount
INSERT INTO point_transactions (customer_id, type, points, order_id, note)
VALUES (12, 'redeem', -100, 43, 'Rp1.000 discount applied');

UPDATE loyalty_points SET balance = balance - 100 WHERE customer_id = 12;
```

---

### User Login & Auth Flow

1. Staff enters username + password (or PIN at POS counter)
2. App fetches user from `users` table, verifies hash
3. If valid and `is_active = 1`: generate a random `session_token`
4. `INSERT` into `user_sessions`, `UPDATE users.last_login_at`
5. Return token to client — stored in app memory / secure storage
6. On every subsequent request: look up token in `user_sessions` where `logout_at IS NULL`
7. On logout: `UPDATE user_sessions SET logout_at = datetime('now')`

```sql
-- Verify login
SELECT u.id, u.full_name, u.password_hash, u.is_active, r.role_key
FROM users u
JOIN roles r ON u.role_id = r.id
WHERE u.username = 'siti_kasir';

-- Create session
INSERT INTO user_sessions (user_id, session_token, device_info)
VALUES (5, 'tok_abc123xyz789', 'Flutter App - iPhone 14');

-- Validate token on each API request
SELECT u.id, u.role_id, u.is_active
FROM user_sessions s
JOIN users u ON s.user_id = u.id
WHERE s.session_token = 'tok_abc123xyz789'
  AND s.logout_at IS NULL
  AND u.is_active = 1;
```

---

## Connecting with Next.js

### Install the Turso client

```bash
npm install @libsql/client
```

### Create a database utility

```typescript
// lib/db.ts
import { createClient } from "@libsql/client";

export const db = createClient({
  url: process.env.TURSO_DATABASE_URL!,
  authToken: process.env.TURSO_AUTH_TOKEN!,
});
```

### Example: fetch low-stock products

```typescript
// app/api/stock/low/route.ts
import { db } from "@/lib/db";
import { NextResponse } from "next/server";

export async function GET() {
  const result = await db.execute(`
    SELECT p.name, s.quantity, p.low_stock_alert, u.abbr AS unit
    FROM stock s
    JOIN products p ON s.product_id = p.id
    JOIN units u ON p.unit_id = u.id
    WHERE s.quantity <= p.low_stock_alert
      AND p.is_active = 1
    ORDER BY (s.quantity / p.low_stock_alert) ASC
  `);
  return NextResponse.json(result.rows);
}
```

### Example: process a sale (Server Action)

```typescript
// app/actions/sale.ts
"use server";
import { db } from "@/lib/db";

export async function processSale(payload: {
  customerId: number | null;
  items: {
    productId?: number;
    menuItemId?: number;
    qty: number;
    price: number;
  }[];
  paymentMethod: string;
  staffId: number;
}) {
  const total = payload.items.reduce((sum, i) => sum + i.qty * i.price, 0);
  const pointsEarned = Math.floor(total / 1000);

  // 1. Create order
  const orderResult = await db.execute({
    sql: `INSERT INTO orders (customer_id, total_amount, points_earned, payment_method, status, created_by)
          VALUES (?, ?, ?, ?, 'completed', ?)`,
    args: [
      payload.customerId,
      total,
      pointsEarned,
      payload.paymentMethod,
      payload.staffId,
    ],
  });
  const orderId = orderResult.lastInsertRowid;

  // 2. Insert order items + deduct stock
  for (const item of payload.items) {
    await db.execute({
      sql: `INSERT INTO order_items (order_id, product_id, menu_item_id, quantity, unit_price, subtotal)
            VALUES (?, ?, ?, ?, ?, ?)`,
      args: [
        orderId,
        item.productId ?? null,
        item.menuItemId ?? null,
        item.qty,
        item.price,
        item.qty * item.price,
      ],
    });

    // If menu item, get recipe and deduct each ingredient
    if (item.menuItemId) {
      const recipe = await db.execute({
        sql: `SELECT product_id, quantity FROM recipes WHERE menu_item_id = ?`,
        args: [item.menuItemId],
      });
      for (const ingredient of recipe.rows) {
        const deduct = Number(ingredient.quantity) * item.qty;
        await db.execute({
          sql: `UPDATE stock SET quantity = quantity - ?, updated_at = datetime('now')
                WHERE product_id = ? AND location = 'main'`,
          args: [deduct, ingredient.product_id],
        });
        await db.execute({
          sql: `INSERT INTO stock_movements (product_id, type, quantity, reference_id, created_by)
                VALUES (?, 'sale', ?, ?, ?)`,
          args: [
            ingredient.product_id,
            -deduct,
            `ORD-${orderId}`,
            payload.staffId,
          ],
        });
      }
    }
  }

  // 3. Loyalty points
  if (payload.customerId && pointsEarned > 0) {
    await db.execute({
      sql: `INSERT INTO point_transactions (customer_id, type, points, order_id, note, created_by)
            VALUES (?, 'earn', ?, ?, ?, ?)`,
      args: [
        payload.customerId,
        pointsEarned,
        orderId,
        `Purchase Rp${total.toLocaleString("id-ID")}`,
        payload.staffId,
      ],
    });
    await db.execute({
      sql: `UPDATE loyalty_points SET balance = balance + ?, updated_at = datetime('now')
            WHERE customer_id = ?`,
      args: [pointsEarned, payload.customerId],
    });
    await db.execute({
      sql: `UPDATE customers SET total_spent = total_spent + ?,
            tier = CASE
              WHEN total_spent + ? >= 5000000 THEN 'gold'
              WHEN total_spent + ? >= 1000000 THEN 'silver'
              ELSE 'member' END
            WHERE id = ?`,
      args: [total, total, total, payload.customerId],
    });
  }

  return { orderId, pointsEarned };
}
```

### Middleware: permission check

```typescript
// middleware.ts (or a utility function)
import { db } from "@/lib/db";

export async function hasPermission(
  sessionToken: string,
  permKey: string,
): Promise<boolean> {
  const result = await db.execute({
    sql: `SELECT COUNT(*) AS allowed
          FROM user_sessions s
          JOIN users u ON s.user_id = u.id
          JOIN role_permissions rp ON u.role_id = rp.role_id
          JOIN permissions p ON rp.permission_id = p.id
          WHERE s.session_token = ?
            AND s.logout_at IS NULL
            AND u.is_active = 1
            AND p.perm_key = ?`,
    args: [sessionToken, permKey],
  });
  return Number(result.rows[0].allowed) > 0;
}

// Usage in API route:
// if (!(await hasPermission(token, 'inventory.write'))) {
//   return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
// }
```

---

## Connecting with Flutter

Your Flutter app **never connects to Turso directly**. It talks to your Next.js API over HTTPS. This is the correct architecture for security — you never expose your database credentials to a mobile device.

```
Flutter App  →  HTTPS  →  Next.js API  →  Turso DB
```

### HTTP client setup

```yaml
# pubspec.yaml
dependencies:
  http: ^1.2.0
  flutter_secure_storage: ^9.0.0 # for storing session token
```

### Auth service

```dart
// lib/services/auth_service.dart
import 'dart:convert';
import 'package:http/http.dart' as http;
import 'package:flutter_secure_storage/flutter_secure_storage.dart';

class AuthService {
  static const _baseUrl = 'https://your-app.vercel.app/api';
  static const _storage = FlutterSecureStorage();

  static Future<Map<String, dynamic>> login(String username, String password) async {
    final res = await http.post(
      Uri.parse('$_baseUrl/auth/login'),
      headers: {'Content-Type': 'application/json'},
      body: jsonEncode({'username': username, 'password': password}),
    );
    final data = jsonDecode(res.body);
    if (res.statusCode == 200) {
      await _storage.write(key: 'session_token', value: data['token']);
    }
    return data;
  }

  static Future<String?> getToken() => _storage.read(key: 'session_token');

  static Future<void> logout() async {
    final token = await getToken();
    await http.post(
      Uri.parse('$_baseUrl/auth/logout'),
      headers: {'Authorization': 'Bearer $token'},
    );
    await _storage.delete(key: 'session_token');
  }
}
```

### API client

```dart
// lib/services/api_service.dart
import 'dart:convert';
import 'package:http/http.dart' as http;
import 'auth_service.dart';

class ApiService {
  static const _baseUrl = 'https://your-app.vercel.app/api';

  static Future<Map<String, String>> _headers() async {
    final token = await AuthService.getToken();
    return {
      'Content-Type': 'application/json',
      'Authorization': 'Bearer $token',
    };
  }

  // ── INVENTORY ──────────────────────────────────────────────

  static Future<List<dynamic>> getLowStockItems() async {
    final res = await http.get(
      Uri.parse('$_baseUrl/stock/low'),
      headers: await _headers(),
    );
    return jsonDecode(res.body);
  }

  // ── ORDERS ────────────────────────────────────────────────

  static Future<Map<String, dynamic>> processSale({
    required List<Map<String, dynamic>> items,
    required String paymentMethod,
    int? customerId,
  }) async {
    final res = await http.post(
      Uri.parse('$_baseUrl/orders'),
      headers: await _headers(),
      body: jsonEncode({
        'items': items,
        'payment_method': paymentMethod,
        'customer_id': customerId,
      }),
    );
    return jsonDecode(res.body);
  }

  // ── CUSTOMERS ─────────────────────────────────────────────

  static Future<Map<String, dynamic>?> lookupCustomer(String phone) async {
    final res = await http.get(
      Uri.parse('$_baseUrl/customers?phone=$phone'),
      headers: await _headers(),
    );
    if (res.statusCode == 404) return null;
    return jsonDecode(res.body);
  }

  // ── KITCHEN DISPLAY ───────────────────────────────────────

  static Future<List<dynamic>> getOrderQueue() async {
    final res = await http.get(
      Uri.parse('$_baseUrl/orders?status=pending,in_progress'),
      headers: await _headers(),
    );
    return jsonDecode(res.body);
  }

  static Future<void> updateOrderStatus(int orderId, String status) async {
    await http.patch(
      Uri.parse('$_baseUrl/orders/$orderId'),
      headers: await _headers(),
      body: jsonEncode({'status': status}),
    );
  }
}
```

### Suggested Flutter app structure

```
lib/
├── main.dart
├── services/
│   ├── auth_service.dart      # login, logout, token storage
│   └── api_service.dart       # all API calls
├── models/
│   ├── product.dart
│   ├── order.dart
│   ├── customer.dart
│   └── user.dart
├── screens/
│   ├── login_screen.dart
│   ├── pos/
│   │   ├── pos_screen.dart    # cashier view
│   │   └── cart_screen.dart
│   ├── kitchen/
│   │   └── kitchen_display.dart  # barista view
│   ├── inventory/
│   │   ├── stock_screen.dart
│   │   └── receive_stock_screen.dart
│   └── loyalty/
│       └── customer_lookup_screen.dart
└── widgets/
    ├── product_card.dart
    └── order_tile.dart
```

---

## API Design Suggestions

A clean REST API for Next.js App Router (`/app/api/...`):

```
Auth
  POST   /api/auth/login          → { token, user, role, permissions[] }
  POST   /api/auth/logout
  POST   /api/auth/pin            → quick POS login with PIN

Products & Stock
  GET    /api/products            → list all active products
  POST   /api/products            → create (requires products.write)
  PATCH  /api/products/:id
  GET    /api/stock               → current stock levels
  GET    /api/stock/low           → items below low_stock_alert
  POST   /api/stock/movements     → log waste or adjustment

Purchase Orders
  GET    /api/purchase-orders
  POST   /api/purchase-orders     → create PO (status: pending)
  PATCH  /api/purchase-orders/:id → receive or approve

Menu
  GET    /api/menu                → active menu items
  GET    /api/menu/:id/recipe     → ingredients for a menu item

Orders
  GET    /api/orders              → order history (with filters)
  POST   /api/orders              → process sale
  PATCH  /api/orders/:id          → update status (barista)
  DELETE /api/orders/:id          → cancel (requires sales.cancel)

Customers & Loyalty
  GET    /api/customers?phone=    → lookup by phone
  POST   /api/customers           → register new customer
  GET    /api/customers/:id/points
  POST   /api/customers/:id/redeem

Users (owner only)
  GET    /api/users
  POST   /api/users
  PATCH  /api/users/:id
  DELETE /api/users/:id           → sets is_active = 0

Reports
  GET    /api/reports/sales?date=
  GET    /api/reports/stock
  GET    /api/reports/loyalty
```

---

## Security Notes

### Passwords

- **Never store plaintext passwords.** Always hash with **argon2id** (preferred) or bcrypt before inserting.
- In Next.js: use the `argon2` npm package or `bcryptjs`.
- In Flutter: hash on the client is optional if using HTTPS; the API should re-verify. But never send the raw hash to clients either.

```typescript
// Next.js: hashing a password
import argon2 from "argon2";
const hash = await argon2.hash(password); // store this
const valid = await argon2.verify(hash, inputPassword); // verify this
```

### Session Tokens

- Generate with `crypto.randomUUID()` or `crypto.getRandomValues()` — not `Math.random()`.
- Tokens should be long enough to be unguessable (UUID v4 is fine, 32+ random bytes is better).
- Expire sessions after inactivity (e.g. 8 hours for POS, 30 days for manager dashboard).

```typescript
import { randomBytes } from "crypto";
const token = randomBytes(32).toString("hex"); // 64 character hex string
```

### PINs

- PINs are convenience only — they should be hashed too (bcrypt with low cost factor is fine).
- Do not allow PINs for sensitive operations like user management or financial reports.
- Consider locking out after 5 failed PIN attempts.

### Environment Variables

```bash
# .env.local — never commit this file
TURSO_DATABASE_URL=libsql://...
TURSO_AUTH_TOKEN=...
NEXTAUTH_SECRET=...   # if using NextAuth
JWT_SECRET=...        # if using JWT
```

### Flutter

- Store the session token in `flutter_secure_storage`, not `SharedPreferences`.
- All API calls must use HTTPS — never HTTP in production.
- Do not hardcode API base URLs or tokens in source code.

---

## Common Queries

### Low stock alert

```sql
SELECT p.name, s.quantity, p.low_stock_alert, u.abbr AS unit, c.name AS category
FROM stock s
JOIN products p ON s.product_id = p.id
JOIN units u ON p.unit_id = u.id
JOIN categories c ON p.category_id = c.id
WHERE s.quantity <= p.low_stock_alert AND p.is_active = 1
ORDER BY (CAST(s.quantity AS REAL) / p.low_stock_alert) ASC;
```

### Daily sales summary

```sql
SELECT
  COUNT(*)                          AS total_orders,
  SUM(total_amount)                 AS total_revenue,
  SUM(points_earned)                AS total_points_issued,
  SUM(CASE WHEN payment_method = 'cash' THEN total_amount ELSE 0 END)  AS cash_sales,
  SUM(CASE WHEN payment_method = 'qris' THEN total_amount ELSE 0 END)  AS qris_sales
FROM orders
WHERE DATE(created_at) = DATE('now')
  AND status = 'completed';
```

### Customer loyalty profile

```sql
SELECT
  c.name, c.phone, c.tier, c.total_spent,
  lp.balance AS points_balance,
  COUNT(o.id) AS total_orders,
  MAX(o.created_at) AS last_visit
FROM customers c
JOIN loyalty_points lp ON c.id = lp.customer_id
LEFT JOIN orders o ON c.id = o.customer_id AND o.status = 'completed'
WHERE c.phone = ?
GROUP BY c.id;
```

### Top selling menu items

```sql
SELECT
  m.name,
  SUM(oi.quantity) AS total_sold,
  SUM(oi.subtotal) AS total_revenue
FROM order_items oi
JOIN menu_items m ON oi.menu_item_id = m.id
JOIN orders o ON oi.order_id = o.id
WHERE o.status = 'completed'
  AND DATE(o.created_at) >= DATE('now', '-30 days')
GROUP BY m.id
ORDER BY total_sold DESC
LIMIT 10;
```

### Staff activity audit

```sql
SELECT
  u.full_name,
  sm.type,
  sm.quantity,
  p.name AS product,
  sm.note,
  sm.created_at
FROM stock_movements sm
JOIN users u ON sm.created_by = u.id
JOIN products p ON sm.product_id = p.id
WHERE DATE(sm.created_at) = DATE('now')
ORDER BY sm.created_at DESC;
```

### Current shift summary

```sql
SELECT
  u.full_name,
  s.clock_in,
  s.opening_cash,
  COUNT(o.id)       AS orders_processed,
  SUM(o.total_amount) AS sales_total
FROM shifts s
JOIN users u ON s.user_id = u.id
LEFT JOIN orders o ON o.created_by = u.id
  AND o.created_at >= s.clock_in
  AND (s.clock_out IS NULL OR o.created_at <= s.clock_out)
  AND o.status = 'completed'
WHERE s.clock_out IS NULL
GROUP BY s.id;
```

---

## Extending the Schema

Some ideas for future additions as your shop grows:

### Multiple branches

```sql
CREATE TABLE branches (
  id        INTEGER PRIMARY KEY AUTOINCREMENT,
  name      TEXT NOT NULL,
  address   TEXT,
  phone     TEXT,
  is_active INTEGER DEFAULT 1
);

-- Add branch_id to: users, stock, orders, shifts
ALTER TABLE users  ADD COLUMN branch_id INTEGER REFERENCES branches(id);
ALTER TABLE orders ADD COLUMN branch_id INTEGER REFERENCES branches(id);
```

### Tables / dine-in support

```sql
CREATE TABLE tables (
  id        INTEGER PRIMARY KEY AUTOINCREMENT,
  name      TEXT NOT NULL,   -- 'Table 1', 'VIP Room', 'Outdoor A'
  capacity  INTEGER,
  is_active INTEGER DEFAULT 1
);

ALTER TABLE orders ADD COLUMN table_id INTEGER REFERENCES tables(id);
```

### Point expiry

Points that expire after a set number of days:

```sql
ALTER TABLE loyalty_points ADD COLUMN expires_at TEXT;

-- Expire stale points (run as a scheduled job)
INSERT INTO point_transactions (customer_id, type, points, note)
SELECT customer_id, 'expire', -balance, 'Points expired after 365 days'
FROM loyalty_points
WHERE expires_at IS NOT NULL AND expires_at < datetime('now') AND balance > 0;

UPDATE loyalty_points SET balance = 0
WHERE expires_at IS NOT NULL AND expires_at < datetime('now');
```

### Promotions & discounts

```sql
CREATE TABLE promotions (
  id          INTEGER PRIMARY KEY AUTOINCREMENT,
  name        TEXT NOT NULL,
  type        TEXT NOT NULL,   -- 'percent', 'fixed', 'bogo', 'happy_hour'
  value       REAL NOT NULL,   -- 10 = 10% or Rp 10.000 fixed
  min_purchase REAL DEFAULT 0,
  starts_at   TEXT,
  ends_at     TEXT,
  is_active   INTEGER DEFAULT 1
);
```

### WhatsApp / notification log

```sql
CREATE TABLE notification_log (
  id          INTEGER PRIMARY KEY AUTOINCREMENT,
  customer_id INTEGER REFERENCES customers(id),
  type        TEXT,   -- 'low_stock_alert', 'loyalty_tier_up', 'birthday'
  channel     TEXT,   -- 'whatsapp', 'sms', 'push'
  message     TEXT,
  status      TEXT,   -- 'sent', 'failed'
  sent_at     TEXT DEFAULT (datetime('now'))
);
```

---

## File Reference

| File                  | Description                                                |
| --------------------- | ---------------------------------------------------------- |
| `kopiflow_schema.sql` | Complete database schema — paste into Turso to get started |
| `README.md`           | This file                                                  |

---

_Built for a real coffee shop. Designed to scale from 1 branch to many. Questions or improvements? Update this README as your system grows._
