'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useQueryClient } from '@tanstack/react-query';
import { useFormik } from 'formik';
import * as yup from 'yup';
import { Edit2, AlertCircle, CheckCircle2 } from 'lucide-react';

import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { getProductAddon, updateProductAddon } from '@/lib/db';
import { toast } from '@/lib/toast';
import type { ProductAddon } from '@/types/product_addon';

/* ─── Validation Schema (Yup) ─── */
const editAddonSchema = yup.object().shape({
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

interface PageProps {
  params: Promise<{ id: string }>;
}

export default function EditAddonPage({ params }: PageProps) {
  const router = useRouter();
  const queryClient = useQueryClient();
  const [addon, setAddon] = useState<ProductAddon | null>(null);
  const [banner, setBanner] = useState<{ kind: 'success' | 'error'; text: string } | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Fetch addon data on mount
  useEffect(() => {
    params.then((p) => {
      if (p.id) {
        getProductAddon(Number(p.id)).then((data) => {
          setAddon(data);
        });
      }
    });
  }, [params]);

  /* ─── Submit handler (calls PostgREST PATCH) ─── */
  const handleSubmit = async (values: FormValues) => {
    if (!addon) return;
    setBanner(null);
    setIsSubmitting(true);
    try {
      await updateProductAddon(addon.id, {
        name: values.name.trim(),
        base_price: values.base_price,
      });

      toast({
        title: 'สำเร็จ!',
        description: 'แก้ไขตัวเลือกสินค้าเรียบร้อยแล้ว',
      });
      setBanner({ kind: 'success', text: 'แก้ไขตัวเลือกสินค้าเรียบร้อยแล้ว' });
      queryClient.invalidateQueries({ queryKey: ['product_addons'] });

      setTimeout(() => router.push('/management/addons'), 1500);
    } catch (err) {
      toast({
        title: 'เกิดข้อผิดพลาด',
        description: err instanceof Error ? err.message : 'ไม่สามารถแก้ไขตัวเลือกได้',
      });
      setBanner({
        kind: 'error',
        text: err instanceof Error ? err.message : 'ไม่สามารถแก้ไขตัวเลือกได้',
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  /* ─── Formik ─── */
  const formik = useFormik<FormValues>({
    initialValues: { name: addon?.name ?? '', base_price: addon?.base_price ?? 0 },
    validationSchema: editAddonSchema,
    onSubmit: handleSubmit,
    enableReinitialize: true,
  });

  return (
    <div className="max-w-xl mx-auto">
      <Card className="border border-primary/20 bg-white shadow-sm">
        <CardHeader className="space-y-1.5 pb-2">
          <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-primary text-secondary shadow-sm">
            <Edit2 className="h-6 w-6" aria-hidden />
          </div>
          <CardTitle className="text-xl font-bold text-primary text-center">
            แก้ไขตัวเลือกสินค้า
          </CardTitle>
          <CardDescription className="text-center text-muted-foreground">
            แก้ไขข้อมูลตัวเลือกสินค้า (Add-on)
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

          {/* Form Container */}
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
                <Edit2 className="mr-2 h-4 w-4" aria-hidden />
                {isSubmitting ? 'กำลังบันทึก...' : 'บันทึกข้อมูล'}
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}