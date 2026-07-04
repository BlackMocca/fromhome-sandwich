'use client';

import { useState, useMemo, useEffect } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { cn } from '@/lib/utils';
import { ChevronLeft } from 'lucide-react';
import type { Channel } from '@/types/channel';

// ─── Management Data (mock → PostgREST later) ────────────
const CHANNELS: Channel[] = [
  { id: 1, short_code: 'CND', name: 'Condo', gp_percentage: 10 },
  { id: 2, short_code: 'GRB', name: 'GrabFood', gp_percentage: 18 },
  { id: 3, short_code: 'LMN', name: 'Lineman', gp_percentage: 20 },
  { id: 4, short_code: 'RBN', name: 'Robinhood', gp_percentage: 15 },
];

const NAV_ITEMS = [
  { label: 'หมวดหมู่ (Category)', href: '/management/categories', icon: '📂' },
  { label: 'สินค้า (Product)', href: '/management/products', icon: '🥪' },
  { label: 'ตัวเลือกสินค้า (Add-on)', href: '/management/addons', icon: '➕' },
];

// Module-level stable state for mobile sidebar (survives SSR/CSR boundary)
let _isMobileSidebarOpen = false;

export function toggleMobileSidebar(): void {
  _isMobileSidebarOpen = !_isMobileSidebarOpen;
}

function closeMobileSidebar(): void {
  _isMobileSidebarOpen = false;
}

