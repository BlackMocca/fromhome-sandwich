"use client";

import * as React from 'react';
import { cn } from '@/lib/utils';

/**
 * KpiCard — single statistic tile used at the top of the dashboards.
 * Warm & Natural theme: white surface, rounded-xl, subtle tint by accent.
 *
 * Responsive: stacks 1-per-row on mobile, grids on sm/lg (the grid is
 * controlled by the parent — the card itself just fills its cell).
 */

export type KpiAccent = 'primary' | 'action' | 'success' | 'destructive';

export interface KpiCardProps {
  /** lucide icon element (optional) */
  icon?: React.ReactNode;
  label: string;
  /** Already-formatted display string (e.g. "฿12,340" or "42") */
  value: string;
  /** Optional sub line (e.g. "+8% vs last month") */
  hint?: React.ReactNode;
  accent?: KpiAccent;
  className?: string;
}

const accentWrap: Record<KpiAccent, string> = {
  primary: 'bg-primary/5 border-primary/20',
  action: 'bg-action/10 border-action/30',
  success: 'bg-success/10 border-success/25',
  destructive: 'bg-destructive/10 border-destructive/25',
};

const accentValue: Record<KpiAccent, string> = {
  primary: 'text-primary',
  action: 'text-action-dark',
  success: 'text-success-dark',
  destructive: 'text-destructive',
};

const accentIconWrap: Record<KpiAccent, string> = {
  primary: 'bg-primary/15 text-primary',
  action: 'bg-action/20 text-primary',
  success: 'bg-success/15 text-success',
  destructive: 'bg-destructive/15 text-destructive',
};

export function KpiCard({
  icon,
  label,
  value,
  hint,
  accent = 'primary',
  className,
}: KpiCardProps) {
  return (
    <div
      className={cn(
        'rounded-xl border p-4 sm:p-5 shadow-sm transition-shadow hover:shadow-md',
        accentWrap[accent],
        className,
      )}
    >
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <p className="text-xs sm:text-sm font-medium text-primary/70 truncate uppercase tracking-wide">
            {label}
          </p>
          <p
            className={cn(
              'mt-1 sm:mt-2 text-2xl sm:text-3xl font-bold leading-tight break-words',
              accentValue[accent],
            )}
          >
            {value}
          </p>
          {hint && <div className="mt-1 text-xs text-muted-foreground">{hint}</div>}
        </div>
        {icon && (
          <span
            className={cn(
              'flex-shrink-0 inline-flex h-10 w-10 sm:h-11 sm:w-11 items-center justify-center rounded-lg',
              accentIconWrap[accent],
            )}
          >
            {icon}
          </span>
        )}
      </div>
    </div>
  );
}

/* ─── Skeleton (loading) ─────────────────────────────────── */
export function KpiCardSkeleton({ className }: { className?: string }) {
  return (
    <div
      className={cn(
        'rounded-xl border border-border/40 bg-surface/50 p-4 sm:p-5 shadow-sm animate-pulse',
        className,
      )}
    >
      <div className="h-3 w-20 rounded bg-primary/10" />
      <div className="mt-3 h-8 w-28 rounded bg-primary/10" />
      <div className="mt-2 h-3 w-16 rounded bg-primary/5" />
    </div>
  );
}
