'use client';

import { useState, useEffect, useRef, useMemo } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useRouter } from 'next/navigation';
import { ArrowLeft, Plus, Trash2, Minus, Search, PackageX, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { InputDate } from '@/components/ui/input-date';
import { cn } from '@/lib/utils';
import { toast } from '@/lib/toast';
import { getProducts, getNextClaimNo, createClaim } from '@/lib/db';
import {
  CLAIM_REASON_LABELS,
  type ClaimReason,
} from '@/types/claim';
import type { Product } from '@/types/product';

interface DraftItem {
  productId: number;
  productName: string;
  coverUrl?: string | null;
  unitCost: number;
  quantity: number;
  note: string;
}

const REASON_ICON: Record<ClaimReason, string> = {
  expired: '⏰',
  damaged: '💥',
  lost: '🚫',
  other: '📝',
};

export default function CreateClaimPage() {
  const router = useRouter();
  const queryClient = useQueryClient();

  const [reason, setReason] = useState<ClaimReason>('expired');
  const [claimDate, setClaimDate] = useState(new Date().toISOString().split('T')[0]);
  const [note, setNote] = useState('');
  const [items, setItems] = useState<DraftItem[]>([]);

  // ─── Product picker (search) ──────────────────────────
  const [search, setSearch] = useState('');
  const [debouncedSearch, setDebouncedSearch] = useState('');
  const debounceTimer = useRef<ReturnType<typeof setTimeout>>(null);

  const handleSearchChange = (value: string) => {
    setSearch(value);
    if (debounceTimer.current) clearTimeout(debounceTimer.current);
    debounceTimer.current = setTimeout(() => setDebouncedSearch(value), 300);
  };

  useEffect(() => {
    return () => { if (debounceTimer.current) clearTimeout(debounceTimer.current); };
  }, []);

  const { data: products = [], isLoading: loadingProducts } = useQuery({
    queryKey: ['claim-products', debouncedSearch],
    queryFn: () => getProducts(debouncedSearch || undefined),
  });

  const inCartIds = useMemo(() => new Set(items.map((i) => i.productId)), [items]);

  // ─── Next claim no (for live preview) ─────────────────
  const claimNoQuery = useQuery({
    queryKey: ['claimNo', claimDate],
    queryFn: () => getNextClaimNo(claimDate),
    enabled: !!claimDate,
    staleTime: 30_000,
  });
  const claimNo = claimNoQuery.data || `CLM${claimDate.replace(/-/g, '')}0001`;

  // ─── Derived totals ───────────────────────────────────
  const totalQuantity = items.reduce((s, i) => s + i.quantity, 0);
  const totalCost = items.reduce((s, i) => s + i.unitCost * i.quantity, 0);

  // ─── Item actions ─────────────────────────────────────
  const addProduct = (p: Product) => {
    if (inCartIds.has(p.id)) return;
    setItems((prev) => [
      ...prev,
      {
        productId: p.id,
        productName: p.name,
        coverUrl: p.cover_url ?? null,
        unitCost: Number(p.cost || 0),
        quantity: 1,
        note: '',
      },
    ]);
  };

  const updateItem = (productId: number, patch: Partial<DraftItem>) => {
    setItems((prev) => prev.map((i) => (i.productId === productId ? { ...i, ...patch } : i)));
  };

  const changeQty = (productId: number, delta: number) => {
    setItems((prev) =>
      prev.map((i) =>
        i.productId === productId
          ? { ...i, quantity: Math.max(1, i.quantity + delta) }
          : i,
      ),
    );
  };

  const removeItem = (productId: number) => {
    setItems((prev) => prev.filter((i) => i.productId !== productId));
  };

  // ─── Submit ────────────────────────────────────────────
  const createMutation = useMutation({
    mutationFn: () =>
      createClaim({
        claim_no: claimNo,
        claim_date: claimDate,
        reason,
        note: note.trim() || null,
        total_quantity: totalQuantity,
        total_cost: totalCost,
        items: items.map((i) => ({
          product_id: i.productId,
          product_name: i.productName,
          unit_cost: i.unitCost,
          quantity: i.quantity,
          line_cost: i.unitCost * i.quantity,
          note: i.note.trim() || null,
        })),
      }),
    onSuccess: (res) => {
      queryClient.invalidateQueries({ queryKey: ['claims'] });
      toast({ title: 'สำเร็จ', description: `บันทึกเคลม ${res.claim.claim_no} เรียบร้อย` });
      router.push(`/management/claims/${res.claim.id}`);
    },
    onError: (err) => {
      toast({ title: 'เกิดข้อผิดพลาด', description: err.message });
    },
  });

  const handleSubmit = () => {
    if (items.length === 0) {
      toast({ title: 'กรุณาเลือกสินค้า', description: 'อย่างน้อย 1 รายการ' });
      return;
    }
    createMutation.mutate();
  };

  return (
    <div className="w-full">
      {/* Header */}
      <div className="flex items-start justify-between mb-6">
        <div className="flex items-start gap-3">
          <button
            type="button"
            onClick={() => router.back()}
            className="p-2 rounded-lg hover:bg-surface transition-colors"
          >
            <ArrowLeft className="w-5 h-5 text-primary" />
          </button>
          <div>
            <h1 className="text-2xl font-bold text-primary">สร้างเคลมสินค้า</h1>
            <p className="text-sm text-muted-foreground mt-0.5">
              บันทึกสินค้าที่สูญเสีย โดยต้นทุนยังคงอยู่กับเรา
            </p>
          </div>
        </div>
        <div className="hidden lg:block">
          <Button
            variant="primary"
            className="text-white"
            onClick={handleSubmit}
            disabled={createMutation.isPending || items.length === 0}
          >
            {createMutation.isPending ? <Loader2 className="w-4 h-4 mr-1 animate-spin" /> : <Plus className="w-4 h-4 mr-1" />}
            บันทึกเคลม
          </Button>
        </div>
      </div>

      <div className="flex flex-col lg:flex-row gap-6 items-start w-full">
        {/* ── Left: form ─────────────────────────────── */}
        <div className="w-full space-y-5 flex-1 min-w-0">
          {/* Reason selector */}
          <div className="space-y-2">
            <label className="text-sm font-medium text-primary">
              เหตุผลการเคลม <span className="text-destructive">*</span>
            </label>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
              {(Object.keys(CLAIM_REASON_LABELS) as ClaimReason[]).map((r) => (
                <button
                  key={r}
                  type="button"
                  onClick={() => setReason(r)}
                  className={cn(
                    'flex items-center justify-center gap-1.5 px-3 py-2.5 rounded-xl text-sm font-medium transition-all border',
                    reason === r
                      ? 'bg-primary text-white border-primary shadow-sm'
                      : 'bg-surface text-primary border-border hover:bg-primary/5',
                  )}
                >
                  <span>{REASON_ICON[r]}</span>
                  {CLAIM_REASON_LABELS[r]}
                </button>
              ))}
            </div>
          </div>

          {/* Claim date + claim no */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="space-y-2">
              <label className="text-sm font-medium text-primary">
                วันที่เคลม <span className="text-destructive">*</span>
              </label>
              <InputDate value={claimDate} onValueChange={setClaimDate} className="max-w-xs" />
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium text-primary">เลขที่เคลม</label>
              <Input value={claimNo} readOnly disabled className="bg-surface/50 font-mono" />
            </div>
          </div>

          {/* Note */}
          <div className="space-y-2">
            <label htmlFor="claim-note" className="text-sm font-medium text-primary">
              หมายเหตุ <span className="text-muted-foreground text-xs">(ไม่บังคับ)</span>
            </label>
            <textarea
              id="claim-note"
              placeholder="เช่น Lot ที่ผลิตวันที่ ... / ตู้เย็นเสีย"
              rows={2}
              value={note}
              onChange={(e) => setNote(e.target.value)}
              className="flex w-full rounded-md border border-border bg-surface px-3 py-2 text-sm ring-offset-surface placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-action resize-none"
            />
          </div>

          {/* Product picker */}
          <div className="space-y-2">
            <label className="text-sm font-medium text-primary">เลือกสินค้า</label>
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <Input
                placeholder="ค้นหาชื่อสินค้า..."
                value={search}
                onChange={(e) => handleSearchChange(e.target.value)}
                className="pl-9"
              />
            </div>

            <div className="rounded-xl border border-border/60 bg-white max-h-64 overflow-y-auto divide-y divide-border/40">
              {loadingProducts ? (
                <div className="px-4 py-6 text-center text-sm text-muted-foreground">กำลังโหลด...</div>
              ) : products.length === 0 ? (
                <div className="px-4 py-6 text-center text-sm text-muted-foreground">ไม่พบสินค้า</div>
              ) : (
                products.map((p: Product) => {
                  const added = inCartIds.has(p.id);
                  return (
                    <button
                      key={p.id}
                      type="button"
                      disabled={added}
                      onClick={() => addProduct(p)}
                      className={cn(
                        'w-full flex items-center gap-3 px-3 py-2.5 text-left transition-colors',
                        added ? 'opacity-50 cursor-not-allowed bg-surface/50' : 'hover:bg-surface',
                      )}
                    >
                      <div className="w-10 h-10 rounded-lg bg-surface shrink-0 overflow-hidden flex items-center justify-center">
                        {p.cover_url ? (
                          <img src={p.cover_url} alt={p.name} className="w-full h-full object-cover" />
                        ) : (
                          <span className="text-lg">🥪</span>
                        )}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium text-primary truncate">{p.name}</p>
                        <p className="text-xs text-muted-foreground">ต้นทุน ฿{Number(p.cost || 0).toLocaleString()}</p>
                      </div>
                      {added ? (
                        <span className="text-[11px] font-medium text-success">เพิ่มแล้ว</span>
                      ) : (
                        <Plus className="w-4 h-4 text-action shrink-0" />
                      )}
                    </button>
                  );
                })
              )}
            </div>
          </div>

          {/* Selected items */}
          <div className="space-y-2">
            <label className="text-sm font-medium text-primary">
              รายการที่เคลม <span className="text-muted-foreground text-xs">({items.length})</span>
            </label>

            {items.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-12 text-muted-foreground border border-dashed border-border rounded-xl">
                <PackageX className="w-12 h-12 mb-3 text-primary/20" />
                <p className="text-sm">ยังไม่มีรายการ — เลือกสินค้าข้างต้น</p>
              </div>
            ) : (
              <div className="space-y-3">
                {items.map((item) => (
                  <div key={item.productId} className="rounded-xl border border-border/50 bg-white p-3">
                    <div className="flex items-start gap-3">
                      <div className="w-12 h-12 rounded-lg bg-surface shrink-0 overflow-hidden flex items-center justify-center">
                        {item.coverUrl ? (
                          <img src={item.coverUrl} alt={item.productName} className="w-full h-full object-cover" />
                        ) : (
                          <span className="text-lg">🥪</span>
                        )}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-semibold text-primary truncate">{item.productName}</p>
                        {/* unit cost + qty row */}
                        <div className="flex items-end gap-2 mt-2 flex-wrap">
                          <div className="space-y-1">
                            <label className="text-[11px] text-muted-foreground">ต้นทุน/หน่วย</label>
                            <Input
                              type="number"
                              min={0}
                              value={item.unitCost}
                              onChange={(e) => updateItem(item.productId, { unitCost: Math.max(0, Number(e.target.value) || 0) })}
                              className="h-8 w-24 text-sm"
                            />
                          </div>
                          <div className="space-y-1">
                            <label className="text-[11px] text-muted-foreground">จำนวน</label>
                            <div className="flex items-center gap-1">
                              <Button
                                type="button"
                                variant="ghost"
                                size="sm"
                                className="h-8 w-8 p-0"
                                onClick={() => changeQty(item.productId, -1)}
                              >
                                <Minus className="w-3.5 h-3.5" />
                              </Button>
                              <span className="w-8 text-center text-sm font-medium text-primary">{item.quantity}</span>
                              <Button
                                type="button"
                                variant="ghost"
                                size="sm"
                                className="h-8 w-8 p-0"
                                onClick={() => changeQty(item.productId, 1)}
                              >
                                <Plus className="w-3.5 h-3.5" />
                              </Button>
                            </div>
                          </div>
                          <div className="ml-auto text-right">
                            <p className="text-[11px] text-muted-foreground">รวม</p>
                            <p className="text-sm font-bold text-destructive">฿{(item.unitCost * item.quantity).toLocaleString()}</p>
                          </div>
                        </div>
                      </div>
                      <Button
                        type="button"
                        variant="destructive"
                        size="sm"
                        className="shrink-0"
                        onClick={() => removeItem(item.productId)}
                      >
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    </div>
                    {/* per-item note */}
                    <input
                      placeholder="หมายเหตุรายการ (ไม่บังคับ)"
                      value={item.note}
                      onChange={(e) => updateItem(item.productId, { note: e.target.value })}
                      className="mt-2 w-full h-8 rounded-md border border-border bg-surface px-2 text-xs placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-action"
                    />
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* ── Right: summary ──────────────────────────── */}
        <div className="w-full lg:w-[300px] shrink-0">
          <div className="lg:sticky lg:top-4 rounded-2xl border border-border/60 bg-white p-5 shadow-sm">
            <h2 className="text-base font-semibold text-primary mb-4">สรุปเคลม</h2>
            <div className="space-y-3">
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">เหตุผล</span>
                <span className="font-medium text-primary">
                  {REASON_ICON[reason]} {CLAIM_REASON_LABELS[reason]}
                </span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">จำนวนรายการ</span>
                <span className="font-medium text-primary">{items.length} รายการ</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">จำนวนชิ้น</span>
                <span className="font-medium text-primary">{totalQuantity} ชิ้น</span>
              </div>
            </div>
            <div className="mt-4 rounded-xl bg-destructive text-white px-4 py-3 flex items-center justify-between">
              <span className="font-medium text-sm">ต้นทุนของเสีย</span>
              <span className="text-lg font-bold">฿{totalCost.toLocaleString()}</span>
            </div>
            <p className="text-[11px] text-muted-foreground mt-2 text-center">
              ต้นทุนนี้ยังคงอยู่กับเรา (ลดกำไรสุทธิ)
            </p>

            <Button
              variant="primary"
              className="text-white w-full mt-4 lg:hidden"
              onClick={handleSubmit}
              disabled={createMutation.isPending || items.length === 0}
            >
              {createMutation.isPending ? <Loader2 className="w-4 h-4 mr-1 animate-spin" /> : <Plus className="w-4 h-4 mr-1" />}
              บันทึกเคลม
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
