'use client';

import { useRef, useState } from 'react';
import { useOrder } from '@/contexts/OrderContext';
import { useRouter } from 'next/navigation';
import { ArrowLeft, Download, Plus, Trash2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { InputDate } from '@/components/ui/input-date';
import { OrderPreview } from '@/components/ui/OrderPreview';
import html2canvas from 'html2canvas';

export interface DiscountSet {
  id: string;
  discount_type: 'percentage' | 'pricing' | 'coupon';
  coupon_code?: string;
  percentage?: number;
  price?: number;
}

export function StepInvoiceForm({ onBack }: { onBack: () => void }) {
  const router = useRouter();
  const { items, channelName, totalQuantity, totalPrice, clearOrder } = useOrder();
  const [orderingRef, setOrderingRef] = useState('');
  const [customerName, setCustomerName] = useState('');
  const [invoiceDate, setInvoiceDate] = useState(() => new Date().toISOString().split('T')[0]);
  const [discounts, setDiscounts] = useState<DiscountSet[]>([]);

  const addDiscount = () => {
    setDiscounts([...discounts, { id: crypto.randomUUID(), discount_type: 'pricing' }]);
  };

  const removeDiscount = (id: string) => {
    setDiscounts(discounts.filter(d => d.id !== id));
  };

  const updateDiscount = (id: string, field: keyof DiscountSet, value: any) => {
    setDiscounts(discounts.map(d => d.id === id ? { ...d, [field]: value } : d));
  };
  const previewRef = useRef<HTMLDivElement>(null);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!customerName.trim()) return;
    console.log({ customerName, invoiceDate, items, totalQuantity, totalPrice });
    clearOrder();
    router.back();
  };

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
    link.download = `invoice-${invoiceDate}.jpg`;
    link.click();
    style.remove();
  };

  return (
    <>
      {/* Header & Actions */}
      <div className="flex flex-col sm:flex-row items-start justify-between gap-4 mb-6">
        <div className="flex items-start gap-3">
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

        {/* Desktop Actions: Top-right corner */}
        <div className="hidden lg:flex justify-end items-center gap-2 w-full sm:w-auto">
          <Button type="button" variant="destructive" onClick={onBack}>
            ยกเลิก
          </Button>
          <Button type="button" variant="default" onClick={handleDownload}>
            <Download className="w-4 h-4 mr-1" />
            ดาวน์โหลด
          </Button>
          <Button type="submit" form="invoice-form" variant="primary" className="text-white">
            สร้างบิล
          </Button>
        </div>
      </div>

      {/* Form | Preview layout */}
      <div className="flex flex-col lg:flex-row gap-6 items-start w-full max-w-[1028px] px-2">
        {/* Form Section */}
        <div className="w-full space-y-4 flex-1 min-w-0">
          <form id="invoice-form" onSubmit={handleSubmit} className="space-y-4">
            {/* Form fields stacked vertically: Ordering, order_date, customer_name */}
            <div className="space-y-4 mb-6">
              <div className="space-y-2">
                <label htmlFor="orderingRef" className="text-sm font-medium text-primary">
                  ที่สั่ง
                </label>
                <Input
                  id="orderingRef"
                  placeholder="เลขที่ใบสั่งซื้อ"
                  value={orderingRef}
                  onChange={e => setOrderingRef(e.target.value)}
                />
              </div>

              <div className="space-y-2">
                <label className="text-sm font-medium text-primary">
                  วันที่ออกบิล <span className="text-destructive">*</span>
                </label>
                <InputDate
                  value={invoiceDate}
                  onValueChange={setInvoiceDate}
                  className="max-w-xs"
                />
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
            </div>

            {/* Discounts section */}
            <div className="space-y-3 pt-2">
              <div className="flex items-center justify-between">
                <label className="text-sm font-medium text-primary">ส่วนลดราคา (optional)</label>
                <Button type="button" variant="ghost" size="sm" onClick={addDiscount} className="h-8 px-2">
                  <Plus className="w-4 h-4 mr-1" />
                  เพิ่มส่วนลด
                </Button>
              </div>
              {discounts.map((discount) => {
                const isCoupon = discount.discount_type === 'coupon';
                const isPercentage = discount.discount_type === 'percentage';
                const isPricing = discount.discount_type === 'pricing';

                const calculatedPrice = isPercentage
                  ? ((discount.percentage ?? 0) * totalPrice) / 100
                  : discount.price ?? 0;

                return (
                  <div key={discount.id} className="flex flex-col gap-3 p-3 border rounded-lg bg-surface/50 overflow-hidden">
                    {/* Row 1: Type selector */}
                    <div className="w-full min-w-0 space-y-1">
                      <label className="text-xs font-medium text-muted-foreground">ประเภทส่วนลด</label>
                      <select
                        value={discount.discount_type}
                        onChange={(e) => updateDiscount(discount.id, 'discount_type', e.target.value as 'percentage' | 'pricing' | 'coupon')}
                        className="w-full h-10 px-3 border border-border rounded-lg bg-surface text-sm focus:outline-none focus:ring-2 focus:ring-action truncate"
                      >
                        <option value="pricing">Pricing</option>
                        <option value="percentage">Percentage</option>
                        <option value="coupon">Coupon</option>
                      </select>
                    </div>

                    {/* Row 2: Fields based on type */}
                    <div className="flex flex-col md:flex-row gap-3 min-w-0">
                      {/* Coupon: coupon_code */}
                      {isCoupon && (
                        <div className="flex-1 min-w-0 space-y-1">
                          <label className="text-xs font-medium text-primary">โค้ดคูปอง</label>
                          <Input
                            placeholder="กรอกโค้ดคูปอง"
                            value={discount.coupon_code || ''}
                            onChange={(e) => updateDiscount(discount.id, 'coupon_code', e.target.value)}
                          />
                        </div>
                      )}

                      {/* Percentage: percentage input */}
                      {isPercentage && (
                        <div className="flex-1 min-w-0 space-y-1">
                          <label className="text-xs font-medium text-primary">เปอร์เซ็นต์ส่วนลด</label>
                          <Input
                            type="number"
                            min={0}
                            max={100}
                            placeholder="0"
                            value={discount.percentage ?? ''}
                            onChange={(e) => updateDiscount(discount.id, 'percentage', e.target.value ? Number(e.target.value) : undefined)}
                          />
                        </div>
                      )}

                      {/* Discount price — disabled for coupon & percentage, editable for pricing */}
                      <div className="flex-1 min-w-0 space-y-1">
                        <label className="text-xs font-medium text-muted-foreground">ราคาส่วนลด</label>
                        <Input
                          type="number"
                          placeholder="0"
                          value={isPricing ? (discount.price ?? '') : calculatedPrice || ''}
                          onChange={(e) => {
                            if (isPricing) {
                              updateDiscount(discount.id, 'price', e.target.value ? Number(e.target.value) : undefined);
                            }
                          }}
                          disabled={!isPricing}
                          className={!isPricing ? 'opacity-60 cursor-not-allowed' : ''}
                        />
                      </div>
                    </div>

                    {/* Delete */}
                    <div className="flex items-end">
                      <Button type="button" variant="destructive" size="sm" onClick={() => removeDiscount(discount.id)}>
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    </div>
                  </div>
                );
              })}
            </div>
          </form>
        </div>

        {/* Separator on mobile, or vertical border on desktop */}
        <div className="hidden lg:block w-px bg-border self-stretch"></div>
        <div className="lg:hidden w-full h-px bg-border my-4"></div>

        {/* Preview Section */}
        <div className="w-full lg:w-[320px] flex justify-center lg:justify-start">
          <OrderPreview
            ref={previewRef}
            customerName={customerName}
            invoiceDate={invoiceDate}
            channelName={channelName}
            items={items}
            totalQuantity={totalQuantity}
            totalPrice={totalPrice}
          />
        </div>
      </div>

      {/* Mobile Actions: Bottom, outside layout form/preview */}
      <div className="lg:hidden flex justify-end gap-2 pt-6 pb-8 w-full border-t mt-6 max-w-[1028px] px-2 mx-auto">
        <Button type="button" variant="destructive" onClick={onBack}>
          ยกเลิก
        </Button>
        <Button type="button" variant="default" onClick={handleDownload}>
          <Download className="w-4 h-4 mr-1" />
          ดาวน์โหลด
        </Button>
        <Button type="submit" form="invoice-form" variant="primary" className="text-white">
          สร้างบิล
        </Button>
      </div>
    </>
  );
}
