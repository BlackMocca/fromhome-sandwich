# 🗄️ Database Design — BOM-based Product Cost

> ไฟล์ส่วนหนึ่งของ `README.md` ในโฟลเดอร์นี้
> Stack: Supabase PostgreSQL + PostgREST Direct REST (ดู `spec/SUPABASE.md`)

---

## 1. ERD (หลังเปลี่ยน)

```mermaid
erDiagram
    products ||--o{ product_ingredients : "uses (BOM)"
    ingredients ||--o{ product_ingredients : "used in"
    ingredients ||--o{ ingredient_purchases : "bought"
    products {
        bigint id PK
        text name
        bigint category_id FK
        numeric base_price
        numeric cost                -- NEW: calculated snapshot (system เขียน)
        numeric cost_override       -- NEW: nullable, override ระบุมือ
        boolean is_active
    }
    product_ingredients {
        bigint product_id FK
        bigint ingredient_id FK
        numeric qty                 -- usage ต่อ 1 หน่วยสินค้า (ฐาน: ชิ้น/กรัม/ใบ)
        PK "product_id, ingredient_id"
    }
    ingredients {
        bigint id PK
        text name
        text purchase_unit          -- เก่า: default_unit → ทำความหมายชัดขึ้น (หัว/ถุง/กล่อง/แพ็ค)
        text base_unit              -- NEW: หน่วยที่ใช้คำนวณต้นทุน (ชิ้น/กรัม/ใบ/กล่องเล็ก)
        numeric manual_unit_price   -- NEW: nullable — ราคาคงที่ สำหรับ packaging ที่ไม่ได้ซื้อจริง
        text description
    }
    ingredient_purchases {
        bigint id PK
        bigint ingredient_id FK
        date purchase_date
        numeric quantity            -- จำนวนที่ซื้อ (หน่วย purchase_unit)
        text unit                   -- snapshot หน่วยตอนซื้อ
        numeric conversion_factor   -- NEW: 1 unit ที่ซื้อ = base unit กี่หน่วย (ขนมปังใหญ่ 1 หัว = 18 ชิ้น)
        numeric base_units          -- NEW: quantity × conversion_factor (หน่วยฐานทั้งหมดที่ได้)
        numeric unit_price          -- NEW: amount / base_units (price as-of, เก็บ 4-6 ทศนิยม)
        numeric amount              -- จำนวนเงินที่จ่าย (คงเดิม)
        text purchase_group         -- NEW: nullable เช่น 'Sandwich' (คอลัมน์ "ประเภท" ในตัวอย่าง)
        text note
    }
    receipts ||--o{ receipt_items : keeps product_cost snapshot (ไม่เปลี่ยน schema)
    receipt_items {
        bigint id PK
        numeric product_cost        -- snapshot ตอนออกบิล (พฤติกรรมเดิม)
    }
```

## 2. Migration 1 — `ingredients` (เพิ่มความสามารถ)

```sql
ALTER TABLE ingredients
  ADD COLUMN base_unit         TEXT,           -- หน่วยฐานที่ BOM อ้างอิง (เช่น 'ชิ้น', 'กรัม', 'ใบ')
  ADD COLUMN manual_unit_price NUMERIC(12,4);  -- null = เอาราคาจาก purchases / ไม่ null = ราคาคงที่

-- ค่า legacy: ถ้ามี ingredient ที่ไม่ได้ตั้ง base_unit → fallback ใช้ default_unit
```

**Semantics:**
- `manual_unit_price IS NOT NULL` → current price ของ ingredient นี้ = `manual_unit_price` (สำหรับ "กล่อง 2.7", "กระดาษ 1.3", หรือของที่ราคาไม่นิ่ง)
- `manual_unit_price IS NULL` → current price = `unit_price` ของ `ingredient_purchases` แถวล่าสุด (D2)

## 3. Migration 2 — `ingredient_purchases` (ขึ้นจาก ledger → price source)

```sql
ALTER TABLE ingredient_purchases
  ADD COLUMN conversion_factor NUMERIC(12,3) NOT NULL DEFAULT 1,  -- 1 หน่วยที่ซื้อ = base unit × factor
  ADD COLUMN base_units        NUMERIC(12,4) GENERATED ALWAYS AS (quantity * conversion_factor) STORED,
  ADD COLUMN unit_price        NUMERIC(14,6) GENERATED ALWAYS AS (CASE WHEN base_units > 0 THEN amount / base_units ELSE 0 END) STORED,
  ADD COLUMN purchase_group    TEXT;  -- กลุ่ม เช่น 'Sandwich' / 'Drink'

-- ⚠️ drop unique index เดิม (allow ซื้อซ้ำ 2 ครั้งในวันเดียวกัน — อาทิตย์/พุธ เสริม)  → ดู Q4
DROP INDEX IF EXISTS idx_ingredient_purchases_unique_order;
```

