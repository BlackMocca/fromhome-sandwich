'use client';

import { useState, useEffect, useRef, useMemo } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useRouter } from 'next/navigation';
import { ChevronLeft, ChevronRight, Eye, X, Plus, PackageX } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { InputDate } from '@/components/ui/input-date';
import { Button } from '@/components/ui/button';
import { ToggleSwitch } from '@/components/ui/toggle-switch';
import { cn } from '@/lib/utils';
import { toast } from '@/lib/toast';
import {
  getClaims,
  updateClaimStatus,
} from '@/lib/db';
import {
  CLAIM_REASON_LABELS,
  type Claim,
  type ClaimReason,
} from '@/types/claim';

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

const REASON_BADGE: Record<ClaimReason, string> = {
  expired: 'bg-action/15 text-action',
  damaged: 'bg-destructive/15 text-destructive',
  lost: 'bg-primary/15 text-primary',
  other: 'bg-surface text-muted-foreground',
};

export default function ClaimsPage() {
  const router = useRouter();
  const queryClient = useQueryClient();
  const [search, setSearch] = useState('');
  const [debouncedSearch, setDebouncedSearch] = useState('');
  const [reasonFilter, setReasonFilter] = useState('');
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

  const { data: claims = [], isLoading } = useQuery({
    queryKey: ['claims', debouncedSearch, reasonFilter, dateFilter],
    queryFn: () => getClaims({
      search: debouncedSearch || undefined,
      reason: (reasonFilter || undefined) as ClaimReason | undefined,
      claim_date: dateFilter || undefined,
    }),
  });

  const statusMutation = useMutation({
    mutationFn: ({ id, status }: { id: number; status: 'active' | 'cancelled' }) =>
      updateClaimStatus(id, status),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['claims'] });
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
  const totalCount = claims.length;
  const totalPages = Math.max(1, Math.ceil(totalCount / PAGE_SIZE));
  const safePage = Math.min(page, totalPages);
  const paginatedClaims = claims.slice(
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

  const totalLoss = useMemo(
    () => claims.filter(c => c.status === 'active').reduce((s, c) => s + Number(c.total_cost || 0), 0),
    [claims],
  );

  return (
    <div className="w-full">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-semibold text-primary">รายการเคลมสินค้า</h1>
          <p className="text-sm text-muted-foreground mt-0.5">
            สินค้าหมดอายุ / เสียหาย / สูญหาย — ต้นทุนที่ยังคงอยู่กับเรา
          </p>
        </div>
        <Button variant="primary" className="text-white" onClick={() => router.push('/management/claims/create')}>
          <Plus className="w-4 h-4 mr-1" />
          สร้างเคลม
        </Button>
      </div>

      {/* สรุปยอดต้นทุนของเสีย (active) */}
      <div className="mb-5 rounded-xl bg-destructive/10 border border-destructive/20 px-5 py-3 flex items-center gap-3">
        <div className="w-9 h-9 rounded-lg bg-destructive/15 flex items-center justify-center text-destructive">
          <PackageX className="w-4 h-4" />
        </div>
        <div className="flex-1">
          <p className="text-xs text-muted-foreground">ต้นทุนของเสียสะสม (ที่ยัง active)</p>
          <p className="text-lg font-bold text-destructive">฿{totalLoss.toLocaleString()}</p>
        </div>
      </div>

      {/* Filters — inline */}
      <div className="flex flex-wrap items-center gap-3 mb-6">
        {/* Search */}
        <div className="relative max-w-xs flex-1 min-w-[200px]">
          <Input
            placeholder="ค้นหาเลขที่เคลม / หมายเหตุ..."
            value={search}
            onChange={(e) => handleSearchChange(e.target.value)}
          />
        </div>

        {/* Date filter */}
        <div className="relative w-[124px]">
          <InputDate
            value={dateFilter}
            onValueChange={(date) => { setDateFilter(date); setPage(1); }}
            placeholder="วันที่เคลม"
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

        {/* Reason filter */}
        <select
          value={reasonFilter}
          onChange={(e) => { setReasonFilter(e.target.value); setPage(1); }}
          className="h-10 rounded-lg border border-border bg-white px-3 text-sm text-primary focus:outline-none focus:ring-2 focus:ring-action min-w-[140px]"
        >
          <option value="">ทุกเหตุผล</option>
          {(Object.keys(CLAIM_REASON_LABELS) as ClaimReason[]).map((r) => (
            <option key={r} value={r}>{CLAIM_REASON_LABELS[r]}</option>
          ))}
        </select>
      </div>

      {/* Data Table — Desktop */}
      <div className="hidden md:block w-full bg-white rounded-xl border border-border/50 overflow-hidden">
        {/* Header */}
        <div className="grid grid-cols-12 gap-3 px-4 py-3 bg-surface/60 border-b border-border/50 text-sm font-medium text-muted-foreground">
          <div className="col-span-2">เลขที่เคลม</div>
          <div className="col-span-2">วันที่เคลม</div>
          <div className="col-span-2">เหตุผล</div>
          <div className="col-span-1 text-center">จำนวน</div>
          <div className="col-span-2 text-right">ต้นทุนของเสีย</div>
          <div className="col-span-2 text-center">สถานะ</div>
          <div className="col-span-1 text-right">&nbsp;</div>
        </div>

        {/* Data Rows */}
        {isLoading ? (
          <div className="px-4 py-8 text-center text-muted-foreground">กำลังโหลดข้อมูล...</div>
        ) : paginatedClaims.length === 0 ? (
          <div className="px-4 py-8 text-center text-muted-foreground">ไม่พบข้อมูล</div>
        ) : (
          paginatedClaims.map((c: Claim, i: number) => (
            <div
              key={c.id}
              className={cn(
                "grid grid-cols-12 gap-3 p-4 border-b transition-colors text-sm cursor-pointer hover:bg-surface h-[76px] items-center",
                i === paginatedClaims.length - 1 && 'border-b-0',
              )}
              onClick={() => router.push(`/management/claims/${c.id}`)}
            >
              <div className="col-span-2 h-full">
                <span className="text-md font-medium text-primary font-mono">{c.claim_no}</span>
              </div>
              <div className="col-span-2 h-full space-y-1">
                <div>{toBuddhistDate(c.claim_date)}</div>
                <div className="text-xs text-gray-400">สร้างเมื่อ {toBuddhistDateTime(c.created_at)}</div>
              </div>
              <div className="col-span-2 h-full">
                <span className={cn("inline-flex items-center px-2 py-0.5 rounded-full text-[11px] font-medium", REASON_BADGE[c.reason])}>
                  {CLAIM_REASON_LABELS[c.reason]}
                </span>
              </div>
              <div className="col-span-1 h-full text-center font-medium text-primary">
                {c.total_quantity} ชิ้น
              </div>
              <div className="col-span-2 h-full text-right font-semibold text-destructive">
                ฿{Number(c.total_cost).toLocaleString()}
              </div>
              <div className="col-span-2 h-full flex justify-center items-start" onClick={(e) => e.stopPropagation()}>
                <div className="flex flex-col items-center gap-1">
                  <ToggleSwitch
                    on={c.status === 'active'}
                    onToggle={() => handleStatusToggle(c.id, c.status)}
                    size="sm"
                    disabled={statusMutation.isPending}
                  />
                  <span className="text-[10px] font-medium text-destructive whitespace-nowrap">{c.status === 'cancelled' && "ยกเลิก"}</span>
                </div>
              </div>
              <div className="col-span-1 flex justify-end">
                <Button
                  variant="ghost"
                  size="sm"
                  className="h-8 w-8 p-0"
                  onClick={(e) => { e.stopPropagation(); router.push(`/management/claims/${c.id}`); }}
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
        ) : paginatedClaims.length === 0 ? (
          <div className="px-4 py-8 text-center text-muted-foreground bg-white rounded-xl border border-border/50">ไม่พบข้อมูล</div>
        ) : (
          paginatedClaims.map((c: Claim) => (
            <div
              key={c.id}
              className="bg-white rounded-xl border border-border/50 p-4 cursor-pointer active:bg-surface transition-colors"
              onClick={() => router.push(`/management/claims/${c.id}`)}
            >
              {/* Top: claim_no + reason badge | total cost */}
              <div className="flex items-start gap-3 mb-2">
                <div className="flex-1 min-w-0">
                  <div className="font-mono font-medium text-sm truncate">{c.claim_no}</div>
                  <span className={cn("inline-flex items-center px-2 py-0.5 rounded-full text-[11px] font-medium mt-1", REASON_BADGE[c.reason])}>
                    {CLAIM_REASON_LABELS[c.reason]}
                  </span>
                </div>
                <div className="text-right shrink-0">
                  <div className="text-xs text-muted-foreground">ต้นทุนของเสีย</div>
                  <div className="font-bold text-destructive">฿{Number(c.total_cost).toLocaleString()}</div>
                </div>
              </div>

              <div className="text-sm text-muted-foreground truncate">{toBuddhistDate(c.claim_date)} · {c.total_quantity} ชิ้น</div>

              <div className="flex items-center justify-end mt-2" onClick={(e) => e.stopPropagation()}>
                {c.status === 'cancelled' && (
                  <span className="text-[10px] font-medium text-destructive mr-1.5">ยกเลิก</span>
                )}
                <ToggleSwitch
                  on={c.status === 'active'}
                  onToggle={() => handleStatusToggle(c.id, c.status)}
                  size="sm"
                  disabled={statusMutation.isPending}
                />
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
