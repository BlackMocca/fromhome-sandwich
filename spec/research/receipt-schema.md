# Receipt Table Schema — Snapshot Order Design

> Final schema for storing order history with snapshot data.
> Based on research from `web/app/management/orders/draft/` and `OrderContext`.

---

## 1. Schema Overview

```
┌──────────────┐       ┌──────────────────┐
│   channels   │──────<│     receipts     │
└──────────────┘       └──────────────────┘
                              │
                              │ 1:N
                              ▼
                       ┌──────────────────┐
                       │  receipt_items   │
                       └──────────────────┘
                              │
                              │ FK (nullable)
                              ▼
                       ┌──────────────────┐
                       │    products      │
                       └──────────────────┘
```

---

## 2. Table: `channels` (Existing)

> ช่องทางการขาย — มีอยู่แล้ว

```sql
CREATE TABLE channels (
  id              BIGSERIAL PRIMARY KEY,
  code            TEXT NOT NULL UNIQUE,          -- 'LMN', 'GRAB', 'COND', 'RBNH'
  name            TEXT NOT NULL,                 -- 'Lineman', 'GrabFood'...
  gp_percent      NUMERIC(5,2) DEFAULT 0,       -- Gross Profit %
  is_active       BOOLEAN DEFAULT true,
  created_at      TIMESTAMPTZ DEFAULT NOW(),
  updated_at      TIMESTAMPTZ DEFAULT NOW()
);
```

---

## 3. Table: `receipts` (Header)

> ใบเสร็จ — เก็บ header + ยอดรวม

```sql
CREATE TABLE receipts (
  id              BIGSERIAL PRIMARY KEY,

  -- Channel reference
  channel_id      BIGINT NOT NULL REFERENCES channels(id),
  channel_code    TEXT NOT NULL,                   -- denormalized snapshot (LMN, GRAB...)

  -- Receipt identity
  receipt_no      TEXT NOT NULL UNIQUE,            -- LMN202607140001

  -- Customer info (snapshot at order time)
  customer_name   TEXT,                            -- optional

  -- Dates
  bill_date       DATE NOT NULL DEFAULT CURRENT_DATE,

  -- Quantity
  total_quantity  INT NOT NULL DEFAULT 0,              -- จำนวนสินค้าทั้งหมด (sum of quantity)

  -- Money
  subtotal        NUMERIC(10,2) NOT NULL DEFAULT 0,   -- sum of all line_total before discount
  discount_total  NUMERIC(10,2) NOT NULL DEFAULT 0,
  grand_total     NUMERIC(10,2) NOT NULL DEFAULT 0,   -- subtotal - discount_total

  -- Discount snapshot (optional, stored as JSONB for flexibility)
  discounts       JSONB NOT NULL DEFAULT '[]',
  --  [{ type: 'pricing', price: 10 },
  --   { type: 'percentage', percentage: 5, price: 3.50 },
  --   { type: 'coupon', code: 'SAVE10', price: 10 }]

  -- Status
  status          TEXT NOT NULL DEFAULT 'active'
                  CHECK (status IN ('active', 'cancelled')),

  -- Metadata
  note            TEXT,
  created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at      TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Indexes
CREATE INDEX idx_receipts_channel_id ON receipts(channel_id);
CREATE INDEX idx_receipts_bill_date ON receipts(bill_date);
CREATE INDEX idx_receipts_status ON receipts(status);
CREATE UNIQUE INDEX idx_receipts_receipt_no ON receipts(receipt_no);
```

---

## 4. Table: `receipt_items` (Line Items + Snapshot)

> รายการสินค้าในใบเสร็จ — snapshot ข้อมูลสินค้า ณ เวลาสั่งซื้อ

```sql
CREATE TABLE receipt_items (
  id              BIGSERIAL PRIMARY KEY,
  receipt_id      BIGINT NOT NULL REFERENCES receipts(id) ON DELETE CASCADE,

  -- FK reference (nullable: ถ้า product ถูกลบ ยังดู receipt ได้)
  product_id      BIGINT REFERENCES products(id) ON DELETE SET NULL,

  -- ═══════════════════════════════════════════════════
  -- PRODUCT SNAPSHOT (คัดลอกจาก master data ณ ตอนสั่ง)
  -- จะไม่เปลี่ยนแปลง แม้ product ใน master จะแก้ไขทีหลัง
  -- ═══════════════════════════════════════════════════

  product_name        TEXT NOT NULL,                    -- ชื่อสินค้าตอนสั่ง
  product_price       NUMERIC(10,2) NOT NULL,           -- ราคาขาย (channel price) ตอนสั่ง
  product_cost        NUMERIC(10,2) NOT NULL,           -- ต้นทุน (channel cost) ตอนสั่ง
  product_options     JSONB NOT NULL DEFAULT '[]',
  --  [{ "id": 1, "name": "ไข่", "price": 10 },
  --   { "id": 2, "name": "ชีส", "price": 15 }]

  -- Quantity & calculated
  quantity            INT NOT NULL DEFAULT 1,
  line_total          NUMERIC(10,2) NOT NULL,           -- (product_price + options_total) * quantity

  -- Optional
  note                TEXT,

  created_at          TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Indexes
CREATE INDEX idx_receipt_items_receipt_id ON receipt_items(receipt_id);
CREATE INDEX idx_receipt_items_product_id ON receipt_items(product_id);
```

