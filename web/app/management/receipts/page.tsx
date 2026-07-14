'use client';

import { useState, useEffect, useRef, useMemo } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useRouter } from 'next/navigation';
import { ChevronLeft, ChevronRight, Eye, X } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { InputDate } from '@/components/ui/input-date';
import { Button } from '@/components/ui/button';
import { ToggleSwitch } from '@/components/ui/toggle-switch';
import { cn } from '@/lib/utils';
import { toast } from '@/lib/toast';
import { getReceipts, updateReceiptStatus, getChannels } from '@/lib/db';
import type { Receipt } from '@/types/receipt';
import type { Channel } from '@/types/channel';

const PAGE_SIZE = 15;

const THAI_MONTHS = ['ม.ค.', 'ก.พ.', 'มี.ค.', 'เม.ย.', 'พ.ค.', 'มิ.ย.', 'ก.ค.', 'ส.ค.', 'ก.ย.', 'ต.ค.', 'พ.ย.', 'ธ.ค.'];

function toBuddhistDate(dateStr: string): string {
  const [y, m, d] = dateStr.split('-').map(Number);
  return `${d} ${THAI_MONTHS[m - 1]} ${y + 543}`;
}

function toBuddhistDateTime(isoStr: string): string {
  const dt = new Date(isoStr);
  const buddhistYear = dt.getFullYear() + 543;
  const day = dt.getDate();
  const month = THAI_MONTHS[dt.getMonth()];
  const time = dt.toLocaleString('th-TH', { hour: '2-digit', minute: '2-digit', hour12: false });
  return `${day} ${month} ${buddhistYear} ${time}`;
}

