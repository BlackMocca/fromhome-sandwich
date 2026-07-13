"use client"

import * as React from "react"
import { Calendar as CalendarIcon, ChevronDown } from "lucide-react"
import { cn } from "@/lib/utils"
import { Calendar } from "@/components/ui/calendar"

const THAI_MONTHS = [
  'ม.ค.', 'ก.พ.', 'มี.ค.', 'เม.ย.', 'พ.ค.', 'มิ.ย.',
  'ก.ค.', 'ส.ค.', 'ก.ย.', 'ต.ค.', 'พ.ย.', 'ธ.ค.',
]

const THAI_DAYS = ['อา.', 'จ.', 'อ.', 'พ.', 'พฤ.', 'ศ.', 'ส.']

function formatThaiDate(isoDate: string): string {
  if (!isoDate) return ''
  const [year, month, day] = isoDate.split('-').map(Number)
  const date = new Date(year, month - 1, day)
  const dayName = THAI_DAYS[date.getDay()]
  const monthName = THAI_MONTHS[month - 1]
  const buddhistYear = year + 543
  return `${day} ${monthName} ${buddhistYear}`
}

export interface InputDateProps {
  value?: string
  onValueChange?: (date: string) => void
  placeholder?: string
  className?: string
  disabled?: boolean
}

function InputDate({
  value = "",
  onValueChange,
  placeholder = "เลือกวันที่",
  className,
  disabled,
}: InputDateProps) {
  const [open, setOpen] = React.useState(false)

  return (
    <div className={cn("relative", className)}>
      <button
        type="button"
        disabled={disabled}
        onClick={() => setOpen(!open)}
        className={cn(
          "flex h-10 w-full items-center justify-between gap-2 rounded-lg border border-border bg-surface px-3 py-2 text-sm text-left font-normal",
          "hover:bg-accent transition-colors",
          "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-action",
          "disabled:opacity-50 disabled:cursor-not-allowed",
          !value && "text-muted-foreground"
        )}
      >
        <span className="flex items-center gap-2 truncate">
          <CalendarIcon className="h-4 w-4 shrink-0 text-muted-foreground" />
          {value ? formatThaiDate(value) : placeholder}
        </span>
        <ChevronDown className={cn("h-4 w-4 shrink-0 text-muted-foreground transition-transform", open && "rotate-180")} />
      </button>

      {open && (
        <div className="absolute z-50 mt-1 bg-white border rounded-md shadow-lg p-2 sm:p-3 left-0">
          <Calendar
            selectedDate={value}
            onSelect={(date) => {
              onValueChange?.(date || new Date().toISOString().split('T')[0])
              setOpen(false)
            }}
            showOutsideDays={false}
          />
        </div>
      )}
    </div>
  )
}

InputDate.displayName = "InputDate"

export { InputDate, formatThaiDate }
