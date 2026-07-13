'use client';

import { forwardRef } from 'react';
import type { OrderItem } from '@/contexts/OrderContext';

interface OrderPreviewProps {
  customerName: string;
  invoiceDate: string;
  channelName: string | null;
  items: OrderItem[];
  totalQuantity: number;
  totalPrice: number;
}

const THAI_MONTHS = [
  'ม.ค.', 'ก.พ.', 'มี.ค.', 'เม.ย.', 'พ.ค.', 'มิ.ย.',
  'ก.ค.', 'ส.ค.', 'ก.ย.', 'ต.ค.', 'พ.ย.', 'ธ.ค.',
];

const THAI_DAYS = ['อาทิตย์', 'จันทร์', 'อังคาร', 'พุธ', 'พฤหัสบดี', 'ศุกร์', 'เสาร์'];

function formatThaiDateFull(isoDate: string): string {
  if (!isoDate) return '';
  const [year, month, day] = isoDate.split('-').map(Number);
  const date = new Date(year, month - 1, day);
  const dayName = THAI_DAYS[date.getDay()];
  const monthName = THAI_MONTHS[month - 1];
  const buddhistYear = year + 543;
  return `วัน${dayName}ที่ ${day} ${monthName} ${buddhistYear}`;
}

export const OrderPreview = forwardRef<HTMLDivElement, OrderPreviewProps>(
  function OrderPreview({ customerName, invoiceDate, channelName, items, totalQuantity, totalPrice }, ref) {
    return (
      <div
        ref={ref}
        className="w-[304px] mx-auto border border-border/50 rounded-[27px] bg-white text-black text-xs overflow-hidden"
      >
        <div className="px-[14px] py-[24px]">
          {/* Header */}
          <div className="flex py-4 justify-center">
            <img src="/images/merchant/logo.jpg" className="w-[100px] h-[89px] rounded-lg flex items-center justify-center text-4xl" />
          </div>

          {customerName && (
            <div className="py-2 text-center">
              <p className="font-semibold text-4xl">{customerName}</p>
            </div>
          )}

          <div className="py-4 space-y-1">
            <p>วันที่: {formatThaiDateFull(invoiceDate)}</p>
          </div>

          <div className="w-full border-b border-black border-dashed" />

          {/* Products */}
          <div className="py-4">
            {items.map((item, i) => {
              const cp = item.channelProduct;
              const addonTotal = item.selectedAddons.reduce((s, a) => s + a.base_price, 0);
              const unitPrice = cp.price + addonTotal;
              const lineTotal = unitPrice * item.quantity;

              return (
                <div key={i} className="flex justify-between py-1">
                  <div className="text-left">
                    <p className="text-sm">{cp.products?.name ?? 'สินค้า'}</p>
                    <p>{item.quantity} x ฿{unitPrice.toFixed(2)}</p>
                    {item.selectedAddons.map((addon, j) => (
                      <p key={j} className="pl-4">- {addon.name}</p>
                    ))}
                  </div>
                  <div className="text-right">
                    <p className="text-sm">฿{lineTotal.toLocaleString()}</p>
                  </div>
                </div>
              );
            })}
          </div>

          <div className="w-full border-b border-black border-dashed" />

          {/* Total */}
          <div className="flex justify-between py-4 text-base leading-8">
            <p className="font-bold">ราคารวม</p>
            <p className="font-bold">฿{totalPrice.toLocaleString()}</p>
          </div>

          {/* Footer */}
          <div className="w-full border-b border-black border-dashed" />
          <div className="py-4 text-center space-y-2">
            <p>From Home Sandwich</p>
            <p className="text-[10px] text-muted-foreground">จำนวนสินค้า: {totalQuantity} ชิ้น</p>
          </div>
      </div>
    </div>
  );
  }
);
