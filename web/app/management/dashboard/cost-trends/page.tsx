'use client';

import * as React from 'react';
import { RefreshCw, TrendingUp, Package } from 'lucide-react';
import { cn } from '@/lib/utils';

import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { KpiCard } from '@/components/dashboard/KpiCard';
import { DashboardSkeleton, SectionError } from '@/components/dashboard/QueryState';

import { useWeeklyIngredientCosts, useMonthlyIngredientCosts, useMonthlySalesProfit } from '@/lib/dashboard-queries';
import { bahtSign } from '@/types/dashboard';

type ViewMode = 'weekly' | 'monthly';

const THAI_MONTH_SHORT = [
  'ม.ค.', 'ก.พ.', 'มี.ค.', 'เม.ย.', 'พ.ค.', 'มิ.ย.', 
  'ก.ค.', 'ส.ค.', 'ก.ย.', 'ต.ค.', 'พ.ย.', 'ธ.ค.'
];

function formatThaiDateRange(startDateStr: string | null, endDateStr: string | null): string {
  if (!startDateStr || !endDateStr) return '-';
  try {
    const start = new Date(startDateStr + 'T00:00:00');
    const end = new Date(endDateStr + 'T00:00:00');
    const fmt = (d: Date) => d.toLocaleDateString('th-TH', { day: 'numeric', month: 'short' });
    return `วันที่ ${fmt(start)} - ${fmt(end)}`;
  } catch {
    return '-';
  }
}

function formatMonthShort(monthNumber: number): string {
  if (monthNumber < 1 || monthNumber > 12) return '';
  return THAI_MONTH_SHORT[monthNumber - 1];
}



