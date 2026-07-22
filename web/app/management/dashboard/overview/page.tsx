'use client';

import * as React from 'react';
import { RefreshCw } from 'lucide-react';
import { ReceiptText, Boxes, DollarSign, TrendingUp } from 'lucide-react';

import { Button } from '@/components/ui/button';
import { KpiCard } from '@/components/dashboard/KpiCard';
import {
  PeriodFilter,
  defaultPeriodFilter,
  type PeriodFilterValue,
} from '@/components/dashboard/PeriodFilter';
import { SalesByChannelCard } from '@/components/dashboard/SalesByChannelCard';
import { TrendCard } from '@/components/dashboard/TrendCard';
import { TopProductsTable } from '@/components/dashboard/TopProductsTable';
import { DashboardSkeleton, SectionError } from '@/components/dashboard/QueryState';

import {
  useDailySummary,
  useDailySummaryRange,
  useTopProducts,
  useClaimLossRange,
  useIngredientPurchaseTotal,
  useDailyTrend,
} from '@/lib/dashboard-queries';
import type {
  DailySummaryRow,
  ChannelSummary,
  DashboardOverviewSummary,
} from '@/types/dashboard';
import { toNum, bahtSign } from '@/types/dashboard';

/* ─── Aggregation helpers ─────────────────────────────────── */
const ZERO_SUMMARY: DashboardOverviewSummary = {
  order_count: 0,
  total_items: 0,
  total_sales: 0,
  total_discounts: 0,
  net_sales: 0,
  total_cost: 0,
  net_profit: 0,
};

function aggregateRows(rows: DailySummaryRow[]): DashboardOverviewSummary {
  return rows.reduce<DashboardOverviewSummary>(
    (acc, r) => ({
      order_count: acc.order_count + toNum(r.order_count),
      total_items: acc.total_items + toNum(r.total_items),
      total_sales: acc.total_sales + toNum(r.total_sales),
      total_discounts: acc.total_discounts + toNum(r.total_discounts),
      net_sales: acc.net_sales + toNum(r.net_sales),
      total_cost: acc.total_cost + toNum(r.total_cost),
      net_profit: acc.net_profit + toNum(r.net_profit),
    }),
    { ...ZERO_SUMMARY },
  );
}

function toChannelSummaries(rows: DailySummaryRow[]): ChannelSummary[] {
  // Group by channel_code (range mode can have multiple dates per channel).
  const map = new Map<string, ChannelSummary>();
  for (const r of rows) {
    const existing =
      map.get(r.channel_code) ??
      ({
        channel_code: r.channel_code,
        ...ZERO_SUMMARY,
      } as ChannelSummary);
    existing.order_count += toNum(r.order_count);
    existing.total_items += toNum(r.total_items);
    existing.total_sales += toNum(r.total_sales);
    existing.total_discounts += toNum(r.total_discounts);
    existing.net_sales += toNum(r.net_sales);
    existing.total_cost += toNum(r.total_cost);
    existing.net_profit += toNum(r.net_profit);
    map.set(r.channel_code, existing);
  }
  return Array.from(map.values());
}

/* Period label helper */
function periodLabel(v: PeriodFilterValue): string {
  if (v.period === 'today') return `วันที่ ${formatThai(v.range.dateFrom)}`;
  if (v.period === 'month') return `เดือนนี้`;
  return `${formatThai(v.range.dateFrom)} - ${formatThai(v.range.dateTo)}`;
}

function formatThai(iso: string): string {
  if (!iso) return '';
  try {
    const d = new Date(iso + 'T00:00:00');
    return d.toLocaleDateString('th-TH', { day: '2-digit', month: 'short', year: 'numeric' });
  } catch {
    return iso;
  }
}

