/**
 * Dashboard entities — match the SQL views in
 * supabase/migrations/20260717000001_dashboard_views_rls_and_best_sellers.sql
 *
 * All numeric money fields come back as strings from PostgREST
 * (the views cast to NUMERIC). The app treats them as numbers;
 * helpers below coerce safely.
 */

/** Per-day, per-channel summary (view_daily_summary) */
export interface DailySummaryRow {
  bill_date: string;          // 'YYYY-MM-DD'
  channel_code: string;       // e.g. 'LMN'
  order_count: number;        // INT
  total_items: number;        // INT
  total_sales: number;         // NUMERIC -> number
  total_discounts: number;
  net_sales: number;
  total_cost: number;
  net_profit: number;          // net_sales - total_cost
}

/** Per receipt-item sales line (view_sales_product_lines) */
export interface SalesProductLine {
  receipt_id: number;
  receipt_no: string;
  bill_date: string;
  channel_code: string;
  product_id: number | null;
  product_name: string;
  product_price: number;
  product_cost: number;
  quantity: number;
  line_total: number;
  line_cost: number;
  line_profit: number;
}

/** Ranked best-seller aggregation (view_top_products) */
export interface TopProductRow {
  product_id: number | null;
  product_name: string;
  total_quantity: number;
  order_count: number;
  total_revenue: number;
  total_cost: number;
  total_profit: number;
  /** net profit / revenue * 100 (already computed by the view, 2 dp) */
  profit_margin: number;
  /** Assigned client-side when sorted by total_quantity desc. */
  rank?: number;
}

/** Monthly sales/profit trend (view_monthly_sales_profit) */
export interface MonthlySalesRow {
  bill_month: string;          // 'YYYY-MM'
  year: number;
  month: number;                // 1..12
  order_count: number;
  total_items: number;
  net_sales: number;
  total_cost: number;
  net_profit: number;
}

/* ─── Derived (client-side) summary shapes ─────────────────── */

export interface DashboardOverviewSummary {
  order_count: number;
  total_items: number;
  total_sales: number;
  total_discounts: number;
  net_sales: number;
  total_cost: number;
  net_profit: number;
}

export interface ChannelSummary extends DashboardOverviewSummary {
  channel_code: string;
}

/* ─── Filters used by the dashboard hooks/components ───────── */

export type DashboardPeriod = 'today' | 'month' | 'range';

export interface DashboardDateRange {
  /** Inclusive, 'YYYY-MM-DD' */
  dateFrom: string;
  /** Inclusive, 'YYYY-MM-DD' */
  dateTo: string;
}

export interface DashboardFilters {
  period: DashboardPeriod;
  dateFrom: string;
  dateTo: string;
  /** Optional channel filter (e.g. 'LMN'); empty = all channels */
  channelCode?: string;
}

/* ─── Coercion helpers (PostgREST NUMERIC returns strings) ──── */

/**
 * PostgREST may return NUMERIC columns as strings (especially large
 * / decimal values) even though TS suspects `number`. This coerces
 * any input into a number safely.
 */
export function toNum(v: unknown): number {
  if (v == null) return 0;
  if (typeof v === 'number') return Number.isFinite(v) ? v : 0;
  // string numbers (incl. '123.45' and '0') and ''
  const n = typeof v === 'string' ? Number(v) : NaN;
  return Number.isFinite(n) ? n : 0;
}

/** Format a money value as Thai Baht (no decimals by default). */
export function baht(v: number | string | null | undefined, decimals = 0): string {
  const n = toNum(v);
  return n.toLocaleString('th-TH', {
    minimumFractionDigits: decimals,
    maximumFractionDigits: decimals,
  });
}

/** Format with the ฿ symbol prefix. */
export function bahtSign(v: number | string | null | undefined, decimals = 0): string {
  return `฿${baht(v, decimals)}`;
}
