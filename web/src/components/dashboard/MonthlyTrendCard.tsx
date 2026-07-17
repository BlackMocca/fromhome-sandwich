"use client";

import * as React from 'react';
import { cn } from '@/lib/utils';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { TrendingUp, TrendingDown } from 'lucide-react';
import { baht, bahtSign, toNum, type MonthlySalesRow } from '@/types/dashboard';

/* Thai month labels */
const TH_MONTHS = [
  'ม.ค.', 'ก.พ.', 'มี.ค.', 'เม.ย.', 'พ.ค.', 'มิ.ย.',
  'ก.ค.', 'ส.ค.', 'ก.ย.', 'ต.ค.', 'พ.ย.', 'ธ.ค.',
];
function monthShort(m: number): string {
  return TH_MONTHS[m - 1] ?? `${m}`;
}

/**
 * MonthlyTrendCard — lightweight CSS bar chart of net_sales & net_profit
 * per month (Requirement §4.2). Avoids a chart library: each month is
 * a column pair of two bars. Also shows current vs previous month delta.
 *
 * Designed mobile-first: bars shrink for small screens while staying
 * readable thanks to flex-wrap and min-widths.
 */
export interface MonthlyTrendCardProps {
  months: MonthlySalesRow[];
  loading?: boolean;
}

export function MonthlyTrendCard({ months, loading }: MonthlyTrendCardProps) {
  const { sorted, cur, prev, deltaPct, maxSales } = React.useMemo(() => {
    const sorted = [...months].sort((a, b) => a.bill_month.localeCompare(b.bill_month));
    const cur = sorted[sorted.length - 1] ?? null;
    const prev = sorted[sorted.length - 2] ?? null;
    const curSales = toNum(cur?.net_sales);
    const prevSales = toNum(prev?.net_sales);
    const deltaPct = prevSales > 0 ? Math.round(((curSales - prevSales) / prevSales) * 100) : null;
    const maxSales = Math.max(1, ...sorted.map((m) => toNum(m.net_sales)));
    return { sorted, cur, prev, deltaPct, maxSales };
  }, [months]);

  const isEmpty = sorted.length === 0;

  return (
    <Card className="border-border/40">
      <CardHeader className="pb-3">
        <CardTitle className="flex items-center gap-2 text-base">
          แนวโน้มยอดขาย/กำไร (รายเดือน)
        </CardTitle>
      </CardHeader>
      <CardContent className="pt-0">
        {/* Current vs previous month delta */}
        {!loading && cur && (
          <div className="mb-4 flex flex-wrap items-baseline gap-x-3 gap-y-1 text-sm">
            <span className="text-muted-foreground">
              {monthShort(cur.month)} {cur.year}
            </span>
            <span className="font-semibold text-primary">{bahtSign(cur.net_sales)}</span>
            {deltaPct !== null && (
              <span
                className={cn(
                  'inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium',
                  deltaPct >= 0 ? 'bg-success/15 text-success-dark' : 'bg-destructive/15 text-destructive',
                )}
              >
                {deltaPct >= 0 ? <TrendingUp className="w-3 h-3" /> : <TrendingDown className="w-3 h-3" />}
                {deltaPct >= 0 ? '+' : ''}
                {deltaPct}% เทียบเดือนก่อนหน้า
              </span>
            )}
          </div>
        )}

        {loading ? (
          <div className="space-y-2">
            {Array.from({ length: 6 }).map((_, i) => (
              <div key={i} className="h-24 rounded-lg bg-surface/70 animate-pulse" />
            ))}
          </div>
        ) : isEmpty ? (
          <p className="text-sm text-muted-foreground py-6 text-center">ยังไม่มีข้อมูลยอดขายรายเดือน</p>
        ) : (
          <div className="flex items-end gap-2 sm:gap-3 overflow-x-auto pb-1 min-h-[150px]">
            {sorted.map((m) => {
              const sales = toNum(m.net_sales);
              const profit = toNum(m.net_profit);
              const salesH = Math.round((sales / maxSales) * 110); // px scale
              const profitH = Math.round((Math.abs(profit) / maxSales) * 110);
              const isCur = cur ? m.bill_month === cur.bill_month : false;
              return (
                <div
                  key={m.bill_month}
                  className={cn(
                    'flex flex-col items-center gap-1 min-w-[44px] sm:min-w-[56px] flex-1',
                  )}
                >
                  {/* Bars */}
                  <div className="flex items-end gap-0.5 h-24 w-full justify-center">
                    {/* sales bar */}
                    <div
                      className={cn(
                        'w-2.5 sm:w-3 rounded-t',
                        isCur ? 'bg-primary' : 'bg-primary/50',
                      )}
                      style={{ height: `${Math.max(salesH, 2)}px` }}
                      title={`ยอดขาย ${bahtSign(sales)}`}
                    />
                    {/* profit bar */}
                    <div
                      className={cn(
                        'w-2.5 sm:w-3 rounded-t',
                        profit >= 0 ? (isCur ? 'bg-success' : 'bg-success/60') : 'bg-destructive/70',
                      )}
                      style={{ height: `${Math.max(profitH, 2)}px` }}
                      title={`กำไร ${bahtSign(profit)}`}
                    />
                  </div>
                  {/* label */}
                  <div
                    className={cn(
                      'text-[10px] sm:text-xs font-medium',
                      isCur ? 'text-primary' : 'text-muted-foreground',
                    )}
                  >
                    {monthShort(m.month)}
                  </div>
                  <div className="text-[9px] text-muted-foreground/70 sm:hidden">{baht(sales)}</div>
                </div>
              );
            })}
          </div>
        )}

        {/* Legend */}
        {!loading && !isEmpty && (
          <div className="mt-3 flex items-center gap-4 text-xs text-muted-foreground">
            <span className="inline-flex items-center gap-1.5">
              <span className="w-2.5 h-2.5 rounded-sm bg-primary" /> ยอดขาย
            </span>
            <span className="inline-flex items-center gap-1.5">
              <span className="w-2.5 h-2.5 rounded-sm bg-success" /> กำไร
            </span>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