- `quantity` / `unit` / `amount` **คงเดิม 100%** — UI ledger ที่อยู่แล้วยังทำงานได้ (compat)
- row เก่ายังไม่มี conversion → `conversion_factor = 1` → `unit_price = amount/quantity` = ค่าที่ระบบเดิมเข้าใจอยู่แล้ว → **backward compatible**
- เก็บ `unit_price` เป็น generated column (ไม่คำนวณใน app) เพื่อไม่ให้เลขลอยตอน UI/display และ reuse ใน views ได้

## 4. Migration 3 — `product_ingredients` (BOM — ตารางใหม่)

```sql
CREATE TABLE product_ingredients (
  product_id    BIGINT NOT NULL REFERENCES products(id) ON DELETE CASCADE,
  ingredient_id BIGINT NOT NULL REFERENCES ingredients(id),
  qty           NUMERIC(12,3) NOT NULL CHECK (qty >= 0),  -- ใช้ต่อ 1 หน่วยสินค้า (SKU แยกกล่อง/ถุง ตาม D1)
  created_at    TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at    TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  PRIMARY KEY (product_id, ingredient_id)
);
CREATE INDEX idx_product_ingredients_ingredient ON product_ingredients(ingredient_id);
```

> **ทำไม `qty` คอลัมน์เดียว:** ตาม D1 — "กล่อง/ถุง" เป็น SKU (product) แยกกัน ตัวเลขตัวอย่าง "ใช้ต่อถุง = ครึ่งของใช้ต่อกล่อง" ยืนยันว่าใช้การ scale ง่าย ๆ ไม่ใช่ BOM คนละอย่างกัน → ไม่ต้องสร้าง `qty_box` / `qty_bag` (ดู README Q3, ถ้ามี exception ค่อยเพิ่มคอลัมน์ตาม)

## 5. Migration 4 — `products` (cost กลายเป็น snapshot + override)

```sql
ALTER TABLE products ADD COLUMN cost_override NUMERIC(10,2);  -- nullable
```

- `products.cost` **ไม่งดใช้** — semantics เปลี่ยนจาก "กรอกเอง" → "ระบบคำนวณแล้วเขียนทับ"
- Effective cost ที่ module เก่าอ่าน = `COALESCE(cost_override, cost)` — ต้องแก้ทุกจุดที่อ่าน (list ใน §8 ของ `02-calculation-logic.md`)

## 6. Recalc engine (Postgres function + triggers — D4)

```sql
CREATE OR REPLACE FUNCTION fn_get_ingredient_unit_price(p_ingredient_id BIGINT)
RETURNS NUMERIC
LANGUAGE sql STABLE AS $$
  SELECT COALESCE(
    i.manual_unit_price,
    (SELECT ip.unit_price
       FROM ingredient_purchases ip
      WHERE ip.ingredient_id = p_ingredient_id
      ORDER BY ip.purchase_date DESC, ip.created_at DESC
      LIMIT 1)
  )
$$;

CREATE OR REPLACE FUNCTION fn_recalc_product_costs(p_product_id BIGINT)
RETURNS void LANGUAGE plpgsql AS $$
BEGIN
  UPDATE products
     SET cost = (
           SELECT COALESCE(CEIL(SUM(pi.qty * fn_get_ingredient_unit_price(pi.ingredient_id)) * 100) / 100, 0)
             FROM product_ingredients pi
            WHERE pi.product_id = p_product_id
           )
  WHERE id = p_product_id;
  -- policy Q1: CEIL(×100)/100 — ค่าเต็มจำนวน (เช่น 2.70) อยู่ที่เดิม ไม่ +0.01
END $$;

CREATE OR REPLACE FUNCTION trg_product_ingredients_recalc() RETURNS trigger
LANGUAGE plpgsql AS $$
BEGIN
  PERFORM fn_recalc_product_costs(OLD.product_id);
  PERFORM fn_recalc_product_costs(NEW.product_id);
  RETURN NULL;
END $$;

CREATE OR REPLACE FUNCTION trg_purchase_recalc() RETURNS trigger
LANGUAGE plpgsql AS $$
DECLARE rec RECORD;
BEGIN
  -- recalc ทุก product ที่ใช้ ingredient ที่ราคาเปลี่ยน (cascade ตาม P5)
  FOR rec IN
    SELECT DISTINCT pi.product_id
      FROM product_ingredients pi
     WHERE pi.ingredient_id =
           (CASE WHEN TG_OP = 'DELETE' THEN OLD.ingredient_id ELSE NEW.ingredient_id END)
  LOOP
    PERFORM fn_recalc_product_costs(rec.product_id);
  END LOOP;
  RETURN NULL;
END $$;

CREATE TRIGGER trg_product_ingredients_recalc_trg
  AFTER INSERT OR UPDATE OR DELETE ON product_ingredients
  FOR EACH ROW EXECUTE FUNCTION trg_product_ingredients_recalc();

CREATE TRIGGER trg_purchase_recalc_trg
  AFTER INSERT OR UPDATE OR DELETE ON ingredient_purchases
  FOR EACH ROW EXECUTE FUNCTION trg_purchase_recalc();
```

