-- ============================================================
-- INGREDIENT COST TREND VIEWS - Weekly & Monthly (vs Net Profit)
-- ------------------------------------------------------------
-- Views สำหรับคำนวณและสรุปต้นทุนการซื้อวัตถุดิบ แยกตามรายสัปดาห์ และ รายเดือน
-- เพื่อใช้ในหน้า Dashboard "ต้นทุนวัตถุดิบเทียบกำไรสุทธิ" 
-- หมายเหตุ: สัปดาห์เริ่มต้นวันจันทร์ ใช้ ISO Week format ('IYYY-IW')
-- ============================================================

DROP VIEW IF EXISTS view_weekly_ingredient_costs CASCADE;
CREATE VIEW view_weekly_ingredient_costs AS
WITH cte_purchases AS (
  SELECT 
    purchase_date,
    amount,
    ingredient_id,
    to_char(purchase_date, 'IYYY')::integer as iso_year_num,
    cast(to_char(purchase_date, 'IW') as integer) as iso_week_number,
    (to_char(purchase_date, 'IYYY')) || '-W' || lpad(to_char(purchase_date, 'IW'), 2, '0') AS period_id
  FROM ingredient_purchases
)
SELECT 
  iso_year_num,
  iso_week_number,
  period_id,
  COALESCE(SUM(amount), 0)::numeric(12,2) AS total_ingredient_cost,
  COUNT(DISTINCT ingredient_id)::integer AS unique_ingredients_count,
  MIN(purchase_date) as week_start_date,
  MAX(purchase_date) as week_end_date
FROM cte_purchases
GROUP BY 
  iso_year_num,
  iso_week_number,
  period_id;

DROP VIEW IF EXISTS view_monthly_ingredient_costs CASCADE;
CREATE VIEW view_monthly_ingredient_costs AS
WITH cte_purchases AS (
  SELECT 
    purchase_date,
    amount,
    ingredient_id,
    TO_CHAR(purchase_date, 'YYYY-MM')::text AS month_identifier,
    EXTRACT(YEAR FROM purchase_date)::integer AS year_num,
    extract(month from purchase_date)::integer as month_number
  FROM ingredient_purchases
)
SELECT 
  month_identifier,
  year_num,
  month_number,
  COALESCE(SUM(amount), 0)::numeric(12,2) AS total_ingredient_cost,
  COUNT(DISTINCT ingredient_id)::integer AS unique_ingredients_count,
  MIN(purchase_date) as month_start_date,
  MAX(purchase_date) as month_end_date
FROM cte_purchases
GROUP BY 
  month_identifier,
  year_num,
  month_number;

GRANT SELECT ON view_weekly_ingredient_costs TO authenticated;
REVOKE SELECT ON view_weekly_ingredient_costs FROM anon;

GRANT SELECT ON view_monthly_ingredient_costs TO authenticated;
REVOKE SELECT ON view_monthly_ingredient_costs FROM anon;
