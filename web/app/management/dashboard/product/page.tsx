'use client';

import * as React from 'react';
import { RefreshCw, Package, TrendingUp, DollarSign } from 'lucide-react';

import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { ResponsiveTable, type Column } from '@/components/dashboard/ResponsiveTable';
import {
  PeriodFilter,
  defaultPeriodFilter,
  type PeriodFilterValue,
} from '@/components/dashboard/PeriodFilter';
import { TopProductsTable } from '@/components/dashboard/TopProductsTable';
import { TopAddonsTable } from '@/components/dashboard/TopAddonsTable';
import { KpiCard } from '@/components/dashboard/KpiCard';
import { DashboardSkeleton, SectionError } from '@/components/dashboard/QueryState';

import {
  useProductSalesLines,
  useTopProducts,
  useTopAddons,
} from '@/lib/dashboard-queries';
import type { SalesProductLine } from '@/types/dashboard';
import { toNum, bahtSign } from '@/types/dashboard';

/* ─── helpers ─────────────────────────────────────────────── */
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

/* ─── Per-line detail columns (shared) ────────────────────── */
function buildLineColumns(): Column<SalesProductLine>[] {
  return [
    {
      key: 'receipt_no',
      header: 'เลขบิล',
      align: 'left',
      isHeader: true,
      render: (row) => <span className="font-mono text-xs">{row.receipt_no}</span>,
    },
    {
      key: 'channel_code',
      header: 'ช่องขาย',
      align: 'left',
      render: (row) => (
        <span className="px-1.5 py-0.5 rounded bg-primary/10 text-xs font-mono text-primary">
          {row.channel_code}
        </span>
      ),
    },
    {
      key: 'product_name',
      header: 'สินค้า',
      align: 'left',
      render: (row) => (
        <span className="truncate max-w-[180px] inline-block" title={row.product_name}>
          {row.product_name}
        </span>
      ),
    },
    {
      key: 'quantity',
      header: 'จำนวน',
      align: 'right',
      render: (row) => toNum(row.quantity),
    },
    {
      key: 'product_price',
      header: 'ราคา/ชิ้น',
      align: 'right',
      hideOnMobile: true,
      render: (row) => bahtSign(row.product_price),
    },
    {
      key: 'line_total',
      header: 'ยอดขาย',
      align: 'right',
      render: (row) => <span className="font-semibold text-primary">{bahtSign(row.line_total)}</span>,
    },
    {
      key: 'line_cost',
      header: 'ต้นทุน',
      align: 'right',
      hideOnMobile: true,
      render: (row) => <span className="text-muted-foreground">{bahtSign(row.line_cost)}</span>,
    },
    {
      key: 'line_profit',
      header: 'กำไร',
      align: 'right',
      render: (row) => {
        const p = toNum(row.line_profit);
        return (
          <span className={`font-semibold ${p >= 0 ? 'text-success-dark' : 'text-destructive'}`}>
            {bahtSign(p)}
          </span>
        );
      },
    },
  ];
}

