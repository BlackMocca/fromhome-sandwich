'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { useQuery } from '@tanstack/react-query';
import { cn } from '@/lib/utils';
import { ChevronLeft, ChevronDown } from 'lucide-react';
import type { Channel } from '@/types/channel';
import { getChannels } from '@/lib/db';

const NAV_ITEMS = [
  { label: 'แดชบอร์ด (Dashboard)', href: '/management', icon: '📊' },
  { label: 'ผู้ใช้งาน (User)', href: '/management/user', icon: '👤' },
  { label: 'หมวดหมู่ (Category)', href: '/management/categories', icon: '📂' },
  { label: 'สินค้า (Product)', href: '/management/products', icon: '🥪' },
  { label: 'ตัวเลือกสินค้า (Add-on)', href: '/management/addons', icon: '➕' },
];

// Module-level stable state for mobile sidebar (survives SSR/CSR boundary)
let _isMobileSidebarOpen = false;

export function toggleMobileSidebar(): void {
  _isMobileSidebarOpen = !_isMobileSidebarOpen;
}

export function closeMobileSidebar(): void {
  _isMobileSidebarOpen = false;
}

export default function ManagementSidebar({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();
  const [channelsExpanded, setChannelsExpanded] = useState(true);

  const { data: channels = [] } = useQuery({
    queryKey: ['channels'],
    queryFn: getChannels,
    staleTime: 5 * 60 * 1000,
    gcTime: 30 * 60 * 1000,
  });
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

  // Check if we're currently on a channel detail page
  const currentChannelCode = isChannelCardsView ? pathname.split('/').pop() : null;

  return (
    <div className="flex w-full h-[calc(100dvh-4rem)]">
      {/* ── LEFT NAVBAR (Responsive) ─────────────── */}
      <aside className={cn(
        'fixed md:relative z-30 -mt-5 md:mt-5 rounded bg-white transition-all duration-300 ease-in-out flex-shrink-0',
        'shadow-xl md:shadow-lg md:rounded-l-2xl',
        'h-[calc(100dvh-4rem)] md:h-auto overflow-y-auto',
        isMobileOpen ? 'w-72 translate-x-0' : '-translate-x-full md:translate-x-0 md:w-72',
      )}>

        <nav className="px-3 space-y-1 py-4">
          {NAV_ITEMS.map(item => (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                'flex items-center gap-3 px-4 py-3 rounded-xl text-sm transition-all',
                pathname === item.href
                  ? 'bg-primary/10 text-primary font-semibold shadow-sm'
                  : 'text-primary/70 hover:bg-surface hover:shadow-sm'
              )}
            >
              <span className="text-base">{item.icon}</span>
              {item.label}
            </Link>
          ))}

          {/* Channel group header - เป็นปุ่ม expand/collapse */}
          <button
            type="button"
            onClick={() => setChannelsExpanded(!channelsExpanded)}
            className={cn(
              'w-full flex items-center justify-between px-4 py-3 rounded-xl text-sm transition-all cursor-pointer',
              channelsExpanded ? 'bg-primary/10 text-primary font-semibold shadow-sm' : 'text-primary/70 hover:bg-surface hover:shadow-sm'
            )}
          >
            <span className="flex items-center gap-2">
              <span>📊</span>
              <span>ช่องทางการขาย (Channels)</span>
            </span>
            <ChevronDown
              className={cn(
                'w-4 h-4 transition-transform',
                channelsExpanded ? 'rotate-180' : ''
              )}
            />
          </button>

          {/* Channel group content - แสดงเมื่อ expand พร้อม slide animation */}
          <div className={cn('overflow-hidden transition-all duration-300 ease-out', channelsExpanded ? 'max-h-96 opacity-100' : 'max-h-0 opacity-0')}>
            <div className="pt-2 pb-1 space-y-1 px-1">
              {channels.map(channel => {
                const isChannelPathname = pathname === `/management/channels/${channel.id}`;

                return (
                  <button
                    key={channel.id}
                    type="button"
                    onClick={() => {
                      // เมื่อคลิก channel ก็ไป Product Card ทันที
                      if (typeof window !== 'undefined' && window.innerWidth < 768) {
                        setIsMobileOpen(false);
                      }
                      window.location.href = `/management/channels/${channel.id}`;
                    }}
                    className={cn(
                      'w-full flex items-center justify-between px-4 py-2.5 rounded-xl text-sm transition-all',
                      isChannelPathname
                        ? 'bg-primary/90 text-white font-semibold shadow-md'
                        : 'text-primary/60 hover:bg-surface hover:text-primary hover:shadow-sm bg-white'
                    )}
                  >
                    <span className="flex items-center gap-2 min-w-0">
                      <span className="relative inline-flex h-6 w-6 flex-shrink-0 items-center justify-center rounded-full bg-primary/10 text-xs text-primary/50">
                        {channel.cover_url && (
                          <img
                            src={channel.cover_url}
                            alt=""
                            className="absolute inset-0 h-full w-full rounded-full object-cover"
                            onError={e => { (e.currentTarget as HTMLElement).style.display = 'none'; }}
                          />
                        )}
                        <span>📊</span>
                      </span>
                      <span className="text-md font-mono text-muted-foreground/70 flex-shrink-0">[{channel.code}]</span>
                      <span className="truncate">{channel.name}</span>
                    </span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Add Channel button — ปุ่ม primary */}
          <button
            type="button"
            onClick={() => router.push('/management/channels/create')}
            className="w-full mt-3 px-4 py-2.5 rounded-xl bg-primary text-white border border-transparent text-sm font-medium hover:bg-primary/90 transition-all flex items-center justify-center gap-1 shadow-md hover:shadow-lg"
          >
            <span>+</span> เพิ่มช่องทางใหม่
          </button>
        </nav>
      </aside>

      {/* ── MOBILE OVERLAY ─────────────────────── */}
      {isMobileOpen && (
        <div
          className="fixed inset-0 z-20 bg-black/30 md:hidden"
          onClick={closeMobileSidebar}
        />
      )}

      {/* ── RIGHT CONTENT ───────────────────── */}
      <main className="flex-1 w-full max-w-[1440px] mx-auto overflow-y-auto px-4 py-6 bg-background">
        {children}
      </main>

    </div>
  );
}
