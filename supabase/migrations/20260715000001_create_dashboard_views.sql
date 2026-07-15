-- ============================================================
-- DASHBOARD VIEWS
-- ============================================================

-- 1. view_daily_summary — สรุปรายวันตามช่องทางการขาย
CREATE OR REPLACE VIEW view_daily_summary AS
SELECT
  r.bill_date,
  r.channel_code,
  COUNT(r.id)::INT                                AS order_count,
  SUM(r.total_quantity)::INT                        AS total_items,
  COALESCE(SUM(r.subtotal), 0)::NUMERIC(12,2)     AS total_sales,
  COALESCE(SUM(r.discount_total), 0)::NUMERIC(12,2) AS total_discounts,
  COALESCE(SUM(r.grand_total), 0)::NUMERIC(12,2)  AS net_sales,
  COALESCE(SUM(ri.product_cost * ri.quantity), 0)::NUMERIC(12,2) AS total_cost,
  (COALESCE(SUM(ri.line_total), 0) - COALESCE(SUM(ri.product_cost * ri.quantity), 0))::NUMERIC(12,2) AS net_profit
FROM receipts r
JOIN receipt_items ri ON ri.receipt_id = r.id
WHERE r.status = 'active'
GROUP BY r.bill_date, r.channel_code;

-- 2. view_sales_product_lines — รายละเอียดยอดขายแต่ละรายการ (เก็บประวัติทั้งหมด)
CREATE OR REPLACE VIEW view_sales_product_lines AS
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

  -- คำนวณต้นทุนต่อรายการ (line)
  (ri.product_cost * ri.quantity)::NUMERIC(10,2) AS line_cost,
  
  -- คำนวณกำไรสุทธิต่อรายการ (line_profit) = ยอดขายบรรทัด - ต้นทุนบรรทัด
  (ri.line_total - (ri.product_cost * ri.quantity))::NUMERIC(10,2) AS line_profit

FROM receipts r
JOIN receipt_items ri ON ri.receipt_id = r.id
WHERE r.status = 'active';
