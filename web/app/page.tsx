'use client';

import { useRouter } from 'next/navigation';

const features = [
  {
    icon: (
      <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />
      </svg>
    ),
    title: 'จัดการสินค้า',
    desc: 'เพิ่ม แก้ไข และจัดหมวดหมู่สินค้าได้ง่าย พร้อมระบบสต็อกที่ใช้งานสะดวก',
    color: 'text-primary',
    bg: 'bg-primary/10',
  },
  {
    icon: (
      <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-3 7h3m-3 4h3m-6-4h.01M9 16h.01" />
      </svg>
    ),
    title: 'ออกบิลเร็ว',
    desc: 'สร้างใบเสร็จและบิลขายได้ในไม่กี่คลิก รองรับหลายช่องทางขายในที่เดียว',
    color: 'text-action',
    bg: 'bg-action/10',
  },
  {
    icon: (
      <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
      </svg>
    ),
    title: 'รายงานยอดขาย',
    desc: 'ดูยอดขาย สรุปรายได้ และวิเคราะห์ข้อมูลแบบเรียลไทม์ ตัดสินใจได้แม่นยำ',
    color: 'text-success',
    bg: 'bg-success/10',
  },
];

const products = [
  { name: 'โกโก้', img: '/images/products/cocoa.jpg', price: '฿45' },
  { name: 'มัทฉะ', img: '/images/products/matcha.jpg', price: '฿55' },
  { name: 'มะลิ', img: '/images/products/mali.jpg', price: '฿40' },
  { name: 'แซนด์วิชปูอัด', img: '/images/products/sw_crabstick_egg.jpg', price: '฿65' },
];

const stats = [
  { value: '12', label: 'หมวดหมู่', color: 'text-primary' },
  { value: '48', label: 'สินค้า', color: 'text-action' },
  { value: '4', label: 'ช่องทางขาย', color: 'text-success' },
  { value: '23', label: 'บิลวันนี้', color: 'text-primary' },
];

