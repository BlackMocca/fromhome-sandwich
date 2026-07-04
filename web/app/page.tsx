'use client';

import { useRouter } from 'next/navigation';

export default function LandingPage() {
  const router = useRouter();

  return (
    <div className="min-h-[80vh] flex items-center justify-center">
      <div className="text-center max-w-md px-6">
        {/* Logo */}
        <div className="w-16 h-16 rounded-2xl bg-primary/90 mx-auto mb-6 flex items-center justify-center shadow-lg shadow-primary/20">
          <span className="text-3xl">🥪</span>
        </div>

        {/* Title */}
        <h1 className="text-heading text-4xl font-bold mb-3 tracking-tight">
          From Home Sandwich
        </h1>
        <p className="text-primary/60 text-lg mb-8 leading-relaxed">
          ระบบจัดการสินค้า ใบเสร็จ และรายงานยอดขาย<br />
          เรียบง่าย รวดเร็ว สำหรับธุรกิจของคุณ
        </p>

        {/* Action buttons */}
        <div className="flex gap-4 justify-center flex-wrap">
          <button
            onClick={() => router.push('/management')}
            className="btn-action text-lg px-8 py-3"
          >
            ไปที่ระบบจัดการ →
          </button>
          <a
            href="/receipt"
            className="btn-primary text-lg px-8 py-3 flex items-center gap-2"
          >
            📝 ออกบิล
          </a>
        </div>

        {/* Quick stats */}
        <div className="mt-10 grid grid-cols-3 gap-4">
          <div className="p-4 rounded-xl bg-surface border border-border/50">
            <p className="text-2xl font-bold text-primary">12</p>
            <p className="text-xs text-muted-foreground mt-1">หมวดหมู่</p>
          </div>
          <div className="p-4 rounded-xl bg-surface border border-border/50">
            <p className="text-2xl font-bold text-action">48</p>
            <p className="text-xs text-muted-foreground mt-1">สินค้า</p>
          </div>
          <div className="p-4 rounded-xl bg-surface border border-border/50">
            <p className="text-2xl font-bold text-success">23</p>
            <p className="text-xs text-muted-foreground mt-1">บิลวันนี้</p>
          </div>
        </div>
      </div>
    </div>
  );
}
