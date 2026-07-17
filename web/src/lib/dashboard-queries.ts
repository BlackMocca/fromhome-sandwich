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
} from '@/lib/db';
import type {
  DailySummaryRow,
  SalesProductLine,
  TopProductRow,
  TopAddonRow,
  MonthlySalesRow,
} from '@/types/dashboard';

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
