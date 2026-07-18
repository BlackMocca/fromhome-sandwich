'use client';

import { use, useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useRouter } from 'next/navigation';
import { ArrowLeft, Package, Calculator, PackageX, RotateCcw } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { toast } from '@/lib/toast';
import { getClaim, getClaimItems, updateClaimStatus } from '@/lib/db';
import {
  CLAIM_REASON_LABELS,
  CLAIM_STATUS_LABELS,
  type Claim,
  type ClaimItem,
} from '@/types/claim';

const THAI_MONTHS_SHORT = [
  'ม.ค.', 'ก.พ.', 'มี.ค.', 'เม.ย.', 'พ.ค.', 'มิ.ย.',
  'ก.ค.', 'ส.ค.', 'ก.ย.', 'ต.ค.', 'พ.ย.', 'ธ.ค.',
];

function formatThaiDate(iso: string, withTime = false): string {
  if (!iso) return '-';
  const [datePart, timePart] = iso.split('T');
  const [year, month, day] = datePart.split('-').map(Number);
  if (!year || !month || !day) return iso;
  const buddhistYear = year + 543;
  const dd = String(day).padStart(2, '0');
  let result = `${dd} ${THAI_MONTHS_SHORT[month - 1]} ${buddhistYear}`;
  if (withTime && timePart) {
    const time = timePart.split(/[.Z+-]/)[0];
    if (time) result += ` ${time}`;
  }
  return result;
}

const REASON_BADGE: Record<string, string> = {
  expired: 'bg-action/15 text-action',
  damaged: 'bg-destructive/15 text-destructive',
  lost: 'bg-primary/15 text-primary',
  other: 'bg-surface text-muted-foreground',
};

