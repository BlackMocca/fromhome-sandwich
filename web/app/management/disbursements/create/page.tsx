'use client';

import { useState, useEffect, useRef } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useRouter } from 'next/navigation';
import { ArrowLeft, Plus, Loader2, Wallet } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { InputDate } from '@/components/ui/input-date';
import { ToggleSwitch } from '@/components/ui/toggle-switch';
import { cn } from '@/lib/utils';
import { toast } from '@/lib/toast';
import { getNextWithdrawNo, createDisbursement } from '@/lib/db';
import {
  DISBURSEMENT_STATUS_LABELS,
  type DisbursementStatus,
} from '@/types/disbursement';

export default function CreateDisbursementPage() {
  const router = useRouter();
  const queryClient = useQueryClient();

  const [description, setDescription] = useState('');
  const [amount, setAmount] = useState('');
  const [withdrawDate, setWithdrawDate] = useState(new Date().toISOString().split('T')[0]);
  const [paid, setPaid] = useState(false); // default ค้างจ่าย
  const [note, setNote] = useState('');

  // ─── Next withdraw no (for live preview) ─────────────
  const withdrawNoQuery = useQuery({
    queryKey: ['withdrawNo', withdrawDate],
    queryFn: () => getNextWithdrawNo(withdrawDate),
    enabled: !!withdrawDate,
    staleTime: 30_000,
  });
  const withdrawNo = withdrawNoQuery.data || `WD${withdrawDate.replace(/-/g, '')}0001`;

  const amountNum = Number(amount) || 0;
  const canSubmit = description.trim().length > 0 && amountNum > 0;

  const createMutation = useMutation({
    mutationFn: () =>
      createDisbursement({
        withdraw_no: withdrawNo,
        withdraw_date: withdrawDate,
        description: description.trim(),
        amount: amountNum,
        status: (paid ? 'paid' : 'unpaid') as DisbursementStatus,
        note: note.trim() || null,
      }),
    onSuccess: (res) => {
      queryClient.invalidateQueries({ queryKey: ['disbursements'] });
      toast({ title: 'สำเร็จ', description: `บันทึกเบิก ${res.disbursement.withdraw_no} เรียบร้อย` });
      router.push(`/management/disbursements/${res.disbursement.id}`);
    },
    onError: (err) => {
      toast({ title: 'เกิดข้อผิดพลาด', description: err.message });
    },
  });

  const handleSubmit = () => {
    if (!canSubmit) {
      toast({
        title: 'กรุณากรอกข้อมูลให้ครบ',
        description: 'ระบุรายการและราคา (มากกว่า 0)',
      });
      return;
    }
    createMutation.mutate();
  };

  return (
    <div className="w-full max-w-[720px] mx-auto">
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
            <h1 className="text-2xl font-bold text-primary">สร้างเบิกเงิน</h1>
            <p className="text-sm text-muted-foreground mt-0.5">
              บันทึกรายการเบิก พร้อมราคา และวันที่
            </p>
          </div>
        </div>
      </div>

      <div className="rounded-2xl border border-border/60 bg-white p-5 sm:p-6 shadow-sm space-y-5">
        {/* Description */}
        <div className="space-y-2">
          <label htmlFor="desc" className="text-sm font-medium text-primary">
            รายการ <span className="text-destructive">*</span>
          </label>
          <Input
            id="desc"
            placeholder="เช่น ซื้อวัตถุดิบเพิ่ม, ค่าเดินทางส่งของ..."
            value={description}
            onChange={(e) => setDescription(e.target.value)}
          />
        </div>

        {/* Amount */}
        <div className="space-y-2">
          <label htmlFor="amount" className="text-sm font-medium text-primary">
            ราคา (บาท) <span className="text-destructive">*</span>
          </label>
          <Input
            id="amount"
            type="number"
            min={0}
            placeholder="0"
            value={amount}
            onChange={(e) => setAmount(e.target.value)}
            className="text-lg"
          />
        </div>

        {/* Date + withdraw no */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div className="space-y-2">
            <label className="text-sm font-medium text-primary">
              วันที่เบิก <span className="text-destructive">*</span>
            </label>
            <InputDate value={withdrawDate} onValueChange={setWithdrawDate} className="max-w-xs" />
          </div>
          <div className="space-y-2">
            <label className="text-sm font-medium text-primary">เลขที่เบิก</label>
            <Input value={withdrawNo} readOnly disabled className="bg-surface/50 font-mono" />
          </div>
        </div>

        {/* Paid toggle */}
        <div className="flex items-center justify-between rounded-xl bg-surface/50 px-4 py-3">
          <div>
            <p className="text-sm font-medium text-primary">สถานะการจ่าย</p>
            <p className={cn(
              "text-xs",
              paid ? "text-success" : "text-destructive",
            )}>
              {DISBURSEMENT_STATUS_LABELS[paid ? 'paid' : 'unpaid']}
            </p>
          </div>
          <ToggleSwitch on={paid} onToggle={() => setPaid((p) => !p)} />
        </div>

        {/* Note */}
        <div className="space-y-2">
          <label htmlFor="note" className="text-sm font-medium text-primary">
            หมายเหตุ <span className="text-muted-foreground text-xs">(ไม่บังคับ)</span>
          </label>
          <textarea
            id="note"
            placeholder="รายละเอียดเพิ่มเติม (ถ้ามี)"
            rows={2}
            value={note}
            onChange={(e) => setNote(e.target.value)}
            className="flex w-full rounded-md border border-border bg-surface px-3 py-2 text-sm ring-offset-surface placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-action resize-none"
          />
        </div>
      </div>

      {/* Summary + actions */}
      <div className="mt-5 rounded-2xl bg-primary text-white px-5 py-4 flex items-center justify-between">
        <span className="font-medium">ยอดเบิก</span>
        <span className="text-xl font-bold">฿{amountNum.toLocaleString()}</span>
      </div>

      <div className="flex justify-end gap-2 mt-5 pb-8">
        <Button variant="destructive" onClick={() => router.back()}>
          ยกเลิก
        </Button>
        <Button
          variant="primary"
          className="text-white"
          onClick={handleSubmit}
          disabled={createMutation.isPending || !canSubmit}
        >
          {createMutation.isPending ? (
            <Loader2 className="w-4 h-4 mr-1 animate-spin" />
          ) : (
            <Plus className="w-4 h-4 mr-1" />
          )}
          บันทึกเบิก
        </Button>
      </div>
    </div>
  );
}
