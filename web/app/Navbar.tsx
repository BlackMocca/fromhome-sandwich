"use client";

import { openMobileSidebar } from './mobile-sidebar';

export default function Navbar() {
  return (
    <header className="border-b border-border/50 px-4 py-3 bg-white sticky top-0 z-20">
      <div className="flex items-center justify-between w-full max-w-[1440px] mx-auto">
        {/* Left side: Hamburger + Logo */}
        <div className="flex items-center gap-3">
          {/* Hamburger button for mobile/tablet */}
          <button
            onClick={openMobileSidebar}
            className="md:hidden p-2 rounded-lg hover:bg-surface transition-colors"
            aria-label="เปิดเมนู"
          >
            <svg className="w-5 h-5 text-primary" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
            </svg>
          </button>

          <a href="/management" className="text-primary font-bold text-base sm:text-lg tracking-tight flex items-center gap-2">
            <span className="w-6 h-6 rounded bg-action inline-block" />
            From Home Sandwich
            <span className="text-xs text-muted-foreground font-normal hidden sm:inline">| Management</span>
          </a>
        </div>

        {/* Right side: User menu */}
        <button className="flex items-center gap-2 px-3 py-1.5 rounded-lg hover:bg-surface transition-colors text-sm">
          <div className="w-7 h-7 rounded-full bg-primary/90 flex items-center justify-center text-secondary text-xs font-bold">A</div>
          <span className="text-primary/80 hidden sm:inline">Admin</span>
        </button>
      </div>
    </header>
  );
}