export default function ClaimDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const router = useRouter();
  const queryClient = useQueryClient();
  const claimId = Number(id);

  const { data: claim, isLoading: loadingClaim } = useQuery({
    queryKey: ['claim', claimId],
    queryFn: () => getClaim(claimId),
    enabled: !!claimId,
  });

  const { data: items = [], isLoading: loadingItems } = useQuery({
    queryKey: ['claimItems', claimId],
    queryFn: () => getClaimItems(claimId),
    enabled: !!claimId,
  });

  const [toggling, setToggling] = useState(false);

  const handleToggleStatus = async () => {
    if (!claim) return;
    setToggling(true);
    try {
      await updateClaimStatus(claim.id, claim.status === 'active' ? 'cancelled' : 'active');
      queryClient.invalidateQueries({ queryKey: ['claim', claimId] });
      queryClient.invalidateQueries({ queryKey: ['claims'] });
      toast({ title: 'สำเร็จ', description: 'อัปเดตสถานะเรียบร้อย' });
    } catch (err) {
      toast({ title: 'เกิดข้อผิดพลาด', description: err instanceof Error ? err.message : 'ไม่สามารถอัปเดตได้' });
    } finally {
      setToggling(false);
    }
  };

  if (loadingClaim || loadingItems) {
    return (
      <div className="flex items-center justify-center h-64 text-muted-foreground">
        กำลังโหลดข้อมูล...
      </div>
    );
  }

  if (!claim) {
    return (
      <div className="flex flex-col items-center justify-center h-64 gap-4">
        <p className="text-muted-foreground">ไม่พบรายการเคลมนี้</p>
        <Button onClick={() => router.back()}>กลับ</Button>
      </div>
    );
  }

  return (
    <div className="w-full max-w-[800px] mx-auto">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-3">
          <Button variant="ghost" size="sm" onClick={() => router.back()}>
            <ArrowLeft className="w-4 h-4 mr-1" />
            กลับ
          </Button>
          <h1 className="text-2xl font-bold text-primary">รายละเอียดเคลม</h1>
        </div>
        <Button
          variant={claim.status === 'active' ? 'destructive' : 'success'}
          size="sm"
          onClick={handleToggleStatus}
          disabled={toggling}
        >
          <RotateCcw className="w-4 h-4 mr-1" />
          {claim.status === 'active' ? 'ยกเลิกเคลม' : 'คืนสถานะ'}
        </Button>
      </div>

      {/* Claim Info Card */}
      <div className="bg-white rounded-2xl border border-border/60 shadow-sm p-6 mb-6">
        <div className="flex items-center justify-between mb-5">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-lg bg-destructive/10 flex items-center justify-center text-destructive">
              <PackageX className="w-4 h-4" />
            </div>
            <h2 className="text-base font-semibold text-primary">ข้อมูลเคลม</h2>
          </div>
          <span className={cn(
            "px-3 py-1 rounded-full text-xs font-medium",
            claim.status === 'active' ? "bg-success/10 text-success" : "bg-destructive/10 text-destructive"
          )}>
            {CLAIM_STATUS_LABELS[claim.status]}
          </span>
        </div>
        <div className="grid grid-cols-2 gap-3">
          <div className="rounded-xl bg-surface/50 px-4 py-3">
            <p className="text-[11px] text-muted-foreground mb-1">เลขที่เคลม</p>
            <p className="text-sm font-semibold text-primary font-mono">{claim.claim_no}</p>
          </div>
          <div className="rounded-xl bg-surface/50 px-4 py-3">
            <p className="text-[11px] text-muted-foreground mb-1">วันที่เคลม</p>
            <p className="text-sm font-semibold text-primary">{formatThaiDate(claim.claim_date)}</p>
          </div>
          <div className="rounded-xl bg-surface/50 px-4 py-3">
            <p className="text-[11px] text-muted-foreground mb-1">เหตุผล</p>
            <span className={cn("inline-flex items-center px-2 py-0.5 rounded-full text-[11px] font-medium", REASON_BADGE[claim.reason])}>
              {CLAIM_REASON_LABELS[claim.reason]}
            </span>
          </div>
          <div className="rounded-xl bg-surface/50 px-4 py-3">
            <p className="text-[11px] text-muted-foreground mb-1">สร้างเมื่อ</p>
            <p className="text-sm font-semibold text-primary">{formatThaiDate(claim.created_at, true)}</p>
          </div>
          {claim.note && (
            <div className="col-span-2 rounded-xl bg-surface/50 px-4 py-3">
              <p className="text-[11px] text-muted-foreground mb-1">หมายเหตุ</p>
              <p className="text-sm font-medium text-primary whitespace-pre-wrap">{claim.note}</p>
            </div>
          )}
        </div>
      </div>

      {/* Items Table */}
      <div className="bg-white rounded-2xl border border-border/60 shadow-sm overflow-hidden mb-6">
        <div className="flex items-center gap-2.5 px-5 py-4 border-b border-border/60">
          <div className="w-9 h-9 rounded-lg bg-destructive/10 flex items-center justify-center text-destructive">
            <Package className="w-4 h-4" />
          </div>
          <h2 className="text-base font-semibold text-primary">รายการสินค้าที่เคลม</h2>
        </div>
        <div className="grid grid-cols-12 gap-4 px-5 py-3 bg-surface/60 border-b border-border/60 text-xs font-semibold text-muted-foreground">
          <div className="col-span-4">สินค้า</div>
          <div className="col-span-2 text-right">ต้นทุน/หน่วย</div>
          <div className="col-span-1 text-center">จำนวน</div>
          <div className="col-span-1 text-center">หน่วย</div>
          <div className="col-span-4 text-right">ต้นทุนของเสีย</div>
        </div>

        {items.length === 0 ? (
          <div className="px-5 py-10 text-center text-muted-foreground">ไม่มีรายการสินค้า</div>
        ) : (
          items.map((item: ClaimItem, i: number) => (
            <div
              key={item.id}
              className={cn(
                "grid grid-cols-12 gap-4 px-5 py-4 border-b border-border/60 transition-colors text-sm hover:bg-surface/40",
                i === items.length - 1 && 'border-b-0',
              )}
            >
              <div className="col-span-4">
                <p className="font-medium text-primary">{item.product_name}</p>
                {item.note && (
                  <p className="text-xs text-muted-foreground mt-1 whitespace-pre-wrap">{item.note}</p>
                )}
              </div>
              <div className="col-span-2 text-right text-muted-foreground">฿{Number(item.unit_cost).toLocaleString()}</div>
              <div className="col-span-1 text-center">{item.quantity}</div>
              <div className="col-span-1 text-center text-xs text-muted-foreground">ชิ้น</div>
              <div className="col-span-4 text-right font-semibold text-destructive">฿{Number(item.line_cost).toLocaleString()}</div>
            </div>
          ))
        )}
      </div>

      {/* Summary Card */}
      <div className="bg-white rounded-2xl border border-border/60 shadow-sm p-6">
        <div className="flex items-center gap-2.5 mb-4">
          <div className="w-9 h-9 rounded-lg bg-destructive/10 flex items-center justify-center text-destructive">
            <Calculator className="w-4 h-4" />
          </div>
          <h2 className="text-base font-semibold text-primary">สรุปยอด</h2>
        </div>
        <div className="space-y-3">
          <div className="flex justify-between text-sm">
            <span className="text-muted-foreground">จำนวนรายการ</span>
            <span className="font-medium text-primary">{items.length} รายการ</span>
          </div>
          <div className="flex justify-between text-sm">
            <span className="text-muted-foreground">จำนวนชิ้นทั้งหมด</span>
            <span className="font-medium text-primary">{claim.total_quantity} ชิ้น</span>
          </div>
        </div>

        <div className="mt-4 rounded-xl bg-destructive text-white px-4 py-3 flex items-center justify-between">
          <span className="font-semibold">ต้นทุนของเสีย (ที่ยังอยู่กับเรา)</span>
          <span className="text-lg font-bold">฿{Number(claim.total_cost).toLocaleString()}</span>
        </div>
      </div>
    </div>
  );
}
