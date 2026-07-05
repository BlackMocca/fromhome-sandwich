'use client';

import * as React from 'react';
import { cn } from '@/lib/utils';

// ─── Types ───────────────────────────────────────────────
export type ToggleSwitchSize = 'sm' | 'md' | 'lg';

export type ToggleSwitchOnChange = (next: boolean) => void;

interface ToggleSwitchProps extends Omit<React.ButtonHTMLAttributes<HTMLButtonElement>, 'size' | 'onToggle'> {
  on?: boolean;
  defaultOn?: boolean;
  size?: ToggleSwitchSize;
  onToggle?: ToggleSwitchOnChange;
}

// ─── Base classes ────────────────────────────────────────
const baseClasses =
  'inline-flex items-center justify-center ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring disabled:pointer-events-none disabled:opacity-50 select-none';

// ─── Sizes (track width, knob size) ─────
const sizes: Record<ToggleSwitchSize, { track: string; knob: number; translateX: number }> = {
  // translateX = ระยะที่วงกลมต้องเลื่อนไปทางขวา
  // สูตร: left(3) + translateX + knobWidth = trackWidth
  sm: { track: 'w-[40px] h-[26px]', knob: 20, translateX: 17 },   // 3 + 17 + 20 = 40
  md: { track: 'w-[52px] h-[30px]', knob: 24, translateX: 25 },    // 3 + 25 + 24 = 52
  lg: { track: 'w-[64px] h-[34px]', knob: 28, translateX: 33 },    // 3 + 33 + 28 = 64
};

// ─── Component ───────────────────────────────────────────
export function ToggleSwitch({
  on,
  defaultOn = false,
  onToggle,
  size = 'md',
  className,
  children,
  ...props
}: ToggleSwitchProps) {
  // Handle controlled vs uncontrolled state
  const isControlled = on !== undefined;
  const [state, setState] = React.useState(defaultOn);

  const isActive = isControlled ? on : state;

  return (
    <div className="inline-flex items-center gap-3">
      {/* The Button Track */}
      <button
        role="switch"
        aria-checked={isActive}
        onClick={() => {
          if (!isControlled) setState(prev => !prev);
          onToggle?.(!isActive); // ใช้ onToggle ที่ destructured มาแล้ว รับ boolean ได้โดยตรง
        }}
        disabled={props.disabled}
        className={cn(
          baseClasses,
          'relative rounded-full transition-colors duration-200 ease-in-out',

          // Background colors (On/Off)
          isActive ? 'bg-[#4ade80]' : 'bg-[#E5E7EB]',
          isActive && !props.disabled && 'hover:bg-[#3cc173]',

          sizes[size].track,
          className,
        )}
        {...props}
      >
        {/* The Sliding Knob — เลื่อนด้วย transform: translate() */}
        <span
          aria-hidden="true"
          className={cn(
            'absolute left-[3px] rounded-full bg-white shadow-md w-[var(--knob-w)] h-[var(--knob-w)]',
            'transition-transform duration-500 ease-in-out',
          )}
          style={{
            '--knob-w': `${sizes[size].knob}px`,
            top: '50%',
            transform: `translateY(-50%) translateX(${isActive ? (sizes[size].translateX - 3) : 0}px)`,
          } as React.CSSProperties}
        />

        {/* Label (optional text inside the track) */}
        {children && (
          <span className="absolute inset-0 flex items-center justify-center text-[10px] font-semibold uppercase tracking-wider pointer-events-none">
            {/* Add custom label content if needed */}
          </span>
        )}
      </button>

      {/* Right Label (iOS style) */}
      {children && (
        <span className="text-sm font-medium text-zinc-600 select-none pointer-events-none">
          {isActive ? 'เปิดใช้งาน' : 'ปิดใช้งาน'}
        </span>
      )}
    </div>
  );
}

export default ToggleSwitch;
