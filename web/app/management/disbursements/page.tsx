'use client';

import { useState, useEffect, useRef, useMemo } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useRouter } from 'next/navigation';
import { ChevronLeft, ChevronRight, Eye, X, Plus, Wallet } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { InputDate } from '@/components/ui/input-date';
import { Button } from '@/components/ui/button';
import { ToggleSwitch } from '@/components/ui/toggle-switch';
import { cn } from '@/lib/utils';
import { toast } from '@/lib/toast';
import {
  getDisbursements,
  updateDisbursementStatus,
} from '@/lib/db';
import {
  DISBURSEMENT_STATUS_LABELS,
  type Disbursement,
  type DisbursementStatus,
} from '@/types/disbursement';

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

export default function DisbursementsPage() {
  const router = useRouter();
  const queryClient = useQueryClient();
  const [search, setSearch] = useState('');
  const [debouncedSearch, setDebouncedSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
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

  const { data: disbursements = [], isLoading } = useQuery({
    queryKey: ['disbursements', debouncedSearch, statusFilter, dateFilter],
    queryFn: () => getDisbursements({
      search: debouncedSearch || undefined,
      status: (statusFilter || undefined) as DisbursementStatus | undefined,
      withdraw_date: dateFilter || undefined,
    }),
  });

  const statusMutation = useMutation({
    mutationFn: ({ id, status }: { id: number; status: 'paid' | 'unpaid' }) =>
      updateDisbursementStatus(id, status),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['disbursements'] });
      toast({ title: 'สำเร็จ', description: 'อัปเดตสถานะเรียบร้อย' });
    },
    onError: (err) => {
      toast({ title: 'เกิดข้อผิดพลาด', description: err.message });
    },
  });

  const handleStatusToggle = (id: number, currentStatus: string) => {
    const next = currentStatus === 'paid' ? 'unpaid' : 'paid';
    statusMutation.mutate({ id, status: next });
  };

  const handleClearDate = () => {
    setDateFilter('');
    setPage(1);
  };

  // Paginate
  const totalCount = disbursements.length;
  const totalPages = Math.max(1, Math.ceil(totalCount / PAGE_SIZE));
  const safePage = Math.min(page, totalPages);
  const paginated = disbursements.slice(
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

  // สรุปยอด
  const summary = useMemo(() => {
    return disbursements.reduce(
      (acc, d) => {
        const amt = Number(d.amount || 0);
        acc.total += amt;
        if (d.status === 'paid') acc.paid += amt;
        else acc.unpaid += amt;
        return acc;
      },
      { total: 0, paid: 0, unpaid: 0 },
    );
  }, [disbursements]);

  return (
    <div className="w-full">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-semibold text-primary">รายการเบิกเงิน</h1>
          <p className="text-sm text-muted-foreground mt-0.5">
            บันทึกรายการเบิก พร้อมราคา วันที่ และสถานะจ่ายแล้ว / ค้างจ่าย
          </p>
        </div>
        <Button variant="primary" className="text-white" onClick={() => router.push('/management/disbursements/create')}>
          <Plus className="w-4 h-4 mr-1" />
          สร้างเบิก
        </Button>
      </div>

      {/* สรุปยอด */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 mb-5">
        <div className="rounded-xl bg-surface/60 border border-border/50 px-5 py-3 flex items-center gap-3">
          <div className="w-9 h-9 rounded-lg bg-primary/10 flex items-center justify-center text-primary">
            <Wallet className="w-4 h-4" />
          </div>
          <div>
            <p className="text-xs text-muted-foreground">เบิกรวมทั้งหมด</p>
            <p className="text-lg font-bold text-primary">฿{summary.total.toLocaleString()}</p>
          </div>
        </div>
        <div className="rounded-xl bg-success/10 border border-success/20 px-5 py-3 flex items-center gap-3">
          <div className="w-9 h-9 rounded-lg bg-success/15 flex items-center justify-center text-success">
            <Wallet className="w-4 h-4" />
          </div>
          <div>
            <p className="text-xs text-muted-foreground">จ่ายแล้ว</p>
            <p className="text-lg font-bold text-success">฿{summary.paid.toLocaleString()}</p>
          </div>
        </div>
        <div className="rounded-xl bg-destructive/10 border border-destructive/20 px-5 py-3 flex items-center gap-3">
          <div className="w-9 h-9 rounded-lg bg-destructive/15 flex items-center justify-center text-destructive">
            <Wallet className="w-4 h-4" />
          </div>
          <div>
            <p className="text-xs text-muted-foreground">ค้างจ่าย</p>
            <p className="text-lg font-bold text-destructive">฿{summary.unpaid.toLocaleString()}</p>
          </div>
        </div>
      </div>

      {/* Filters — inline */}
      <div className="flex flex-wrap items-center gap-3 mb-6">
        {/* Search */}
        <div className="relative max-w-xs flex-1 min-w-[200px]">
          <Input
            placeholder="ค้นหาเลขที่เบิก / รายการ / หมายเหตุ..."
            value={search}
            onChange={(e) => handleSearchChange(e.target.value)}
          />
        </div>

        {/* Date filter */}
        <div className="relative w-[124px]">
          <InputDate
            value={dateFilter}
            onValueChange={(date) => { setDateFilter(date); setPage(1); }}
            placeholder="วันที่เบิก"
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

        {/* Status filter */}
        <select
          value={statusFilter}
          onChange={(e) => { setStatusFilter(e.target.value); setPage(1); }}
          className="h-10 rounded-lg border border-border bg-white px-3 text-sm text-primary focus:outline-none focus:ring-2 focus:ring-action min-w-[140px]"
        >
          <option value="">ทุกสถานะ</option>
          <option value="unpaid">ค้างจ่าย</option>
          <option value="paid">จ่ายแล้ว</option>
        </select>
      </div>

      {/* Data Table — Desktop */}
      <div className="hidden md:block w-full bg-white rounded-xl border border-border/50 overflow-hidden">
        {/* Header */}
        <div className="grid grid-cols-12 gap-3 px-4 py-3 bg-surface/60 border-b border-border/50 text-sm font-medium text-muted-foreground">
          <div className="col-span-2">เลขที่เบิก</div>
          <div className="col-span-2">วันที่เบิก</div>
          <div className="col-span-3">รายการ</div>
          <div className="col-span-2 text-right">ราคา</div>
          <div className="col-span-2 text-center">สถานะการจ่าย</div>
          <div className="col-span-1 text-right">&nbsp;</div>
        </div>

        {/* Data Rows */}
        {isLoading ? (
          <div className="px-4 py-8 text-center text-muted-foreground">กำลังโหลดข้อมูล...</div>
        ) : paginated.length === 0 ? (
          <div className="px-4 py-8 text-center text-muted-foreground">ไม่พบข้อมูล</div>
        ) : (
          paginated.map((d: Disbursement, i: number) => (
            <div
              key={d.id}
              className={cn(
                "grid grid-cols-12 gap-3 p-4 border-b transition-colors text-sm cursor-pointer hover:bg-surface h-[76px] items-center",
                i === paginated.length - 1 && 'border-b-0',
              )}
              onClick={() => router.push(`/management/disbursements/${d.id}`)}
            >
              <div className="col-span-2 h-full">
                <span className="text-md font-medium text-primary font-mono">{d.withdraw_no}</span>
              </div>
              <div className="col-span-2 h-full space-y-1">
                <div>{toBuddhistDate(d.withdraw_date)}</div>
                <div className="text-xs text-gray-400">สร้างเมื่อ {toBuddhistDateTime(d.created_at)}</div>
              </div>
              <div className="col-span-3 h-full">
                <p className="font-medium text-primary truncate">{d.description}</p>
                {d.note && (
                  <p className="text-xs text-muted-foreground truncate">{d.note}</p>
                )}
              </div>
              <div className="col-span-2 h-full text-right font-semibold text-primary">
                ฿{Number(d.amount).toLocaleString()}
              </div>
              <div className="col-span-2 h-full flex justify-center items-start" onClick={(e) => e.stopPropagation()}>
                <div className="flex flex-col items-center gap-1">
                  <ToggleSwitch
                    on={d.status === 'paid'}
                    onToggle={() => handleStatusToggle(d.id, d.status)}
                    size="sm"
                    disabled={statusMutation.isPending}
                  />
                  <span className={cn(
                    "text-[10px] font-medium whitespace-nowrap",
                    d.status === 'paid' ? "text-success" : "text-destructive",
                  )}>
                    {DISBURSEMENT_STATUS_LABELS[d.status]}
                  </span>
                </div>
              </div>
              <div className="col-span-1 flex justify-end">
                <Button
                  variant="ghost"
                  size="sm"
                  className="h-8 w-8 p-0"
                  onClick={(e) => { e.stopPropagation(); router.push(`/management/disbursements/${d.id}`); }}
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
        ) : paginated.length === 0 ? (
          <div className="px-4 py-8 text-center text-muted-foreground bg-white rounded-xl border border-border/50">ไม่พบข้อมูล</div>
        ) : (
          paginated.map((d: Disbursement) => (
            <div
              key={d.id}
              className="bg-white rounded-xl border border-border/50 p-4 cursor-pointer active:bg-surface transition-colors"
              onClick={() => router.push(`/management/disbursements/${d.id}`)}
            >
              <div className="flex items-start gap-3 mb-2">
                <div className="flex-1 min-w-0">
                  <div className="font-mono font-medium text-sm truncate">{d.withdraw_no}</div>
                  <p className="text-sm font-medium text-primary truncate mt-0.5">{d.description}</p>
                </div>
                <div className="text-right shrink-0">
                  <div className="font-bold text-primary">฿{Number(d.amount).toLocaleString()}</div>
                </div>
              </div>

              <div className="text-xs text-muted-foreground">{toBuddhistDate(d.withdraw_date)}</div>

              <div className="flex items-center justify-end mt-2" onClick={(e) => e.stopPropagation()}>
                <span className={cn(
                  "text-[11px] font-medium mr-1.5",
                  d.status === 'paid' ? "text-success" : "text-destructive",
                )}>
                  {DISBURSEMENT_STATUS_LABELS[d.status]}
                </span>
                <ToggleSwitch
                  on={d.status === 'paid'}
                  onToggle={() => handleStatusToggle(d.id, d.status)}
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
