"use client";

import * as React from 'react';
import { cn } from '@/lib/utils';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { baht, bahtSign, toNum, type ChannelSummary } from '@/types/dashboard';
import { Layers3 } from 'lucide-react';

/**
 * SalesByChannelCard — channel breakdown for the selected period.
 * One row per channel_code. On mobile is a vertical stack of compact
 * rows (each channel in its own card-ish block), on desktop a tidy
 * list with right-aligned metrics.
 *
 * The channel breakdown uses `net_sales` (after discounts) and
 * `net_profit` to match the KPI cards meaning.
 */
export interface SalesByChannelCardProps {
  channels: ChannelSummary[];
  loading?: boolean;
  periodLabel: string;
}

export function SalesByChannelCard({ channels, loading, periodLabel }: SalesByChannelCardProps) {
  const sorted = React.useMemo(
    () => [...channels].sort((a, b) => toNum(b.net_sales) - toNum(a.net_sales)),
    [channels],
  );

  const isEmpty = sorted.length === 0;
  const maxSales = Math.max(1, ...sorted.map((c) => toNum(c.net_sales)));

  return (
    <Card className="border-border/40">
      <CardHeader className="pb-3">
        <CardTitle className="flex items-center gap-2 text-base">
          <Layers3 className="w-4 h-4 text-primary/70" />
          สรุปตามช่องทางการขาย
          <span className="text-xs font-normal text-muted-foreground">({periodLabel})</span>
        </CardTitle>
      </CardHeader>
      <CardContent>
        {loading ? (
          <div className="space-y-2">
            {Array.from({ length: 3 }).map((_, i) => (
              <div key={i} className="h-12 rounded-lg bg-surface/70 animate-pulse" />
            ))}
          </div>
        ) : isEmpty ? (
          <p className="text-sm text-muted-foreground py-6 text-center">
            ไม่มีข้อมูลบิลในช่วงที่เลือก
          </p>
        ) : (
          <ul className="space-y-2">
            {sorted.map((c) => {
              const widthPct = Math.round((toNum(c.net_sales) / maxSales) * 100);
              const profit = toNum(c.net_profit);
              return (
                <li
                  key={c.channel_code}
                  className="rounded-lg border border-border/40 bg-surface/40 p-3"
                >
                  <div className="flex items-center justify-between gap-2">
                    <div className="flex items-center gap-2 min-w-0">
                      <span className="px-2 py-0.5 rounded bg-primary/10 text-xs font-mono font-semibold text-primary">
                        {c.channel_code}
                      </span>
                      <span className="text-xs text-muted-foreground truncate">
                        {c.order_count} บิล · {c.total_items} ชิ้น
                      </span>
                    </div>
                    <div className="flex items-center gap-3 text-xs">
                      <span className="font-semibold text-success-dark">
                        ยอดขาย {bahtSign(c.net_sales)}
                      </span>
                      <span
                        className={cn(
                          'font-semibold',
                          profit >= 0 ? 'text-success-dark' : 'text-destructive',
                        )}
                      >
                        กำไร {bahtSign(profit)}
                      </span>
                    </div>
                  </div>
                  {/* Relative sales bar — visual quick-scan */}
                  <div className="mt-2 h-1.5 w-full rounded-full bg-primary/10 overflow-hidden">
                    <div
                      className="h-full rounded-full bg-primary/60"
                      style={{ width: `${widthPct}%` }}
                      aria-hidden
                    />
                  </div>
                </li>
              );
            })}
          </ul>
        )}
      </CardContent>
    </Card>
  );
}