/* ─── Page ────────────────────────────────────────────────── */
export default function DashboardOverviewPage() {
  const [period, setPeriod] = React.useState<PeriodFilterValue>(() =>
    defaultPeriodFilter('today'),
  );

  // Choose the right summary query based on the period type.
  const isRange = period.period !== 'today';
  const singleDate = period.range.dateFrom;

  const singleDayQuery = useDailySummary(singleDate);
  const rangeQuery = useDailySummaryRange({ dateFrom: period.range.dateFrom, dateTo: period.range.dateTo });

  const summaryQuery = isRange ? rangeQuery : singleDayQuery;
  const topProductsQuery = useTopProducts(5);
  const claimLossQuery = useClaimLossRange(period.range.dateFrom, period.range.dateTo);
  const ingredientPurchaseQuery = useIngredientPurchaseTotal(period.range.dateFrom, period.range.dateTo);
  const dailyTrendQuery = useDailyTrend(period.range.dateFrom, period.range.dateTo);

  const dailyRows: DailySummaryRow[] = isRange
    ? (rangeQuery.data ?? [])
    : (singleDayQuery.data ?? []);

  const summary = React.useMemo(
    () => aggregateRows(dailyRows),
    [dailyRows],
  );
  const channels = React.useMemo(() => toChannelSummaries(dailyRows), [dailyRows]);

  // ต้นทุนของเสียจากเคลมสินค้า ในช่วงเวลาเดียวกัน (สำหรับแสดง hint ในกราฟ)
  const claimLoss = React.useMemo(() => {
    const rows = (claimLossQuery.data ?? []) as { total_cost: number }[];
    return rows.reduce((s, r) => s + toNum(r.total_cost), 0);
  }, [claimLossQuery.data]);

  // ต้นทุนจากการซื้อวัตถุดิบในช่วงเวลาเดียวกัน (สำหรับแสดง hint ในกราฟ)
  const ingredientPurchaseTotal = React.useMemo(() => {
    return toNum(ingredientPurchaseQuery.data?.total_amount ?? 0);
  }, [ingredientPurchaseQuery.data]);

  // กำไรสุทธิ: view already calculates net_profit = grand_total - total_cost - claim_loss

  const isLoading = summaryQuery.isLoading;
  const isError = summaryQuery.isError;
  const refetch = () => {
    if (isRange) rangeQuery.refetch();
    else singleDayQuery.refetch();
    dailyTrendQuery.refetch();
    topProductsQuery.refetch();
    claimLossQuery.refetch();
    ingredientPurchaseQuery.refetch();
  };

  return (
    <div className="space-y-5">
      {/* Header + controls */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <h1 className="text-xl sm:text-2xl font-bold text-primary">ภาพรวมยอดขาย</h1>
          <p className="text-sm text-muted-foreground mt-0.5">
            สรุปยอดขาย ต้นทุน และกำไรของช่วงเวลาที่เลือก
          </p>
        </div>
        <div className="flex items-center gap-2 sm:gap-3 flex-wrap">
          <PeriodFilter value={period} onChange={setPeriod} />
          <Button variant="ghost" size="sm" onClick={refetch} aria-label="รีเฟรชข้อมูล">
            <RefreshCw className={`w-4 h-4 ${isLoading ? 'animate-spin' : ''}`} />
            <span className="hidden sm:inline ml-1">รีเฟรช</span>
          </Button>
        </div>
      </div>

      {/* KPI cards */}
      {isLoading ? (
        <DashboardSkeleton kpiCount={4} />
      ) : (
        <>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
            <KpiCard
              accent="primary"
              icon={<ReceiptText className="w-5 h-5" />}
              label="จำนวนบิล"
              value={`${summary.order_count}`}
              hint={`${summary.total_items} ชิ้นสินค้า`}
            />
            <KpiCard
              accent="action"
              icon={<DollarSign className="w-5 h-5" />}
              label="ยอดขายรวม"
              value={bahtSign(summary.net_sales)}
              hint={
                summary.total_discounts > 0
                  ? `ส่วนลดรวม ${bahtSign(summary.total_discounts)}`
                  : undefined
              }
            />
            <KpiCard
              accent="primary"
              icon={<Boxes className="w-5 h-5" />}
              label="ต้นทุนรวม"
              value={bahtSign(summary.total_cost + claimLoss)}
              hint={
                <div className="space-y-0.5">
                  <div>
                    <span className="text-muted-foreground/70">ต้นทุนสินค้า</span>{" "}
                    <span className="font-semibold text-primary">{bahtSign(summary.total_cost)}</span>
                  </div>
                  <div>
                    <span className="text-muted-foreground/70">ต้นทุนของเสียสะสม</span>{" "}
                    <span className="font-semibold text-destructive">{bahtSign(claimLoss)}</span>
                  </div>
                </div>
              }
            />
            <KpiCard
              accent={summary.net_profit >= 0 ? 'success' : 'destructive'}
              icon={<TrendingUp className="w-5 h-5" />}
              label="กำไรสุทธิ"
              value={bahtSign(summary.net_profit)}
              hint={
                summary.net_sales > 0
                  ? `margin ${((summary.net_profit / Math.max(summary.net_sales, 1)) * 100).toFixed(1)}%`
                  : undefined
              }
            />
          </div>

          {isError && (
            <SectionError
              message={summaryQuery.error?.message}
              onRetry={refetch}
            />
          )}

          {/* Channel breakdown + daily trend */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            <SalesByChannelCard
              channels={channels}
              loading={isLoading}
              periodLabel={periodLabel(period)}
            />
            <TrendCard
              rows={dailyTrendQuery.data ?? []}
              loading={dailyTrendQuery.isLoading}
              periodLabel={periodLabel(period)}
            />
          </div>

          {/* Highlight: current period top 5 best sellers */}
          <TopProductsTable
            products={topProductsQuery.data ?? []}
            loading={topProductsQuery.isLoading}
            limit={5}
            title="สินค้าขายดี 5 อันดับ (ตลอดกาล)"
            emptyText="ยังไม่มีข้อมูลการขาย"
          />
        </>
      )}

      {/* Hint when empty after load */}
      {!isLoading && !isError && dailyRows.length === 0 && (
        <p className="text-sm text-muted-foreground text-center pt-2">
          ไม่มีข้อมูลบิลใน{periodLabel(period)}
        </p>
      )}
    </div>
  );
}

export const dynamic = 'force-dynamic';
