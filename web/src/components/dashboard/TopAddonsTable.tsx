"use client";

import * as React from 'react';
import { cn } from '@/lib/utils';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { ResponsiveTable, type Column } from '@/components/dashboard/ResponsiveTable';
import { bahtSign, toNum, type TopAddonRow } from '@/types/dashboard';

/**
 * TopAddonsTable — best-selling add-ons / product options ranking
 * with mobile/desktop support.
 *
 * Columns (desktop): rank · ตัวเลือก · จำนวน · บิล · รายได้
 * Mobile: a card per add-on with the rank badge, name as title and
 * the rest as label/value rows.
 *
 * Add-ons have no cost snapshot, so only quantity / revenue are shown
 * (unlike TopProductsTable which also shows profit & margin).
 *
 * The caller passes already-fetched rows (sorted by total_quantity desc
 * by the DB). We optionally accept `limit` to slice top-N.
 */

export interface TopAddonsTableProps {
  addons: TopAddonRow[];
  loading?: boolean;
  /** Show only the first N (after rank assignment). */
  limit?: number;
  title?: string;
  emptyText?: string;
}

/* Rank medal badges for the top 3 */
function RankBadge({ rank }: { rank: number }) {
  const styles =
    rank === 1
      ? 'bg-action text-primary'
      : rank === 2
      ? 'bg-primary/15 text-primary'
      : rank === 3
      ? 'bg-success/20 text-success-dark'
      : 'bg-surface text-muted-foreground';
  return (
    <span
      className={cn(
        'inline-flex h-7 w-7 items-center justify-center rounded-full text-xs font-bold',
        styles,
      )}
    >
      {rank}
    </span>
  );
}

export function TopAddonsTable({
  addons,
  loading,
  limit,
  title = 'ตัวเลือกขายดี',
  emptyText = 'ยังไม่มีข้อมูลการขาย',
}: TopAddonsTableProps) {
  const rows = React.useMemo(() => {
    const ranked = addons.map((a, i) => ({ ...a, rank: i + 1 }));
    return limit ? ranked.slice(0, limit) : ranked;
  }, [addons, limit]);

  const columns: Column<TopAddonRow>[] = [
    {
      key: 'rank',
      header: 'อันดับ',
      align: 'center',
      hideOnMobile: true,
      render: (row) => <RankBadge rank={row.rank ?? 0} />,
    },
    {
      key: 'addon_name',
      header: 'ตัวเลือก',
      align: 'left',
      isHeader: true,
      render: (row) => <span className="truncate max-w-[220px] inline-block">{row.addon_name}</span>,
    },
    {
      key: 'total_quantity',
      header: 'จำนวนขาย',
      align: 'right',
      render: (row) => `${toNum(row.total_quantity)} ชิ้น`,
    },
    {
      key: 'order_count',
      header: 'บิล',
      align: 'right',
      hideOnMobile: true,
      render: (row) => toNum(row.order_count),
    },
    {
      key: 'total_revenue',
      header: 'รายได้',
      align: 'right',
      render: (row) => <span className="font-semibold text-primary">{bahtSign(row.total_revenue)}</span>,
    },
  ];

  return (
    <Card className="border-border/40">
      <CardHeader className="pb-3">
        <CardTitle className="text-base">{title}</CardTitle>
      </CardHeader>
      <CardContent className="pt-0">
        {loading ? (
          <div className="space-y-2 py-2">
            {Array.from({ length: 5 }).map((_, i) => (
              <div key={i} className="h-12 rounded-lg bg-surface/70 animate-pulse md:table-row" />
            ))}
          </div>
        ) : (
          <ResponsiveTable<TopAddonRow>
            columns={columns}
            rows={rows}
            rowKey={(r) => `${r.addon_id ?? 'null'}-${r.addon_name}`}
            renderMobileBadge={(row) => <RankBadge rank={row.rank ?? 0} />}
            empty={emptyText}
          />
        )}
      </CardContent>
    </Card>
  );
}
