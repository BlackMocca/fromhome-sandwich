'use client';

import { useState, useEffect, useRef } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useRouter } from 'next/navigation';
import { ChevronLeft, ChevronRight, Eye, X, Plus, Trash2 } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { toast } from '@/lib/toast';
import { getIngredientPurchases, deleteIngredientPurchase } from '@/lib/db';

const PAGE_SIZE = 15;

function toBuddhistDate(dateStr: string): string {
  const months = ['ม.ค.', 'ก.พ.', 'มี.ค.', 'เม.ย.', 'พ.ค.', 'มิ.ย.', 'ก.ค.', 'ส.ค.', 'ก.ย.', 'ต.ค.', 'พ.ย.', 'ธ.ค.'];
  const [y, m, d] = dateStr.split('-').map(Number);
  return `${d} ${months[m - 1]} ${y + 543}`;
}

export default function IngredientPurchasesPage() {
  const router = useRouter();
  const queryClient = useQueryClient();
  
  const [ingredientFilter, setIngredientFilter] = useState('');
  const [dateFromFilter, setDateFromFilter] = useState('');
  const [dateToFilter, setDateToFilter] = useState('');
  const [page, setPage] = useState(1);

  // Fetch ingredient purchases with filters
  const { data: purchases = [], isLoading } = useQuery({
    queryKey: ['ingredient-purchases', ingredientFilter, dateFromFilter, dateToFilter],
    queryFn: () => getIngredientPurchases({
      search: undefined,
      ingredient_id: ingredientFilter ? Number(ingredientFilter) : undefined,
      purchase_date_from: dateFromFilter || undefined,
      purchase_date_to: dateToFilter || undefined,
    }),
  });

  const deleteMutation = useMutation({
    mutationFn: (id: number) => deleteIngredientPurchase(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['ingredient-purchases'] });
      toast({ title: 'สำเร็จ', description: 'ลบลำบบันทึกการซื้อวัตถุดิบเรียบร้อย' });
    },
    onError: (err) => {
      toast({ title: 'เกิดข้อผิดพลาด', description: err.message || 'ไม่สามารถลบข้อมูลได้' });
    },
  });

  const handleDelete = (id: number, ingredientName?: string) => {
    if (!confirm(`คุณต้องการลบบันทึกการซื้อ "${ingredientName}" หรือไม่? การดำเนินการนี้ไม่สามารถยกเลิกได้`)) {
      return;
    }
    deleteMutation.mutate(id);
  };

  // Paginate
  const totalCount = purchases.length;
  const totalPages = Math.max(1, Math.ceil(totalCount / PAGE_SIZE));
  const safePage = Math.min(page, totalPages);
  const paginatedPurchases = purchases.slice(
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

  // Filter clear handlers
  const handleClearIngredientFilter = () => { setIngredientFilter(''); setPage(1); };
  const handleClearDateFrom = () => { setDateFromFilter(''); setPage(1); };
  const handleClearDateTo = () => { setDateToFilter(''); setPage(1); };

  return (
    <div className="w-full">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-semibold text-primary">รายการซื้อวัตถุดิบ</h1>
        <Button variant="primary" className="text-white" onClick={() => router.push('/management/ingredient-purchases/create')}>
          <Plus className="w-4 h-4 mr-1" />
          บันทึกการซื้อใหม่
        </Button>
      </div>

      {/* Filters — inline */}
      <div className="flex flex-wrap items-center gap-3 mb-6">
        {/* Ingredient filter (simple text input for ingredient_id or name search) */}
        <div className="relative max-w-xs flex-1 min-w-[200px]">
          <Input
            placeholder="ค้นหาวัตถุดิบ (ID หรือชื่อ)..."
            value={ingredientFilter}
            onChange={(e) => { setIngredientFilter(e.target.value); setPage(1); }}
          />
        </div>

        {/* Date from filter */}
        <input
          type="date"
          value={dateFromFilter}
          onChange={(e) => { setDateFromFilter(e.target.value); setPage(1); }}
          className="h-10 rounded-lg border border-border bg-white px-3 text-sm text-primary focus:outline-none focus:ring-2 focus:ring-action min-w-[140px]"
        />
        
        {/* Date to filter */}
        <input
          type="date"
          value={dateToFilter}
          onChange={(e) => { setDateToFilter(e.target.value); setPage(1); }}
          className="h-10 rounded-lg border border-border bg-white px-3 text-sm text-primary focus:outline-none focus:ring-2 focus:ring-action min-w-[140px]"
        />

        {/* Clear filters buttons */}
        <div className="flex gap-2">
          {ingredientFilter && (
            <Button variant="ghost" size="sm" onClick={handleClearIngredientFilter}>
              <X className="w-3 h-3 mr-1" /> ล้างวัตถุดิบ
            </Button>
          )}
          {(dateFromFilter || dateToFilter) && (
            <Button variant="ghost" size="sm" onClick={() => { setDateFromFilter(''); setDateToFilter(''); setPage(1); }}>
              <X className="w-3 h-3 mr-1" /> ล้างวันที่
            </Button>
          )}
        </div>
      </div>

      {/* Data Table — Desktop */}
      <div className="hidden md:block w-full bg-white rounded-xl border border-border/50 overflow-hidden">
        {/* Header */}
        <div className="grid grid-cols-12 gap-3 px-4 py-3 bg-surface/60 border-b border-border/50 text-sm font-medium text-muted-foreground">
          <div className="col-span-2">วันที่ซื้อ</div>
          <div className="col-span-3">ชื่อวัตถุดิบ / หน่วย</div>
          <div className="col-span-1 text-center">จำนวน</div>
          <div className="col-span-2 text-right">ยอดรวม (บาท)</div>
          <div className="col-span-3">หมายเหตุ</div>
          <div className="col-span-1 text-right">&nbsp;</div>
        </div>

        {/* Data Rows */}
        {isLoading ? (
          <div className="px-4 py-8 text-center text-muted-foreground">กำลังโหลดข้อมูล...</div>
        ) : paginatedPurchases.length === 0 ? (
          <div className="px-4 py-8 text-center text-muted-foreground">ไม่พบข้อมูล</div>
        ) : (
          paginatedPurchases.map((p: any, i: number) => {
            // Extract ingredient name from the embedded data or fallback to placeholder
            const ingredientName = p.ingredients?.name || `ID ${p.ingredient_id}`;
            return (
              <div
                key={p.id}
                className={cn(
                  "grid grid-cols-12 gap-3 p-4 border-b transition-colors text-sm hover:bg-surface h-[76px] items-center",
                  i === paginatedPurchases.length - 1 && 'border-b-0',
                )}
              >
                <div className="col-span-2 h-full">
                  <span className="text-md font-medium text-primary">{toBuddhistDate(p.purchase_date)}</span>
                </div>
                <div className="col-span-3 h-full space-y-1">
                  <div className="font-medium text-primary truncate">{ingredientName}</div>
                  <div className="text-xs text-muted-foreground">{p.unit || 'ชิ้น'}</div>
                </div>
                <div className="col-span-1 h-full text-center font-medium text-primary ">
                  {Number(p.quantity).toLocaleString('th-TH', { maximumFractionDigits: 3 })}
                </div>
                <div className="col-span-2 h-full text-right font-semibold text-success">
                  ฿{Number(p.amount || p.total_cost || 0).toLocaleString()}
                </div>
                <div className="col-span-3 h-full text-sm truncate text-muted-foreground">{p.note || '-'}</div>
                <div className="col-span-1 flex justify-end items-center gap-2" onClick={(e) => e.stopPropagation()}>
                  {/* Edit button */}
                  <Button
                    variant="ghost"
                    size="sm"
                    className="h-8 w-8 p-0 text-action hover:text-action-dark"
                    onClick={() => router.push(`/management/ingredient-purchases/${p.id}/edit`)}
                  >
                    <Eye className="w-4 h-4" />
                  </Button>
                  {/* Delete button */}
                  <Button
                    variant="ghost"
                    size="sm"
                    className="h-8 w-8 p-0 text-destructive hover:text-destructive-dark"
                    onClick={() => handleDelete(p.id, ingredientName)}
                  >
                    <Trash2 className="w-4 h-4" />
                  </Button>
                </div>
              </div>
            );
          })
        )}
      </div>

      {/* Data Cards — Mobile */}
      <div className="md:hidden space-y-3">
        {isLoading ? (
          <div className="px-4 py-8 text-center text-muted-foreground bg-white rounded-xl border border-border/50">กำลังโหลดข้อมูล...</div>
        ) : paginatedPurchases.length === 0 ? (
          <div className="px-4 py-8 text-center text-muted-foreground bg-white rounded-xl border border-border/50">ไม่พบข้อมูล</div>
        ) : (
          paginatedPurchases.map((p: any) => {
            const ingredientName = p.ingredients?.name || `ID ${p.ingredient_id}`;
            return (
              <div
                key={p.id}
                className="bg-white rounded-xl border border-border/50 p-4 cursor-pointer active:bg-surface transition-colors"
              >
                {/* Top: date + amount */}
                <div className="flex items-start justify-between mb-2">
                  <span className="text-sm text-muted-foreground">{toBuddhistDate(p.purchase_date)}</span>
                  <span className="font-bold text-success">฿{Number(p.amount || p.total_cost || 0).toLocaleString()}</span>
                </div>

                {/* Middle: ingredient name + unit */}
                <div className="text-md font-medium text-primary truncate mb-1">{ingredientName}</div>
                <div className="flex items-center justify-between">
                  <span className="text-sm text-muted-foreground">จำนวน: {Number(p.quantity).toLocaleString('th-TH', { maximumFractionDigits: 3 })} {p.unit || 'ชิ้น'}</span>
                  <span className="text-xs text-muted-foreground truncate max-w-[120px]">{p.note || '-'}</span>
                </div>

                {/* Actions */}
                <div className="flex justify-end gap-2 mt-3" onClick={(e) => e.stopPropagation()}>
                  <Button
                    variant="ghost"
                    size="sm"
                    className="h-8 px-2 text-action hover:text-action-dark"
                    onClick={() => router.push(`/management/ingredient-purchases/${p.id}/edit`)}
                  >
                    แก้ไข
                  </Button>
                  <Button
                    variant="ghost"
                    size="sm"
                    className="h-8 px-2 text-destructive hover:text-destructive-dark"
                    onClick={() => handleDelete(p.id, ingredientName)}
                  >
                    ลบ
                  </Button>
                </div>
              </div>
            );
          })
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

export const dynamic = 'force-dynamic';
