import type { Metadata, ResolvingMetadata } from 'next';
import { Kanit, Inter } from 'next/font/google';
import { Suspense } from 'react';
import './globals.css';
import Navbar from './Navbar';
import Providers from './providers';
import { cn } from "@/lib/utils";

const inter = Inter({subsets:['latin'],variable:'--font-sans'});


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
    icons: {
      icon: '/images/merchant/logo.jpg',
    },
  };
}

// Root layout with Sidebar + content area (SPEC.md §3.C)
export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="th" className={cn("font-sans", inter.variable)}>
      <body className={`min-h-screen bg-grey-100 ${kanit.className}`}>
        <Suspense>
          <Providers>
            {/* Top Navbar inside Providers for AuthContext access */}
            <Navbar />
            <div className="mt-4 rounded-xl w-full flex min-h-[calc(100dvh-5rem)] max-w-[1440px] mx-auto bg-white shadow">
              {children}
            </div>
          </Providers>
        </Suspense>
      </body>
    </html>
  );
}

export const dynamic = 'force-dynamic';
