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
  /** Order/receipt number, shown under the date (optional) */
  orderNo?: string;
  /** Pre-discount total, shown as "ราคาเดิม" when a discount exists (optional) */
  subtotal?: number;
  /** Discount amount, shown as "ส่วนลด" when > 0 (optional) */
  discountTotal?: number;
  /** Order note, shown in the order-info block (optional) */
  note?: string;
}

/**
 * Formats an ISO date string as DD/MM/YY (Buddhist year).
 * If the string includes a time component it is appended as HH:MM:SS.
 * Examples: "2026-02-16" -> "16/02/69", "2026-02-16T18:12:50Z" -> "16/02/69 18:12:50"
 */
function formatDmy(iso: string): string {
  if (!iso) return '';
  const [datePart, timePart] = iso.split('T');
  const [year, month, day] = datePart.split('-').map(Number);
  if (!year || !month || !day) return iso;
  const yy = String(year + 543).slice(-2);
  const dd = String(day).padStart(2, '0');
  const mm = String(month).padStart(2, '0');
  let result = `${dd}/${mm}/${yy}`;
  if (timePart) {
    const time = timePart.split(/[.Z+-]/)[0];
    if (time) result += ` ${time}`;
  }
  return result;
}

const MERCHANT = {
  name: "From Home Sandwich & Beverage",
  slogan: "Joy in every bite, Joy in every moment",
  socials: {
    search: "fromhome.th",
    icons: ["facebook", "instagram"],
  },
};

const SOCIAL_URLS: Record<string, string> = {
  facebook: "https://www.facebook.com/",
  instagram: "https://www.instagram.com/",
};

export const OrderPreview = forwardRef<HTMLDivElement, OrderPreviewProps>(
  function OrderPreview({ customerName, invoiceDate, channelName, items, totalPrice, orderNo, subtotal, discountTotal, note }, ref) {
    const hasDiscount = discountTotal !== undefined && discountTotal > 0;

    return (
      <div
        ref={ref}
        className="w-[304px] mx-auto border border-border/50 bg-white text-black text-xs overflow-hidden"
      >
        <div className="px-[14px] py-[24px]">
          {/* Header */}
          <div className="flex py-4 justify-center">
            <img src="/images/merchant/logo.jpg" className="w-[100px] h-[89px] rounded-lg flex items-center justify-center text-4xl" />
          </div>

          {customerName && (
            <div className="py-2 text-center">
              <p className="font-medium text-2xl">{customerName}</p>
            </div>
          )}

          <div className="py-4 space-y-1">
            <p>วันที่: {formatDmy(invoiceDate)}</p>
            {orderNo && <p>เลขคำสั่งซื้อ: {orderNo}</p>}
            {note && <p className="break-words">หมายเหตุ: {note}</p>}
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

          {/* Discount lines (only when a discount exists) */}
          {hasDiscount && (
            <div className="py-2 space-y-1 text-sm">
              <div className="flex justify-between">
                <p>ราคาเดิม</p>
                <p>฿{(subtotal ?? 0).toLocaleString()}</p>
              </div>
              <div className="flex justify-between">
                <p>ส่วนลด</p>
                <p>฿{discountTotal!.toLocaleString()}</p>
              </div>
            </div>
          )}

          {/* Total */}
          <div className="flex justify-between py-2 text-base leading-8">
            <p className="font-bold">ราคารวม</p>
            <p className="font-bold">฿{totalPrice.toLocaleString()}</p>
          </div>

          {/* Footer */}
          <div className="w-full border-b border-black border-dashed" />
          <div className="py-4 text-center space-y-2">
            <p className="font-semibold">{MERCHANT.name}</p>
            <p className="text-[11px] text-muted-foreground italic">{MERCHANT.slogan}</p>
            <div className="flex flex-col items-center gap-1 pt-1">
              {MERCHANT.socials.icons.map((icon) => (
                <a
                  key={icon}
                  href={(SOCIAL_URLS[icon] ?? "https://") + MERCHANT.socials.search}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-1.5 text-[11px] text-muted-foreground hover:text-primary transition-colors"
                >
                  <img src={`/images/icon/${icon}.png`} alt={icon} className="w-4 h-4" />
                  <span>{MERCHANT.socials.search}</span>
                </a>
              ))}
            </div>
          </div>
      </div>
    </div>
  );
  }
);
