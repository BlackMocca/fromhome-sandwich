-- ============================================================
-- DASHBOARD VIEWS — v3 (FIX fan-out duplication + RLS-aware)
-- ------------------------------------------------------------
-- BUG FIXED (v2): ทุก view ที่ `receipts r JOIN receipt_items ri`
-- ทำให้ header row (ฝั่ง "one") ถูกขยายซ้ำตามจำนวน line items
-- (ฝั่ง "many") → ฟังก์ชัน SUM() บนคอลัมน์ header
-- (`r.total_quantity`, `r.subtotal`, `r.discount_total`,
-- `r.grand_total`) ถูกนับซ้ำตามจำนวน items ของบิลนั้น ๆ
-- ผลคือ total_quantity/total_sales/net_sales กลายเป็น
-- `header_value × item_count` — ผิดทั้งหมด เช่น บิลมี 3 items
-- ยอด grand_total จะถูกรวมซ้อนกัน 3 เท่า
--
-- FIX:
--   ตัดการ JOIN ฝั่ง header ออกจากการ SUM โดยสิ้นเชิง
--   • ค่า header (order_count, total_quantity, subtotal,
--     discount_total, grand_total) → aggregate จาก `receipts`
--     เพียว ๆ  (GROUP BY bill_date/channel_code หรือ month)
--   • ค่า item (total_items, total_cost) → pre-aggregate จาก
--     `receipt_items` ก่อน (กลุ่มตาม receipt_id) แล้วค่อย sum/
--     join — ไม่มี header อยู่ในสูตร SUM ที่ตัวเลขจะซ้อน
--   • net_profit = net_sales(header) − total_cost(items)
--   • total_sales = net_sales(header) — ใช้จาก header โดยตรง
--
-- RLS (เหมือนเดิม): security_invoker = true + GRANT to authenticated
-- ------------------------------------------------------------
-- Requires PostgreSQL 15+ (security_invoker). Supabase supports it.
-- ============================================================

-- ─── helpers ────────────────────────────────────────────────
-- Drop the old (v2) views so we can recreate them.
DROP VIEW IF EXISTS view_sales_product_lines CASCADE;
DROP VIEW IF EXISTS view_daily_summary CASCADE;
DROP VIEW IF EXISTS view_top_products CASCADE;
DROP VIEW IF EXISTS view_monthly_sales_profit CASCADE;

-- ============================================================
-- Shared: per-receipt item cost pre-aggregation
-- (one row per receipt → no header fan-out)
-- ============================================================
-- NOTE: function used inside views below; defined inline as a CTE
-- in each view (Postgres views cannot reference a temp/staging
-- table directly, but CTEs inside a view are fine).

-- ============================================================
-- 1. view_daily_summary — สรุปรายวันตามช่องทางการขาย
--    header metrics จาก `receipts` (ไม่ JOIN items)
--    cost metrics จาก pre-aggregated `receipt_items`
--    JOIN กันทีหลัง → ไม่มี header ซ้อน
-- ============================================================
DROP VIEW IF EXISTS view_daily_summary CASCADE;
CREATE VIEW view_daily_summary
WITH (security_invoker = true) AS
WITH
  -- header extracts: ตัวเลขจากฝั่ง receipt โดยตรง (no fan-out)
  hdr AS (
    SELECT
      bill_date,
      channel_code,
      id                                            AS receipt_id,
      total_quantity,
      subtotal,
      discount_total,
      grand_total
    FROM receipts
    WHERE status = 'active'
  ),
  -- item cost per receipt: 1 row per receipt
  itm AS (
    SELECT
      receipt_id,
      COALESCE(SUM(quantity), 0)::INT                  AS total_items,
      COALESCE(SUM(product_cost * quantity), 0)::NUMERIC(12,2) AS total_cost
    FROM receipt_items
    GROUP BY receipt_id
  )
SELECT
  h.bill_date,
  h.channel_code,
  COUNT(*)::INT                                       AS order_count,
  COALESCE(SUM(h.total_quantity), 0)::INT             AS total_items,
  COALESCE(SUM(h.subtotal), 0)::NUMERIC(12,2)         AS total_sales,
  COALESCE(SUM(h.discount_total), 0)::NUMERIC(12,2)   AS total_discounts,
  COALESCE(SUM(h.grand_total), 0)::NUMERIC(12,2)      AS net_sales,
  COALESCE(SUM(i.total_cost), 0)::NUMERIC(12,2)       AS total_cost,
  (COALESCE(SUM(h.grand_total), 0) -
   COALESCE(SUM(i.total_cost), 0))::NUMERIC(12,2)     AS net_profit
FROM hdr h
LEFT JOIN itm i ON i.receipt_id = h.receipt_id
GROUP BY h.bill_date, h.channel_code;

