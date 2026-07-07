'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useFormik } from 'formik';
import * as yup from 'yup';
import { PlusCircle, Package, AlertCircle, CheckCircle2 } from 'lucide-react';

import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { create } from '@/lib/db';
import { toast, setGlobalToast, useToast } from '@/lib/toast';

/* ─── Validation Schema (Yup) ─── */
const createCategorySchema = yup.object().shape({
  name: yup
    .string()
    .trim()
    .required('กรุณากรอกชื่อหมวดหมู่')
    .min(2, 'ชื่อต้องมีอย่างน้อย 2 ตัวอักษร'),
});

type FormValues = { name: string };

export default function CreateCategoryPage() {
  const router = useRouter();
  const [banner, setBanner] = useState<{ kind: 'success' | 'error'; text: string } | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  /* Set global toast reference so toast() works from anywhere */
  const { toast: localToast } = useToast();
  useEffect(() => setGlobalToast(localToast), [localToast]);

  /* ─── Submit handler (calls PostgREST directly) ─── */
  const handleSubmit = async (values: FormValues) => {
    setBanner(null);
    setIsSubmitting(true);
    try {
      await create('categories', {
        name: values.name.trim(),
        is_active: true,
      });

      // Show success toast + auto-redirect
      toast({
        title: 'สำเร็จ!',
        description: 'สร้างหมวดหมู่เรียบร้อยแล้ว',
      });
      setBanner({ kind: 'success', text: 'สร้างหมวดหมู่เรียบร้อยแล้ว' });

      // Navigate after a short delay so user sees the toast
      setTimeout(() => router.push('/management/categories'), 1500);
    } catch (err) {
      toast({
        title: 'เกิดข้อผิดพลาด',
        description: err instanceof Error ? err.message : 'ไม่สามารถสร้างหมวดหมู่ได้',
      });
      setBanner({
        kind: 'error',
        text: err instanceof Error ? err.message : 'ไม่สามารถสร้างหมวดหมู่ได้',
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  /* ─── Formik ─── */
  const formik = useFormik<FormValues>({
    initialValues: { name: '' },
    validationSchema: createCategorySchema,
    onSubmit: handleSubmit,
  });

  return (
    <div className="max-w-xl mx-auto">
      <Card className="border border-primary/20 bg-white shadow-sm">
        <CardHeader className="space-y-1.5 pb-2">
          <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-primary text-secondary shadow-sm">
            <Package className="h-6 w-6" aria-hidden />
          </div>
          <CardTitle className="text-xl font-bold text-primary text-center">
            เพิ่มหมวดหมู่ใหม่
          </CardTitle>
          <CardDescription className="text-center text-muted-foreground">
            สร้างหมวดหมู่สินค้าสำหรับจัดกลุ่มสินค้า
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
                  onClick={() => router.push('/management/categories')}
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
            {/* Category Name */}
            <div className="space-y-1.5">
              <label htmlFor="name" className="block text-sm font-medium text-primary">
                ชื่อหมวดหมู่ <span className="text-destructive">*</span>
              </label>
              <Input
                id="name"
                name="name"
                type="text"
                autoComplete="off"
                placeholder="เช่น Sandwich, Drink, Salad"
                className=""
                value={formik.values.name}
                onChange={formik.handleChange('name')}
                onBlur={formik.handleBlur('name')}
                error={formik.touched.name ? (formik.errors.name as string) : undefined}
                disabled={isSubmitting}
              />
            </div>

            {/* Submit Buttons */}
            <div className="flex items-center justify-end gap-2 pt-2">
              <Button
                type="button"
                variant="primary"
                onClick={() => router.push('/management/categories')}
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
                {isSubmitting ? 'กำลังสร้าง...' : 'เพิ่มหมวดหมู่'}
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
