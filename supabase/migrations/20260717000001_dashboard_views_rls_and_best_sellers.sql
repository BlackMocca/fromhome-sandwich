-- ============================================================
-- DASHBOARD VIEWS — v2 (RLS-aware + Best Sellers + Monthly Trend)
-- ------------------------------------------------------------
-- What changed vs 20260715000001_create_dashboard_views.sql:
--   1. Recreate views WITH (security_invoker = true) so the view
--      runs as the *caller* and therefore respects RLS on the
--      underlying receipts / receipt_items tables. Without this,
--      a Postgres view bypasses RLS (table owner privileges),
--      which is a Supabase security trap.
--      (Requires PostgreSQL 15+. Supabase is on 15+.)
--   2. Add view_top_products  — ranked best-sellers (sales focus)
--   3. Add view_monthly_sales_profit — monthly sales/cost/profit trend
--   4. Explicit GRANT to authenticated role (tables are exposed
--      via PostgREST Data API) + RLS note.
--
-- Access role model:
--   - The underlying receipts / receipt_items tables already have
--     RLS policies for `authenticated`. Because views are now
--     security_invoker, an anon key (no auth) sees NO rows, and an
--     authenticated user sees exactly the rows their RLS allows
--     (here: all active receipts, per existing policies).
-- ============================================================

-- ─── helpers ────────────────────────────────────────────────
-- Drop the old (non-security-invoker) views so we can recreate them.
DROP VIEW IF EXISTS view_sales_product_lines CASCADE;
DROP VIEW IF EXISTS view_daily_summary CASCADE;
-- ============================================================
-- 1. view_daily_summary — สรุปรายวันตามช่องทางการขาย
--    (RLS-aware: security_invoker = true)
-- ============================================================
CREATE OR REPLACE VIEW view_daily_summary
WITH (security_invoker = true) AS
SELECT
  r.bill_date,
  r.channel_code,
  COUNT(DISTINCT r.id)::INT                           AS order_count,
  COALESCE(SUM(r.total_quantity), 0)::INT              AS total_items,
  COALESCE(SUM(r.subtotal), 0)::NUMERIC(14,2)          AS total_sales,
  COALESCE(SUM(r.discount_total), 0)::NUMERIC(14,2)    AS total_discounts,
  COALESCE(SUM(r.grand_total), 0)::NUMERIC(14,2)       AS net_sales,
  COALESCE(SUM(ri.product_cost * ri.quantity), 0)::NUMERIC(14,2) AS total_cost,
  (COALESCE(SUM(r.grand_total), 0) -
   COALESCE(SUM(ri.product_cost * ri.quantity), 0))::NUMERIC(14,2) AS net_profit
FROM receipts r
JOIN receipt_items ri ON ri.receipt_id = r.id
WHERE r.status = 'active'
GROUP BY r.bill_date, r.channel_code;
-- ============================================================
-- 2. view_sales_product_lines — รายละเอียดยอดขายแต่ละรายการ
--    (RLS-aware: security_invoker = true)
-- ============================================================
CREATE OR REPLACE VIEW view_sales_product_lines
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
  (ri.product_cost * ri.quantity)::NUMERIC(14,2) AS line_cost,
  (ri.line_total - (ri.product_cost * ri.quantity))::NUMERIC(14,2) AS line_profit
FROM receipts r
JOIN receipt_items ri ON ri.receipt_id = r.id
WHERE r.status = 'active';
-- ============================================================
-- 3. view_top_products — สินค้าขายดี (Best sellers, ranked)
--    Aggregates all active sales per product; client orders by
--    total_quantity / total_revenue and limits as needed.
--    product_id may be NULL for ad-hoc items → grouped as 'Unknown'.
-- ============================================================
CREATE OR REPLACE VIEW view_top_products
WITH (security_invoker = true) AS
SELECT
  ri.product_id                                  AS product_id,
  COALESCE(ri.product_name, 'ไม่ระบุสินค้า')      AS product_name,
  COALESCE(SUM(ri.quantity), 0)::INT              AS total_quantity,
  COUNT(DISTINCT r.id)::INT                       AS order_count,
  COALESCE(SUM(ri.line_total), 0)::NUMERIC(14,2)  AS total_revenue,
  COALESCE(SUM(ri.product_cost * ri.quantity), 0)::NUMERIC(14,2) AS total_cost,
  (COALESCE(SUM(ri.line_total), 0) -
   COALESCE(SUM(ri.product_cost * ri.quantity), 0))::NUMERIC(14,2) AS total_profit,
  CASE WHEN COALESCE(SUM(ri.line_total), 0) = 0 THEN 0
       ELSE ROUND(
         ((SUM(ri.line_total) - SUM(ri.product_cost * ri.quantity))
          / NULLIF(SUM(ri.line_total), 0)) * 100, 2)
  END::NUMERIC(6,2)                                AS profit_margin
FROM receipts r
JOIN receipt_items ri ON ri.receipt_id = r.id
WHERE r.status = 'active'
GROUP BY ri.product_id, ri.product_name;
-- ============================================================
-- 4. view_monthly_sales_profit — แนวโน้มยอดขาย/กำไร รายเดือน
--    bill_month format: 'YYYY-MM'. Useful for current vs previous
--    month comparison chart on the Overview dashboard.
-- ============================================================
CREATE OR REPLACE VIEW view_monthly_sales_profit
WITH (security_invoker = true) AS
SELECT
  TO_CHAR(r.bill_date, 'YYYY-MM')                 AS bill_month,
  EXTRACT(YEAR FROM r.bill_date)::INT              AS year,
  EXTRACT(MONTH FROM r.bill_date)::INT             AS month,
  COUNT(DISTINCT r.id)::INT                        AS order_count,
  COALESCE(SUM(r.total_quantity), 0)::INT          AS total_items,
  COALESCE(SUM(r.grand_total), 0)::NUMERIC(14,2)   AS net_sales,
  COALESCE(SUM(ri.product_cost * ri.quantity), 0)::NUMERIC(14,2) AS total_cost,
  (COALESCE(SUM(r.grand_total), 0) -
   COALESCE(SUM(ri.product_cost * ri.quantity), 0))::NUMERIC(14,2) AS net_profit
FROM receipts r
JOIN receipt_items ri ON ri.receipt_id = r.id
WHERE r.status = 'active'
GROUP BY TO_CHAR(r.bill_date, 'YYYY-MM'),
         EXTRACT(YEAR FROM r.bill_date),
         EXTRACT(MONTH FROM r.bill_date);
-- ============================================================
-- Access role "authenticated"
-- ------------------------------------------------------------
-- Newly created SQL objects are NOT automatically reachable from
-- the PostgREST Data API for `anon`/`authenticated` roles. We
-- grant SELECT on the views explicitly to `authenticated`.
--
-- Because the tables (receipts / receipt_items) already enable RLS
-- with `TO authenticated` policies, AND the views are now
-- security_invoker, an authenticated caller's RLS policies are
-- honoured for every read. Anon callers receive no rows.
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