---

## 5. Column Mapping: Draft Page → DB

### 5.1 `receipts` — Header

| DB Column | Draft Page Source | Notes |
|-----------|------------------|-------|
| `channel_id` | `OrderContext.channelId` | from channel selection |
| `channel_code` | ❓ **Missing** — need `channelCode` in context | e.g. `'LMN'` |
| `receipt_no` | Auto-generate | `LMN202607140001` |
| `customer_name` | `step-invoice-form.tsx:25` `customerName` | optional |
| `bill_date` | `step-invoice-form.tsx:26` `invoiceDate` | defaults to today |
| `subtotal` | `totalPrice` from OrderContext | calculated |
| `discount_total` | `discounts[].price` sum | calculated from form |
| `grand_total` | `subtotal - discount_total` | calculated |
| `discounts` | `step-invoice-form.tsx:27` `discounts[]` | JSONB snapshot |
| `status` | Default `'active'` | |
| `note` | ❓ **Missing** — could add to form | optional |

### 5.2 `receipt_items` — Line Items

| DB Column | Draft Page Source | Notes |
|-----------|------------------|-------|
| `receipt_id` | FK from `receipts.id` | |
| `product_id` | `channelProduct.product_id` | FK reference |
| `product_name` | `channelProduct.products?.name` | from join |
| `product_price` | `channelProduct.price` | channel-specific price |
| `product_cost` | `channelProduct.cost` | channel-specific cost |
| `product_options` | `selectedAddons[].{id, name, base_price}` | JSONB |
| `quantity` | `item.quantity` | user input |
| `line_total` | `(channelProduct.price + addonTotal) * quantity` | calculated |
| `note` | `item.note` | optional |

---

## 6. Data Example

### Receipt (header)
```json
{
  "id": 1,
  "channel_id": 3,
  "channel_code": "LMN",
  "receipt_no": "LMN202607140001",
  "customer_name": "สมชาย",
  "bill_date": "2026-07-14",
  "total_quantity": 2,
  "subtotal": 115,
  "discount_total": 10,
  "grand_total": 105,
  "discounts": [
    { "type": "pricing", "price": 10 }
  ],
  "status": "active"
}
```

### Receipt Items (lines)
```json
[
  {
    "id": 1,
    "receipt_id": 1,
    "product_id": 5,
    "product_name": "ไก่ย่างแซนด์วิช",
    "product_price": 55,
    "product_cost": 30,
    "product_options": [
      { "id": 1, "name": "ไข่", "price": 10 },
      { "id": 3, "name": "ชีส", "price": 15 }
    ],
    "quantity": 2,
    "line_total": 160,
    "note": "ไม่ใส่ผัก"
  }
]
```

---

## 7. Query Examples (PostgREST)

### Get receipt with items
```
GET /receipts?select=*,receipt_items(*)&receipt_no=eq.LMN202607140001
```

### Get receipts for dashboard (this month)
```
GET /receipts?select=*,receipt_items(product_cost,line_total,quantity)
  &bill_date=gte.2026-07-01
  &bill_date=lt.2026-08-01
  &status=eq.active
```

### Dashboard KPIs (raw SQL / RPC)
```sql
SELECT
  SUM(subtotal) AS total_sales,
  SUM(discount_total) AS total_discounts,
  SUM(grand_total) AS net_sales,
  COUNT(*) AS order_count
FROM receipts
WHERE status = 'active'
  AND bill_date BETWEEN '2026-07-01' AND '2026-07-31';
```

```sql
SELECT
  SUM(ri.product_cost * ri.quantity) AS total_cost,
  SUM(ri.line_total) AS total_revenue,
  SUM(ri.line_total) - SUM(ri.product_cost * ri.quantity) AS net_profit
FROM receipt_items ri
JOIN receipts r ON r.id = ri.receipt_id
WHERE r.status = 'active'
  AND r.bill_date BETWEEN '2026-07-01' AND '2026-07-31';
```

---

## 8. Materialized Views (Dashboard)

> ใช้ Materialized Views สำหรับ Dashboard KPIs — pre-computed, refresh หลังจากสร้าง/แก้ไข receipt

### 8.1 `mv_daily_summary` — สรุปรายวัน

