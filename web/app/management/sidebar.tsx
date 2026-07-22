'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useQuery } from '@tanstack/react-query';
import { cn } from '@/lib/utils';
import { ChevronLeft, ChevronDown, ShoppingCart, PackageX, Wallet } from 'lucide-react';
import type { Channel } from '@/types/channel';
import { getChannels } from '@/lib/db';

const SYSTEM_MANAGEMENT_ITEMS = [
  { label: 'ผู้ใช้งาน (User)', href: '/management/user', icon: '👤' },
  { label: 'สินค้า (Product)', href: '/management/products', icon: '🥪' },
  { label: 'หมวดหมู่ (Category)', href: '/management/categories', icon: '📂' },
  { label: 'ตัวเลือกสินค้า (Add-on)', href: '/management/addons', icon: '➕' },
  { label: 'วัตถุดิบ (Ingredients)', href: '/management/ingredients', icon: '🌾' },
  { label: 'ช่องทางการขาย (Channels)', href: '/management/channels', icon: '🛒' },
  { label: 'เชื่อมต่อ Telegram', href: '/management/telegram', icon: '✈️' },
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
  const [dashboardExpanded, setDashboardExpanded] = useState(false);
  const [channelsExpanded, setChannelsExpanded] = useState(false);
  const [systemManagementExpanded, setSystemManagementExpanded] = useState(false);

  const { data: channels = [] } = useQuery({
    queryKey: ['channels'],
    queryFn: getChannels,
    staleTime: 5 * 60 * 1000,
    gcTime: 30 * 60 * 1000,
  });
  // Responsive sidebar state - mobile only
  const [isMobileOpen, setIsMobileOpen] = useState(_isMobileSidebarOpen);

  // Listen for toggle events from top navbar only
  useEffect(() => {
    const handleToggle = () => {
      setIsMobileOpen(prev => !prev);
    };
    document.addEventListener('mobile-sidebar:toggle', handleToggle);

    return () => document.removeEventListener('mobile-sidebar:toggle', handleToggle);
  }, []);

  // Auto-close sidebar when resizing to desktop
  useEffect(() => {
    if (typeof window === 'undefined') return;

    const handleResize = () => {
      if (window.innerWidth >= 768 && isMobileOpen) {
        setIsMobileOpen(false);
      }
    };

    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, [isMobileOpen]);

  // Detect if we're viewing a specific channel's product cards
  const isChannelCardsView = pathname.startsWith('/management/channels/');

  // Check if we're currently on a channel detail page
  const currentChannelCode = isChannelCardsView ? pathname.split('/').pop() : null;

  // Compute active child states for collapsible menus
  const dashboardHasActiveChild = 
    pathname === '/management/dashboard/overview' || 
    pathname === '/management/dashboard/product' ||
    pathname === '/management/dashboard/cost-trends';

  const channelsHaveActiveChild = 
    isChannelCardsView || pathname.startsWith('/management/channels/');

  const systemManagementHasActiveChild =
    pathname === '/management/channels' ||
    pathname === '/management/products' || pathname.startsWith('/management/products/') ||
    pathname === '/management/user' || pathname.startsWith('/management/user/') ||
    pathname === '/management/categories' || pathname.startsWith('/management/categories/') ||
    pathname === '/management/addons' || pathname.startsWith('/management/addons/') ||
    pathname === '/management/ingredients' || pathname.startsWith('/management/ingredients/') ||
    pathname === '/management/telegram' || pathname.startsWith('/management/telegram/');

  // Effective expanded states: if a child route is active, the parent must be expanded and shown as active.
  const effectiveDashboardExpanded = dashboardExpanded || dashboardHasActiveChild;
  const effectiveChannelsExpanded = channelsExpanded || channelsHaveActiveChild;
  const effectiveSystemManagementExpanded = systemManagementExpanded || systemManagementHasActiveChild;

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
          {/* Dashboard group header - เป็นปุ่ม expand/collapse */}
          <button
            type="button"
            onClick={() => setDashboardExpanded(!dashboardExpanded)}
            className={cn(
              'w-full flex items-center justify-between px-4 py-3 rounded-xl text-sm transition-all cursor-pointer',
              effectiveDashboardExpanded ? 'bg-primary/10 text-primary font-semibold shadow-sm' : 'text-primary/70 hover:bg-surface hover:shadow-sm'
            )}
          >
            <span className="flex items-center gap-2">
              <span>📊</span>
              <span>แดชบอร์ด (Dashboard)</span>
            </span>
            <ChevronDown
              className={cn(
                'w-4 h-4 transition-transform',
                effectiveDashboardExpanded ? 'rotate-180' : ''
              )}
            />
          </button>

          {/* Dashboard group content - แสดงเมื่อ expand พร้อม slide animation */}
          <div className={cn('overflow-hidden transition-all duration-300 ease-out', effectiveDashboardExpanded ? 'max-h-96 opacity-100' : 'max-h-0 opacity-0')}>
            <div className="pt-2 pb-1 space-y-1 px-1">
              <Link
                href="/management/dashboard/overview"
                className={cn(
                  'flex items-center gap-3 px-4 py-2.5 rounded-xl text-sm transition-all',
                  pathname === '/management/dashboard/overview'
                    ? 'bg-primary/90 text-white font-semibold shadow-md'
                    : 'text-primary/60 hover:bg-surface hover:text-primary hover:shadow-sm bg-white'
                )}
              >
                <span className="relative inline-flex h-6 w-6 flex-shrink-0 items-center justify-center rounded-full bg-primary/10 text-xs text-primary/50">
                  <span>📈</span>
                </span>
                ภาพรวม (Overview)
              </Link>
              <Link
                href="/management/dashboard/product"
                className={cn(
                  'flex items-center gap-3 px-4 py-2.5 rounded-xl text-sm transition-all',
                  pathname === '/management/dashboard/product'
                    ? 'bg-primary/90 text-white font-semibold shadow-md'
                    : 'text-primary/60 hover:bg-surface hover:text-primary hover:shadow-sm bg-white'
                )}
              >
                <span className="relative inline-flex h-6 w-6 flex-shrink-0 items-center justify-center rounded-full bg-primary/10 text-xs text-primary/50">
                  <span>📦</span>
                </span>
                รายสินค้า (Products)
              </Link>
              <Link
                href="/management/dashboard/cost-trends"
                className={cn(
                  'flex items-center gap-3 px-4 py-2.5 rounded-xl text-sm transition-all',
                  pathname === '/management/dashboard/cost-trends'
                    ? 'bg-primary/90 text-white font-semibold shadow-md'
                    : 'text-primary/60 hover:bg-surface hover:text-primary hover:shadow-sm bg-white'
                )}
              >
                <span className="relative inline-flex h-6 w-6 flex-shrink-0 items-center justify-center rounded-full bg-primary/10 text-xs text-primary/50">
                  <span>📉</span>
                </span>
                ต้นทุนvsกำไร (Cost Trends)
              </Link>
            </div>
          </div>

          {/* Channel group header - เป็นปุ่ม expand/collapse */}
          <button
            type="button"
            onClick={() => setChannelsExpanded(!channelsExpanded)}
            className={cn(
              'w-full flex items-center justify-between px-4 py-3 rounded-xl text-sm transition-all cursor-pointer',
              effectiveChannelsExpanded ? 'bg-primary/10 text-primary font-semibold shadow-sm' : 'text-primary/70 hover:bg-surface hover:shadow-sm'
            )}
          >
            <span className="flex items-center gap-2">
              <ShoppingCart className='w-5 h-5'/>
              <span>ช่องทางการขาย (Channels)</span>
            </span>
            <ChevronDown
              className={cn(
                'w-4 h-4 transition-transform',
                effectiveChannelsExpanded ? 'rotate-180' : ''
              )}
            />
          </button>

          {/* Channel group content - แสดงเมื่อ expand พร้อม slide animation */}
          <div className={cn('overflow-hidden transition-all duration-300 ease-out', effectiveChannelsExpanded ? 'max-h-96 opacity-100' : 'max-h-0 opacity-0')}>
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

          {/* รายการบิล (Receipts) */}
          <Link
            href="/management/receipts"
            className={cn(
              'flex items-center gap-2 px-4 py-3 rounded-xl text-sm transition-all',
              pathname === '/management/receipts'
                ? 'bg-primary/10 text-primary font-semibold shadow-sm'
                : 'text-primary/70 hover:bg-surface hover:shadow-sm'
            )}
          >
            <span className="text-base">🧾</span>
            รายการบิล (Receipts)
          </Link>

          {/* เคลมสินค้า (Claims) */}
          <Link
            href="/management/claims"
            className={cn(
              'flex items-center gap-2 px-4 py-3 rounded-xl text-sm transition-all',
              pathname === '/management/claims' || pathname.startsWith('/management/claims/')
                ? 'bg-primary/10 text-primary font-semibold shadow-sm'
                : 'text-primary/70 hover:bg-surface hover:shadow-sm'
            )}
          >
            <span className="text-base"><PackageX className="w-4 h-4" /></span>
            เคลมสินค้า (Claims)
          </Link>

          {/* เบิกเงิน (Disbursements) */}
          <Link
            href="/management/disbursements"
            className={cn(
              'flex items-center gap-2 px-4 py-3 rounded-xl text-sm transition-all',
              pathname === '/management/disbursements' || pathname.startsWith('/management/disbursements/')
                ? 'bg-primary/10 text-primary font-semibold shadow-sm'
                : 'text-primary/70 hover:bg-surface hover:shadow-sm'
            )}
          >
            <span className="text-base"><Wallet className="w-4 h-4" /></span>
            เบิกเงิน (Disbursements)
          </Link>

          {/* บันทึกการซื้อวัตถุดิบ (Ingredient Purchases) */}
          <Link
            href="/management/ingredient-purchases"
            className={cn(
              'flex items-center gap-2 px-4 py-3 rounded-xl text-sm transition-all',
              pathname === '/management/ingredient-purchases' || pathname.startsWith('/management/ingredient-purchases/')
                ? 'bg-primary/10 text-primary font-semibold shadow-sm'
                : 'text-primary/70 hover:bg-surface hover:shadow-sm'
            )}
          >
            <span className="text-base">💰</span>
            บันทึกการซื้อวัตถุดิบ (Purchases)
          </Link>

          {/* System Management group header - เป็นปุ่ม expand/collapse */}
          <button
            type="button"
            onClick={() => setSystemManagementExpanded(!systemManagementExpanded)}
            className={cn(
              'w-full flex items-center justify-between px-4 py-3 rounded-xl text-sm transition-all cursor-pointer',
              effectiveSystemManagementExpanded ? 'bg-primary/10 text-primary font-semibold shadow-sm' : 'text-primary/70 hover:bg-surface hover:shadow-sm'
            )}
          >
            <span className="flex items-center gap-2">
              <span>⚙️</span>
              <span>จัดการระบบ (System)</span>
            </span>
            <ChevronDown
              className={cn(
                'w-4 h-4 transition-transform',
                effectiveSystemManagementExpanded ? 'rotate-180' : ''
              )}
            />
          </button>

          {/* System Management group content - แสดงเมื่อ expand พร้อม slide animation */}
          <div className={cn('overflow-hidden transition-all duration-300 ease-out', effectiveSystemManagementExpanded ? 'max-h-96 opacity-100' : 'max-h-0 opacity-0')}>
            <div className="pt-2 pb-1 space-y-1 px-1">
              {SYSTEM_MANAGEMENT_ITEMS.map(item => (
                <Link
                  key={item.href}
                  href={item.href}
                  className={cn(
                    'flex items-center gap-3 px-4 py-2.5 rounded-xl text-sm transition-all',
                    pathname === item.href
                      ? 'bg-primary/90 text-white font-semibold shadow-md'
                      : 'text-primary/60 hover:bg-surface hover:text-primary hover:shadow-sm bg-white'
                  )}
                >
                  <span className="relative inline-flex h-6 w-6 flex-shrink-0 items-center justify-center rounded-full bg-primary/10 text-xs text-primary/50">
                    <span>{item.icon}</span>
                  </span>
                  {item.label}
                </Link>
              ))}
            </div>
          </div>
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
      <main className="flex-1 w-full max-w-[1440px] mx-auto overflow-y-auto no-scrollbar px-4 py-6 bg-background">
        {children}
      </main>

    </div>
  );
}
