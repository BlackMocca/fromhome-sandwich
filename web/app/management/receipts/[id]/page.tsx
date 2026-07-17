'use client';

import { use, useRef } from 'react';
import { useQuery } from '@tanstack/react-query';
import { useRouter } from 'next/navigation';
import { ArrowLeft, Download, Receipt as ReceiptIcon, Package, Calculator } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { getReceipt, getReceiptItems } from '@/lib/db';
import { OrderPreview } from '@/components/ui/OrderPreview';
import html2canvas from 'html2canvas';
import type { Receipt, ReceiptItem, DiscountSnapshot, ProductOptionSnapshot } from '@/types/receipt';
import type { OrderItem } from '@/contexts/OrderContext';
import type { ChannelProduct } from '@/types/channel_product';
import type { Product } from '@/types/product';

const THAI_MONTHS_SHORT = [
  'ม.ค.', 'ก.พ.', 'มี.ค.', 'เม.ย.', 'พ.ค.', 'มิ.ย.',
  'ก.ค.', 'ส.ค.', 'ก.ย.', 'ต.ค.', 'พ.ย.', 'ธ.ค.',
];

/** Thai date: "2026-07-14" -> "14 ก.ค. 2569" (Buddhist year). withTime appends HH:MM:SS. */
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

  const previewRef = useRef<HTMLDivElement>(null);

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

  // Map receipt items -> OrderItem shape for the OrderPreview component.
  // product_price is the base unit price and options are stored separately,
  // matching OrderPreview's own line_total computation.
  const previewItems: OrderItem[] = items.map((item) => ({
    channelProduct: {
      id: item.product_id ?? item.id,
      channel_id: receipt.channel_id,
      product_id: item.product_id ?? 0,
      price: item.product_price,
      cost: item.product_cost,
      is_active: true,
      products: {
        id: item.product_id ?? 0,
        category_id: 0,
        name: item.product_name,
        base_price: item.product_price,
        cost: item.product_cost,
        is_active: true,
      } as Product,
    } as ChannelProduct,
    quantity: item.quantity,
    selectedAddons: (item.product_options ?? []).map((opt) => ({
      id: opt.id,
      name: opt.name,
      base_price: opt.price,
      is_active: true,
    })),
    note: item.note ?? undefined,
  }));

  // ─── Download preview as image ─────────────────────
  const handleDownload = async () => {
    if (!previewRef.current) return;
    const style = document.createElement('style');
    document.head.appendChild(style);
    style.sheet?.insertRule('body > div:last-child img { display: inline-block; }');

    const canvas = await html2canvas(previewRef.current, {
      scale: window.devicePixelRatio,
      x: 0,
      y: 0,
      logging: true,
    });

    const image = canvas.toDataURL('image/jpeg', 1.0);
    const link = document.createElement('a');
    link.href = image;
    link.download = `receipt-${receipt.receipt_no}.jpg`;
    link.click();
    style.remove();
  };

  return (
    <div className="w-full max-w-[800px] mx-auto">
      {/* Header */}
      <div className="flex items-center gap-3 mb-6">
        <Button variant="ghost" size="sm" onClick={() => router.back()}>
          <ArrowLeft className="w-4 h-4 mr-1" />
          กลับ
        </Button>
        <h1 className="text-2xl font-bold text-primary">รายละเอียดบิล</h1>
      </div>

      {/* Download action — under header, above the OrderPreview bill */}
      <div className="flex justify-end mb-6">
        <Button variant="primary" className="text-white" onClick={handleDownload}>
          <Download className="w-4 h-4 mr-1" />
          ดาวน์โหลด
        </Button>
      </div>

      {/* Order Preview — first content element */}
      <div className="flex justify-center mb-6">
        <OrderPreview
          ref={previewRef}
          customerName={receipt.customer_name ?? ''}
          invoiceDate={receipt.created_at}
          channelName={receipt.channel_code}
          items={previewItems}
          totalQuantity={receipt.total_quantity}
          totalPrice={receipt.grand_total}
          orderNo={receipt.receipt_no}
          subtotal={receipt.subtotal}
          discountTotal={receipt.discount_total}
          note={receipt.note ?? undefined}
        />
      </div>

      {/* Receipt Info Card */}
      <div className="bg-white rounded-2xl border border-border/60 shadow-sm p-6 mb-6">
        <div className="flex items-center justify-between mb-5">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-lg bg-primary/10 flex items-center justify-center text-primary">
              <ReceiptIcon className="w-4 h-4" />
            </div>
            <h2 className="text-base font-semibold text-primary">ข้อมูลบิล</h2>
          </div>
          <span className={cn(
            "px-3 py-1 rounded-full text-xs font-medium",
            receipt.status === 'active' ? "bg-success/10 text-success" : "bg-destructive/10 text-destructive"
          )}>
            {receipt.status === 'active' ? 'ปกติ' : 'ยกเลิก'}
          </span>
        </div>
        <div className="grid grid-cols-2 gap-3">
          <div className="rounded-xl bg-surface/50 px-4 py-3">
            <p className="text-[11px] text-muted-foreground mb-1">เลขที่บิล</p>
            <p className="text-sm font-semibold text-primary font-mono">{receipt.receipt_no}</p>
          </div>
          <div className="rounded-xl bg-surface/50 px-4 py-3">
            <p className="text-[11px] text-muted-foreground mb-1">วันที่</p>
            <p className="text-sm font-semibold text-primary">{formatThaiDate(receipt.bill_date)}</p>
          </div>
          <div className="rounded-xl bg-surface/50 px-4 py-3">
            <p className="text-[11px] text-muted-foreground mb-1">ลูกค้า</p>
            <p className="text-sm font-semibold text-primary">{receipt.customer_name || '-'}</p>
          </div>
          <div className="rounded-xl bg-surface/50 px-4 py-3">
            <p className="text-[11px] text-muted-foreground mb-1">ช่องทาง</p>
            <p className="text-sm font-semibold text-primary">{receipt.channel_code}</p>
          </div>
          <div className="col-span-2 rounded-xl bg-surface/50 px-4 py-3">
            <p className="text-[11px] text-muted-foreground mb-1">สร้างบิลเมื่อ</p>
            <p className="text-sm font-semibold text-primary">{formatThaiDate(receipt.created_at, true)}</p>
          </div>
          {receipt.note && (
            <div className="col-span-2 rounded-xl bg-surface/50 px-4 py-3">
              <p className="text-[11px] text-muted-foreground mb-1">หมายเหตุ</p>
              <p className="text-sm font-medium text-primary">{receipt.note}</p>
            </div>
          )}
        </div>
      </div>

      {/* Items Table */}
      <div className="bg-white rounded-2xl border border-border/60 shadow-sm overflow-hidden mb-6">
        <div className="flex items-center gap-2.5 px-5 py-4 border-b border-border/60">
          <div className="w-9 h-9 rounded-lg bg-primary/10 flex items-center justify-center text-primary">
            <Package className="w-4 h-4" />
          </div>
          <h2 className="text-base font-semibold text-primary">รายการสินค้า</h2>
        </div>
        <div className="grid grid-cols-12 gap-4 px-5 py-3 bg-surface/60 border-b border-border/60 text-xs font-semibold text-muted-foreground">
          <div className="col-span-1">#</div>
          <div className="col-span-4">สินค้า</div>
          <div className="col-span-2 text-right">ราคา/หน่วย</div>
          <div className="col-span-1 text-center">จำนวน</div>
          <div className="col-span-4 text-right">รวม</div>
        </div>

        {items.length === 0 ? (
          <div className="px-5 py-10 text-center text-muted-foreground">ไม่มีรายการสินค้า</div>
        ) : (
          items.map((item: ReceiptItem, i: number) => {
            const options = (item.product_options ?? []) as ProductOptionSnapshot[];
            return (
              <div
                key={item.id}
                className={cn(
                  "grid grid-cols-12 gap-4 px-5 py-4 border-b border-border/60 transition-colors text-sm hover:bg-surface/40",
                  i === items.length - 1 && 'border-b-0',
                )}
              >
                <div className="col-span-1 text-muted-foreground">{i + 1}</div>
                <div className="col-span-4">
                  <p className="font-medium text-primary">{item.product_name}</p>
                  {options.length > 0 && (
                    <div className="flex flex-wrap gap-1 mt-1.5">
                      {options.map((opt) => (
                        <span key={opt.id} className="inline-flex items-center px-2 py-0.5 rounded-full text-[11px] font-medium bg-primary text-white">
                          {opt.name}{opt.price > 0 ? ` +฿${opt.price}` : ''}
                        </span>
                      ))}
                    </div>
                  )}
                </div>
                <div className="col-span-2 text-right text-muted-foreground">฿{item.product_price.toLocaleString()}</div>
                <div className="col-span-1 text-center">{item.quantity}</div>
                <div className="col-span-4 text-right font-semibold text-primary">฿{item.line_total.toLocaleString()}</div>
              </div>
            );
          })
        )}
      </div>

      {/* Summary Card */}
      <div className="bg-white rounded-2xl border border-border/60 shadow-sm p-6">
        <div className="flex items-center gap-2.5 mb-4">
          <div className="w-9 h-9 rounded-lg bg-primary/10 flex items-center justify-center text-primary">
            <Calculator className="w-4 h-4" />
          </div>
          <h2 className="text-base font-semibold text-primary">สรุปยอด</h2>
        </div>
        <div className="space-y-3">
          <div className="flex justify-between text-sm">
            <span className="text-muted-foreground">จำนวนสินค้าทั้งหมด</span>
            <span className="font-medium text-primary">{receipt.total_quantity} ชิ้น</span>
          </div>
          <div className="flex justify-between text-sm">
            <span className="text-muted-foreground">ราคารวม (ก่อนลด)</span>
            <span className="font-medium text-primary">฿{receipt.subtotal.toLocaleString()}</span>
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
        </div>

        <div className="mt-4 rounded-xl bg-primary text-white px-4 py-3 flex items-center justify-between">
          <span className="font-semibold">ยอดรวมสุทธิ</span>
          <span className="text-lg font-bold">฿{receipt.grand_total.toLocaleString()}</span>
        </div>
      </div>
    </div>
  );
}
