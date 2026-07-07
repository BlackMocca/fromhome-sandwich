'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useFormik } from 'formik';
import * as yup from 'yup';
import { UserPlus, Mail, KeyRound, User as UserIcon, AlertCircle, CheckCircle2 } from 'lucide-react';

import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { createUser } from '@/lib/user-actions';

/* ─── Validation Schema (Yup) ─── */
const createUserSchema = yup.object().shape({
  email: yup
    .string()
    .trim()
    .required('กรุณากรอกอีเมล')
    .email('รูปแบบอีเมลไม่ถูกต้อง'),
  password: yup
    .string()
    .required('กรุณากรอกรหัสผ่าน')
    .min(6, 'รหัสผ่านต้องมีอย่างน้อย 8 ตัวอักษร'),
  display_name: yup
    .string()
    .trim()
    .max(64, 'ชื่อต้องไม่เกิน 64 ตัวอักษร'),
});

type FormValues = { email: string; password: string; display_name: string };

export default function CreateUserPage() {
  const router = useRouter();
  const [banner, setBanner] = useState<{ kind: 'success' | 'error'; text: string } | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  /* ─── Submit handler (calls the server action directly) ─── */
  const handleSubmit = async (values: FormValues) => {
    setBanner(null);
    setIsSubmitting(true);
    try {
      const result = await createUser({
        email: values.email.trim(),
        password: values.password,
        display_name: values.display_name.trim() || undefined,
      });
      if (!result.ok) {
        setBanner({ kind: 'error', text: result.error });
        return;
      }
      setBanner({ kind: 'success', text: 'สร้างผู้ใช้เรียบร้อยแล้ว' });
    } catch (err) {
      setBanner({
        kind: 'error',
        text: err instanceof Error ? err.message : 'ไม่สามารถสร้างผู้ใช้ได้',
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  /* ─── Formik ─── */
  const formik = useFormik<FormValues>({
    initialValues: { email: '', password: '', display_name: '' },
    validationSchema: createUserSchema,
    onSubmit: handleSubmit,
  });

  const submitError = banner?.kind === 'error' ? banner.text : null;

  return (
    <div className="max-w-xl mx-auto">
      <Card className="border border-primary/20 bg-white shadow-sm">
        <CardHeader className="space-y-1.5 pb-2">
          <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-primary text-secondary shadow-sm">
            <UserPlus className="h-6 w-6" aria-hidden />
          </div>
          <CardTitle className="text-xl font-bold text-primary text-center">
            เพิ่มผู้ใช้ใหม่
          </CardTitle>
          <CardDescription className="text-center text-muted-foreground">
            สร้างบัญชีผู้ใช้สำหรับเข้าสู่ระบบ From Home Sandwich
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
                  onClick={() => router.push('/management/user')}
                  className="ml-2 font-semibold underline underline-offset-2 hover:text-success/80"
                >
                  กลับไปหน้ารายชื่อ
                </button>
              </div>
            </div>
          )}

          {submitError && (
            <div
              role="alert"
              className="flex items-start gap-2 rounded-lg border border-destructive/40 bg-destructive/10 p-3 text-sm text-destructive"
            >
              <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" aria-hidden />
              <span>สร้างผู้ใช้ไม่สำเร็จ: {submitError}</span>
            </div>
          )}

          <div className="space-y-4">
            {/* Email */}
            <div className="space-y-1.5">
              <label htmlFor="email" className="block text-sm font-medium text-primary">
                อีเมล <span className="text-destructive">*</span>
              </label>
              <div className="relative">
                <Mail className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" aria-hidden />
                <Input
                  id="email"
                  name="email"
                  type="email"
                  autoComplete="email"
                  autoCapitalize="none"
                  spellCheck={false}
                  placeholder="name@example.com"
                  className="pl-9"
                  value={formik.values.email}
                  onChange={formik.handleChange('email')}
                  onBlur={formik.handleBlur('email')}
                  error={formik.touched.email ? (formik.errors.email as string) : undefined}
                  disabled={isSubmitting}
                />
              </div>
            </div>

            {/* Password */}
            <div className="space-y-1.5">
              <label htmlFor="password" className="block text-sm font-medium text-primary">
                รหัสผ่าน <span className="text-destructive">*</span>
              </label>
              <div className="relative">
                <KeyRound className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" aria-hidden />
                <Input
                  id="password"
                  name="password"
                  type="password"
                  autoComplete="new-password"
                  placeholder="อย่างน้อย 6 ตัวอักษร (a-z, 0-9)"
                  className="pl-9"
                  value={formik.values.password}
                  onChange={formik.handleChange('password')}
                  onBlur={formik.handleBlur('password')}
                  error={formik.touched.password ? (formik.errors.password as string) : undefined}
                  disabled={isSubmitting}
                />
              </div>
            </div>

            {/* Display Name */}
            <div className="space-y-1.5">
              <label htmlFor="display_name" className="block text-sm font-medium text-primary">
                ชื่อที่แสดง <span className="text-muted-foreground text-xs">(ไม่บังคับ)</span>
              </label>
              <div className="relative">
                <UserIcon className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" aria-hidden />
                <Input
                  id="display_name"
                  name="display_name"
                  type="text"
                  autoComplete="name"
                  placeholder="เช่น เจ้าของร้าน"
                  className="pl-9"
                  value={formik.values.display_name}
                  onChange={formik.handleChange('display_name')}
                  onBlur={formik.handleBlur('display_name')}
                  error={formik.touched.display_name ? (formik.errors.display_name as string) : undefined}
                  disabled={isSubmitting}
                />
              </div>
            </div>

            {/* Submit */}
            <div className="flex items-center justify-end gap-2 pt-2">
              <Button
                type="button"
                variant="primary"
                onClick={() => router.push('/management/user')}
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
                <UserPlus className="mr-2 h-4 w-4" aria-hidden />
                {isSubmitting ? 'กำลังสร้าง...' : 'สร้างผู้ใช้'}
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
