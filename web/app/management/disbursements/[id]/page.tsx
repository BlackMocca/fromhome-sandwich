'use client';

import { use, useState, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useRouter } from 'next/navigation';
import { ArrowLeft, Wallet, Pencil, Check, X, RotateCcw, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { InputDate } from '@/components/ui/input-date';
import { ToggleSwitch } from '@/components/ui/toggle-switch';
import { cn } from '@/lib/utils';
import { toast } from '@/lib/toast';
import { getDisbursement, updateDisbursementStatus, updateDisbursement } from '@/lib/db';
import {
  DISBURSEMENT_STATUS_LABELS,
  type Disbursement,
  type DisbursementStatus,
} from '@/types/disbursement';

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

export default function DisbursementDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const router = useRouter();
  const queryClient = useQueryClient();
  const disbursementId = Number(id);

  const { data: d, isLoading } = useQuery({
    queryKey: ['disbursement', disbursementId],
    queryFn: () => getDisbursement(disbursementId),
    enabled: !!disbursementId,
  });

  // ─── edit state ──────────────────────────────────────
  const [editing, setEditing] = useState(false);
  const [description, setDescription] = useState('');
  const [amount, setAmount] = useState('');
  const [withdrawDate, setWithdrawDate] = useState('');
  const [note, setNote] = useState('');

  useEffect(() => {
    if (d && !editing) {
      setDescription(d.description);
      setAmount(String(d.amount));
      setWithdrawDate(d.withdraw_date);
      setNote(d.note ?? '');
    }
  }, [d, editing]);

  const statusMutation = useMutation({
    mutationFn: (status: 'paid' | 'unpaid') => updateDisbursementStatus(disbursementId, status),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['disbursement', disbursementId] });
      queryClient.invalidateQueries({ queryKey: ['disbursements'] });
      toast({ title: 'สำเร็จ', description: 'อัปเดตสถานะเรียบร้อย' });
    },
    onError: (err) => toast({ title: 'เกิดข้อผิดพลาด', description: err.message }),
  });

  const updateMutation = useMutation({
    mutationFn: () =>
      updateDisbursement(disbursementId, {
        description: description.trim(),
        amount: Number(amount) || 0,
        withdraw_date: withdrawDate,
        note: note.trim() || null,
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['disbursement', disbursementId] });
      queryClient.invalidateQueries({ queryKey: ['disbursements'] });
      setEditing(false);
      toast({ title: 'สำเร็จ', description: 'บันทึกการแก้ไขเรียบร้อย' });
    },
    onError: (err) => toast({ title: 'เกิดข้อผิดพลาด', description: err.message }),
  });

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64 text-muted-foreground">
        กำลังโหลดข้อมูล...
      </div>
    );
  }

  if (!d) {
    return (
      <div className="flex flex-col items-center justify-center h-64 gap-4">
        <p className="text-muted-foreground">ไม่พบรายการเบิกนี้</p>
        <Button onClick={() => router.back()}>กลับ</Button>
      </div>
    );
  }

  const amountNum = Number(amount) || 0;
  const canSave = description.trim().length > 0 && amountNum > 0;

  return (
    <div className="w-full max-w-[720px] mx-auto">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-3">
          <Button variant="ghost" size="sm" onClick={() => router.back()}>
            <ArrowLeft className="w-4 h-4 mr-1" />
            กลับ
          </Button>
          <h1 className="text-2xl font-bold text-primary">รายละเอียดเบิกเงิน</h1>
        </div>
        <Button
          variant={d.status === 'paid' ? 'destructive' : 'success'}
          size="sm"
          onClick={() => statusMutation.mutate(d.status === 'paid' ? 'unpaid' : 'paid')}
          disabled={statusMutation.isPending}
        >
          <RotateCcw className="w-4 h-4 mr-1" />
          {d.status === 'paid' ? 'เปลี่ยนเป็นค้างจ่าย' : 'ทำเครื่องหมายจ่ายแล้ว'}
        </Button>
      </div>

      {/* Info / Edit Card */}
      <div className="bg-white rounded-2xl border border-border/60 shadow-sm p-6 mb-6">
        <div className="flex items-center justify-between mb-5">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-lg bg-primary/10 flex items-center justify-center text-primary">
              <Wallet className="w-4 h-4" />
            </div>
            <h2 className="text-base font-semibold text-primary">ข้อมูลเบิก</h2>
          </div>
          {!editing && (
            <Button variant="ghost" size="sm" onClick={() => setEditing(true)}>
              <Pencil className="w-4 h-4 mr-1" />
              แก้ไข
            </Button>
          )}
        </div>

        {!editing ? (
          <div className="grid grid-cols-2 gap-3">
            <div className="rounded-xl bg-surface/50 px-4 py-3">
              <p className="text-[11px] text-muted-foreground mb-1">เลขที่เบิก</p>
              <p className="text-sm font-semibold text-primary font-mono">{d.withdraw_no}</p>
            </div>
            <div className="rounded-xl bg-surface/50 px-4 py-3">
              <p className="text-[11px] text-muted-foreground mb-1">วันที่เบิก</p>
              <p className="text-sm font-semibold text-primary">{formatThaiDate(d.withdraw_date)}</p>
            </div>
            <div className="col-span-2 rounded-xl bg-surface/50 px-4 py-3">
              <p className="text-[11px] text-muted-foreground mb-1">รายการ</p>
              <p className="text-sm font-semibold text-primary whitespace-pre-wrap">{d.description}</p>
            </div>
            <div className="col-span-2 rounded-xl bg-surface/50 px-4 py-3">
              <p className="text-[11px] text-muted-foreground mb-1">ราคา</p>
              <p className="text-sm font-semibold text-primary">฿{Number(d.amount).toLocaleString()}</p>
            </div>
            <div className="rounded-xl bg-surface/50 px-4 py-3">
              <p className="text-[11px] text-muted-foreground mb-1">สถานะการจ่าย</p>
              <span className={cn(
                "inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full text-[11px] font-medium",
                d.status === 'paid' ? "bg-success/10 text-success" : "bg-destructive/10 text-destructive",
              )}>
                <ToggleSwitch on={d.status === 'paid'} onToggle={() => statusMutation.mutate(d.status === 'paid' ? 'unpaid' : 'paid')} size="sm" />
                {DISBURSEMENT_STATUS_LABELS[d.status]}
              </span>
            </div>
            <div className="rounded-xl bg-surface/50 px-4 py-3">
              <p className="text-[11px] text-muted-foreground mb-1">สร้างเมื่อ</p>
              <p className="text-sm font-semibold text-primary">{formatThaiDate(d.created_at, true)}</p>
            </div>
            {d.note && (
              <div className="col-span-2 rounded-xl bg-surface/50 px-4 py-3">
                <p className="text-[11px] text-muted-foreground mb-1">หมายเหตุ</p>
                <p className="text-sm font-medium text-primary whitespace-pre-wrap">{d.note}</p>
              </div>
            )}
          </div>
        ) : (
          <div className="space-y-4">
            <div className="space-y-2">
              <label className="text-sm font-medium text-primary">รายการ</label>
              <Input value={description} onChange={(e) => setDescription(e.target.value)} />
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium text-primary">ราคา (บาท)</label>
              <Input type="number" min={0} value={amount} onChange={(e) => setAmount(e.target.value)} />
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium text-primary">วันที่เบิก</label>
              <InputDate value={withdrawDate} onValueChange={setWithdrawDate} className="max-w-xs" />
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium text-primary">หมายเหตุ</label>
              <textarea
                rows={2}
                value={note}
                onChange={(e) => setNote(e.target.value)}
                className="flex w-full rounded-md border border-border bg-surface px-3 py-2 text-sm ring-offset-surface placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-action resize-none"
              />
            </div>
            <div className="flex justify-end gap-2 pt-2">
              <Button variant="ghost" onClick={() => setEditing(false)} disabled={updateMutation.isPending}>
                <X className="w-4 h-4 mr-1" />
                ยกเลิก
              </Button>
              <Button
                variant="primary"
                className="text-white"
                onClick={() => updateMutation.mutate()}
                disabled={updateMutation.isPending || !canSave}
              >
                {updateMutation.isPending ? (
                  <Loader2 className="w-4 h-4 mr-1 animate-spin" />
                ) : (
                  <Check className="w-4 h-4 mr-1" />
                )}
                บันทึก
              </Button>
            </div>
          </div>
        )}
      </div>

      {/* Summary Card */}
      <div className="bg-white rounded-2xl border border-border/60 shadow-sm p-6">
        <div className="flex items-center gap-2.5 mb-4">
          <div className="w-9 h-9 rounded-lg bg-primary/10 flex items-center justify-center text-primary">
            <Wallet className="w-4 h-4" />
          </div>
          <h2 className="text-base font-semibold text-primary">สรุปยอด</h2>
        </div>
        <div className="mt-2 rounded-xl bg-primary text-white px-4 py-3 flex items-center justify-between">
          <span className="font-semibold">ยอดเบิก</span>
          <span className="text-lg font-bold">฿{Number(editing ? amountNum : d.amount).toLocaleString()}</span>
        </div>
      </div>
    </div>
  );
}
