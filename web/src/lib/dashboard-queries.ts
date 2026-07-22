/**
 * React Query (TanStack Query v5) hooks & queryOptions for the
 * Dashboards (Overview + Best Sellers / รายสินค้า).
 *
 * Design notes:
 *  - Query keys are hierarchical for fine-grained invalidation:
 *        ['dashboard']
 *        ├── ['dashboard', 'daily-summary', <args>]
 *        ├── ['dashboard', 'daily-summary-range', <args>]
 *        ├── ['dashboard', 'product-lines', <args>]
 *        ├── ['dashboard', 'top-products', <args>]
 *        └── ['dashboard', 'monthly-sales', <args>]
 *  - We use the `queryOptions()` helper for full type inference.
 *  - `staleTime` 60s matches the global default; dashboards are
 *    not super real-time but a manual refetch button is provided.
 *  - `enabled` guards empty date ranges so no bad request fires.
 */

import { queryOptions, useQuery } from '@tanstack/react-query';
import {
  getDailySummary,
  getDailySummaryRange,
  getProductSalesLines,
  getTopProducts,
  getTopAddons,
  getMonthlySalesProfit,
  getClaimLossRange,
  getIngredientPurchaseTotal,
  getIngredientPurchaseDaily,
  getWeeklyIngredientCosts,
  getMonthlyIngredientCosts,
} from '@/lib/db';
import type {
  DailySummaryRow,
  SalesProductLine,
  TopProductRow,
  TopAddonRow,
  MonthlySalesRow,
  DailyTrendRow,
  WeeklyIngredientCostRow,
  MonthlyIngredientCostRow,
} from '@/types/dashboard';
import { toNum } from '@/types/dashboard';

/** Root query key namespace for all dashboard queries. */
export const dashboardKeys = {
  all: ['dashboard'] as const,
  dailySummary: (date: string) =>
    [...dashboardKeys.all, 'daily-summary', date] as const,
  dailySummaryRange: (range: { dateFrom: string; dateTo: string }) =>
    [...dashboardKeys.all, 'daily-summary-range', range] as const,
  productLines: (
    range: string | { dateFrom: string; dateTo: string },
  ) => [...dashboardKeys.all, 'product-lines', range] as const,
  topProducts: (limit?: number) =>
    [...dashboardKeys.all, 'top-products', { limit }] as const,
  topAddons: (limit?: number) =>
    [...dashboardKeys.all, 'top-addons', { limit }] as const,
  monthlySales: (months: number) =>
    [...dashboardKeys.all, 'monthly-sales', months] as const,
};

/* ─── queryOptions (type-safe, reusable) ──────────────────── */

export const dailySummaryOptions = (date: string) =>
  queryOptions<DailySummaryRow[]>({
    queryKey: dashboardKeys.dailySummary(date),
    queryFn: () => getDailySummary(date),
    staleTime: 60 * 1000,
  });

export const dailySummaryRangeOptions = (range: {
  dateFrom: string;
  dateTo: string;
}) =>
  queryOptions<DailySummaryRow[]>({
    queryKey: dashboardKeys.dailySummaryRange(range),
    queryFn: () => getDailySummaryRange(range),
    staleTime: 60 * 1000,
    enabled: !!range.dateFrom && !!range.dateTo,
  });

export const productLinesOptions = (
  range: string | { dateFrom: string; dateTo: string },
) =>
  queryOptions<SalesProductLine[]>({
    queryKey: dashboardKeys.productLines(range),
    queryFn: () => getProductSalesLines(range),
    staleTime: 60 * 1000,
  });

export const topProductsOptions = (limit?: number) =>
  queryOptions<TopProductRow[]>({
    queryKey: dashboardKeys.topProducts(limit),
    queryFn: () => getTopProducts({ limit }),
    staleTime: 60 * 1000,
  });

export const topAddonsOptions = (limit?: number) =>
  queryOptions<TopAddonRow[]>({
    queryKey: dashboardKeys.topAddons(limit),
    queryFn: () => getTopAddons(limit),
    staleTime: 60 * 1000,
  });

export const monthlySalesOptions = (months = 12) =>
  queryOptions<MonthlySalesRow[]>({
    queryKey: dashboardKeys.monthlySales(months),
    queryFn: () => getMonthlySalesProfit(months),
    staleTime: 5 * 60 * 1000, // monthly trend changes rarely
  });

/* ─── Hooks (ergonomic wrappers) ─────────────────────────── */

export function useDailySummary(date: string) {
  return useQuery(dailySummaryOptions(date));
}

export function useDailySummaryRange(range: { dateFrom: string; dateTo: string }) {
  return useQuery(dailySummaryRangeOptions(range));
}

export function useProductSalesLines(
  range: string | { dateFrom: string; dateTo: string },
) {
  return useQuery(productLinesOptions(range));
}

/** Best-sellers. Pass a limit (e.g. 5 for top-5 highlight, undefined for all). */
export function useTopProducts(limit?: number) {
  return useQuery(topProductsOptions(limit));
}

/** Best-selling add-ons / product options (all-time). */
export function useTopAddons(limit?: number) {
  return useQuery(topAddonsOptions(limit));
}

export function useMonthlySalesProfit(months = 12) {
  return useQuery(monthlySalesOptions(months));
}

/** ต้นทุนของเสียจากเคลมสินค้า ในช่วงวันที่ (status='active') */
export function useClaimLossRange(dateFrom: string, dateTo: string) {
  return useQuery({
    queryKey: [...dashboardKeys.all, 'claim-loss', { dateFrom, dateTo }],
    queryFn: () => getClaimLossRange(dateFrom, dateTo),
    staleTime: 60 * 1000,
    enabled: !!dateFrom && !!dateTo,
  });
}

