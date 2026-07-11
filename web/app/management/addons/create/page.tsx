'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useQueryClient } from '@tanstack/react-query';
import { useFormik } from 'formik';
import * as yup from 'yup';
import { PlusCircle, AlertCircle, CheckCircle2 } from 'lucide-react';

import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { createProductAddon } from '@/lib/db';
import { toast } from '@/lib/toast';

/* ─── Validation Schema (Yup) ─── */
const createAddonSchema = yup.object().shape({
  name: yup
    .string()
    .trim()
    .required('กรุณากรอกชื่อตัวเลือก')
    .min(2, 'ชื่อต้องมีอย่างน้อย 2 ตัวอักษร'),
  base_price: yup
    .number()
    .typeError('กรุณากรอกราคา')
    .required('กรุณากรอกราคา')
    .min(0, 'ราคาต้องไม่ติดลบ'),
});

type FormValues = {
  name: string;
  base_price: number;
};

export default function CreateAddonPage() {
  const router = useRouter();
  const queryClient = useQueryClient();
  const [banner, setBanner] = useState<{ kind: 'success' | 'error'; text: string } | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  /* ─── Submit handler (calls PostgREST directly) ─── */
  const handleSubmit = async (values: FormValues) => {
    setBanner(null);
    setIsSubmitting(true);
    try {
      await createProductAddon({
        name: values.name.trim(),
        base_price: values.base_price,
        is_active: true,
      });

      // Show success toast + auto-redirect
      toast({
        title: 'สำเร็จ!',
        description: 'สร้างตัวเลือกสินค้าเรียบร้อยแล้ว',
      });
      setBanner({ kind: 'success', text: 'สร้างตัวเลือกสินค้าเรียบร้อยแล้ว' });
      queryClient.invalidateQueries({ queryKey: ['product_addons'] });

      // Navigate after a short delay so user sees the toast
      setTimeout(() => router.push('/management/addons'), 1500);
    } catch (err) {
      toast({
        title: 'เกิดข้อผิดพลาด',
        description: err instanceof Error ? err.message : 'ไม่สามารถสร้างตัวเลือกได้',
      });
      setBanner({
        kind: 'error',
        text: err instanceof Error ? err.message : 'ไม่สามารถสร้างตัวเลือกได้',
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  /* ─── Formik ─── */
  const formik = useFormik<FormValues>({
    initialValues: { name: '', base_price: 0 },
    validationSchema: createAddonSchema,
    onSubmit: handleSubmit,
  });

  return (
    <div className="max-w-xl mx-auto">
      <Card className="border border-primary/20 bg-white shadow-sm">
        <CardHeader className="space-y-1.5 pb-2">
          <CardTitle className="text-xl font-bold text-primary text-center">
            เพิ่มตัวเลือกสินค้า
          </CardTitle>
          <CardDescription className="text-center text-muted-foreground">
            สร้างตัวเลือกสินค้า (Add-on) สำหรับเพิ่มในสินค้า
          </CardDescription>
        </CardHeader>

        <CardContent className="space-y-5 pt-2">
          {/* Banners */}
          {banner?.kind === 'success' && (
            <div
              role="status"
              className="flex items-start gap-2 rounded-lg border border-success/40 bg-success/10 p-3 text-sm text-success"
            >
              <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0" aria-hidden />
              <div className="flex-1">
                <span>{banner.text}</span>
                <button
                  type="button"
                  onClick={() => router.push('/management/addons')}
                  className="ml-2 font-semibold underline underline-offset-2 hover:text-success/80"
                >
                  กลับไปหน้ารายชื่อ
                </button>
              </div>
            </div>
          )}

          {banner?.kind === 'error' && (
            <div
              role="alert"
              className="flex items-start gap-2 rounded-lg border border-destructive/40 bg-destructive/10 p-3 text-sm text-destructive"
            >
              <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" aria-hidden />
              <span>{banner.text}</span>
            </div>
          )}

          {/* Form Container — no <form> tag */}
          <div className="space-y-4">
            {/* Addon Name */}
            <div className="space-y-1.5">
              <label htmlFor="name" className="block text-sm font-medium text-primary">
                ชื่อตัวเลือก <span className="text-destructive">*</span>
              </label>
              <Input
                id="name"
                name="name"
                type="text"
                autoComplete="off"
                placeholder="เช่น เพิ่มไข่, ชีสเพิ่ม, ซอสพิเศษ"
                value={formik.values.name}
                onChange={formik.handleChange('name')}
                onBlur={formik.handleBlur('name')}
                error={formik.touched.name ? (formik.errors.name as string) : undefined}
                disabled={isSubmitting}
              />
            </div>

            {/* Base Price */}
            <div className="space-y-1.5">
              <label htmlFor="base_price" className="block text-sm font-medium text-primary">
                ราคา (บาท) <span className="text-destructive">*</span>
              </label>
              <Input
                id="base_price"
                name="base_price"
                type="number"
                min="0"
                step="1"
                autoComplete="off"
                placeholder="เช่น 10"
                value={formik.values.base_price}
                onChange={formik.handleChange('base_price')}
                onBlur={formik.handleBlur('base_price')}
                error={formik.touched.base_price ? (formik.errors.base_price as string) : undefined}
                disabled={isSubmitting}
              />
            </div>

            {/* Submit Buttons */}
            <div className="flex items-center justify-end gap-2 pt-2">
              <Button
                type="button"
                variant="destructive"
                onClick={() => router.push('/management/addons')}
                disabled={isSubmitting}
              >
                ยกเลิก
              </Button>
              <Button
                type="button"
                variant="primary"
                onClick={() => formik.handleSubmit()}
                disabled={!formik.isValid || isSubmitting}
              >
                <PlusCircle className="mr-2 h-4 w-4" aria-hidden />
                {isSubmitting ? 'กำลังสร้าง...' : 'สร้างตัวเลือก'}
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}