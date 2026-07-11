'use client';

import { useState, useEffect, useRef } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useRouter } from 'next/navigation';
import { PlusCircle, Edit2, ChevronLeft, ChevronRight } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { ToggleSwitch } from '@/components/ui/toggle-switch';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { toast } from '@/lib/toast';
import { getProductAddons, updateProductAddon } from '@/lib/db';

const PAGE_SIZE = 7;

export default function AddonsPage() {
  const router = useRouter();
  const queryClient = useQueryClient();
  const [search, setSearch] = useState('');
  const [debouncedSearch, setDebouncedSearch] = useState('');
  const [page, setPage] = useState(1);
  const debounceTimer = useRef<ReturnType<typeof setTimeout>>(null);

  // Debounce search input — 300ms
  const handleSearchChange = (value: string) => {
    setSearch(value);
    setPage(1);
    if (debounceTimer.current) clearTimeout(debounceTimer.current);
    debounceTimer.current = setTimeout(() => setDebouncedSearch(value), 300);
  };

  // Cleanup timer on unmount
  useEffect(() => {
    return () => { if (debounceTimer.current) clearTimeout(debounceTimer.current); };
  }, []);

  const { data: addons = [], isLoading } = useQuery({
    queryKey: ['product_addons', debouncedSearch],
    queryFn: () => getProductAddons(debouncedSearch),
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, is_active }: { id: number; is_active: boolean }) =>
      updateProductAddon(id, { is_active }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['product_addons'] });
      toast({ title: 'สำเร็จ!', description: 'อัปเดตสถานะสำเร็จ' });
    },
    onError: (error) => {
      toast({ title: 'เกิดข้อผิดพลาด', description: error.message });
    },
  });

  const handleToggle = (id: number, currentStatus: boolean) => {
    updateMutation.mutate({ id, is_active: !currentStatus });
  };

  const handleEdit = (id: number) => {
    router.push(`/management/addons/${id}/edit`);
  };

  const handleCreate = () => {
    router.push('/management/addons/create');
  };

  // Paginate (data already filtered by backend)
  const totalCount = addons.length;
  const totalPages = Math.max(1, Math.ceil(totalCount / PAGE_SIZE));
  const safePage = Math.min(page, totalPages);
  const paginatedAddons = addons.slice(
    (safePage - 1) * PAGE_SIZE,
    safePage * PAGE_SIZE,
  );

  // Generate visible page numbers
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
    <div className='w-full'>
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold text-primary">ตัวเลือกสินค้า</h1>
        <Button onClick={handleCreate} className="gap-2 text-sm">
          <PlusCircle className="w-4 h-4" /> เพิ่มตัวเลือก
        </Button>
      </div>

      {/* Search */}
      <div className="mb-6 max-w-md">
        <Input
          placeholder="ค้นหาตัวเลือก..."
          value={search}
          onChange={(e) => handleSearchChange(e.target.value)}
        />
      </div>

      {/* Data Table */}
      <div className="w-full bg-white rounded-xl border border-border/50 overflow-hidden">
        {/* Header Row */}
        <div className="grid grid-cols-12 gap-4 px-4 py-3 bg-surface/60 border-b border-border/50 text-sm font-semibold text-muted-foreground">
          <div className="col-span-1">#</div>
          <div className="col-span-3">ชื่อตัวเลือก</div>
          <div className="col-span-2 text-start">ราคา</div>
          <div className="col-span-2 text-center">สถานะ</div>
          <div className="col-span-4 text-right">&nbsp;</div>
        </div>

        {/* Data Rows */}
        {isLoading ? (
          <div className="px-4 py-8 text-center text-muted-foreground">
            กำลังโหลดข้อมูล...
          </div>
        ) : paginatedAddons.length === 0 ? (
          <div className="px-4 py-8 text-center text-muted-foreground">
            ไม่พบข้อมูล
          </div>
        ) : (
          paginatedAddons.map((addon, i) => (
            <div
              key={addon.id}
              className={cn(
                "grid grid-cols-12 gap-4 px-4 py-3 border-b transition-colors text-sm",
                i === paginatedAddons.length - 1 && 'border-b-0',
                "hover:bg-surface",
              )}
            >
              <div className="col-span-1 text-muted-foreground">{rowOffset + i + 1}</div>
              <div className="col-span-3 font-medium text-primary">{addon.name}</div>
              <div className="col-span-2 flex items-center justify-start">
                <span className="text-primary">+฿{addon.base_price.toLocaleString()}</span>
              </div>
              <div className="col-span-2 flex items-center justify-center">
                <ToggleSwitch
                  on={addon.is_active}
                  onToggle={() => handleToggle(addon.id, addon.is_active)}
                  size="sm"
                  disabled={updateMutation.isPending}
                />
              </div>
              <div className="col-span-4 flex items-center justify-end">
                <Button
                  variant="default"
                  size="sm"
                  onClick={() => handleEdit(addon.id)}
                  disabled={updateMutation.isPending}
                  className="h-[34px] px-3 rounded-lg"
                >
                  <Edit2 className="w-4 h-4 mr-1.5" />
                  แก้ไข
                </Button>
              </div>
            </div>
          ))
        )}
      </div>

      {/* Pagination — always visible when not loading */}
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
                <span key={`ellipsis-${idx}`} className="px-1 text-muted-foreground select-none">
                  ...
                </span>
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

export const dynamic = 'force-dynamic';