export default function CostTrendsDashboardPage() {
  const [viewMode, setViewMode] = React.useState<ViewMode>('weekly');

  const weeklyQuery = useWeeklyIngredientCosts();
  const monthlyQuery = useMonthlyIngredientCosts();
  const salesProfitQuery = useMonthlySalesProfit(12);

  const isLoading = viewMode === 'weekly' ? weeklyQuery.isLoading : monthlyQuery.isLoading;
  const isError = viewMode === 'weekly' ? weeklyQuery.isError : monthlyQuery.isError;
  const data = viewMode === 'weekly' ? (weeklyQuery.data ?? []) : (monthlyQuery.data ?? []);

  // คำนวณค่ารวมสำหรับ KPI
  const totalIngredientCost = React.useMemo(() => {
    return data.reduce((sum, row) => sum + Number(row.total_ingredient_cost || 0), 0);
  }, [data]);

  const lastSalesProfit = React.useMemo(() => {
    const rows = salesProfitQuery.data || [];
    const last = rows.slice(-1)[0];
    return last ? { net_sales: Number(last.net_sales || 0), net_profit: Number(last.net_profit || 0) } : { net_sales: 0, net_profit: 0 };
  }, [salesProfitQuery.data]);

  const refetch = () => {
    if (viewMode === 'weekly') weeklyQuery.refetch();
    else monthlyQuery.refetch();
    salesProfitQuery.refetch();
  };

  return (
    <div className="space-y-5">
      {/* Header + controls */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <h1 className="text-xl sm:text-2xl font-bold text-primary">ต้นทุนวัตถุดิบเทียบกับกำไรสุทธิ</h1>
          <p className="text-sm text-muted-foreground mt-0.5">
            ติดตามแนวโน้มต้นทุนการซื้อวัตถุดิบ เทียบกับรายได้และกำไร
          </p>
        </div>
        <div className="flex items-center gap-2 sm:gap-3 flex-wrap">
          {/* View mode toggle */}
          <div className="inline-flex rounded-lg border border-border/50 bg-surface/40 p-0.5 self-start sm:self-auto">
            <button
              type="button"
              onClick={() => setViewMode('weekly')}
              className={cn(
                'inline-flex items-center gap-1.5 px-3 h-8 rounded-md text-xs sm:text-sm font-medium transition-colors',
                viewMode === 'weekly' ? 'bg-primary text-white shadow-sm' : 'text-primary/70 hover:bg-primary/5',
              )}
            >
              รายสัปดาห์
            </button>
            <button
              type="button"
              onClick={() => setViewMode('monthly')}
              className={cn(
                'inline-flex items-center gap-1.5 px-3 h-8 rounded-md text-xs sm:text-sm font-medium transition-colors',
                viewMode === 'monthly' ? 'bg-primary text-white shadow-sm' : 'text-primary/70 hover:bg-primary/5',
              )}
            >
              รายเดือน
            </button>
          </div>

          <Button variant="ghost" size="sm" onClick={refetch} aria-label="รีเฟรชข้อมูล">
            <RefreshCw className={`w-4 h-4 ${isLoading ? 'animate-spin' : ''}`} />
            <span className="hidden sm:inline ml-1">รีเฟรช</span>
          </Button>
        </div>
      </div>

      {/* KPI cards */}
      {isLoading ? (
        <DashboardSkeleton kpiCount={2} />
      ) : (
        <>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
            <KpiCard
              accent="primary"
              icon={<Package className="w-5 h-5" />}
              label={`ต้นทุนวัตถุดิบ (${viewMode === 'weekly' ? 'รวมทั้งหมด' : 'เฉลี่ยต่อเดือน'})`}
              value={bahtSign(totalIngredientCost)}
            />
            <KpiCard
              accent="action"
              icon={<TrendingUp className="w-5 h-5" />}
              label={`ยอดขายรายล่าสุด (${viewMode === 'weekly' ? 'สัปดาห์นี้' : 'เดือนนี้'})`}
              value={bahtSign(lastSalesProfit.net_sales)}
            />
            <KpiCard
              accent={lastSalesProfit.net_profit >= 0 ? 'success' : 'destructive'}
              icon={<TrendingUp className="w-5 h-5" />}
              label={`กำไรสุทธิรายล่าสุด (${viewMode === 'weekly' ? 'สัปดาห์นี้' : 'เดือนนี้'})`}
              value={bahtSign(lastSalesProfit.net_profit)}
            />
          </div>

          {isError && (
            <SectionError message={viewMode === 'weekly' ? weeklyQuery.error?.message : monthlyQuery.error?.message} onRetry={refetch} />
          )}

          {/* Data table */}
          <Card>
            <CardHeader>
              <CardTitle>{viewMode === 'weekly' ? 'แนวโน้มต้นทุนวัตถุดิบรายสัปดาห์' : 'แนวโน้มต้นทุนวัตถุดิบรายเดือน'}</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              {isLoading ? (
                <div className="animate-pulse space-y-2">
                  {[1, 2, 3, 4].map((i) => (
                    <div key={i} className="h-8 bg-primary/5 rounded" />
                  ))}
                </div>
              ) : data.length === 0 ? (
                <p className="text-sm text-muted-foreground text-center py-6">ไม่มีข้อมูลต้นทุนวัตถุดิบ</p>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="border-b border-border/50">
                        {viewMode === 'weekly' ? (
                          <>
                            <th className="text-left py-2 px-3 font-medium text-primary/70">สัปดาห์</th>
                            <th className="text-right py-2 px-3 font-medium text-primary/70">ต้นทุนวัตถุดิบ</th>
                            <th className="text-right py-2 px-3 font-medium text-primary/70">จำนวนวัสดุแยก</th>
                          </>
                        ) : (
                          <>
                            <th className="text-left py-2 px-3 font-medium text-primary/70">เดือน</th>
                            <th className="text-right py-2 px-3 font-medium text-primary/70">ต้นทุนวัตถุดิบ</th>
                            <th className="text-right py-2 px-3 font-medium text-primary/70">จำนวนวัสดุแยก</th>
                          </>
                        )}
                      </tr>
                    </thead>
                    <tbody>
                      {data.map((row, idx) => (
                        <tr key={idx} className="border-b border-border/30 hover:bg-primary/5 transition-colors">
                          {viewMode === 'weekly' ? (
                            <>
                              <td className="py-2 px-3 text-primary">{formatThaiDateRange((row as any).week_start_date, (row as any).week_end_date)}</td>
                              <td className="py-2 px-3 text-right font-semibold">{bahtSign(row.total_ingredient_cost)}</td>
                              <td className="py-2 px-3 text-right text-muted-foreground">{row.unique_ingredients_count || 0}</td>
                            </>
                          ) : (
                            <>
                              <td className="py-2 px-3 text-primary font-medium">{formatMonthShort((row as any).month_number || 0)}</td>
                              <td className="py-2 px-3 text-right font-semibold">{bahtSign(row.total_ingredient_cost)}</td>
                              <td className="py-2 px-3 text-right text-muted-foreground">{row.unique_ingredients_count || 0}</td>
                            </>
                          )}
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </CardContent>
          </Card>
        </>
      )}
    </div>
  );
}

export const dynamic = 'force-dynamic';
