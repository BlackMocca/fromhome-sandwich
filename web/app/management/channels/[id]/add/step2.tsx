'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useFormik } from 'formik';
import * as yup from 'yup';

import { Card, CardContent } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { ProductCard } from '@/components/app/product-card';
import { cn } from '@/lib/utils';
import { calcPercentage, calcGrandPercentage } from '@/utils/gp';
import type { Channel } from '@/types/channel';
import type { Product } from '@/types/product';
import type { ProductAddon } from '@/types/product_addon';

/* ─── Addon item shape inside Formik ─── */
type AddonItem = {
  addon_id: number;
  name: string;
  price: number;
  is_selected: boolean;
};

/* ─── Validation Schema ─── */
const channelProductSchema = yup.object().shape({
  price: yup.number().typeError('กรุณากรอกราคาขาย').required().min(0),
  cost: yup.number().typeError('กรุณากรอกต้นทุน').required().min(0),
  addons: yup.array().of(
    yup.object().shape({
      addon_id: yup.number().required(),
      name: yup.string().required(),
      price: yup.number().typeError('กรุณากรอกราคา').required().min(0),
      is_selected: yup.boolean().required(),
    })
  ),
});

type FormValues = {
  price: number;
  cost: number;
  addons: AddonItem[];
};

interface Step2Props {
  channel: Channel;
  template: Product;
  onSubmit: (values: { price: number; cost: number }, addons: { addon_id: number; price: number }[]) => Promise<void>;
  onBack: () => void;
}

