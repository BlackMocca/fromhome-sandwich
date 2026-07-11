'use client';

import { useEffect, useState } from 'react';
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

/* ─── Validation Schema (Yup) ─── */
const channelProductSchema = yup.object().shape({
  price: yup.number().typeError('กรุณากรอกราคาขาย').required().min(0),
  cost: yup.number().typeError('กรุณากรอกต้นทุน').required().min(0),
});

type FormValues = {
  price: number;
  cost: number;
};

interface Step2Props {
  channel: Channel;
  template: Product;
  onSubmit: (values: FormValues, addonIds: number[]) => Promise<void>;
  onBack: () => void;
}

export function Step2ChannelForm({ channel, template, onSubmit, onBack }: Step2Props) {
  const router = useRouter();

  const addons: ProductAddon[] = (template.product_mapping_addons ?? [])
    .map(m => m.product_addons)
    .filter((a): a is ProductAddon => a !== undefined);

  const initialAddonIds = addons.map(a => a.id);

  const formik = useFormik<FormValues>({
    initialValues: {
      price: calcGrandPercentage(template.base_price, channel.gp_percentage || 0),
      cost: calcGrandPercentage(template.cost, channel.gp_percentage || 0),
    },
    enableReinitialize: false,
    validationSchema: channelProductSchema,
    onSubmit: async (values) => {
      await onSubmit(values, selectedAddonIds);
    },
  });

  const [selectedAddonIds, setSelectedAddonIds] = useState(initialAddonIds);

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
      {/* Left: Preview card */}
      <div>
        <ProductCard
          product={template}
          category={template.categories ?? null}
          options={addons}
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

            {/* Addons */}
            {addons.length > 0 && (
              <div className="space-y-2">
                <label className="block text-sm font-medium text-primary">ตัวเลือก:</label>
                <div className="flex flex-wrap gap-2">
                  {addons.map(addon => {
                    const isSelected = selectedAddonIds.includes(addon.id);
                    return (
                      <button
                        key={addon.id}
                        type="button"
                        onClick={() => {
                          setSelectedAddonIds(prev =>
                            isSelected
                              ? prev.filter(id => id !== addon.id)
                              : [...prev, addon.id]
                          );
                        }}
                        className={cn(
                          'px-3 py-1.5 rounded-full text-sm transition-colors border',
                          isSelected
                            ? 'bg-primary/15 text-primary border-primary/30 font-semibold'
                            : 'bg-surface text-muted-foreground border-border/50 hover:bg-action/10',
                        )}
                      >
                        {addon.name}
                        {addon.base_price > 0 && ` +฿${addon.base_price}`}
                      </button>
                    );
                  })}
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
