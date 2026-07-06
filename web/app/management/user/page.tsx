import Link from 'next/link';
import { PlusCircle } from 'lucide-react';
import { listProfiles } from '@/lib/user-actions';
import { UserTable } from './user-table';

/**
 * /management/user — User list page
 *
 * Server Component that loads all profiles via the admin
 * client and hands them to the client `<UserTable>` for
 * rendering + actions.
 */
export default async function UsersPage() {
  const profiles = await listProfiles();

  return (
    <div>
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-primary">ผู้ใช้งาน (Users)</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            จัดการบัญชีผู้ใช้งานที่สามารถเข้าสู่ระบบได้
          </p>
        </div>
        <Link
          href="/management/user/create"
          className="btn-primary flex items-center gap-2 text-sm text-white"
        >
          <PlusCircle className="w-4 h-4" /> เพิ่มผู้ใช้
        </Link>
      </div>

      <UserTable profiles={profiles} />
    </div>
  );
}

export const dynamic = 'force-dynamic';