export default function ManagementLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const [expandedChannel, setExpandedChannel] = useState<Channel | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  // Responsive sidebar state - mobile only
  const [isMobileOpen, setIsMobileOpen] = useState(_isMobileSidebarOpen);

  // Auto-open on small screens during mount
  useEffect(() => {
    if (typeof window !== 'undefined' && window.innerWidth < 768) {
      setIsMobileOpen(true);
    }

    // Listen for toggle events from top navbar
    const handleToggle = () => {
      setIsMobileOpen(prev => !prev);
    };
    document.addEventListener('mobile-sidebar:toggle', handleToggle);

    return () => document.removeEventListener('mobile-sidebar:toggle', handleToggle);
  }, []);

  // Detect viewport size changes
  useEffect(() => {
    if (typeof window === 'undefined') return;

    const handleResize = () => {
      if (window.innerWidth >= 768 && isMobileOpen) {
        setIsMobileOpen(false);
      } else if (window.innerWidth < 400 && !isMobileOpen) {
        setIsMobileOpen(true);
      }
    };

    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, [isMobileOpen]);

  // Detect if we're viewing a specific channel's product cards
  const isChannelCardsView = pathname.startsWith('/management/channels/');

  const filteredChannels = useMemo(() => {
    if (!searchQuery) return CHANNELS;
    return CHANNELS.filter(ch => ch.name.toLowerCase().includes(searchQuery.toLowerCase()));
  }, [searchQuery]);

  // Check if we're currently on a channel detail page
  const currentChannelCode = isChannelCardsView ? pathname.split('/').pop() : null;
  const hasActiveChannel = expandedChannel || !!currentChannelCode;

  return (
    <div className="flex h-[calc(100vh-4rem)]">

      {/* ── LEFT NAVBAR (Responsive) ─────────────── */}
      <aside className={cn(
        'fixed md:relative z-30 bg-white border-r border-border/50 transition-all duration-300 ease-in-out flex-shrink-0',
        'h-[calc(100vh-4rem)] md:h-auto overflow-y-auto',
        isMobileOpen ? 'w-72 translate-x-0' : '-translate-x-full md:translate-x-0 md:w-72',
      )}>
        {/* Mobile close button */}
        <button
          type="button"
          onClick={closeMobileSidebar}
          className="md:hidden absolute top-3 right-3 p-1.5 rounded-lg hover:bg-surface transition-colors"
        >
          <ChevronLeft className="w-5 h-5 text-muted-foreground" />
        </button>

        <div className="p-4">
          {/* Search channel */}
          <input
            type="text"
            placeholder="ค้นหาช่องทาง..."
            value={searchQuery}
            onChange={e => setSearchQuery(e.target.value)}
            className="w-full px-3 py-2 rounded-lg border border-border text-sm bg-surface focus:ring-2 focus:ring-action/50 outline-none"
          />
        </div>

        {/* Navigation items */}
        <nav className="px-3 space-y-1">
          {NAV_ITEMS.map(item => (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                'flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm transition-colors',
                pathname === item.href
                  ? 'bg-primary/10 text-primary font-semibold'
                  : 'text-primary/70 hover:bg-surface'
              )}
            >
              <span className="text-base">{item.icon}</span>
              {item.label}
            </Link>
          ))}

          {/* Channel group */}
          <div className="pt-3 pb-1">
            <p className="px-3 text-xs font-semibold text-muted-foreground uppercase tracking-wider">
              ช่องทางการขาย (Channels)
            </p>
          </div>

          {filteredChannels.map(channel => {
            const isActiveChannel = expandedChannel?.id === channel.id;
            const isChannelPathname = pathname === `/management/channels/${channel.short_code}`;

            return (
              <div key={channel.id} className="mb-0.5">
                <button
                  onClick={() => setExpandedChannel(isActiveChannel ? null : channel)}
                  type="button"
                  className={cn(
                    'w-full flex items-center justify-between px-3 py-2 rounded-lg text-sm transition-all',
                    isChannelPathname || isActiveChannel
                      ? 'bg-action/15 text-primary font-semibold border-l-2 border-action'
                      : 'text-primary/60 hover:bg-surface hover:text-primary'
                  )}
                >
                  <span className="flex items-center gap-2">
                    <span className={cn(
                      'w-2 h-2 rounded-full',
                      isActiveChannel ? 'bg-action' : 'bg-border'
                    )} />
                    {channel.name}
                  </span>
                  <span className="text-xs text-muted-foreground">{channel.short_code}</span>
                </button>

                {/* Channel sub-items */}
                {(isActiveChannel || isChannelPathname) && (
                  <div className="ml-5 mt-1 space-y-0.5 border-l border-border/40 pl-2">
                    <Link
                      href={`/management/channels/${channel.short_code}`}
                      onClick={(e) => {
                        if (typeof window !== 'undefined' && window.innerWidth < 768) {
                          e.preventDefault();
                          setIsMobileOpen(false);
                          setTimeout(() => window.location.href = `/management/channels/${channel.short_code}`, 50);
                        }
                      }}
                      className={cn(
                        'block px-3 py-1.5 rounded text-xs transition-colors',
                        isChannelPathname
                          ? 'bg-action/20 text-primary font-medium'
                          : 'text-muted-foreground hover:text-primary hover:bg-surface'
                      )}
                    >
                      📋 สินค้าของ {channel.name} — Product Cards
                    </Link>
                  </div>
                )}
              </div>
            );
          })}

          {/* Add Channel button */}
          <button type="button" className="w-full mt-3 px-3 py-2 rounded-lg border border-dashed border-border/50 text-sm text-muted-foreground hover:border-action hover:text-action transition-colors flex items-center justify-center gap-1">
            <span>+</span> เพิ่มช่องทางใหม่
          </button>
        </nav>

        {/* Channel summary footer */}
        <div className="absolute bottom-0 left-0 right-0 p-3 border-t border-border/50 bg-surface/50 text-xs text-muted-foreground md:opacity-100 opacity-0">
          <p>{CHANNELS.length} ช่องทางการขาย</p>
        </div>
      </aside>

      {/* ── MOBILE OVERLAY ─────────────────────── */}
      {isMobileOpen && (
        <div
          className="fixed inset-0 z-20 bg-black/30 md:hidden"
          onClick={closeMobileSidebar}
        />
      )}

      {/* ── RIGHT CONTENT ───────────────────── */}
      <main className="flex-1 overflow-y-auto p-6 bg-background">
        {children}
      </main>

    </div>
  );
}
