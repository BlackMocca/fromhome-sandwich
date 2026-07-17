"use client";

import * as React from 'react';
import { AlertCircle, RefreshCw } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';

/**
 * DashboardSkeleton — full-page loading skeleton for a dashboard page.
 * Renders N KPI-card skeletons + a few card skeletons.
 */
export function DashboardSkeleton({ kpiCount = 4 }: { kpiCount?: number }) {
  return (
    <>
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 mb-6">
        {Array.from({ length: kpiCount }).map((_, i) => (
          <div
            key={i}
            className="rounded-xl border border-border/40 bg-surface/50 p-4 sm:p-5 shadow-sm animate-pulse"
          >
            <div className="h-3 w-20 rounded bg-primary/10" />
            <div className="mt-3 h-8 w-28 rounded bg-primary/10" />
            <div className="mt-2 h-3 w-16 rounded bg-primary/5" />
          </div>
        ))}
      </div>
      <div className="space-y-4">
        {Array.from({ length: 2 }).map((_, i) => (
          <div key={i} className="h-48 rounded-xl border border-border/40 bg-surface/50 animate-pulse" />
        ))}
      </div>
    </>
  );
}

/**
 * SectionError — inline error block with a retry button.
 * Used inside individual cards when a query errors out, so the rest
 * of the dashboard stays visible.
 */
export function SectionError({
  title = 'โหลดข้อมูลไม่สำเร็จ',
  message,
  onRetry,
  className,
}: {
  title?: string;
  message?: string;
  onRetry?: () => void;
  className?: string;
}) {
  return (
    <div
      className={cn(
        'flex items-center gap-3 rounded-lg border border-destructive/30 bg-destructive/5 p-3 text-sm',
        className,
      )}
    >
      <AlertCircle className="w-5 h-5 text-destructive flex-shrink-0" />
      <div className="min-w-0 flex-1">
        <p className="font-medium text-destructive">{title}</p>
        {message && <p className="text-muted-foreground text-xs mt-0.5 truncate">{message}</p>}
      </div>
      {onRetry && (
        <Button variant="destructive" size="sm" onClick={onRetry} className="flex-shrink-0">
          <RefreshCw className="w-3.5 h-3.5 mr-1" /> ลองใหม่
        </Button>
      )}
    </div>
  );
}

/**
 * EmptyState — generic "no data" block.
 */
export function EmptyState({ message, className }: { message: string; className?: string }) {
  return (
    <div
      className={cn(
        'rounded-xl border border-border/40 bg-surface/40 p-10 text-center text-muted-foreground text-sm',
        className,
      )}
    >
      {message}
    </div>
  );
}
