'use client';

import { useState, useEffect } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';

export default function UpdatePasswordPage() {
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const searchParams = useSearchParams();
  const router = useRouter();

  useEffect(() => {
    // Check for error message from URL (e.g., if token expired)
    const msg = searchParams.get('message');
    if (msg) {
      setMessage(decodeURIComponent(msg));
    }
  }, [searchParams]);

  async function handleUpdatePassword(e: React.FormEvent) {
    e.preventDefault();
    
    if (password !== confirmPassword) {
      setMessage('รหัสผ่านไม่ตรงกัน กรุณาลองใหม่');
      return;
    }

    setLoading(true);
    setMessage(null);

    try {
      const supabase = createClient();
      const { error } = await supabase.auth.updateUser({
        password,
      });

      if (error) {
        setMessage(`อัปเดตรหัสผ่านไม่สำเร็จ: ${error.message}`);
      } else {
        setMessage('อัปเดตรหัสผ่านเรียบร้อย กำลังกลับเข้าสู่ระบบ...');
        setTimeout(() => router.push('/auth/login'), 1500);
      }
    } catch (err: any) {
      setMessage(`เกิดข้อผิดพลาด: ${err.message || 'กรุณาลองใหม่'}`);
    } finally {
      setLoading(false);
    }
  }

  return (
    <main className="flex min-h-screen items-center justify-center bg-[#f9f8f8] p-4">
      <div className="w-full max-w-md rounded-xl border border-border bg-white p-8 shadow-sm">
        <h1 className="mb-6 text-center text-2xl font-bold" style={{ color: 'var(--primary)' }}>
          อัปเดตรหัสผ่าน
        </h1>

        {message && (
          <div className="mb-6 rounded-lg border border-[#e0b554] bg-[#e0b554]/10 p-3 text-center text-sm text-[#695848]">
            {message}
          </div>
        )}

        <form onSubmit={handleUpdatePassword} className="space-y-4">
          <div>
            <label htmlFor="password" className="mb-1 block text-sm text-muted-foreground">
              รหัสผ่านใหม่
            </label>
            <Input
              id="password"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              placeholder="••••••••"
              className="border-input bg-background text-foreground"
            />
          </div>

          <div>
            <label htmlFor="confirmPassword" className="mb-1 block text-sm text-muted-foreground">
              ยืนยันรหัสผ่านใหม่
            </label>
            <Input
              id="confirmPassword"
              type="password"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              required
              placeholder="••••••••"
              className="border-input bg-background text-foreground"
            />
          </div>

          <Button 
            type="submit"
            disabled={loading}
            className="w-full bg-primary text-secondary hover:bg-primary/90"
          >
            {loading ? 'กำลังอัปเดต...' : 'อัปเดตรหัสผ่าน'}
          </Button>
        </form>

        <p className="mt-6 text-center text-sm text-muted-foreground">
          หรือ{' '}
          <button
            type="button"
            onClick={() => router.push('/auth/login')}
            className="text-action hover:underline"
          >
            กลับไปเข้าสู่ระบบ
          </button>
        </p>
      </div>
    </main>
  );
}
