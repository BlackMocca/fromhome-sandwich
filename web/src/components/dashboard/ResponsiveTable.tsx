"use client";

import * as React from 'react';
import { cn } from '@/lib/utils';
import {
  Table,
  TableHeader,
  TableBody,
  TableRow,
  TableHead,
  TableCell,
} from '@/components/ui/table';

/**
 * ResponsiveTable
 * ---------------
 * Renders a real <table> on md+ (>= 768px) for scannable columns,
 * and a **stacked card list** on mobile (< md) so every row stays
 * readable without horizontal scrolling. This keeps the Dashboard
 * "อ่านข้อมูลได้ง่ายบนทั้ง mobile และ desktop" (requirement 2.1).
 *
 * Column model:
 *  - key          : unique row field key
 *  - header       : table header label (desktop)
 *  - align        : 'left' | 'right' | 'center' (both layouts)
 *  - isHeader     : marks the "primary" column. On mobile this value
 *                   becomes the card title and is shown bold; on
 *                   desktop it is rendered normally.
 *  - hideOnMobile : omit from the mobile detail list (e.g. when the
 *                   same value is already the card title).
 *  - mobileLabel  : prefix label shown on mobile for that field
 *                   (e.g. "ยอดขาย"). Defaults to the header.
 */

export type ColumnAlign = 'left' | 'right' | 'center';

export interface Column<T> {
  key: string;
  header: React.ReactNode;
  align?: ColumnAlign;
  isHeader?: boolean;
  hideOnMobile?: boolean;
  mobileLabel?: React.ReactNode;
  render: (row: T, index: number) => React.ReactNode;
}

export interface ResponsiveTableProps<T> {
  columns: Column<T>[];
  rows: T[];
  /** Stable row key — defaults to index. */
  rowKey?: (row: T, index: number) => React.Key;
  /** Optional badge rendered at the far-left of each mobile card. */
  renderMobileBadge?: (row: T, index: number) => React.ReactNode;
  empty?: React.ReactNode;
  /** Desktop table max-height for scroll (e.g. "max-h-96"). */
  desktopScrollClass?: string;
  className?: string;
}

const alignClass: Record<ColumnAlign, string> = {
  left: 'text-left',
  right: 'text-right',
  center: 'text-center',
};

export function ResponsiveTable<T>({
  columns,
  rows,
  rowKey,
  renderMobileBadge,
  empty = 'ไม่มีข้อมูล',
  desktopScrollClass,
  className,
}: ResponsiveTableProps<T>) {
  const isEmpty = rows.length === 0;

  /* ── Desktop: real table (hidden on mobile) ── */
  const desktop = (
    <Table className={cn('hidden md:table', className)}>
      <TableHeader>
        <TableRow className="border-border/40">
          {columns.map((col) => (
            <TableHead key={col.key} className={cn(alignClass[col.align ?? 'left'])}>
              {col.header}
            </TableHead>
          ))}
        </TableRow>
      </TableHeader>
      <TableBody>
        {isEmpty ? (
          <TableRow>
            <TableCell colSpan={columns.length} className="text-center text-muted-foreground py-10">
              {empty}
            </TableCell>
          </TableRow>
        ) : (
          rows.map((row, i) => (
            <TableRow key={rowKey ? rowKey(row, i) : i}>
              {columns.map((col) => (
                <TableCell
                  key={col.key}
                  className={cn(
                    alignClass[col.align ?? 'left'],
                    col.isHeader && 'font-medium text-primary',
                  )}
                >
                  {col.render(row, i)}
                </TableCell>
              ))}
            </TableRow>
          ))
        )}
      </TableBody>
    </Table>
  );

  /* ── Mobile: stacked cards (hidden on md+) ── */
  const mobile = (
    <div className={cn('md:hidden space-y-3', className)}>
      {isEmpty ? (
        <div className="rounded-xl border border-border/40 bg-surface/50 p-6 text-center text-muted-foreground text-sm">
          {empty}
        </div>
      ) : (
        rows.map((row, i) => {
          const headerCol = columns.find((c) => c.isHeader);
          const badge = renderMobileBadge?.(row, i);
          return (
            <div
              key={rowKey ? rowKey(row, i) : i}
              className="rounded-xl border border-border/40 bg-white p-3.5 shadow-sm"
            >
              <div className="flex items-start gap-3">
                {badge && <div className="flex-shrink-0 pt-0.5">{badge}</div>}
                <div className="min-w-0 flex-1">
                  {headerCol && (
                    <div className="font-semibold text-primary truncate">
                      {headerCol.render(row, i)}
                    </div>
                  )}
                  <dl className="mt-2 space-y-1.5">
                    {columns
                      .filter((c) => !c.isHeader && !c.hideOnMobile)
                      .map((col) => (
                        <div
                          key={col.key}
                          className={cn(
                            'flex items-baseline justify-between gap-3 text-sm',
                          )}
                        >
                          <dt className="flex-shrink-0 text-muted-foreground text-xs">
                            {col.mobileLabel ?? col.header}
                          </dt>
                          <dd
                            className={cn(
                              'min-w-0 text-right font-medium text-primary/90',
                              col.align === 'right' && 'text-right',
                              col.align === 'center' && 'text-center',
                            )}
                          >
                            {col.render(row, i)}
                          </dd>
                        </div>
                      ))}
                  </dl>
                </div>
              </div>
            </div>
          );
        })
      )}
    </div>
  );

  return (
    <div className={desktopScrollClass ? cn('md:overflow-y-auto', desktopScrollClass) : undefined}>
      {desktop}
      {mobile}
    </div>
  );
}
