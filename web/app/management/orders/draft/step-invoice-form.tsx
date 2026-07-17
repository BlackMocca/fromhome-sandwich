'use client';

import { useEffect, useRef, useState } from 'react';
import { useFormik } from 'formik';
import * as yup from 'yup';
import { useQuery } from '@tanstack/react-query';
import { useOrder } from '@/contexts/OrderContext';
import { useRouter } from 'next/navigation';
import { ArrowLeft, Plus, Trash2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { InputDate } from '@/components/ui/input-date';
import { OrderPreview } from '@/components/ui/OrderPreview';
import { getNextReceiptNo, createReceipt } from '@/lib/db';
import { getChannelById } from '@/lib/db';

// ─── Types ──────────────────────────────────────────────

export interface DiscountSet {
  id: string;
  discount_type: 'percentage' | 'pricing' | 'coupon';
  coupon_code?: string;
  percentage?: number;
  price?: number;
}

interface InvoiceFormValues {
  receiptNo: string;
  customerName: string;
  invoiceDate: string;
  note: string;
  discounts: DiscountSet[];
}

// ─── Validation Schema ─────────────────────────────────

const invoiceSchema = yup.object({
  receiptNo: yup.string(),
  customerName: yup.string().trim(),
  invoiceDate: yup.string().required('กรุณาเลือกวันที่'),
  note: yup.string(),
  discounts: yup.array().of(
    yup.object({
      id: yup.string().required(),
      discount_type: yup.string().oneOf(['percentage', 'pricing', 'coupon']).required(),
      coupon_code: yup.string(),
      percentage: yup.number().min(0).max(100),
      price: yup.number().min(0),
    })
  ),
});

// ─── Component ─────────────────────────────────────────

export function StepInvoiceForm({ onBack }: { onBack: () => void }) {
  const router = useRouter();
  const { items, channelId, channelCode, channelName, totalQuantity, totalPrice, clearOrder } = useOrder();
  const previewRef = useRef<HTMLDivElement>(null);

  console.log('[StepInvoiceForm] render', { channelId, channelCode, channelName });

  // Resolve channelCode from DB if missing (e.g., old localStorage data)
  const [resolvedCode, setResolvedCode] = useState(channelCode);
  useEffect(() => {
    if (channelCode) {
      setResolvedCode(channelCode);
      return;
    }
    if (!channelId) return;
    getChannelById(channelId).then(ch => {
      if (ch?.code) setResolvedCode(ch.code);
    });
  }, [channelCode, channelId]);

  const effectiveCode = channelCode ?? resolvedCode;

  // Sync fallback receipt number from channelCode
  const today = new Date().toISOString().split('T')[0];
  const fallbackReceiptNo = effectiveCode
    ? `${effectiveCode}${today.replace(/-/g, '')}0001`
    : '';

  // Fetch actual running number from server via React Query
  const receiptQuery = useQuery({
    queryKey: ['receiptNo', effectiveCode, today],
    queryFn: () => getNextReceiptNo(effectiveCode!, today),
    enabled: !!effectiveCode,
    staleTime: 30_000,
  });
  console.log('[StepInvoiceForm] receiptQuery', { enabled: !!effectiveCode, data: receiptQuery.data, status: receiptQuery.status });

  const receiptNo = receiptQuery.data || fallbackReceiptNo;

  // Sync receiptNo into Formik values
  useEffect(() => {
    if (receiptNo) formik.setFieldValue('receiptNo', receiptNo);
  }, [receiptNo]);

  // ─── Formik ──────────────────────────────────────────

  const formik = useFormik<InvoiceFormValues>({
    initialValues: {
      receiptNo: '',
      customerName: '',
      invoiceDate: new Date().toISOString().split('T')[0],
      note: '',
      discounts: [],
    },
    validationSchema: invoiceSchema,
    onSubmit: async (values) => {
      if (!channelId || !effectiveCode || items.length === 0) return;

      // Build receipt items with snapshot data
      const receiptItems = items.map(item => {
        const addonTotal = item.selectedAddons.reduce((s, a) => s + a.base_price, 0);
        const unitPrice = item.channelProduct.price + addonTotal;
        return {
          product_id: item.channelProduct.product_id,
          product_name: item.channelProduct.products?.name ?? 'สินค้า',
          product_price: item.channelProduct.price,
          product_cost: item.channelProduct.cost,
          product_options: item.selectedAddons.map(a => ({
            id: a.id,
            name: a.name,
            price: a.base_price,
          })),
          quantity: item.quantity,
          line_total: unitPrice * item.quantity,
          note: item.note || null,
        };
      });

      // Calculate totals
      const subtotal = totalPrice;
      const discountTotal = values.discounts.reduce((s, d) => {
        if (d.discount_type === 'percentage') return s + Math.round(((d.percentage ?? 0) * totalPrice) / 100);
        return s + (d.price ?? 0);
      }, 0);
      const grandTotal = subtotal - discountTotal;

      // Create receipt via server action
      const result = await createReceipt({
        channel_id: channelId,
        channel_code: effectiveCode,
        receipt_no: formik.values.receiptNo,
        customer_name: values.customerName,
        bill_date: values.invoiceDate,
        total_quantity: totalQuantity,
        subtotal,
        discount_total: discountTotal,
        grand_total: grandTotal,
        discounts: values.discounts.map(d => ({
          type: d.discount_type,
          ...(d.price != null && d.price > 0 && { price: d.price }),
          ...(d.percentage != null && d.percentage > 0 && { percentage: d.percentage }),
          ...(d.coupon_code && { code: d.coupon_code }),
        })),
        note: values.note,
        items: receiptItems,
      });

      if (result.success) {
        clearOrder();
        // Pass ?send=telegram so the receipt page auto-sends the bill to
        // Telegram once it has rendered (only if Telegram is configured).
        router.push(`/management/receipts/${result.receipt?.id}?send=telegram`);
      }
    },
  });

  // Compute discount total + grand total for the live preview (mirrors onSubmit logic)
  const previewDiscountTotal = formik.values.discounts.reduce((s, d) => {
    if (d.discount_type === 'percentage') return s + Math.round(((d.percentage ?? 0) * totalPrice) / 100);
    return s + (d.price ?? 0);
  }, 0);
  const previewGrandTotal = totalPrice - previewDiscountTotal;

  // ─── Discount helpers ────────────────────────────────

  const addDiscount = () => {
    formik.setFieldValue('discounts', [
      ...formik.values.discounts,
      { id: crypto.randomUUID(), discount_type: 'pricing' },
    ]);
  };

  const removeDiscount = (id: string) => {
    formik.setFieldValue(
      'discounts',
      formik.values.discounts.filter(d => d.id !== id),
    );
  };

  const updateDiscount = (id: string, field: keyof DiscountSet, value: unknown) => {
    formik.setFieldValue(
      'discounts',
      formik.values.discounts.map(d => d.id === id ? { ...d, [field]: value } : d),
    );
  };

  // ─── Render ──────────────────────────────────────────

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
          <Button type="button" variant="primary" className="text-white" disabled={formik.isSubmitting}
            onClick={() => (document.getElementById('invoice-form') as HTMLFormElement)?.requestSubmit()}>
            {formik.isSubmitting ? 'กำลังสร้างบิล...' : 'สร้างบิล'}
          </Button>
        </div>
      </div>

      {/* Form | Preview layout */}
      <div className="flex flex-col lg:flex-row gap-6 items-start w-full max-w-[1028px] px-2">
        {/* Form Section */}
        <div className="w-full space-y-4 flex-1 min-w-0">
          <form id="invoice-form" onSubmit={formik.handleSubmit} className="space-y-4">
            {/* Form fields */}
            <div className="space-y-4 mb-6">
              {/* Receipt No (auto-generated, readonly) */}
              <div className="space-y-2">
                <label htmlFor="receiptNo" className="text-sm font-medium text-primary">
                  เลขที่บิล
                </label>
                <Input
                  id="receiptNo"
                  value={formik.values.receiptNo}
                  readOnly
                  disabled
                  className="bg-surface/50 font-mono"
                />
              </div>

              {/* Invoice Date */}
              <div className="space-y-2">
                <label className="text-sm font-medium text-primary">
                  วันที่ออกบิล <span className="text-destructive">*</span>
                </label>
                <InputDate
                  value={formik.values.invoiceDate}
                  onValueChange={(val) => formik.setFieldValue('invoiceDate', val)}
                  className="max-w-xs"
                />
                {formik.touched.invoiceDate && formik.errors.invoiceDate && (
                  <p className="text-sm text-destructive">{formik.errors.invoiceDate}</p>
                )}
              </div>

              {/* Customer Name */}
              <div className="space-y-2">
                <label htmlFor="customerName" className="text-sm font-medium text-primary">
                  ชื่อลูกค้า <span className="text-muted-foreground text-xs">(ไม่บังคับ)</span>
                </label>
                <Input
                  id="customerName"
                  placeholder="กรอกชื่อลูกค้า"
                  {...formik.getFieldProps('customerName')}
                />
                {formik.touched.customerName && formik.errors.customerName && (
                  <p className="text-sm text-destructive">{formik.errors.customerName}</p>
                )}
              </div>

              {/* Note */}
              <div className="space-y-2">
                <label htmlFor="note" className="text-sm font-medium text-primary">
                  หมายเหตุ
                </label>
                <textarea
                  id="note"
                  placeholder="หมายเหตุ (ถ้ามี)"
                  rows={2}
                  {...formik.getFieldProps('note')}
                  className="flex w-full rounded-md border border-border bg-surface px-3 py-2 text-sm ring-offset-surface placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 resize-none"
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
              {formik.values.discounts.map((discount) => {
                const isCoupon = discount.discount_type === 'coupon';
                const isPercentage = discount.discount_type === 'percentage';
                const isPricing = discount.discount_type === 'pricing';

                const calculatedPrice = isPercentage
                  ? Math.round(((discount.percentage ?? 0) * totalPrice) / 100)
                  : discount.price ?? 0;

                return (
                  <div key={discount.id} className="flex flex-col gap-3 p-3 border rounded-lg bg-surface/50 overflow-hidden">
                    {/* Row 1: Type selector */}
                    <div className="w-full min-w-0 space-y-1">
                      <label className="text-xs font-medium text-muted-foreground">ประเภทส่วนลด</label>
                      <select
                        value={discount.discount_type}
                        onChange={(e) => updateDiscount(discount.id, 'discount_type', e.target.value)}
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
            customerName={formik.values.customerName}
            invoiceDate={formik.values.invoiceDate}
            channelName={channelName}
            items={items}
            totalQuantity={totalQuantity}
            totalPrice={previewGrandTotal}
            orderNo={formik.values.receiptNo}
            subtotal={totalPrice}
            discountTotal={previewDiscountTotal}
            note={formik.values.note}
          />
        </div>
      </div>

      {/* Mobile Actions: Bottom, outside layout form/preview */}
      <div className="lg:hidden flex justify-end gap-2 pt-6 pb-8 w-full border-t mt-6 max-w-[1028px] px-2 mx-auto">
        <Button type="button" variant="destructive" onClick={onBack}>
          ยกเลิก
        </Button>
        <Button type="button" variant="primary" className="text-white" disabled={formik.isSubmitting}
          onClick={() => (document.getElementById('invoice-form') as HTMLFormElement)?.requestSubmit()}>
          {formik.isSubmitting ? 'กำลังสร้างบิล...' : 'สร้างบิล'}
        </Button>
      </div>
    </>
  );
}
