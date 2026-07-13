"use client"

import * as React from "react"

import { cn } from "@/lib/utils"

export interface PopoverProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  children: React.ReactNode;
}

export function Popover({ open, onOpenChange, children }: PopoverProps) {
  return <>{children}</>
}

export function PopoverTrigger({ children, ...props }: React.ButtonHTMLAttributes<HTMLButtonElement>) {
  return (
    <button type="button" {...props}>
      {children}
    </button>
  )
}

export interface PopoverContentProps extends React.HTMLAttributes<HTMLDivElement> {
  open: boolean;
  onOpenChange?: (open: boolean) => void;
  align?: "start" | "center" | "end";
  sideOffset?: number;
}

export function PopoverContent({ 
  className, 
  open, 
  align = "center", 
  sideOffset = 4, 
  children,
  ...props 
}: PopoverContentProps) {
  if (!open) return null;

  return (
    <div
      className={cn(
        "z-50 w-72 rounded-md border bg-popover p-4 text-popover-foreground shadow-md outline-none data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0 data-[state=closed]:zoom-out-95 data-[state=open]:zoom-in-95 data-[side=bottom]:slide-in-from-top-2 data-[side=left]:slide-in-from-right-2 data-[side=right]:slide-in-from-left-2 data-[side=top]:slide-in-from-bottom-2",
        className
      )}
      style={{ position: 'absolute', top: 0, left: 0 }}
      {...props}
    >
      {children}
    </div>
  )
}