/* ─── Page ────────────────────────────────────────────────── */
export default function DashboardProductPage() {
  const [period, setPeriod] = React.useState<PeriodFilterValue>(() =>
    defaultPeriodFilter('today'),
  );

  // Best-sellers across all time (DB view aggregates by product).
  const topProductsQuery = useTopProducts();

  // Best-selling add-ons across all time (DB view unnests product_options).
  const topAddonsQuery = useTopAddons();

  // Per-line sales detail for the selected period.
  const range = { dateFrom: period.range.dateFrom, dateTo: period.range.dateTo };
  const linesQuery = useProductSalesLines(range);

  const lines: SalesProductLine[] = linesQuery.data ?? [];

  // Aggregate KPIs from the per-line detail for the selected period.
  const kpi = React.useMemo(() => {
    let revenue = 0;
    let cost = 0;
    let profit = 0;
    let qty = 0;
    for (const l of lines) {
      revenue += toNum(l.line_total);
      cost += toNum(l.line_cost);
      profit += toNum(l.line_profit);
      qty += toNum(l.quantity);
    }
    return { revenue, cost, profit, qty };
  }, [lines]);

  const isLoading = linesQuery.isLoading;
  const isLinesError = linesQuery.isError;
  const refetch = () => {
    topProductsQuery.refetch();
    topAddonsQuery.refetch();
    linesQuery.refetch();
  };

  return (
    <div className="space-y-5">
      {/* Header + controls */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <h1 className="text-xl sm:text-2xl font-bold text-primary">รายสินค้า / สินค้าขายดี</h1>
          <p className="text-sm text-muted-foreground mt-0.5">
            อันดับสินค้าขายดี และรายละเอียดการขายแต่ละรายการ
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

      {isLoading ? (
        <DashboardSkeleton kpiCount={3} />
      ) : (
        <>
          {/* KPI for the selected period (from per-line detail) */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <KpiCard
              accent="action"
              icon={<DollarSign className="w-5 h-5" />}
              label={`รายได้รวม (${periodLabel(period)})`}
              value={bahtSign(kpi.revenue)}
              hint={`${kpi.qty} ชิ้น`}
            />
            <KpiCard
              accent="primary"
              icon={<Package className="w-5 h-5" />}
              label="ต้นทุนรวม"
              value={bahtSign(kpi.cost)}
            />
            <KpiCard
              accent={kpi.profit >= 0 ? 'success' : 'destructive'}
              icon={<TrendingUp className="w-5 h-5" />}
              label="กำไรสุทธิ"
              value={bahtSign(kpi.profit)}
              hint={
                kpi.revenue > 0
                  ? `margin ${((kpi.profit / Math.max(kpi.revenue, 1)) * 100).toFixed(1)}%`
                  : undefined
              }
            />
          </div>

          {!isLinesError && lines.length === 0 && !isLoading && (
            <p className="text-sm text-muted-foreground text-center">
              ไม่มีข้อมูลการขายใน{periodLabel(period)}
            </p>
          )}
          {isLinesError && (
            <SectionError message={linesQuery.error?.message} onRetry={refetch} />
          )}

          {/* Best sellers ranking (all time) */}
          <TopProductsTable
            products={topProductsQuery.data ?? []}
            loading={topProductsQuery.isLoading}
            title="อันดับสินค้าขายดี (ตลอดกาล)"
            emptyText="ยังไม่มีข้อมูลการขาย"
          />

          {/* Best-selling add-ons ranking (all time) */}
          <TopAddonsTable
            addons={topAddonsQuery.data ?? []}
            loading={topAddonsQuery.isLoading}
            title="อันดับตัวเลือกขายดี (ตลอดกาล)"
            emptyText="ยังไม่มีข้อมูลตัวเลือกในการขาย"
          />

          {/* Per-line detail for the selected period */}
          <Card className="border-border/40">
            <CardHeader className="pb-3">
              <CardTitle className="text-base">
                รายละเอียดการขายแต่ละรายการ
                <span className="text-xs font-normal text-muted-foreground ml-2">
                  ({periodLabel(period)})
                </span>
              </CardTitle>
            </CardHeader>
            <CardContent className="pt-0">
              <ResponsiveTable<SalesProductLine>
                columns={buildLineColumns()}
                rows={lines}
                rowKey={(l, i) => `${l.receipt_id}-${i}`}
                renderMobileBadge={(l) => (
                  <span className="px-1.5 py-0.5 rounded bg-primary/10 text-xs font-mono text-primary whitespace-nowrap">
                    {l.channel_code}
                  </span>
                )}
                empty="ไม่มีข้อมูลการขายในช่วงที่เลือก"
              />
            </CardContent>
          </Card>
        </>
      )}
    </div>
  );
}

export const dynamic = 'force-dynamic';