> ราคาที่ recalc ใช้ = ราคาล่าสุดที่ commit ใน transaction เดียวกัน (trigger ทำงานตอน commit ของ row ใหม่) → **ซื้อวัตถุดิบวันอาทิตย์ → ต้นทุนสินค้าทุกตัวอัปเดตทันที ไม่ต้องกด recalc**

## 7. Views ใหม่ (สำหรับ UI & Audit)

```sql
-- ราคาปัจจุบันของวัตถุดิบ (page "วัตถุดิบ" / price trend)
CREATE VIEW view_ingredient_current_prices AS
WITH latest AS (
  SELECT DISTINCT ON (ingredient_id)
         ingredient_id, purchase_date, unit_price, amount, quantity, conversion_factor
    FROM ingredient_purchases
   ORDER BY ingredient_id, purchase_date DESC, created_at DESC
)
SELECT i.id                                        AS ingredient_id,
       i.name,
       i.base_unit,
       i.manual_unit_price,
       l.purchase_date                             AS price_as_of,
       COALESCE(i.manual_unit_price, l.unit_price) AS current_unit_price,
       (i.manual_unit_price IS NULL)               AS price_from_purchase
  FROM ingredients i
  LEFT JOIN latest l ON l.ingredient_id = i.id;

-- ต้นทุนที่คำนวณได้ (show ในหน้า product)
CREATE VIEW v_product_calculated_costs AS
SELECT p.id, p.name,
       (SELECT COALESCE(SUM(pi.qty * fn_get_ingredient_unit_price(pi.ingredient_id)), 0)
          FROM product_ingredients pi
         WHERE pi.product_id = p.id)               AS calculated_cost,
       p.cost, p.cost_override
  FROM products p
 WHERE p.is_active;
```

## 7.2 Views + Function สำหรับ “ราคา/ต้นทุน ณ ตอนนั้น” (Dashboard retrospective)

```sql
-- ราคาของ ingredient ณ วันที่ใด ๆ (price as-of)
CREATE OR REPLACE FUNCTION fn_ingredient_price_as_of(p_ingredient_id BIGINT, p_as_of DATE)
RETURNS NUMERIC
LANGUAGE sql STABLE AS $$
  SELECT COALESCE(
    (SELECT manual_unit_price FROM ingredients i WHERE i.id = p_ingredient_id),
    (SELECT ip.unit_price
       FROM ingredient_purchases ip
      WHERE ip.ingredient_id = p_ingredient_id
        AND ip.purchase_date <= p_as_of
      ORDER BY ip.purchase_date DESC, ip.created_at DESC
      LIMIT 1)
  )
$$;
-- fn_get_ingredient_unit_price(id) เดิม = wrapper ของ fn_ingredient_price_as_of(id, CURRENT_DATE)

-- COGS “ราคา ณ ตอนนั้น” ต่อวัน/ต่อเดือน — เพิ่ม column บน views เดิม
-- ตัวอย่างต่อ view_daily_summary (ดู migration ใหม่สำหรับตัวจริง):
--   cogs_as_of(ri) = Σ pi.qty × fn_ingredient_price_as_of(pi.ingredient_id, bill_date)
--   JOIN receipt_items → products → product_ingredients
-- ⚠️ แยกจาก total_cost (L3 snapshot) — 2 ตัวเลขใช้คนละคำถามกัน:
--   • total_cost  = ตัวที่ระบบคิดตอนออกบิล (กำไรของวันนั้นจริง ๆ)
--   • cogs_as_of  = ราคาวัตถุดิบ ณ ตอนนั้นที่ requirement ถาม (ย้อนหลังได้ เพราะ purchase = timeline)
```