/** ต้นทุนจากการซื้อวัตถุดิบในช่วงวันที่ */
export function useIngredientPurchaseTotal(dateFrom: string, dateTo: string) {
  return useQuery({
    queryKey: [...dashboardKeys.all, 'ingredient-purchase-total', { dateFrom, dateTo }],
    queryFn: () => getIngredientPurchaseTotal(dateFrom, dateTo),
    staleTime: 60 * 1000,
    enabled: !!dateFrom && !!dateTo,
  });
}

/**
 * แนวโน้มรายวัน: ยอดขาย / กำไร / ต้นทุนของเสีย / ต้นทุนวัตถุดิบ
 * รวมข้อมูลจาก 3 แหล่ง (receipts + claims + ingredient_purchases)
 * แล้ว aggregate รายวันที่ client
 */
export function useDailyTrend(dateFrom: string, dateTo: string) {
  const sales = useQuery({
    queryKey: [...dashboardKeys.all, 'trend-sales', { dateFrom, dateTo }],
    queryFn: () => getDailySummaryRange({ dateFrom, dateTo }),
    staleTime: 60 * 1000,
    enabled: !!dateFrom && !!dateTo,
  });
  const claims = useQuery({
    queryKey: [...dashboardKeys.all, 'trend-claims', { dateFrom, dateTo }],
    queryFn: () => getClaimLossRange(dateFrom, dateTo),
    staleTime: 60 * 1000,
    enabled: !!dateFrom && !!dateTo,
  });
  const ingredients = useQuery({
    queryKey: [...dashboardKeys.all, 'trend-ingredients', { dateFrom, dateTo }],
    queryFn: () => getIngredientPurchaseDaily(dateFrom, dateTo),
    staleTime: 60 * 1000,
    enabled: !!dateFrom && !!dateTo,
  });

  return useQuery<DailyTrendRow[]>({
    queryKey: [
      ...dashboardKeys.all,
      'daily-trend',
      { dateFrom, dateTo },
      sales.dataUpdatedAt,
      claims.dataUpdatedAt,
      ingredients.dataUpdatedAt,
    ],
    queryFn: async () => {
      const salesRows = sales.data || [];
      const claimRows = (claims.data || []) as { claim_date: string; total_cost: number }[];
      const ingRows = ingredients.data || [];

      // Build date index across full [dateFrom, dateTo]
      const map = new Map<string, DailyTrendRow>();
      const fromDate = new Date(dateFrom + 'T00:00:00');
      const toDate = new Date(dateTo + 'T00:00:00');
      for (let d = new Date(fromDate); d <= toDate; d.setDate(d.getDate() + 1)) {
        const key = d.toISOString().slice(0, 10);
        map.set(key, {
          date: key,
          net_sales: 0,
          net_profit: 0,
          claim_cost: 0,
          ingredient_cost: 0,
          net_profit_after_costs: 0,
        });
      }

      // Aggregate sales rows (one per day-channel) into per-day
      for (const r of salesRows) {
        const key = String(r.bill_date).slice(0, 10);
        const slot = map.get(key) || {
          date: key,
          net_sales: 0,
          net_profit: 0,
          claim_cost: 0,
          ingredient_cost: 0,
          net_profit_after_costs: 0,
        };
        slot.net_sales += toNum(r.net_sales);
        slot.net_profit += toNum(r.net_profit);
        map.set(key, slot);
      }

      // Aggregate claim rows
      for (const r of claimRows) {
        const key = String(r.claim_date).slice(0, 10);
        const slot = map.get(key) || {
          date: key,
          net_sales: 0,
          net_profit: 0,
          claim_cost: 0,
          ingredient_cost: 0,
          net_profit_after_costs: 0,
        };
        slot.claim_cost += toNum(r.total_cost);
        map.set(key, slot);
      }

      // Aggregate ingredient rows
      for (const r of ingRows) {
        const key = String(r.purchase_date).slice(0, 10);
        const slot = map.get(key) || {
          date: key,
          net_sales: 0,
          net_profit: 0,
          claim_cost: 0,
          ingredient_cost: 0,
          net_profit_after_costs: 0,
        };
        slot.ingredient_cost += toNum(r.total_amount);
        map.set(key, slot);
      }

      // Compute final net_profit_after_costs
      const out: DailyTrendRow[] = [];
      for (const slot of map.values()) {
        slot.net_profit_after_costs =
          slot.net_profit - slot.claim_cost - slot.ingredient_cost;
        out.push(slot);
      }
      out.sort((a, b) => a.date.localeCompare(b.date));
      return out;
    },
    enabled: !!dateFrom && !!dateTo && !sales.isPending && !claims.isPending && !ingredients.isPending,
    staleTime: 60 * 1000,
  });
}

/** Get weekly ingredient costs */
export function useWeeklyIngredientCosts() {
  return useQuery({
    queryKey: [...dashboardKeys.all, 'weekly-ingredient-costs'],
    queryFn: () => getWeeklyIngredientCosts(),
    staleTime: 60 * 1000,
  });
}

/** Get monthly ingredient costs */
export function useMonthlyIngredientCosts() {
  return useQuery({
    queryKey: [...dashboardKeys.all, 'monthly-ingredient-costs'],
    queryFn: () => getMonthlyIngredientCosts(),
    staleTime: 60 * 1000,
  });
}

