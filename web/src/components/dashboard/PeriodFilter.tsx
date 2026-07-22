"use client";

import * as React from 'react';
import { cn } from '@/lib/utils';
import { CalendarDays, CalendarRange, CalendarCheck2 } from 'lucide-react';
import type { DashboardPeriod, DashboardDateRange } from '@/types/dashboard';

/**
 * PeriodFilter — controls the date range used by the dashboard queries.
 *
 * Three quick presets + a custom range using native <input type="date">
 * (zero deps, works great on mobile keyboards). Emits a normalized
 * { period, dateFrom, dateTo } shape consumed by the page (which maps
 * to the relevant React Query hooks).
 *
 * Layout: on mobile the presets wrap and the date inputs go full width;
 * on sm+ everything sits in a single right-aligned row.
 */

export interface PeriodFilterValue {
  period: DashboardPeriod;
  range: DashboardDateRange;
}

interface PeriodFilterProps {
  value: PeriodFilterValue;
  onChange: (value: PeriodFilterValue) => void;
  className?: string;
}

/* ─── helpers ─────────────────────────────────────────────── */
function todayISO(): string {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
}

function weekStartISO(d = new Date()): string {
  const date = new Date(d);
  const day = date.getDay(); // 0 = Sun, 1 = Mon, ..., 6 = Sat
  // Adjust to make Monday the start of the week (day === 1)
  const diff = date.getDate() - day + (day === 0 ? -6 : 1);
  const monday = new Date(date.setDate(diff));
  return `${monday.getFullYear()}-${String(monday.getMonth() + 1).padStart(2, '0')}-${String(monday.getDate()).padStart(2, '0')}`;
}

function weekEndISO(d = new Date()): string {
  const monISO = weekStartISO(d);
  const [y, m, day] = monISO.split('-').map(Number);
  const monday = new Date(y, m - 1, day);
  const sunday = new Date(monday);
  sunday.setDate(sunday.getDate() + 6);
  return `${sunday.getFullYear()}-${String(sunday.getMonth() + 1).padStart(2, '0')}-${String(sunday.getDate()).padStart(2, '0')}`;
}

function monthStartISO(d = new Date()): string {
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-01`;
}

function monthEndISO(d = new Date()): string {
  const end = new Date(d.getFullYear(), d.getMonth() + 1, 0);
  return `${end.getFullYear()}-${String(end.getMonth() + 1).padStart(2, '0')}-${String(end.getDate()).padStart(2, '0')}`;
}

export function defaultPeriodFilter(period: DashboardPeriod = 'today'): PeriodFilterValue {
  const today = todayISO();
  if (period === 'week') {
    return { period, range: { dateFrom: weekStartISO(), dateTo: weekEndISO() } };
  }
  if (period === 'month') {
    return { period, range: { dateFrom: monthStartISO(), dateTo: monthEndISO() } };
  }
  // 'today' and 'range' default to today. range is editable by the user.
  return { period, range: { dateFrom: today, dateTo: today } };
}

/* ─── presets ─────────────────────────────────────────────── */
const PRESETS: { key: DashboardPeriod; label: string; icon: React.ReactNode }[] = [
  { key: 'today', label: 'วันนี้', icon: <CalendarCheck2 className="w-4 h-4" /> },
  { key: 'week', label: 'สัปดาห์นี้', icon: <CalendarDays className="w-4 h-4" /> },
  { key: 'month', label: 'เดือนนี้', icon: <CalendarRange className="w-4 h-4" /> },
  { key: 'range', label: 'เลือกช่วง', icon: <CalendarRange className="w-4 h-4" /> },
];

export function PeriodFilter({ value, onChange, className }: PeriodFilterProps) {
  const setPreset = (p: DashboardPeriod) => {
    onChange(defaultPeriodFilter(p));
  };

  return (
    <div
      className={cn(
        'flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-end',
        className,
      )}
    >
      {/* Preset buttons */}
      <div className="inline-flex rounded-lg border border-border/50 bg-surface/40 p-0.5 self-start sm:self-auto">
        {PRESETS.map((preset) => {
          const active = value.period === preset.key;
          return (
            <button
              key={preset.key}
              type="button"
              onClick={() => setPreset(preset.key)}
              className={cn(
                'inline-flex items-center gap-1.5 px-3 h-8 rounded-md text-xs sm:text-sm font-medium transition-colors',
                active
                  ? 'bg-primary text-white shadow-sm'
                  : 'text-primary/70 hover:bg-primary/5',
              )}
            >
              {preset.icon}
              {preset.label}
            </button>
          );
        })}
      </div>

      {/* Custom range inputs — only when `range` selected */}
      {value.period === 'range' && (
        <div className="flex flex-col xs:flex-row gap-2 sm:items-center self-start sm:self-auto">
          <FromToInputs
            dateFrom={value.range.dateFrom}
            dateTo={value.range.dateTo}
            onChange={(r) => onChange({ period: 'range', range: r })}
          />
        </div>
      )}
    </div>
  );
}

/* ─── From / To date inputs ───────────────────────────────── */
function FromToInputs({
  dateFrom,
  dateTo,
  onChange,
}: {
  dateFrom: string;
  dateTo: string;
  onChange: (r: DashboardDateRange) => void;
}) {
  return (
    <div className="flex items-center gap-1.5">
      <input
        type="date"
        aria-label="จากวันที่"
        value={dateFrom}
        max={dateTo || undefined}
        onChange={(e) => onChange({ dateFrom: e.target.value, dateTo })}
        className="h-8 rounded-md border border-border/50 bg-white px-2 text-xs sm:text-sm text-primary focus:outline-none focus:ring-2 focus:ring-action"
      />
      <span className="text-muted-foreground text-xs px-0.5">ถึง</span>
      <input
        type="date"
        aria-label="ถึงวันที่"
        value={dateTo}
        min={dateFrom || undefined}
        onChange={(e) => onChange({ dateFrom, dateTo: e.target.value })}
        className="h-8 rounded-md border border-border/50 bg-white px-2 text-xs sm:text-sm text-primary focus:outline-none focus:ring-2 focus:ring-action"
      />
    </div>
  );
}
