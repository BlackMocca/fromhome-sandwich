'use client';

import { useEffect, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { useFormik } from 'formik';
import * as yup from 'yup';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { ChefHat, LogIn, KeyRound, AlertCircle, CheckCircle2, Mail } from 'lucide-react';

import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { signInUser, resetPassword } from '@/lib/auth-mutations';
import { useAuth } from '@/contexts/AuthContext';
import { createClient } from '@/lib/supabase/client';
import type { Profile } from '@/types/profile';

/* ─── Validation Schema (Yup) ───
 *  Login uses email as the identifier (which is also what
 *  Supabase's signInWithPassword expects under the hood).
 */
const loginSchema = yup.object().shape({
  email: yup
    .string()
    .trim()
    .required('กรุณากรอกอีเมล')
    .email('รูปแบบอีเมลไม่ถูกต้อง'),
  password: yup
    .string()
    .required('กรุณากรอกรหัสผ่าน')
    .min(6, 'รหัสผ่านต้องมีอย่างน้อย 6 ตัวอักษร'),
});

type FormValues = { email: string; password: string };

export default function LoginPage() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const queryClient = useQueryClient();
  const { setAuthUser, isAuthenticated } = useAuth();

  /* ─── Check existing session on mount ─── */
  useEffect(() => {
    if (isAuthenticated) {
      router.replace('/management/dashboard/overview');
      return;
    }

    // Also check Supabase session directly (in case AuthContext wasn't hydrated)
    const supabase = createClient();
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (session?.user) {
        router.replace('/management/dashboard/overview');
      }
    });
  }, [isAuthenticated, router]);

  /* ─── URL Message Handler ─── */
  const [banner, setBanner] = useState<{ kind: 'success' | 'error'; text: string } | null>(null);
  useEffect(() => {
    const msg = searchParams.get('message');
    if (msg === 'logout') {
      setBanner({ kind: 'success', text: 'ออกจากระบบเรียบร้อย' });
    } else if (msg) {
      setBanner({ kind: 'success', text: decodeURIComponent(msg) });
    }
  }, [searchParams]);

  /* ─── Login Mutation ─── */
  const { mutateAsync: handleLogin, isPending, error } = useMutation({
    mutationFn: async (values: FormValues) => {
      const result = await signInUser({ email: values.email, password: values.password });
      if (result.error) throw result.error;
      return result;
    },
    onSuccess: async (result) => {
      // Fetch matching profile (best effort — may be null if no profile row)
      let profile: Profile | null = null;
      if (result.data?.user) {
        const supabase = createClient();
        const { data } = await supabase
          .from('profiles')
          .select('*')
          .eq('id', result.data.user.id)
          .maybeSingle();
        profile = (data as Profile) ?? null;
      }

      // Set user into AuthContext
      if (result.data?.user) {
        setAuthUser({ user: result.data.user, profile });
      }

      queryClient.invalidateQueries({ queryKey: ['user'] });
      router.push('/management/dashboard/overview');
    },
  });

  /* ─── Forgot Password (sends reset link to the typed email) ─── */
  const { mutateAsync: handleReset, isPending: resetPending } = useMutation({
    mutationFn: (email: string) => resetPassword({ email, redirectTo: '' }),
    onSuccess: () => {
      setBanner({ kind: 'success', text: 'ส่งลิงก์รีเซ็ตรหัสผ่านไปยังอีเมลของคุณแล้ว' });
    },
  });

  /* ─── Formik Setup (ตาม formik-patterns skill) ─── */
  const formik = useFormik<FormValues>({
    initialValues: { email: '', password: '' },
    validationSchema: loginSchema,
    onSubmit: async (values, { setSubmitting }) => {
      setBanner(null);
      try {
        await handleLogin(values);
      } catch {
        // error is surfaced via the `error` field from useMutation
      } finally {
        setSubmitting(false);
      }
    },
  });

  const submitError = error ? (error as Error).message : null;

  return (
    <main className="flex flex-1 min-h-screen items-center justify-center bg-surface p-4 font-kanit">
      <Card className="w-full max-w-md border border-primary/20 bg-white shadow-sm">
        <CardHeader className="space-y-2 pb-2 text-center text-white">
          {/* Brand mark */}
          <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-primary text-secondary shadow-sm">
            <ChefHat className="h-7 w-7" aria-hidden />
          </div>
          <CardTitle className="text-2xl font-bold text-primary">
            เข้าสู่ระบบ From Home Sandwich
          </CardTitle>
          <CardDescription className="text-sm text-muted-foreground">
            กรอกอีเมลและรหัสผ่านเพื่อจัดการสินค้า ใบเสร็จ และรายงานยอดขาย
          </CardDescription>
        </CardHeader>

        <CardContent className="space-y-5 pt-2">
          {/* ─── Banners (success / error) ─── */}
          {banner?.kind === 'success' && (
            <div
              role="status"
              className="flex items-start gap-2 rounded-lg border border-success/40 bg-success/10 p-3 text-sm text-success"
            >
              <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0" aria-hidden />
              <div className="flex-1">
                <span>{banner.text}</span>
                {banner.text === 'เข้าสู่ระบบสำเร็จ' && (
                  <button
                    type="button"
                    onClick={() => router.push('/')}
                    className="ml-2 font-semibold underline underline-offset-2 hover:text-success/80"
                  >
                    ไปหน้าหลัก
                  </button>
                )}
              </div>
            </div>
          )}

          {submitError && (
            <div
              role="alert"
              className="flex items-start gap-2 rounded-lg border border-destructive/40 bg-destructive/10 p-3 text-sm text-destructive"
            >
              <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" aria-hidden />
              <span>เข้าสู่ระบบไม่สำเร็จ: {submitError}</span>
            </div>
          )}

          <div className="space-y-4">
            {/* ─── Email Field ─── */}
            <div className="space-y-1.5">
              <label
                htmlFor="email"
                className="block text-sm font-medium text-primary"
              >
                อีเมล
              </label>
              <div className="relative">
                <Mail
                  className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground"
                  aria-hidden
                />
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
                  disabled={isPending}
                />
              </div>
            </div>

            {/* ─── Password Field ─── */}
            <div className="space-y-1.5">
              <label
                htmlFor="password"
                className="block text-sm font-medium text-primary"
              >
                รหัสผ่าน
              </label>
              <div className="relative">
                <KeyRound
                  className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground"
                  aria-hidden
                />
                <Input
                  id="password"
                  name="password"
                  type="password"
                  autoComplete="current-password"
                  placeholder="••••••••"
                  className="pl-9"
                  value={formik.values.password}
                  onChange={formik.handleChange('password')}
                  onBlur={formik.handleBlur('password')}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' && formik.isValid) {
                      e.preventDefault();
                      formik.handleSubmit();
                    }
                  }}
                  error={formik.touched.password ? (formik.errors.password as string) : undefined}
                  disabled={isPending}
                />
              </div>
            </div>

            {/* ─── Submit ─── */}
            <Button
              type="button"
              variant="primary"
              size="lg"
              className="w-full cursor-pointer"
              onClick={() => formik.handleSubmit()}
              disabled={!formik.isValid || isPending}
            >
              <LogIn className="mr-2 h-4 w-4" aria-hidden />
              {isPending ? 'กำลังเข้าสู่ระบบ...' : 'เข้าสู่ระบบ'}
            </Button>
          </div>

          {/* ─── Forgot Password ─── */}
          <div className="flex items-center justify-between border-t border-primary/10 pt-4">
            <button
              type="button"
              onClick={() => handleReset(formik.values.email)}
              disabled={resetPending || isPending || !formik.values.email}
              className="inline-flex items-center gap-1.5 text-sm font-medium text-action transition-colors hover:text-action/80 hover:underline disabled:pointer-events-none disabled:opacity-50"
            >
            </button>

            <p className="mx-auto text-xs text-gray-400">
              From Home Sandwich · v1
            </p>
          </div>
        </CardContent>
      </Card>
    </main>
  );
}