-- ============================================================
-- 2. view_sales_product_lines — รายละเอียดยอดขายแต่ละรายการ
--    ไม่มี duplication (1 row ต่อ 1 line item เท่าเดิม)
--    แต่ดึง header fields มา denormalize เฉย ๆ (ไม่ aggregate)
-- ============================================================
DROP VIEW IF EXISTS view_sales_product_lines CASCADE;
CREATE VIEW view_sales_product_lines
WITH (security_invoker = true) AS
SELECT
  r.id                            AS receipt_id,
  r.receipt_no,
  r.bill_date,
  r.channel_code,
  ri.product_id,
  ri.product_name,
  ri.product_price,
  ri.product_cost,
  ri.quantity,
  ri.line_total,
  (ri.product_cost * ri.quantity)::NUMERIC(12,2)   AS line_cost,
  (ri.line_total - (ri.product_cost * ri.quantity))::NUMERIC(12,2) AS line_profit
FROM receipts r
JOIN receipt_items ri ON ri.receipt_id = r.id
WHERE r.status = 'active';

-- ============================================================
-- 3. view_top_products — สินค้าขายดี (Best sellers, ranked)
--    Pre-filter active receipts ก่อน (>กว่าการ JOIN แล้ว filter)
--    แล้ว aggregate เฉพาะฝั่ง item → ไม่มี header fan-out
-- ============================================================
DROP VIEW IF EXISTS view_top_products CASCADE;
CREATE VIEW view_top_products
WITH (security_invoker = true) AS
SELECT
  ri.product_id                                  AS product_id,
  COALESCE(ri.product_name, 'ไม่ระบุสินค้า')      AS product_name,
  COALESCE(SUM(ri.quantity), 0)::INT              AS total_quantity,
  COUNT(DISTINCT ri.receipt_id)::INT              AS order_count,
  COALESCE(SUM(ri.line_total), 0)::NUMERIC(12,2)  AS total_revenue,
  COALESCE(SUM(ri.product_cost * ri.quantity), 0)::NUMERIC(12,2) AS total_cost,
  (COALESCE(SUM(ri.line_total), 0) -
   COALESCE(SUM(ri.product_cost * ri.quantity), 0))::NUMERIC(12,2) AS total_profit,
  CASE WHEN COALESCE(SUM(ri.line_total), 0) = 0 THEN 0
       ELSE ROUND(
         ((SUM(ri.line_total) - SUM(ri.product_cost * ri.quantity))
          / NULLIF(SUM(ri.line_total), 0)) * 100, 2)
  END::NUMERIC(6,2)                                AS profit_margin
FROM receipt_items ri
WHERE ri.receipt_id IN (SELECT id FROM receipts WHERE status = 'active')
GROUP BY ri.product_id, ri.product_name;

-- ============================================================
-- 4. view_monthly_sales_profit — แนวโน้มยอดขาย/กำไร รายเดือน
--    header metrics จาก `receipts` (ไม่ JOIN items)
--    cost metrics จาก pre-aggregated `receipt_items`
-- ============================================================
DROP VIEW IF EXISTS view_monthly_sales_profit CASCADE;
CREATE VIEW view_monthly_sales_profit
WITH (security_invoker = true) AS
WITH
  hdr AS (
    SELECT
      TO_CHAR(bill_date, 'YYYY-MM')                AS bill_month,
      date_part('year', bill_date)::INT             AS year,
      date_part('month', bill_date)::INT           AS month,
      id                                            AS receipt_id,
      total_quantity,
      grand_total
    FROM receipts
    WHERE status = 'active'
  ),
  itm AS (
    SELECT
      receipt_id,
      COALESCE(SUM(product_cost * quantity), 0)::NUMERIC(12,2) AS total_cost
    FROM receipt_items
    GROUP BY receipt_id
  )
SELECT
  h.bill_month,
  h.year,
  h.month,
  COUNT(*)::INT                                   AS order_count,
  COALESCE(SUM(h.total_quantity), 0)::INT         AS total_items,
  COALESCE(SUM(h.grand_total), 0)::NUMERIC(12,2)  AS net_sales,
  COALESCE(SUM(i.total_cost), 0)::NUMERIC(12,2)  AS total_cost,
  (COALESCE(SUM(h.grand_total), 0) -
   COALESCE(SUM(i.total_cost), 0))::NUMERIC(12,2) AS net_profit
FROM hdr h
LEFT JOIN itm i ON i.receipt_id = h.receipt_id
GROUP BY h.bill_month, h.year, h.month;

-- ============================================================
-- Access role "authenticated" (UNCHANGED from v2)
-- ------------------------------------------------------------
-- Views are security_invoker → honour RLS of underlying tables.
-- `receipts`/`receipt_items` already allow `authenticated`.
-- Anon callers receive no rows (sales = authenticated-only).
-- ============================================================
GRANT SELECT ON view_daily_summary       TO authenticated;
GRANT SELECT ON view_sales_product_lines  TO authenticated;
GRANT SELECT ON view_top_products         TO authenticated;
GRANT SELECT ON view_monthly_sales_profit TO authenticated;

-- Do NOT grant these views to anon (sales data is authenticated-only).
REVOKE SELECT ON view_daily_summary       FROM anon;
REVOKE SELECT ON view_sales_product_lines  FROM anon;
REVOKE SELECT ON view_top_products         FROM anon;
REVOKE SELECT ON view_monthly_sales_profit FROM anon;