export function Step2ChannelForm({ channel, template, onSubmit, onBack }: Step2Props) {
  const router = useRouter();

  const templateAddons: ProductAddon[] = (template.product_mapping_addons ?? [])
    .map(m => m.product_addons)
    .filter((a): a is ProductAddon => a !== undefined);

  /* ─── Build initial addons from template ─── */
  const initialAddons: AddonItem[] = templateAddons.map(a => ({
    addon_id: a.id,
    name: a.name,
    price: a.base_price,
    is_selected: true,
  }));

  /* ─── Formik ─── */
  const formik = useFormik<FormValues>({
    initialValues: {
      price: calcGrandPercentage(template.base_price, channel.gp_percentage || 0),
      cost: calcGrandPercentage(template.cost, channel.gp_percentage || 0),
      addons: initialAddons,
    },
    enableReinitialize: false,
    validationSchema: channelProductSchema,
    onSubmit: async (values) => {
      const payload = values.addons
        .filter(a => a.is_selected)
        .map(a => ({ addon_id: a.addon_id, price: a.price }));
      await onSubmit({ price: values.price, cost: values.cost }, payload);
    },
  });

  /* ─── Toggle addon ─── */
  const toggleAddon = (index: number) => {
    const addons = [...formik.values.addons];
    addons[index] = { ...addons[index], is_selected: !addons[index].is_selected };
    formik.setFieldValue('addons', addons);
  };

  /* ─── Update addon price ─── */
  const updateAddonPrice = (index: number, price: number) => {
    const addons = [...formik.values.addons];
    addons[index] = { ...addons[index], price };
    formik.setFieldValue('addons', addons);
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
      {/* Left: Preview card */}
      <div>
        <ProductCard
          product={template}
          category={template.categories ?? null}
          options={formik.values.addons
            .filter(a => a.is_selected)
            .map(a => ({ id: a.addon_id, name: a.name, base_price: a.price, is_active: true }))}
          onAdd={() => {}}
          hideActions
        />
      </div>

      {/* Right: Form */}
      <Card className="border border-primary/20 bg-white shadow-sm">
        <CardContent className="space-y-4 pt-6">
          <h2 className="text-lg font-bold text-primary mb-2">Step 2: ปรับข้อมูลสินค้า</h2>

          {/* Price Breakdown */}
          <div className="rounded-lg bg-surface border border-border/50 p-4 space-y-2 text-sm">
            <div className="flex justify-between">
              <span className="text-muted-foreground">ต้นทุนจากสินค้าหลัก</span>
              <span className="font-semibold text-primary">฿{template.cost.toLocaleString()}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">ราคาสินค้าหลัก (Base Price)</span>
              <span className="font-semibold text-primary">฿{template.base_price.toLocaleString()}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">GP</span>
              <span className="font-semibold text-primary">{channel.gp_percentage ?? 0}%</span>
            </div>
            <div className="border-t border-border/50" />
            <div className="flex justify-between">
              <span className="text-muted-foreground">ราคา GP / ต้นทุนหลังคำนวณ GP</span>
              <span className="font-semibold text-success">
                ฿{calcPercentage(template.cost, channel.gp_percentage ?? 0).toLocaleString()} / ฿{calcGrandPercentage(template.cost, channel.gp_percentage ?? 0)}
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">ราคา GP / ราคาขายหลังคำนวณ GP</span>
              <span className="font-semibold text-primary">
                ฿{calcPercentage(template.base_price, channel.gp_percentage ?? 0).toLocaleString()} / ฿{calcGrandPercentage(template.base_price, channel.gp_percentage ?? 0).toLocaleString()}
              </span>
            </div>
          </div>

          <form onSubmit={formik.handleSubmit} className="space-y-4">
            {/* Price */}
            <div className="space-y-1.5">
              <label className="block text-sm font-medium text-primary">
                ราคาขาย (บาท) <span className="text-destructive">*</span>
              </label>
              <Input
                id="price"
                name="price"
                type="number"
                min="0"
                step="1"
                value={formik.values.price}
                onChange={formik.handleChange}
                onBlur={formik.handleBlur}
                error={formik.touched.price ? (formik.errors.price as string) : undefined}
              />
            </div>

            {/* Cost */}
            <div className="space-y-1.5">
              <label className="block text-sm font-medium text-primary">
                ต้นทุน (บาท) <span className="text-destructive">*</span>
              </label>
              <Input
                id="cost"
                name="cost"
                type="number"
                min="0"
                step="1"
                value={formik.values.cost}
                onChange={formik.handleChange}
                onBlur={formik.handleBlur}
                error={formik.touched.cost ? (formik.errors.cost as string) : undefined}
              />
              <p className="text-xs text-muted-foreground">
                {channel.gp_percentage && channel.gp_percentage > 0
                  ? `คำนวณจากราคาขาย × GP ${channel.gp_percentage}%`
                  : 'ใช้ต้นทุนจากสินค้าหลัก'}
              </p>
            </div>

            {/* Addons — from Formik */}
            {formik.values.addons.length > 0 && (
              <div className="space-y-2">
                <label className="block text-sm font-medium text-primary">ตัวเลือก:</label>
                <div className="space-y-2">
                  {formik.values.addons.map((addon, index) => (
                    <div
                      key={addon.addon_id}
                      className={cn(
                        'flex items-center gap-3 px-3 py-2 rounded-lg border transition-colors',
                        addon.is_selected
                          ? 'bg-primary/10 border-primary/30'
                          : 'bg-surface border-border/50 hover:bg-action/5',
                      )}
                    >
                      <button
                        type="button"
                        onClick={() => toggleAddon(index)}
                        className={cn(
                          'w-5 h-5 rounded flex items-center justify-center border shrink-0 transition-colors',
                          addon.is_selected
                            ? 'bg-primary border-primary text-white'
                            : 'bg-white border-border/60',
                        )}
                      >
                        {addon.is_selected && (
                          <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}>
                            <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                          </svg>
                        )}
                      </button>
                      <span className="text-sm text-primary flex-1">{addon.name}</span>
                      <span className="text-xs text-muted-foreground">+฿</span>
                      <input
                        type="number"
                        min="0"
                        step="1"
                        value={addon.price}
                        onChange={(e) => updateAddonPrice(index, Number(e.target.value))}
                        onClick={(e) => e.stopPropagation()}
                        className="w-20 px-2 py-1 text-sm text-right border border-border/50 rounded bg-white focus:outline-none focus:ring-1 focus:ring-primary/50 disabled:opacity-50"
                        disabled={!addon.is_selected}
                      />
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Actions */}
            <div className="flex items-center justify-between pt-4 border-t border-border/50 mt-4">
              <Button type="button" variant="ghost" onClick={onBack}>
                เลือกสินค้าอื่น
              </Button>
              <div className="flex items-center gap-2">
                <Button
                  type="button"
                  variant="destructive"
                  onClick={() => router.push(`/management/channels/${channel.id}`)}
                >
                  ยกเลิก
                </Button>
                <Button
                  type="submit"
                  variant="primary"
                  disabled={!formik.isValid || formik.isSubmitting}
                >
                  {formik.isSubmitting ? 'กำลังบันทึก...' : 'บันทึกสินค้า'}
                </Button>
              </div>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
