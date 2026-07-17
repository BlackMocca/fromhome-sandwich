"use client";

import * as React from 'react';
import { cn } from '@/lib/utils';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { ResponsiveTable, type Column } from '@/components/dashboard/ResponsiveTable';
import { baht, bahtSign, toNum, type TopProductRow } from '@/types/dashboard';

/**
 * TopProductsTable — best-sellers ranking with mobile/desktop support.
 *
 * Columns (desktop): rank · สินค้า · จำนวน · รายได้ · กำไร · %กำไร
 * Mobile: a card per product with the rank badge, name as title and
 * the rest as label/value rows.
 *
 * The caller passes already-fetched rows (sorted by total_quantity desc
 * by the DB). We optionally accept `limit` to slice top-N.
 */

export interface TopProductsTableProps {
  products: TopProductRow[];
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

export function TopProductsTable({
  products,
  loading,
  limit,
  title = 'สินค้าขายดี',
  emptyText = 'ยังไม่มีข้อมูลการขาย',
}: TopProductsTableProps) {
  const rows = React.useMemo(() => {
    const ranked = products.map((p, i) => ({ ...p, rank: i + 1 }));
    return limit ? ranked.slice(0, limit) : ranked;
  }, [products, limit]);

  const columns: Column<TopProductRow>[] = [
    {
      key: 'rank',
      header: 'อันดับ',
      align: 'center',
      hideOnMobile: true,
      render: (row) => <RankBadge rank={row.rank ?? 0} />,
    },
    {
      key: 'product_name',
      header: 'สินค้า',
      align: 'left',
      isHeader: true,
      render: (row) => <span className="truncate max-w-[220px] inline-block">{row.product_name}</span>,
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
    {
      key: 'total_profit',
      header: 'กำไร',
      align: 'right',
      render: (row) => {
        const p = toNum(row.total_profit);
        return (
          <span className={cn('font-semibold', p >= 0 ? 'text-success-dark' : 'text-destructive')}>
            {bahtSign(p)}
          </span>
        );
      },
    },
    {
      key: 'profit_margin',
      header: '%กำไร',
      align: 'right',
      render: (row) => {
        const m = toNum(row.profit_margin);
        return (
          <span
            className={cn(
              'inline-flex items-center px-1.5 py-0.5 rounded text-xs font-medium',
              m >= 40 ? 'bg-success/15 text-success-dark' : m >= 15 ? 'bg-action/20 text-primary' : 'bg-surface text-muted-foreground',
            )}
          >
            {m.toFixed(1)}%
          </span>
        );
      },
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
          <ResponsiveTable<TopProductRow>
            columns={columns}
            rows={rows}
            rowKey={(r) => `${r.product_id ?? 'null'}-${r.product_name}`}
            renderMobileBadge={(row) => <RankBadge rank={row.rank ?? 0} />}
            empty={emptyText}
          />
        )}
      </CardContent>
    </Card>
  );
}
