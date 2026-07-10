'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useFormik } from 'formik';
import { useQueryClient } from '@tanstack/react-query';
import * as yup from 'yup';
import { PlusCircle, AlertCircle, CheckCircle2 } from 'lucide-react';

import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import ImageUpload from '@/components/ui/image-upload';
import { create } from '@/lib/db';
import { toast, setGlobalToast, useToast } from '@/lib/toast';

/* ─── Validation Schema (Yup) ─── */
const createChannelSchema = yup.object().shape({
  code: yup
    .string()
    .trim()
    .required('กรุณากรอกรหัสช่องทาง')
    .max(6, 'รหัสช่องทางต้องมีไม่เกิน 6 ตัวอักษร'),
  name: yup
    .string()
    .trim()
    .required('กรุณากรอกชื่อช่องทาง')
    .min(2, 'ชื่อต้องมีอย่างน้อย 2 ตัวอักษร'),
  gp_percentage: yup
    .number()
    .min(0, 'ค่า GP% ต้องไม่น้อยกว่า 0')
    .max(100, 'ค่า GP% ต้องไม่เกิน 100')
    .test('precision', 'ค่า GP% ทศนิยมได้สูงสุด 2 ตำแหน่ง', (v) => v === undefined || /^\d+(\.\d{1,2})?$/.test(String(v)))
    .required('ค่า GP% ต้องระบุ'),
  cover_url: yup.string().notRequired(),
});

type FormValues = { code: string; name: string; gp_percentage: number; cover_url: string };

export default function CreateChannelPage() {
  const router = useRouter();
  const queryClient = useQueryClient();
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
      await create('channels', {
        code: values.code.trim().toUpperCase(),
        name: values.name.trim(),
        gp_percentage: values.gp_percentage,
        cover_url: values.cover_url || null,
      });

      queryClient.invalidateQueries({ queryKey: ['channels'] });

      // Show success toast + auto-redirect
      toast({
        title: 'สำเร็จ!',
        description: 'สร้างช่องทางเรียบร้อยแล้ว',
      });
      setBanner({ kind: 'success', text: 'สร้างช่องทางเรียบร้อยแล้ว' });

      // Navigate after a short delay so user sees the toast
      setTimeout(() => router.push('/management/channels'), 1500);
    } catch (err) {
      toast({
        title: 'เกิดข้อผิดพลาด',
        description: err instanceof Error ? err.message : 'ไม่สามารถสร้างช่องทางได้',
      });
      setBanner({
        kind: 'error',
        text: err instanceof Error ? err.message : 'ไม่สามารถสร้างช่องทางได้',
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  /* ─── Formik ─── */
  const formik = useFormik<FormValues>({
    initialValues: { code: '', name: '', gp_percentage: 0, cover_url: '' },
    validationSchema: createChannelSchema,
    onSubmit: handleSubmit,
  });

  return (
    <div className="max-w-xl mx-auto">
      <Card className="border border-primary/20 bg-white shadow-sm">
        <CardHeader className="space-y-1.5 pb-2">
          <CardTitle className="text-xl  font-bold text-primary text-center">
            เพิ่มช่องทางใหม่
          </CardTitle>
          <CardDescription className="text-center text-muted-foreground">
            สร้างช่องทางการขายสำหรับจัดกลุ่มสินค้า
          </CardDescription>
          <div className='flex justify-center items-center py-4'>
            <ImageUpload
              variant="avatar"
              label="รูปปกช่องทาง"
              value={formik.values.cover_url}
              onChange={(url) => formik.setFieldValue('cover_url', url)}
            />
          </div>
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
                  onClick={() => router.push('/management/channels')}
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
            {/* Channel Code */}
            <div className="space-y-1.5">
              <label htmlFor="code" className="block text-sm font-medium text-primary">
                รหัสช่องทาง <span className="text-destructive">*</span>
              </label>
              <Input
                id="code"
                name="code"
                type="text"
                autoComplete="off"
                placeholder="เช่น CND, GRB, LMN"
                className="uppercase"
                value={formik.values.code}
                onChange={(e) => formik.handleChange('code')(e.target.value.toUpperCase())}
                onBlur={formik.handleBlur('code')}
                error={formik.touched.code ? (formik.errors.code as string) : undefined}
                disabled={isSubmitting}
              />
            </div>

            {/* Channel Name */}
            <div className="space-y-1.5">
              <label htmlFor="name" className="block text-sm font-medium text-primary">
                ชื่อช่องทาง <span className="text-destructive">*</span>
              </label>
              <Input
                id="name"
                name="name"
                type="text"
                autoComplete="off"
                placeholder="เช่น Condo, GrabFood, Lineman"
                value={formik.values.name}
                onChange={formik.handleChange('name')}
                onBlur={formik.handleBlur('name')}
                error={formik.touched.name ? (formik.errors.name as string) : undefined}
                disabled={isSubmitting}
              />
            </div>

            {/* GP Percentage */}
            <div className="space-y-1.5">
              <label htmlFor="gp_percentage" className="block text-sm font-medium text-primary">
                ค่า GP% <span className="text-destructive">*</span>
              </label>
              <Input
                id="gp_percentage"
                name="gp_percentage"
                type="number"
                min={0}
                max={100}
                step="0.01"
                placeholder="เช่น 10"
                value={formik.values.gp_percentage}
                onChange={(e) => {
                  const val = e.target.value;
                  const numVal = val === '' ? 0 : Number(val);
                  const parsed = Math.round(numVal * 100) / 100;
                  formik.setFieldValue('gp_percentage', parsed);
                }}
                onBlur={formik.handleBlur('gp_percentage')}
                error={formik.touched.gp_percentage ? (formik.errors.gp_percentage as string) : undefined}
                disabled={isSubmitting}
              />
            </div>

            {/* Submit Buttons */}
            <div className="flex text-white items-center justify-end gap-2 pt-2">
              <Button
                type="button"
                variant="destructive"
                onClick={() => router.push('/management/channels')}
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
                {isSubmitting ? 'กำลังสร้าง...' : 'เพิ่มช่องทาง'}
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
