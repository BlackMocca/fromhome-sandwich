"use client"

import * as React from "react"
import { ChevronLeft, ChevronRight } from "lucide-react"
import { DayPicker, type DayPickerProps } from "react-day-picker"
import { th } from "react-day-picker/locale"
import { format } from "date-fns"

import { cn } from "@/lib/utils"

export interface CalendarProps extends Omit<DayPickerProps, 'selected' | 'onSelect'> {
  selectedDate?: string;
  onSelect: (date: string) => void;
}

function Calendar({
  className,
  classNames,
  showOutsideDays = true,
  selectedDate,
  onSelect,
  ...props
}: CalendarProps) {
  const getSelected = (): Date | undefined => {
    if (!selectedDate) return undefined;
    try {
      const [year, month, day] = selectedDate.split('-').map(Number);
      return new Date(year, month - 1, day);
    } catch {
      return undefined;
    }
  };

  const handleSelect = (selected: Date | undefined, triggerDate: Date) => {
    let date: Date | undefined;
    if (selected instanceof Date) {
      date = selected;
    } else if (triggerDate instanceof Date) {
      date = triggerDate;
    }

    if (!date) return;

    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    onSelect(`${year}-${month}-${day}`);
  };

  return (
    <DayPicker
      showOutsideDays={showOutsideDays}
      className={cn("p-3", className)}
      locale={th}
      formatters={{
        formatCaption: (month) => {
          const buddhistYear = month.getFullYear() + 543
          return `${format(month, "LLLL", { locale: th })} ${buddhistYear}`
        },
      }}
      components={{
        IconLeft: ({ ...props }) => <ChevronLeft className="h-4 w-4" {...props} />,
        IconRight: ({ ...props }) => <ChevronRight className="h-4 w-4" {...props} />,
      }}
      mode="single"
      selected={getSelected()}
      onSelect={(selected, triggerDate) => handleSelect(selected, triggerDate)}
      {...(props as any)}
    />
  )
}

Calendar.displayName = "Calendar"

export { Calendar }
