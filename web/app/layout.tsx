import type { Metadata, ResolvingMetadata } from 'next';
import { Kanit } from 'next/font/google';
import './globals.css';
import Navbar from './Navbar';

// Re-export sidebar functions for backward compat
export {
  openMobileSidebar,
  closeMobileSidebar,
  subscribeMobileSidebar,
  unsubscribeMobileSidebar,
} from './mobile-sidebar';

// Kanit font for all weights (100–900) as per DESIGN.md typography spec
const kanit = Kanit({
  weight: ['100', '200', '300', '400', '500', '600', '700', '800', '900'],
  subsets: ['latin', 'thai'],
  variable: '--font-kanit',
  display: 'swap',
});

// generateMetadata รองรับทั้ง Server Component และ Client Component
export async function generateMetadata(
  props: any,
  parent: ResolvingMetadata,
): Promise<Metadata> {
  return {
    title: 'From Home Sandwich — ระบบจัดการบิลและยอดขาย',
    description:
      'ระบบจัดการสินค้า ใบเสร็จ และรายงานยอดขายสำหรับ From Home Sandwich',
  };
}

// Root layout with Sidebar + content area (SPEC.md §3.C)
export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="th" className={kanit.variable}>
      <body className={`min-h-screen bg-background ${kanit.className}`}>
        {/* Top Navbar */}
        <Navbar />

        <div className="w-full flex min-h-[calc(100vh-5rem)] max-w-[1440px] mx-auto">
          {children}
        </div>
      </body>
    </html>
  );
}

export const dynamic = 'force-dynamic';