export default function LandingPage() {
  const router = useRouter();

  return (
    <div className="min-h-[calc(100dvh-5rem)] bg-white">
      {/* ===================== HERO ===================== */}
      <section className="relative overflow-hidden">
        {/* Warm gradient backdrop */}
        <div className="absolute inset-0 bg-gradient-to-br from-primary/8 via-action/5 to-success/8" />
        <div className="absolute -top-24 -right-24 w-80 h-80 rounded-full bg-action/10 blur-3xl" />
        <div className="absolute -bottom-32 -left-24 w-96 h-96 rounded-full bg-success/10 blur-3xl" />

        <div className="relative max-w-[1280px] mx-auto px-6 pt-16 pb-20 lg:pt-24 lg:pb-28">
          <div className="grid lg:grid-cols-2 gap-12 items-center">
            {/* Left: text + actions */}
            <div className="text-center lg:text-left">
              <span className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-white border border-primary/15 shadow-sm text-sm text-primary/80 mb-6">
                <span className="w-2 h-2 rounded-full bg-success animate-pulse" />
                ระบบจัดการทุกอย่างในที่เดียว
              </span>

              <h1 className="text-heading text-4xl sm:text-5xl lg:text-6xl font-bold mb-5 tracking-tight leading-[1.1]">
                From Home <span className="text-action">Sandwich</span>
              </h1>

              <p className="text-primary/60 text-lg lg:text-xl mb-9 leading-relaxed max-w-xl mx-auto lg:mx-0">
                ระบบจัดการสินค้า ใบเสร็จ และรายงานยอดขาย<br />
                เรียบง่าย รวดเร็ว สำหรับธุรกิจของคุณ
              </p>

              <div className="flex gap-4 justify-center lg:justify-start flex-wrap items-center">
                <button
                  onClick={() => router.push('/management/dashboard/overview')}
                  className="btn-action text-lg px-8 py-3.5 inline-flex items-center gap-2"
                >
                  ไปที่ระบบจัดการ
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14 5l7 7m0 0l-7 7m7-7H3" />
                  </svg>
                </button>
                <a
                  href="/receipt"
                  className="btn-primary text-lg px-8 py-3.5 inline-flex items-center gap-2"
                >
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-3 7h3m-3 4h3m-6-4h.01M9 16h.01" />
                  </svg>
                  ออกบิล
                </a>
              </div>
            </div>

            {/* Right: product collage */}
            <div className="relative hidden lg:block">
              <div className="grid grid-cols-2 gap-5">
                <div className="space-y-5 pt-8">
                  <div className="aspect-square rounded-2xl overflow-hidden shadow-lg border border-primary/10 hover:scale-[1.03] transition-transform duration-300">
                    <img src="/images/products/cocoa.jpg" alt="โกโก้" className="w-full h-full object-cover" />
                  </div>
                  <div className="aspect-square rounded-2xl overflow-hidden shadow-lg border border-primary/10 hover:scale-[1.03] transition-transform duration-300">
                    <img src="/images/products/matcha.jpg" alt="มัทฉะ" className="w-full h-full object-cover" />
                  </div>
                </div>
                <div className="space-y-5">
                  <div className="aspect-square rounded-2xl overflow-hidden shadow-lg border border-primary/10 hover:scale-[1.03] transition-transform duration-300">
                    <img src="/images/products/sw_crabstick_egg.jpg" alt="แซนด์วิชปูอัด" className="w-full h-full object-cover" />
                  </div>
                  <div className="aspect-square rounded-2xl overflow-hidden shadow-lg border border-primary/10 hover:scale-[1.03] transition-transform duration-300">
                    <img src="/images/products/mali.jpg" alt="มะลิ" className="w-full h-full object-cover" />
                  </div>
                </div>
              </div>
              {/* Floating badge */}
              <div className="absolute -bottom-5 -left-5 bg-white rounded-xl shadow-xl border border-primary/10 px-5 py-3 flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-action/15 flex items-center justify-center text-2xl">🥪</div>
                <div>
                  <p className="text-xs text-primary/50">สินค้าคัดสรร</p>
                  <p className="text-sm font-semibold text-primary">สดใหม่ทุกวัน</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ===================== STATS BAR ===================== */}
      <section className="border-y border-primary/10 bg-surface/60">
        <div className="max-w-[1280px] mx-auto px-6 py-8">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
            {stats.map((s) => (
              <div key={s.label} className="text-center">
                <p className={`text-3xl lg:text-4xl font-bold ${s.color}`}>{s.value}</p>
                <p className="text-sm text-primary/60 mt-1">{s.label}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ===================== FEATURES ===================== */}
      <section className="max-w-[1280px] mx-auto px-6 py-20">
        <div className="text-center mb-14">
          <h2 className="text-heading text-3xl lg:text-4xl font-bold mb-4">
            ทุกอย่างที่ธุรกิจของคุณต้องการ
          </h2>
          <p className="text-primary/60 text-lg max-w-2xl mx-auto">
            รวมเครื่องมือจัดการร้านค้าไว้ครบในระบบเดียว ออกแบบมาให้ใช้งานง่ายและรวดเร็ว
          </p>
        </div>

        <div className="grid md:grid-cols-3 gap-6">
          {features.map((f) => (
            <div
              key={f.title}
              className="group bg-white border border-primary/10 rounded-2xl p-8 shadow-sm hover:shadow-lg hover:-translate-y-1 transition-all duration-300"
            >
              <div className={`w-12 h-12 rounded-xl ${f.bg} ${f.color} flex items-center justify-center mb-5 group-hover:scale-110 transition-transform`}>
                {f.icon}
              </div>
              <h3 className="text-xl font-bold text-primary mb-2">{f.title}</h3>
              <p className="text-primary/60 leading-relaxed">{f.desc}</p>
            </div>
          ))}
        </div>
      </section>

      {/* ===================== PRODUCT SHOWCASE ===================== */}
      <section className="bg-surface/50 border-y border-primary/10 py-20">
        <div className="max-w-[1280px] mx-auto px-6">
          <div className="flex items-end justify-between mb-10 flex-wrap gap-4">
            <div>
              <h2 className="text-heading text-3xl lg:text-4xl font-bold mb-2">
                สินค้าของเรา
              </h2>
              <p className="text-primary/60 text-lg">
                เครื่องดื่มและแซนด์วิชสดใหม่ คัดสรรคุณภาพ
              </p>
            </div>
            <a
              href="/management/products"
              className="text-action font-semibold inline-flex items-center gap-1.5 hover:gap-2.5 transition-all"
            >
              ดูสินค้าทั้งหมด
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14 5l7 7m0 0l-7 7m7-7H3" />
              </svg>
            </a>
          </div>

          <div className="grid grid-cols-2 md:grid-cols-4 gap-5">
            {products.map((p) => (
              <div
                key={p.name}
                className="group bg-white rounded-2xl overflow-hidden border border-primary/10 shadow-sm hover:shadow-lg transition-all duration-300"
              >
                <div className="aspect-square overflow-hidden">
                  <img
                    src={p.img}
                    alt={p.name}
                    className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500"
                  />
                </div>
                <div className="p-4 flex items-center justify-between">
                  <span className="font-medium text-primary">{p.name}</span>
                  <span className="text-action font-semibold text-sm">{p.price}</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ===================== CTA ===================== */}
      <section className="max-w-[1280px] mx-auto px-6 py-20">
        <div className="relative overflow-hidden rounded-3xl bg-primary px-8 py-16 lg:px-16 text-center shadow-xl">
          <div className="absolute -top-12 -right-12 w-64 h-64 rounded-full bg-action/15 blur-3xl" />
          <div className="absolute -bottom-16 -left-12 w-72 h-72 rounded-full bg-action/10 blur-3xl" />

          <div className="relative">
            <div className="w-16 h-16 rounded-2xl bg-action/90 mx-auto mb-6 flex items-center justify-center shadow-lg">
              <span className="text-3xl">🥪</span>
            </div>
            <h2 className="text-4xl lg:text-5xl font-bold text-white mb-4 tracking-tight">
              เริ่มจัดการธุรกิจของคุณวันนี้
            </h2>
            <p className="text-white/70 text-lg mb-9 max-w-xl mx-auto">
              เข้าสู่ระบบจัดการเพื่อใช้งานเครื่องมือครบทุกฟังก์ชัน หรือออกบิลได้ทันที
            </p>
            <div className="flex gap-4 justify-center flex-wrap">
              <button
                onClick={() => router.push('/management/dashboard/overview')}
                className="btn-action text-lg px-8 py-3.5"
              >
                เข้าสู่ระบบจัดการ
              </button>
              <a
                href="/receipt"
                className="text-lg px-8 py-3.5 inline-flex items-center gap-2 rounded-lg border border-white/30 text-white font-medium hover:bg-white/10 transition-colors"
              >
                ออกบิลทันที
              </a>
            </div>
          </div>
        </div>
      </section>

      {/* ===================== FOOTER ===================== */}
      <footer className="border-t border-primary/10 bg-surface/60">
        <div className="max-w-[1280px] mx-auto px-6 py-8 flex flex-col md:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-2 text-primary font-bold">
            <span className="text-xl">🥪</span>
            From Home Sandwich
          </div>
          <p className="text-sm text-primary/50">
            © {new Date().getFullYear()} From Home Sandwich — สดใหม่ทุกวัน
          </p>
        </div>
      </footer>
    </div>
  );
}