## 8. RLS / Grants

```sql
ALTER TABLE product_ingredients ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Authenticated users can CRUD product_ingredients"
  ON product_ingredients FOR ALL USING (auth.role() = 'authenticated');

GRANT SELECT ON view_ingredient_current_prices TO authenticated;
REVOKE SELECT ON view_ingredient_current_prices FROM anon;
GRANT SELECT ON v_product_calculated_costs TO authenticated;
REVOKE SELECT ON v_product_calculated_costs FROM anon;
-- GRANT EXECUTE ON fn_get_ingredient_unit_price / fn_recalc_product_costs: anon ไม่ได้รับ grant → เรียกจาก REST ไม่ได้ (trigger ทำงานใน SECURITY DEFAULT แบบ service ฝั่ง DB)
```

> ⚠️ **ข้อจำกัดที่ต้องรู้:** trigger ทำงานบน connection ฝั่ง DB — แต่ผู้ใช้ app connect ผ่าน PostgREST จะ run trigger ในฐานะ `authenticated` role เช่นกัน ดังนั้น `fn_*` ต้องให้ `EXECUTE` แก่ `authenticated` ด้วย และ GRANT SELECT ตรง ๆ บน `ingredient_purchases`/`product_ingredients` (มีแล้วผ่าน RLS) — ไม่มี privilege issue ใน setup นี้

## 9. Data Migration / Backfill (Run ใน migration เดียวกัน หรือ script แยก)

```sql
-- 1) ingredients เก่า: ตั้ง base_unit เดิมพัน = default_unit (admin ตรวจแก้ทีหลัง)
UPDATE ingredients SET base_unit = default_unit WHERE base_unit IS NULL;

-- 2) recipe จากตัวอย่าง (อ่านตาม Q1/Q2 ที่ confirm แล้ว)
INSERT INTO products (name, category_id, base_price, is_active) VALUES
  ('แซนด์วิชไข่ทูน่า (กล่อง)', 1, 65, true),
  ('แซนวิชไข่ทูน่า (ถุง)', 1, 50, true),
  ('แซนวิชมะเขือเทศไข่ทูน่า (กล่อง)', 1, 65, true);

-- 3) BOM (ตัวอย่าง — ตัวเลขยึด Q1/Q2 ก่อน seed จริง)
INSERT INTO product_ingredients (product_id, ingredient_id, qty) VALUES
  (1, (SELECT id FROM ingredients WHERE name='ขนมปัง'), 3),
  (1, (SELECT id FROM ingredients WHERE name='ไข่ไก่'), 1);
-- ...

-- 4) purchase ล่าสุดของทุก ingredient → ราคา as-of ของสัปดาห์ปัจจุบัน
--    (ถ้ามี data ledger เก่าอยู่แล้ว ไม่ต้องลบ — trigger จะ recalc products ทุกตัว)

-- 5) Recalc ทุกรอบหลัง backfill เสร็จ:
SELECT fn_recalc_product_costs(id) FROM products;

-- 6) products ที่ยังไม่มี BOM: ค้างอยู่ที่ cost เก่า → ตรวจว่า admin override หรือไม่
SELECT id, name, cost FROM products
 WHERE cost_override IS NULL
   AND id NOT IN (SELECT DISTINCT product_id FROM product_ingredients);
```

## 10. Ordering ของ Migrations

| # | ไฟล์ (เสนอ) | เนื้อหา |
|---|-------------|---------|
| 1 | `..._bom_01_ingredients_upgrade.sql` | §2, §3 (ALTER ทั้ง 2 ตาราง) |
| 2 | `..._bom_02_product_ingredients.sql` | §4 + RLS |
| 3 | `..._bom_03_products_cost.sql` | §5 (§6) function + triggers |
| 4 | `..._bom_04_views.sql` | §7 views + grants/RLS ของ view |
| 5 | `..._bom_05_backfill.sql` (script แยก รัน 1 ครั้ง) | §9 |

---
ดูสูตรคำนวณเต็ม / edge cases ใน [`02-calculation-logic.md`](./02-calculation-logic.md) และแผนลงมือทำใน [`03-implementation-plan.md`](./03-implementation-plan.md)