export default function ReceiptsPage() {
  const router = useRouter();
  const queryClient = useQueryClient();
  const [search, setSearch] = useState('');
  const [debouncedSearch, setDebouncedSearch] = useState('');
  const [channelFilter, setChannelFilter] = useState('');
  const [dateFilter, setDateFilter] = useState('');
  const [page, setPage] = useState(1);
  const debounceTimer = useRef<ReturnType<typeof setTimeout>>(null);

  const handleSearchChange = (value: string) => {
    setSearch(value);
    setPage(1);
    if (debounceTimer.current) clearTimeout(debounceTimer.current);
    debounceTimer.current = setTimeout(() => setDebouncedSearch(value), 300);
  };

  useEffect(() => {
    return () => { if (debounceTimer.current) clearTimeout(debounceTimer.current); };
  }, []);

  const { data: channels = [] } = useQuery({
    queryKey: ['channels'],
    queryFn: () => getChannels(),
  });

  const channelMap = useMemo(() => {
    const m = new Map<string, { name: string; cover_url: string | null }>();
    channels.forEach((ch: Channel) => m.set(ch.code, { name: ch.name, cover_url: ch.cover_url ?? null }));
    return m;
  }, [channels]);

  const { data: receipts = [], isLoading } = useQuery({
    queryKey: ['receipts', debouncedSearch, channelFilter, dateFilter],
    queryFn: () => getReceipts({
      search: debouncedSearch || undefined,
      channel_code: channelFilter || undefined,
      bill_date: dateFilter || undefined,
    }),
  });

  const statusMutation = useMutation({
    mutationFn: ({ id, status }: { id: number; status: 'active' | 'cancelled' }) =>
      updateReceiptStatus(id, status),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['receipts'] });
      toast({ title: 'สำเร็จ', description: 'อัปเดตสถานะเรียบร้อย' });
    },
    onError: (err) => {
      toast({ title: 'เกิดข้อผิดพลาด', description: err.message });
    },
  });

  const handleStatusToggle = (id: number, currentStatus: string) => {
    const next = currentStatus === 'active' ? 'cancelled' : 'active';
    statusMutation.mutate({ id, status: next });
  };

  const handleClearDate = () => {
    setDateFilter('');
    setPage(1);
  };

  // Paginate
  const totalCount = receipts.length;
  const totalPages = Math.max(1, Math.ceil(totalCount / PAGE_SIZE));
  const safePage = Math.min(page, totalPages);
  const paginatedReceipts = receipts.slice(
    (safePage - 1) * PAGE_SIZE,
    safePage * PAGE_SIZE,
  );

  const getVisiblePages = (): (number | '...')[] => {
    const pages: (number | '...')[] = [];
    if (totalPages <= 5) {
      for (let i = 1; i <= totalPages; i++) pages.push(i);
    } else {
      pages.push(1);
      if (safePage > 3) pages.push('...');
      const start = Math.max(2, safePage - 1);
      const end = Math.min(totalPages - 1, safePage + 1);
      for (let i = start; i <= end; i++) pages.push(i);
      if (safePage < totalPages - 2) pages.push('...');
      pages.push(totalPages);
    }
    return pages;
  };

  const rowOffset = (safePage - 1) * PAGE_SIZE;

  return (
    <div className="w-full">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-semibold text-primary">รายการบิล</h1>
      </div>

      {/* Filters — inline */}
      <div className="flex flex-wrap items-center gap-3 mb-6">
        {/* Search */}
        <div className="relative max-w-xs flex-1 min-w-[200px]">
          <Input
            placeholder="ค้นหาเลขบิล / ชื่อลูกค้า..."
            value={search}
            onChange={(e) => handleSearchChange(e.target.value)}
          />
        </div>

        {/* Date filter */}
        <div className="relative w-[124px]">
          <InputDate
            value={dateFilter}
            onValueChange={(date) => { setDateFilter(date); setPage(1); }}
            placeholder="วันที่บิล"
          />
          {dateFilter && (
            <button
              onClick={handleClearDate}
              className="absolute -top-1.5 -right-1.5 w-4 h-4 rounded-full bg-destructive text-white flex items-center justify-center text-[10px] z-10"
            >
              <X className="w-2.5 h-2.5" />
            </button>
          )}
        </div>

        {/* Channel filter */}
        <select
          value={channelFilter}
          onChange={(e) => { setChannelFilter(e.target.value); setPage(1); }}
          className="h-10 rounded-lg border border-border bg-white px-3 text-sm text-primary focus:outline-none focus:ring-2 focus:ring-action min-w-[140px]"
        >
          <option value="">ทุกช่องทาง</option>
          {channels.map((ch: Channel) => (
            <option key={ch.id} value={ch.code}>{ch.name}</option>
          ))}
        </select>
      </div>

      {/* Data Table — Desktop */}
      <div className="hidden md:block w-full bg-white rounded-xl border border-border/50 overflow-hidden">
        {/* Header */}
        <div className="grid grid-cols-12 gap-3 px-4 py-3 bg-surface/60 border-b border-border/50 text-sm font-medium text-muted-foreground">
          <div className="col-span-2">ช่องทาง</div>
          <div className="col-span-2">เลขที่บิล</div>
          <div className="col-span-2">วันที่บิล</div>
          <div className="col-span-2">ชื่อลูกค้า</div>
          <div className="col-span-1 text-center">ยอดรวม</div>
          <div className="col-span-2 text-center">สถานะบิล</div>
          <div className="col-span-1 text-right">&nbsp;</div>
        </div>

        {/* Data Rows */}
        {isLoading ? (
          <div className="px-4 py-8 text-center text-muted-foreground">กำลังโหลดข้อมูล...</div>
        ) : paginatedReceipts.length === 0 ? (
          <div className="px-4 py-8 text-center text-muted-foreground">ไม่พบข้อมูล</div>
        ) : (
          paginatedReceipts.map((r: Receipt, i: number) => (
            <div
              key={r.id}
              className={cn(
                "grid grid-cols-12 gap-3 p-4 border-b transition-colors text-sm cursor-pointer hover:bg-surface h-[76px] items-center",
                i === paginatedReceipts.length - 1 && 'border-b-0',
              )}
              onClick={() => router.push(`/management/receipts/${r.id}`)}
            >
              <div className="col-span-2 h-full">
                <div className="flex items-start gap-1.5">
                  {channelMap.get(r.channel_code)?.cover_url ? (
                    <img
                      src={channelMap.get(r.channel_code)!.cover_url!}
                      alt={r.channel_code}
                      className="w-10 h-10 rounded-full object-cover shrink-0"
                    />
                  ) : (
                    <div className="w-5 h-5 rounded bg-action/20 flex items-center justify-center text-[10px] font-semibold text-action shrink-0">
                      {r.channel_code.charAt(0)}
                    </div>
                  )}
                  <div className='flex flex-col gap-1'>
                    <span className="text-md text-primary font-medium truncate">{channelMap.get(r.channel_code)?.name || r.channel_code}</span>
                    <span className="text-xs text-gray-400 font-medium truncate">{r.channel_code}</span>
                  </div>
                </div>
              </div>
              <div className="col-span-2 h-full">
                <span className="text-md font-medium text-primary font-mono">{r.receipt_no}</span>
              </div>
              <div className="col-span-2 h-full space-y-1">
                <div>{toBuddhistDate(r.bill_date)}</div>
                <div className="text-xs text-gray-400">สร้างเมื่อ {toBuddhistDateTime(r.created_at)}</div>
              </div>
              <div className="col-span-2 text-md h-full">{r.customer_name || '-'}</div>
              <div className="col-span-1 h-full text-center font-medium text-primary ">
                ฿{r.grand_total.toLocaleString()}
              </div>
              <div className="col-span-2 h-full flex justify-center items-start" onClick={(e) => e.stopPropagation()}>
                <div className="flex flex-col items-center gap-1">
                  <ToggleSwitch
                    on={r.status === 'active'}
                    onToggle={() => handleStatusToggle(r.id, r.status)}
                    size="sm"
                    disabled={statusMutation.isPending}
                  />
                  <span className="text-[10px] font-medium text-destructive whitespace-nowrap">{r.status === 'cancelled' && "ยกเลิก"}</span>
                </div>
              </div>
              <div className="col-span-1 flex justify-end">
                <Button
                  variant="ghost"
                  size="sm"
                  className="h-8 w-8 p-0"
                  onClick={(e) => { e.stopPropagation(); router.push(`/management/receipts/${r.id}`); }}
                >
                  <Eye className="w-4 h-4" />
                </Button>
              </div>
            </div>
          ))
        )}
      </div>

      {/* Data Cards — Mobile */}
      <div className="md:hidden space-y-3">
        {isLoading ? (
          <div className="px-4 py-8 text-center text-muted-foreground bg-white rounded-xl border border-border/50">กำลังโหลดข้อมูล...</div>
        ) : paginatedReceipts.length === 0 ? (
          <div className="px-4 py-8 text-center text-muted-foreground bg-white rounded-xl border border-border/50">ไม่พบข้อมูล</div>
        ) : (
          paginatedReceipts.map((r: Receipt) => (
            <div
              key={r.id}
              className="bg-white rounded-2xl border border-border/30 shadow-sm hover:shadow-md active:scale-[0.98] transition-all duration-200 p-4 cursor-pointer"
              onClick={() => router.push(`/management/receipts/${r.id}`)}
            >
              {/* Top: logo | receipt_no + badge | total */}
              <div className="flex items-start gap-3 mb-3">
                {/* Logo */}
                <div className="shrink-0">
                  {channelMap.get(r.channel_code)?.cover_url ? (
                    <img src={channelMap.get(r.channel_code)!.cover_url!} alt="" className="w-11 h-11 rounded-xl object-cover shadow-sm" />
                  ) : (
                    <div className="w-11 h-11 rounded-xl bg-gradient-to-br from-primary to-primary-dark flex items-center justify-center text-sm font-bold text-white shadow-sm">{r.channel_code.charAt(0)}</div>
                  )}
                </div>

                {/* Middle: receipt_no + badge */}
                <div className="flex-1 min-w-0">
                  <div className="font-mono font-semibold text-sm text-primary truncate">{r.receipt_no}</div>
                  <span className="inline-block mt-1.5 px-2.5 py-0.5 rounded-full text-[11px] font-medium bg-action/15 text-action">{channelMap.get(r.channel_code)?.name || r.channel_code}</span>
                </div>

                {/* Right: total */}
                <div className="text-right shrink-0">
                  <div className="text-lg font-bold text-primary">฿{r.grand_total.toLocaleString()}</div>
                </div>
              </div>

              {/* Divider */}
              <div className="h-px bg-border/40 mb-3"></div>

              {/* Bottom: customer + date + toggle */}
              <div className="flex items-center justify-between">
                <div className="min-w-0">
                  <div className="text-sm font-medium text-foreground truncate">{r.customer_name || '-'}</div>
                  <div className="text-xs text-muted-foreground mt-0.5">{toBuddhistDate(r.bill_date)}</div>
                </div>
                <div onClick={(e) => e.stopPropagation()} className="flex items-center gap-1.5 shrink-0 ml-3">
                  {r.status === 'cancelled' && (
                    <span className="text-[10px] font-medium text-destructive">ยกเลิก</span>
                  )}
                  <ToggleSwitch
                    on={r.status === 'active'}
                    onToggle={() => handleStatusToggle(r.id, r.status)}
                    size="sm"
                    disabled={statusMutation.isPending}
                  />
                </div>
              </div>
            </div>
          ))
        )}
      </div>

      {/* Pagination */}
      {!isLoading && (
        <div className="flex items-center justify-between mt-4 text-sm text-muted-foreground">
          <span>
            {totalCount > 0
              ? `แสดง ${rowOffset + 1}–${Math.min(rowOffset + PAGE_SIZE, totalCount)} จาก ${totalCount} รายการ`
              : 'ไม่มีข้อมูล'}
          </span>
          <div className="flex items-center gap-1">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setPage((p) => Math.max(1, p - 1))}
              disabled={safePage <= 1}
              className="h-8 w-8 p-0"
            >
              <ChevronLeft className="w-4 h-4" />
            </Button>

            {getVisiblePages().map((p, idx) =>
              p === '...' ? (
                <span key={`ellipsis-${idx}`} className="px-1 text-muted-foreground select-none">...</span>
              ) : (
                <Button
                  key={p}
                  variant={p === safePage ? 'primary' : 'ghost'}
                  size="sm"
                  onClick={() => setPage(p)}
                  className="h-8 min-w-[32px] px-2"
                >
                  {p}
                </Button>
              ),
            )}

            <Button
              variant="ghost"
              size="sm"
              onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
              disabled={safePage >= totalPages}
              className="h-8 w-8 p-0"
            >
              <ChevronRight className="w-4 h-4" />
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}
