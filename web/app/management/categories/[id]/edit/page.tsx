'use client';

import { useState, useEffect } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { useFormik } from 'formik';
import * as yup from 'yup';
import { Edit2, Package, AlertCircle, CheckCircle2 } from 'lucide-react';

import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { getOne, update } from '@/lib/db';
import type { Category } from '@/types/category';
import { toast } from '@/lib/toast';

/* ─── Validation Schema (Yup) ─── */
const editCategorySchema = yup.object().shape({
  name: yup
    .string()
    .trim()
    .required('กรุณากรอกชื่อหมวดหมู่')
    .min(2, 'ชื่อต้องมีอย่างน้อย 2 ตัวอักษร'),
});

type FormValues = { name: string };

export default function EditCategoryPage() {
  const router = useRouter();
  const params = useParams<{ id: string }>();
  const [banner, setBanner] = useState<{ kind: 'success' | 'error'; text: string } | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  /* ─── Fetch existing category ─── */
  const [category, setCategory] = useState<Category | null>(null);

  useEffect(() => {
    if (params.id) {
      getOne<Category>('categories', params.id).then(data => {
        setCategory(data);
      });
    }
  }, [params.id]);

  /* ─── Submit handler (calls PostgREST PATCH → 204) ─── */
  const handleSubmit = async (values: FormValues) => {
    setBanner(null);
    setIsSubmitting(true);
    try {
      await update('categories', category!.id, {
        name: values.name.trim(),
      });

      toast({ title: 'สำเร็จ!', description: 'แก้ไขหมวดหมู่เรียบร้อยแล้ว' });
      setBanner({ kind: 'success', text: 'แก้ไขหมวดหมู่เรียบร้อยแล้ว' });
      setTimeout(() => router.push('/management/categories'), 1500);
    } catch (err) {
      toast({
        title: 'เกิดข้อผิดพลาด',
        description: err instanceof Error ? err.message : 'ไม่สามารถแก้ไขหมวดหมู่ได้',
      });
      setBanner({
        kind: 'error',
        text: err instanceof Error ? err.message : 'ไม่สามารถแก้ไขหมวดหมู่ได้',
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  /* ─── Formik ─── */
  const formik = useFormik<FormValues>({
    initialValues: { name: category?.name ?? '' },
    validationSchema: editCategorySchema,
    onSubmit: handleSubmit,
    enableReinitialize: true, // ← re-init เมื่อ category เปลี่ยน
  });

  return (
    <div className="max-w-xl mx-auto">
      <Card className="border border-primary/20 bg-white shadow-sm">
        <CardHeader className="space-y-1.5 pb-2">
          <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-primary text-secondary shadow-sm">
            <Edit2 className="h-6 w-6" aria-hidden />
          </div>
          <CardTitle className="text-xl font-bold text-primary text-center">
            แก้ไขหมวดหมู่
          </CardTitle>
          <CardDescription className="text-center text-muted-foreground">
            แก้ไขชื่อหมวดหมู่สินค้า
          </CardDescription>
        </CardHeader>

        <CardContent className="space-y-5 pt-2">
          {/* Banners */}
          {banner?.kind === 'success' && (
            <div role="status" className="flex items-start gap-2 rounded-lg border border-success/40 bg-success/10 p-3 text-sm text-success">
              <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0" aria-hidden />
              <div className="flex-1">
                <span>{banner.text}</span>
                <button type="button" onClick={() => router.push('/management/categories')} className="ml-2 font-semibold underline underline-offset-2 hover:text-success/80">
                  กลับไปหน้ารายชื่อ
                </button>
              </div>
            </div>
          )}

          {banner?.kind === 'error' && (
            <div role="alert" className="flex items-start gap-2 rounded-lg border border-destructive/40 bg-destructive/10 p-3 text-sm text-destructive">
              <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" aria-hidden />
              <span>{banner.text}</span>
            </div>
          )}

          {/* Form Container */}
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
                value={formik.values.name}
                onChange={formik.handleChange('name')}
                onBlur={formik.handleBlur('name')}
                error={formik.touched.name ? (formik.errors.name as string) : undefined}
                disabled={isSubmitting}
              />
            </div>

            {/* Submit Buttons */}
            <div className="flex items-center justify-end gap-2 pt-2">
              <Button type="button" variant="destructive" onClick={() => router.push('/management/categories')} disabled={isSubmitting}>
                ยกเลิก
              </Button>
              <Button type="button" variant="primary" onClick={() => formik.handleSubmit()} disabled={!formik.isValid || isSubmitting}>
                <Edit2 className="mr-2 h-4 w-4" aria-hidden />
                {isSubmitting ? 'กำลังบันทึก...' : 'บันทึก'}
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
