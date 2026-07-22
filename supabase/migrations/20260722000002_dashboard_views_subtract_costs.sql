-- ============================================================
-- DASHBOARD VIEWS — v4 (subtract claim loss + ingredient purchase)
-- ------------------------------------------------------------
-- Update net_profit ในทั้ง 2 views ให้หักต้นทุนเพิ่มเติม:
--   • ต้นทุนของเสีย (claims.total_cost) — กลุ่มตาม claim_date
--   • ต้นทุนซื้อวัตถุดิบ (ingredient_purchases.amount) — กลุ่มตาม purchase_date
--
-- สูตรใหม่:
--   net_profit = grand_total (net_sales) − total_cost
--                − SUM(claims.total_cost) ในช่วงวันที่นั้น
--                − SUM(ingredient_purchases.amount) ในช่วงวันที่นั้น
--
-- หมายเหตุ:
--   • ใช้ LEFT JOIN เพื่อให้วันที่ไม่มี claims/ingredient_purchases ก็แสดงได้ (0)
--   • claims filter `status = 'active'` (ไม่นับ cancelled)
--   • ingredient_purchases ไม่มี status → นับทุก row
-- ============================================================

-- ============================================================
-- 1. view_daily_summary — สรุปรายวันตามช่องทางการขาย
--    + หักต้นทุนของเสีย (claims) และต้นทุนซื้อวัตถุดิบต่อวัน
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
  ),
  -- claim loss per day (active only)
  clm AS (
    SELECT
      claim_date,
      COALESCE(SUM(total_cost), 0)::NUMERIC(12,2)      AS claim_cost
    FROM claims
    WHERE status = 'active'
    GROUP BY claim_date
  ),
  -- ingredient purchase per day
  ing AS (
    SELECT
      purchase_date,
      COALESCE(SUM(amount), 0)::NUMERIC(12,2)          AS ingredient_cost
    FROM ingredient_purchases
    GROUP BY purchase_date
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
  COALESCE(c.claim_cost, 0)::NUMERIC(12,2)            AS claim_loss,
  COALESCE(g.ingredient_cost, 0)::NUMERIC(12,2)       AS ingredient_cost,
  (COALESCE(SUM(h.grand_total), 0) -
   COALESCE(SUM(i.total_cost), 0) -
   COALESCE(c.claim_cost, 0) -
   COALESCE(g.ingredient_cost, 0))::NUMERIC(12,2)     AS net_profit
FROM hdr h
LEFT JOIN itm i ON i.receipt_id = h.receipt_id
LEFT JOIN clm c ON c.claim_date = h.bill_date
LEFT JOIN ing g ON g.purchase_date = h.bill_date
GROUP BY h.bill_date, h.channel_code, c.claim_cost, g.ingredient_cost;

-- ============================================================
-- 2. view_monthly_sales_profit — แนวโน้มรายเดือน
--    + หักต้นทุนของเสีย (claims) และต้นทุนซื้อวัตถุดิบต่อเดือน
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
  ),
  clm AS (
    SELECT
      TO_CHAR(claim_date, 'YYYY-MM')               AS claim_month,
      COALESCE(SUM(total_cost), 0)::NUMERIC(12,2)  AS claim_cost
    FROM claims
    WHERE status = 'active'
    GROUP BY TO_CHAR(claim_date, 'YYYY-MM')
  ),
  ing AS (
    SELECT
      TO_CHAR(purchase_date, 'YYYY-MM')            AS purchase_month,
      COALESCE(SUM(amount), 0)::NUMERIC(12,2)      AS ingredient_cost
    FROM ingredient_purchases
    GROUP BY TO_CHAR(purchase_date, 'YYYY-MM')
  )
SELECT
  h.bill_month,
  h.year,
  h.month,
  COUNT(*)::INT                                   AS order_count,
  COALESCE(SUM(h.total_quantity), 0)::INT         AS total_items,
  COALESCE(SUM(h.grand_total), 0)::NUMERIC(12,2)  AS net_sales,
  COALESCE(SUM(i.total_cost), 0)::NUMERIC(12,2)  AS total_cost,
  COALESCE(c.claim_cost, 0)::NUMERIC(12,2)       AS claim_loss,
  COALESCE(g.ingredient_cost, 0)::NUMERIC(12,2)  AS ingredient_cost,
  (COALESCE(SUM(h.grand_total), 0) -
   COALESCE(SUM(i.total_cost), 0) -
   COALESCE(c.claim_cost, 0) -
   COALESCE(g.ingredient_cost, 0))::NUMERIC(12,2) AS net_profit
FROM hdr h
LEFT JOIN itm i ON i.receipt_id = h.receipt_id
LEFT JOIN clm c ON c.claim_month = h.bill_month
LEFT JOIN ing g ON g.purchase_month = h.bill_month
GROUP BY h.bill_month, h.year, h.month, c.claim_cost, g.ingredient_cost;

-- ============================================================
-- Access role (unchanged from v3)
-- ============================================================
GRANT SELECT ON view_daily_summary        TO authenticated;
GRANT SELECT ON view_monthly_sales_profit TO authenticated;
REVOKE SELECT ON view_daily_summary        FROM anon;
REVOKE SELECT ON view_monthly_sales_profit FROM anon;

-- ============================================================
-- Comment
-- ============================================================
COMMENT ON VIEW view_daily_summary IS
  'Per-day, per-channel sales/cost summary. net_profit = grand_total - total_cost - claim_loss - ingredient_cost (active claims only).';
COMMENT ON VIEW view_monthly_sales_profit IS
  'Per-month sales/profit trend. net_profit = grand_total - total_cost - claim_loss - ingredient_cost (active claims only).';
