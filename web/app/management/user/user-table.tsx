'use client';

import { useState, useMemo } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { Edit2, Trash2, Search, AlertCircle } from 'lucide-react';

import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { deleteUser } from '@/lib/user-actions';
import type { Profile } from '@/types/profile';

interface UserTableProps {
  profiles: Profile[];
}

export function UserTable({ profiles }: UserTableProps) {
  const router = useRouter();
  const [search, setSearch] = useState('');
  const [pendingDelete, setPendingDelete] = useState<Profile | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  /* ─── Filter ──────────────────────────────────────── */
  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    if (!q) return profiles;
    return profiles.filter(
      (p) =>
        p.email.toLowerCase().includes(q) ||
        (p.display_name ?? '').toLowerCase().includes(q)
    );
  }, [profiles, search]);

  /* ─── Delete handler (calls the server action directly) ─── */
  const handleDelete = async (id: string) => {
    setIsDeleting(true);
    try {
      const result = await deleteUser(id);
      if (!result.ok) {
        // Minimal alert — could be swapped for a toast later
        alert(`ลบไม่สำเร็จ: ${result.error}`);
        return;
      }
      setPendingDelete(null);
      router.refresh();
    } catch (err) {
      alert(
        `ลบไม่สำเร็จ: ${err instanceof Error ? err.message : 'Unknown error'}`
      );
    } finally {
      setIsDeleting(false);
    }
  };

  return (
    <>
      {/* Search */}
      <div className="mb-6 max-w-md">
        <Input
          placeholder="ค้นหาด้วยอีเมลหรือชื่อ..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />
      </div>

      {/* Data Table */}
      <div className="w-full bg-white rounded-xl border border-border/50 overflow-hidden">
        {/* Header */}
        <div className="grid grid-cols-12 gap-4 px-4 py-3 bg-surface/60 border-b border-border/50 text-sm font-semibold text-muted-foreground">
          <div className="col-span-1">#</div>
          <div className="col-span-3">อีเมล (Email)</div>
          <div className="col-span-3">ชื่อ (Name)</div>
          <div className="col-span-3">อัปเดตล่าสุด (Updated)</div>
          <div className="col-span-2 text-right">การจัดการ</div>
        </div>

        {/* Empty state */}
        {filtered.length === 0 && (
          <div className="px-4 py-12 text-center text-sm text-muted-foreground">
            {profiles.length === 0
              ? 'ยังไม่มีผู้ใช้งานในระบบ'
              : 'ไม่พบผู้ใช้งานที่ตรงกับคำค้นหา'}
          </div>
        )}

        {/* Rows */}
        {filtered.map((profile, i) => (
          <div
            key={profile.id}
            className={cn(
              'grid grid-cols-12 gap-4 px-4 py-3 border-b transition-colors text-sm',
              i === filtered.length - 1 && 'border-b-0',
              'hover:bg-surface'
            )}
          >
            <div className="col-span-1 text-muted-foreground">{i + 1}</div>
            <div className="col-span-3 font-medium text-primary truncate">
              {profile.email}
            </div>
            <div className="col-span-3 text-primary/80">
              {profile.display_name ?? (
                <span className="text-muted-foreground italic">— ไม่ระบุ —</span>
              )}
            </div>
            <div className="col-span-3 text-muted-foreground">
              {formatDateTime(profile.updated_at)}
            </div>
            <div className="col-span-2 flex items-center justify-end gap-2">
              <Link
                href={`/management/user/${profile.id}/edit`}
                className="btn-primary inline-flex items-center gap-1.5 h-[34px] px-3 rounded-lg text-white text-xs"
              >
                <Edit2 className="w-3.5 h-3.5" /> แก้ไข
              </Link>
              <button
                type="button"
                onClick={() => setPendingDelete(profile)}
                className="inline-flex items-center gap-1.5 h-[34px] px-3 rounded-lg text-xs font-medium bg-destructive text-white hover:bg-destructive/90 transition-colors"
              >
                <Trash2 className="w-3.5 h-3.5" /> ลบ
              </button>
            </div>
          </div>
        ))}
      </div>

      {/* Delete confirmation modal */}
      {pendingDelete && (
        <div
          role="dialog"
          aria-modal="true"
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4"
        >
          <div className="w-full max-w-sm rounded-xl bg-white border border-border/50 shadow-lg p-6 space-y-4">
            <div className="flex items-start gap-3">
              <div className="mt-0.5 flex h-9 w-9 items-center justify-center rounded-full bg-destructive/10 text-destructive">
                <AlertCircle className="h-5 w-5" />
              </div>
              <div>
                <h2 className="text-base font-semibold text-primary">
                  ยืนยันการลบผู้ใช้
                </h2>
                <p className="mt-1 text-sm text-muted-foreground">
                  ต้องการลบ <span className="font-medium text-primary">{pendingDelete.email}</span> ใช่หรือไม่?
                  การกระทำนี้ไม่สามารถยกเลิกได้
                </p>
              </div>
            </div>

            <div className="flex items-center justify-end gap-2">
              <Button
                type="button"
                variant="primary"
                onClick={() => setPendingDelete(null)}
                disabled={isDeleting}
              >
                ยกเลิก
              </Button>
              <button
                type="button"
                onClick={() => handleDelete(pendingDelete.id)}
                disabled={isDeleting}
                className="inline-flex items-center justify-center h-10 px-4 rounded-lg text-sm font-medium bg-destructive text-white hover:bg-destructive/90 disabled:opacity-50"
              >
                {isDeleting ? 'กำลังลบ...' : 'ลบผู้ใช้'}
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}

/* ─── helpers ──────────────────────────────────────────── */

function formatDateTime(iso: string): string {
  try {
    const d = new Date(iso);
    return new Intl.DateTimeFormat('th-TH', {
      year: 'numeric',
      month: 'short',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit',
    }).format(d);
  } catch {
    return iso;
  }
}