```sql
CREATE MATERIALIZED VIEW mv_daily_summary AS
SELECT
  r.bill_date,
  r.channel_code,
  COUNT(*)                          AS order_count,
  SUM(r.total_quantity)             AS total_items,
  SUM(r.subtotal)                   AS total_sales,
  SUM(r.discount_total)             AS total_discounts,
  SUM(r.grand_total)                AS net_sales,
  SUM(ri.product_cost * ri.quantity) AS total_cost,
  SUM(ri.line_total) - SUM(ri.product_cost * ri.quantity) AS net_profit
FROM receipts r
JOIN receipt_items ri ON ri.receipt_id = r.id
WHERE r.status = 'active'
GROUP BY r.bill_date, r.channel_code
WITH DATA;

CREATE UNIQUE INDEX idx_mv_daily_summary
  ON mv_daily_summary(bill_date, channel_code);

-- Refresh: เรียกหลังจาก insert/update/cancel receipt
REFRESH MATERIALIZED VIEW CONCURRENTLY mv_daily_summary;
```

**Query สำหรับ dashboard:**
```sql
-- วันนี้
SELECT * FROM mv_daily_summary WHERE bill_date = CURRENT_DATE;

-- เดือนนี้
SELECT * FROM mv_daily_summary
WHERE bill_date >= date_trunc('month', CURRENT_DATE)
  AND bill_date < date_trunc('month', CURRENT_DATE) + INTERVAL '1 month'
ORDER BY bill_date;
```

---

### 8.2 `mv_monthly_summary` — สรุปรายเดือน (สำหรับ Graph)

```sql
CREATE MATERIALIZED VIEW mv_monthly_summary AS
SELECT
  date_trunc('month', r.bill_date)::date  AS month,
  r.channel_code,
  COUNT(*)                                AS order_count,
  SUM(r.total_quantity)                   AS total_items,
  SUM(r.subtotal)                         AS total_sales,
  SUM(r.grand_total)                      AS net_sales,
  SUM(ri.product_cost * ri.quantity)       AS total_cost,
  SUM(ri.line_total) - SUM(ri.product_cost * ri.quantity) AS net_profit
FROM receipts r
JOIN receipt_items ri ON ri.receipt_id = r.id
WHERE r.status = 'active'
GROUP BY date_trunc('month', r.bill_date), r.channel_code
WITH DATA;

CREATE UNIQUE INDEX idx_mv_monthly_summary
  ON mv_monthly_summary(month, channel_code);
```

**Query สำหรับ Graph:**
```sql
-- 6 เดือนล่าสุด
SELECT * FROM mv_monthly_summary
WHERE month >= date_trunc('month', CURRENT_DATE) - INTERVAL '5 months'
ORDER BY month DESC;
```

---

### 8.3 `mv_top_products` — สินค้าขายดี

```sql
CREATE MATERIALIZED VIEW mv_top_products AS
SELECT
  ri.product_id,
  ri.product_name,
  COUNT(*)                                AS times_sold,
  SUM(ri.quantity)                        AS total_quantity,
  SUM(ri.line_total)                      AS total_revenue,
  SUM(ri.product_cost * ri.quantity)      AS total_cost,
  SUM(ri.line_total) - SUM(ri.product_cost * ri.quantity) AS total_profit
FROM receipt_items ri
JOIN receipts r ON r.id = ri.receipt_id
WHERE r.status = 'active'
  AND r.bill_date >= date_trunc('month', CURRENT_DATE)
GROUP BY ri.product_id, ri.product_name
WITH DATA;

CREATE UNIQUE INDEX idx_mv_top_products
  ON mv_top_products(product_id);
```

---

### 8.4 Refresh Strategy

```sql
-- หลังจากสร้าง/แก้ไข receipt ใน server action:
REFRESH MATERIALIZED VIEW CONCURRENTLY mv_daily_summary;
REFRESH MATERIALIZED VIEW CONCURRENTLY mv_monthly_summary;
REFRESH MATERIALIZED VIEW CONCURRENTLY mv_top_products;
```

- `CONCURRENTLY` — ไม่ lock query (อ่านได้的同时 refresh)
- Refresh หลังจาก `insert`, `update status` (cancel) receipt
- 1-2 users → ไม่ต้อง schedule, refresh ตรงๆ เลย

---

## 9. Design Decisions

| Decision | Choice | Reason |
|----------|--------|--------|
| Product snapshot on `receipt_items`? | ✅ Yes | ราคาเปลี่ยน → receipt เดิมต้องคงเดิม |
| Keep `product_id` FK? | ✅ Yes (nullable) | สำหรับ analytics + product ถูกลบก็ยังดู receipt ได้ |
| Store options as JSONB? | ✅ Yes | จำนวน options ต่อ line ไม่เท่ากัน + ไม่ต้อง join |
| Store discounts on `receipts`? | ✅ JSONB |  discount มีหลาย type +  optional |
| Denormalize `channel_code`? | ✅ Yes | ไม่ต้อง join channels table เวลา query |
| Use `ON DELETE SET NULL` for product_id? | ✅ Yes | สินค้าถูกลบ → receipt ยังอยู่ |
| Store `channelProduct.price` not `products.base_price`? | ✅ Yes | ราคาต่อ channel อาจต่างกัน |
| Store `total_quantity` on receipt? | ✅ Yes | สำหรับ dashboard query + display | |

---

*Schema designed 2026-07-14 for From Home Sandwich rewrite.*
