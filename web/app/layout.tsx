import type { Metadata } from 'next';
import { Kanit } from 'next/font/google';
import './globals.css';

// Document event keys for mobile sidebar toggle
const MOBILE_SIDEBAR_TOGGLE = 'mobile-sidebar:toggle';

export function openMobileSidebar(): void {
  document.dispatchEvent(new CustomEvent(MOBILE_SIDEBAR_TOGGLE));
}

export function closeMobileSidebar(): void {
  document.dispatchEvent(new CustomEvent(MOBILE_SIDEBAR_TOGGLE, { 
    detail: { forceClose: true } 
  }));
}

// Module-level handler reference to prevent re-creation on render
let isMobileSidebarOpen = false;
const handlers: Map<string, () => void> = new Map();

export function subscribeMobileSidebar(cb: () => void): string {
  const id = Math.random().toString(36).substr(2, 9);
  handlers.set(id, cb);
  return id;
}

export function unsubscribeMobileSidebar(id: string): void {
  handlers.delete(id);
}

// Kanit font for all weights (100–900) as per DESIGN.md typography spec
const kanit = Kanit({
  weight: ['100', '200', '300', '400', '500', '600', '700', '800', '900'],
  subsets: ['latin', 'thai'],
  variable: '--font-kanit',
  display: 'swap',
});

export const metadata: Metadata = {
  title: 'From Home Sandwich — ระบบจัดการบิลและยอดขาย',
  description: 'ระบบจัดการสินค้า ใบเสร็จ และรายงานยอดขายสำหรับ From Home Sandwich',
};

// Root layout with Sidebar + content area (SPEC.md §3.C)
export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="th" className={kanit.variable}>
      <body className={`min-h-screen bg-background ${kanit.className}`}>
        {/* Top Navbar */}
        <header className="border-b border-border/50 px-4 sm:px-6 py-3 bg-white sticky top-0 z-20">
          <div className="flex items-center justify-between max-w-[1440px] mx-auto">
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

        {/* Main layout: Sidebar (left) + Content (right) */}
        <main className="flex">
          {children}
        </main>
      </body>
    </html>
  );
}

export const dynamic = 'force-dynamic';
