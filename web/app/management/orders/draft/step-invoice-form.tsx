'use client';

import { useState } from 'react';
import { useOrder } from '@/contexts/OrderContext';
import { useRouter } from 'next/navigation';
import { ArrowLeft } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';

const THAI_MONTHS = [
  'ม.ค.', 'ก.พ.', 'มี.ค.', 'เม.ย.', 'พ.ค.', 'มิ.ย.',
  'ก.ค.', 'ส.ค.', 'ก.ย.', 'ต.ค.', 'พ.ย.', 'ธ.ค.',
];

const THAI_DAYS = ['อา.', 'จ.', 'อ.', 'พ.', 'พฤ.', 'ศ.', 'ส.'];

function formatThaiDate(isoDate: string): string {
  if (!isoDate) return '';
  const [year, month, day] = isoDate.split('-').map(Number);
  const date = new Date(year, month - 1, day);
  const dayName = THAI_DAYS[date.getDay()];
  const monthName = THAI_MONTHS[month - 1];
  const buddhistYear = year + 543;
  return `${dayName} ${day} ${monthName} ${buddhistYear}`;
}

export function StepInvoiceForm({ onBack }: { onBack: () => void }) {
  const router = useRouter();
  const { items, channelName, totalQuantity, totalPrice, clearOrder } = useOrder();
  const [customerName, setCustomerName] = useState('');
  const [invoiceDate, setInvoiceDate] = useState(() => new Date().toISOString().split('T')[0]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!customerName.trim()) return;
    console.log({ customerName, invoiceDate, items, totalQuantity, totalPrice });
    clearOrder();
    router.back();
  };

  return (
    <>
      <div className="flex items-start gap-3 mb-6">
        <button
          type="button"
          onClick={onBack}
          className="p-2 rounded-lg hover:bg-surface transition-colors shrink-0"
        >
          <ArrowLeft className="w-5 h-5 text-primary" />
        </button>
        <div>
          <h1 className="text-2xl font-bold text-primary">ออกบิล</h1>
          {channelName && (
            <span className="inline-flex items-center px-2.5 py-0.5 rounded-full bg-primary/10 text-primary text-xs font-medium mt-1">
              {channelName}
            </span>
          )}
        </div>
      </div>

      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="rounded-xl border border-border/50 bg-white p-4 space-y-2">
          <h2 className="text-sm font-semibold text-primary mb-3">สรุปรายการ</h2>
          {items.map((item, i) => {
            const cp = item.channelProduct;
            const addonTotal = item.selectedAddons.reduce((s, a) => s + a.base_price, 0);
            const unitPrice = cp.price + addonTotal;
            return (
              <div key={i} className="flex justify-between text-sm">
                <span className="text-muted-foreground truncate mr-2">{cp.products?.name ?? 'สินค้า'} ×{item.quantity}</span>
                <span className="text-primary font-medium shrink-0">฿{(unitPrice * item.quantity).toLocaleString()}</span>
              </div>
            );
          })}
          <div className="border-t border-border/50 pt-2 mt-2 flex justify-between">
            <span className="font-bold text-primary">รวมทั้งหมด</span>
            <span className="font-bold text-primary">฿{totalPrice.toLocaleString()}</span>
          </div>
        </div>

        <div className="space-y-2">
          <label htmlFor="customerName" className="text-sm font-medium text-primary">
            ชื่อลูกค้า <span className="text-destructive">*</span>
          </label>
          <Input
            id="customerName"
            placeholder="กรอกชื่อลูกค้า"
            value={customerName}
            onChange={e => setCustomerName(e.target.value)}
            required
          />
        </div>

        <div className="space-y-2">
          <label htmlFor="invoiceDate" className="text-sm font-medium text-primary">
            วันที่ออกบิล <span className="text-destructive">*</span>
          </label>
          <div className="relative">
            <Input
              id="invoiceDate"
              type="date"
              value={invoiceDate}
              onChange={e => setInvoiceDate(e.target.value)}
              required
              className="text-transparent selection:bg-transparent"
            />
            <span className="absolute left-3 top-1/2 -translate-y-1/2 text-sm text-primary pointer-events-none">
              {formatThaiDate(invoiceDate)}
            </span>
          </div>
        </div>

        <div className="flex justify-end gap-2 pt-4">
          <Button type="button" variant="destructive" onClick={onBack}>
            ยกเลิก
          </Button>
          <Button type="submit" variant="primary" className="text-white">
            ออกบิล
          </Button>
        </div>
      </form>
    </>
  );
}
