"use client";

import * as React from 'react';
import { cn } from '@/lib/utils';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { TrendingUp, TrendingDown } from 'lucide-react';
import { baht, bahtSign, toNum, type DailyTrendRow } from '@/types/dashboard';

/**
 * TrendCard — lightweight CSS bar chart of per-day
 *   • net_sales (ยอดขาย)
 *   • net_profit (กำไรจากยอดขาย − ต้นทุนสินค้าขาย)
 *   • ingredient_cost (ต้นทุนซื้อวัตถุดิบ)
 *
 * เปลี่ยนจากรายเดือน (view_monthly_sales_profit) เป็นรายวัน
 * ตาม filter วันที่ที่ผู้ใช้เลือกใน dashboard
 *
 * หมายเหตุ: ต้นทุนของเสีย (เคลม) แสดงเป็น "hint" เพราะมีขนาดเล็กเทียบกับยอดขาย
 */
export interface TrendCardProps {
  rows: DailyTrendRow[];
  loading?: boolean;
  periodLabel?: string;
}

function dayShort(iso: string): string {
  if (!iso) return '';
  try {
    const d = new Date(iso + 'T00:00:00');
    return d.toLocaleDateString('th-TH', { day: '2-digit', month: 'short' });
  } catch {
    return iso;
  }
}

export function TrendCard({ rows, loading, periodLabel }: TrendCardProps) {
  const { sorted, cur, prev, deltaPct, maxValue, totalClaimCost } = React.useMemo(() => {
    const sorted = [...rows].sort((a, b) => a.date.localeCompare(b.date));
    const cur = sorted[sorted.length - 1] ?? null;
    const prev = sorted[sorted.length - 2] ?? null;
    const curSales = toNum(cur?.net_sales);
    const prevSales = toNum(prev?.net_sales);
    const deltaPct =
      prevSales > 0 ? Math.round(((curSales - prevSales) / prevSales) * 100) : null;
    // Scale bars relative to the largest of {sales, profit, ingredient} so all 3 fit
    const maxValue = Math.max(
      1,
      ...sorted.map((r) =>
        Math.max(toNum(r.net_sales), Math.abs(toNum(r.net_profit)), toNum(r.ingredient_cost)),
      ),
    );
    const totalClaimCost = sorted.reduce((s, r) => s + toNum(r.claim_cost), 0);
    return { sorted, cur, prev, deltaPct, maxValue, totalClaimCost };
  }, [rows]);

  const isEmpty = sorted.length === 0;

  return (
    <Card className="border-border/40">
      <CardHeader className="pb-3">
        <CardTitle className="flex items-center gap-2 text-base">
          แนวโน้มยอดขาย / กำไร / ต้นทุนวัตถุดิบ
        </CardTitle>
      </CardHeader>
      <CardContent className="pt-0">
        {/* Current vs previous day/period delta + total claim hint */}
        {!loading && cur && (
          <div className="mb-4 flex flex-wrap items-baseline gap-x-3 gap-y-1 text-sm">
            <span className="text-muted-foreground">
              {periodLabel || dayShort(cur.date)}
            </span>
            <span className="font-semibold text-primary">{bahtSign(cur.net_sales)}</span>
            {deltaPct !== null && (
              <span
                className={cn(
                  'inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium',
                  deltaPct >= 0
                    ? 'bg-success/15 text-success-dark'
                    : 'bg-destructive/15 text-destructive',
                )}
              >
                {deltaPct >= 0 ? (
                  <TrendingUp className="w-3 h-3" />
                ) : (
                  <TrendingDown className="w-3 h-3" />
                )}
                {deltaPct >= 0 ? '+' : ''}
                {deltaPct}% เทียบช่วงก่อนหน้า
              </span>
            )}
            {totalClaimCost > 0 && (
              <span className="text-xs text-muted-foreground">
                ต้นทุนของเสียรวม {bahtSign(totalClaimCost)}
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
          <p className="text-sm text-muted-foreground py-6 text-center">
            ยังไม่มีข้อมูลในช่วงวันที่เลือก
          </p>
        ) : (
          <div className="flex items-end gap-1.5 sm:gap-2 overflow-x-auto pb-1 min-h-[170px]">
            {sorted.map((m) => {
              const sales = toNum(m.net_sales);
              const profit = toNum(m.net_profit);
              const ing = toNum(m.ingredient_cost);
              const salesH = Math.round((sales / maxValue) * 130);
              const profitH = Math.round((Math.abs(profit) / maxValue) * 130);
              const ingH = Math.round((ing / maxValue) * 130);
              const isCur = cur ? m.date === cur.date : false;
              return (
                <div
                  key={m.date}
                  className="flex flex-col items-center gap-1 min-w-[40px] sm:min-w-[52px] flex-1"
                >
                  {/* Bars (3 columns) */}
                  <div className="flex items-end gap-0.5 h-32 w-full justify-center">
                    {/* sales bar */}
                    <div
                      className={cn(
                        'w-2 sm:w-2.5 rounded-t',
                        isCur ? 'bg-primary' : 'bg-primary/50',
                      )}
                      style={{ height: `${Math.max(salesH, 2)}px` }}
                      title={`ยอดขาย ${bahtSign(sales)}`}
                    />
                    {/* profit bar */}
                    <div
                      className={cn(
                        'w-2 sm:w-2.5 rounded-t',
                        profit >= 0
                          ? isCur
                            ? 'bg-success'
                            : 'bg-success/60'
                          : 'bg-destructive/70',
                      )}
                      style={{ height: `${Math.max(profitH, 2)}px` }}
                      title={`กำไร ${bahtSign(profit)}`}
                    />
                    {/* ingredient cost bar */}
                    <div
                      className={cn(
                        'w-2 sm:w-2.5 rounded-t',
                        isCur ? 'bg-action' : 'bg-action/50',
                      )}
                      style={{ height: `${Math.max(ingH, 2)}px` }}
                      title={`ต้นทุนวัตถุดิบ ${bahtSign(ing)}`}
                    />
                  </div>
                  {/* label */}
                  <div
                    className={cn(
                      'text-[9px] sm:text-[10px] font-medium whitespace-nowrap',
                      isCur ? 'text-primary' : 'text-muted-foreground',
                    )}
                  >
                    {dayShort(m.date)}
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {/* Legend */}
        {!loading && !isEmpty && (
          <div className="mt-3 flex items-center gap-3 sm:gap-4 text-xs text-muted-foreground flex-wrap">
            <span className="inline-flex items-center gap-1.5">
              <span className="w-2.5 h-2.5 rounded-sm bg-primary" /> ยอดขาย
            </span>
            <span className="inline-flex items-center gap-1.5">
              <span className="w-2.5 h-2.5 rounded-sm bg-success" /> กำไร
            </span>
            <span className="inline-flex items-center gap-1.5">
              <span className="w-2.5 h-2.5 rounded-sm bg-action" /> ต้นทุนวัตถุดิบ
            </span>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
