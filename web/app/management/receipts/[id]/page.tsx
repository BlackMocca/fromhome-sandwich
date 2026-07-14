'use client';

import { use } from 'react';
import { useQuery } from '@tanstack/react-query';
import { useRouter } from 'next/navigation';
import { ArrowLeft, Receipt as ReceiptIcon } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { getReceipt, getReceiptItems } from '@/lib/db';
import type { Receipt, ReceiptItem, DiscountSnapshot, ProductOptionSnapshot } from '@/types/receipt';

export default function ReceiptDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const router = useRouter();
  const receiptId = Number(id);

  const { data: receipt, isLoading: loadingReceipt } = useQuery({
    queryKey: ['receipt', receiptId],
    queryFn: () => getReceipt(receiptId),
    enabled: !!receiptId,
  });

  const { data: items = [], isLoading: loadingItems } = useQuery({
    queryKey: ['receiptItems', receiptId],
    queryFn: () => getReceiptItems(receiptId),
    enabled: !!receiptId,
  });

  if (loadingReceipt || loadingItems) {
    return (
      <div className="flex items-center justify-center h-64 text-muted-foreground">
        กำลังโหลดข้อมูล...
      </div>
    );
  }

  if (!receipt) {
    return (
      <div className="flex flex-col items-center justify-center h-64 gap-4">
        <p className="text-muted-foreground">ไม่พบใบเสร็จนี้</p>
        <Button onClick={() => router.back()}>กลับ</Button>
      </div>
    );
  }

  const discounts = (receipt.discounts ?? []) as DiscountSnapshot[];

  return (
    <div className="w-full max-w-[800px] mx-auto">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-3">
          <Button variant="ghost" size="sm" onClick={() => router.back()}>
            <ArrowLeft className="w-4 h-4 mr-1" />
            กลับ
          </Button>
          <h1 className="text-2xl font-bold text-primary">รายละเอียดบิล</h1>
        </div>
        <span className={cn(
          "px-3 py-1 rounded-full text-sm font-medium",
          receipt.status === 'active' ? "bg-success/10 text-success" : "bg-destructive/10 text-destructive"
        )}>
          {receipt.status === 'active' ? 'ปกติ' : 'ยกเลิก'}
        </span>
      </div>

      {/* Receipt Info Card */}
      <div className="bg-white rounded-xl border border-border/50 p-6 mb-6">
        <div className="grid grid-cols-2 gap-6">
          <div>
            <p className="text-xs text-muted-foreground mb-1">เลขที่บิล</p>
            <p className="text-lg font-bold text-primary font-mono">{receipt.receipt_no}</p>
          </div>
          <div>
            <p className="text-xs text-muted-foreground mb-1">วันที่</p>
            <p className="text-lg font-semibold text-primary">{receipt.bill_date}</p>
          </div>
          <div>
            <p className="text-xs text-muted-foreground mb-1">ลูกค้า</p>
            <p className="text-base font-medium">{receipt.customer_name || '-'}</p>
          </div>
          <div>
            <p className="text-xs text-muted-foreground mb-1">ช่องทาง</p>
            <p className="text-base font-medium">{receipt.channel_code}</p>
          </div>
          {receipt.note && (
            <div className="col-span-2">
              <p className="text-xs text-muted-foreground mb-1">หมายเหตุ</p>
              <p className="text-base">{receipt.note}</p>
            </div>
          )}
        </div>
      </div>

      {/* Items Table */}
      <div className="bg-white rounded-xl border border-border/50 overflow-hidden mb-6">
        <div className="grid grid-cols-12 gap-4 px-4 py-3 bg-surface/60 border-b border-border/50 text-sm font-semibold text-muted-foreground">
          <div className="col-span-1">#</div>
          <div className="col-span-4">สินค้า</div>
          <div className="col-span-2 text-right">ราคา/หน่วย</div>
          <div className="col-span-1 text-center">จำนวน</div>
          <div className="col-span-2 text-right">รวม</div>
          <div className="col-span-2">ตัวเลือก</div>
        </div>

        {items.length === 0 ? (
          <div className="px-4 py-8 text-center text-muted-foreground">ไม่มีรายการสินค้า</div>
        ) : (
          items.map((item: ReceiptItem, i: number) => {
            const options = (item.product_options ?? []) as ProductOptionSnapshot[];
            return (
              <div
                key={item.id}
                className={cn(
                  "grid grid-cols-12 gap-4 px-4 py-3 border-b transition-colors text-sm",
                  i === items.length - 1 && 'border-b-0',
                )}
              >
                <div className="col-span-1 text-muted-foreground">{i + 1}</div>
                <div className="col-span-4 font-medium text-primary">{item.product_name}</div>
                <div className="col-span-2 text-right">฿{item.product_price.toLocaleString()}</div>
                <div className="col-span-1 text-center">{item.quantity}</div>
                <div className="col-span-2 text-right font-semibold">฿{item.line_total.toLocaleString()}</div>
                <div className="col-span-2">
                  {options.length > 0 && (
                    <div className="flex flex-wrap gap-1">
                      {options.map((opt) => (
                        <span key={opt.id} className="inline-flex items-center px-2 py-0.5 rounded-full text-[11px] bg-primary/10 text-primary">
                          {opt.name}{opt.price > 0 ? ` +฿${opt.price}` : ''}
                        </span>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            );
          })
        )}
      </div>

      {/* Summary Card */}
      <div className="bg-white rounded-xl border border-border/50 p-6">
        <div className="space-y-3">
          <div className="flex justify-between text-sm">
            <span className="text-muted-foreground">จำนวนสินค้าทั้งหมด</span>
            <span className="font-medium">{receipt.total_quantity} ชิ้น</span>
          </div>
          <div className="flex justify-between text-sm">
            <span className="text-muted-foreground">ราคารวม (ก่อนลด)</span>
            <span className="font-medium">฿{receipt.subtotal.toLocaleString()}</span>
          </div>

          {discounts.length > 0 && discounts.map((d, i) => (
            <div key={i} className="flex justify-between text-sm">
              <span className="text-destructive">
                ส่วนลด{d.type === 'pricing' ? ' (ราคา)' : d.type === 'percentage' ? ` (${d.percentage}%)` : ` (คูปอง${d.code ? `: ${d.code}` : ''})`}
              </span>
              <span className="text-destructive font-medium">
                -฿{d.type === 'pricing' ? (d.price ?? 0).toLocaleString() : ((d.percentage ?? 0) * receipt.subtotal / 100).toLocaleString()}
              </span>
            </div>
          ))}

          {receipt.discount_total > 0 && (
            <div className="flex justify-between text-sm">
              <span className="text-muted-foreground">ส่วนลดรวม</span>
              <span className="text-destructive font-medium">-฿{receipt.discount_total.toLocaleString()}</span>
            </div>
          )}

          <div className="border-t border-border/50 pt-3 flex justify-between">
            <span className="text-lg font-bold text-primary">ยอดรวมสุทธิ</span>
            <span className="text-lg font-bold text-primary">฿{receipt.grand_total.toLocaleString()}</span>
          </div>
        </div>
      </div>
    </div>
  );
}
