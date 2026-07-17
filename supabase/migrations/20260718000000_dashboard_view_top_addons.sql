-- ============================================================
-- DASHBOARD VIEW — Best-selling Add-ons (product_options)
-- ------------------------------------------------------------
-- Ranked add-ons / product options by total quantity sold,
-- all-time (across every active receipt). Unnests the JSONB
-- `product_options` array stored on each receipt line and
-- aggregates by addon id + name.
--
-- Follows the v3 pattern (20260717000002_dashboard_views...):
--   • No header fan-out: aggregate only the item side
--     (filter active receipts via IN subquery, no JOIN to
--     the receipts header).
--   • security_invoker = true → honours RLS on receipt_items.
--   • GRANT SELECT to authenticated, REVOKE from anon.
--
-- Each addon instance counts as `ri.quantity` (an option is
-- selected once per line), so total addon quantity = sum of
-- line quantities for lines that include that option.
-- ============================================================

DROP VIEW IF EXISTS view_top_addons CASCADE;

CREATE VIEW view_top_addons
WITH (security_invoker = true) AS
SELECT
  (opt->>'id')::BIGINT                                AS addon_id,
  COALESCE(opt->>'name', 'ไม่ระบุตัวเลือก')            AS addon_name,
  COALESCE(SUM(ri.quantity), 0)::INT                  AS total_quantity,
  COUNT(DISTINCT ri.receipt_id)::INT                  AS order_count,
  COALESCE(SUM((opt->>'price')::NUMERIC(12,2) * ri.quantity), 0)::NUMERIC(12,2)
                                                     AS total_revenue
FROM receipt_items ri
CROSS JOIN LATERAL jsonb_array_elements(ri.product_options) AS opt
WHERE ri.receipt_id IN (SELECT id FROM receipts WHERE status = 'active')
  AND jsonb_array_length(ri.product_options) > 0
GROUP BY (opt->>'id')::BIGINT, opt->>'name'
ORDER BY total_quantity DESC, total_revenue DESC;

-- ============================================================
-- Access role "authenticated" (matches other dashboard views)
-- ============================================================
GRANT SELECT ON view_top_addons TO authenticated;
REVOKE SELECT ON view_top_addons FROM anon;
