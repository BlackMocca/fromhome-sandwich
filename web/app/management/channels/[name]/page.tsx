'use client';

import { useParams, useRouter } from 'next/navigation';
import { ArrowLeft, PlusCircle, ChevronDown } from 'lucide-react';
import Link from 'next/link';
import { cn } from '@/lib/utils';

// ─── Mock products per channel (will be PostgREST later) ──
const CHANNEL_PRODUCTS: Record<string, Array<{ name: string; price: number; cost: number; category: string }>> = {
  CND: [
    { name: 'แซนด์วิชมะม่วง', price: 45, cost: 28, category: 'Sandwich' },
    { name: 'แซนด์วิชแฮมชีส', price: 50, cost: 32, category: 'Sandwich' },
    { name: 'แซนด์วิชทูน่า', price: 45, cost: 27, category: 'Sandwich' },
    { name: 'ชาเย็น', price: 35, cost: 18, category: 'Drink' },
    { name: 'กาแฟลาเต้', price: 40, cost: 22, category: 'Drink' },
    { name: 'ส้มตำไทย', price: 40, cost: 20, category: 'Salad' },
  ],
  GRB: [
    { name: 'แซนด์วิชมะม่วง', price: 52, cost: 30, category: 'Sandwich' },
    { name: 'แซนด์วิชแฮมชีส', price: 58, cost: 35, category: 'Sandwich' },
    { name: 'แซนด์วิชทูน่า', price: 52, cost: 30, category: 'Sandwich' },
    { name: 'ชาเย็น', price: 42, cost: 20, category: 'Drink' },
    { name: 'กาแฟลาเต้', price: 47, cost: 25, category: 'Drink' },
    { name: 'ส้มตำไทย', price: 46, cost: 23, category: 'Salad' },
    { name: 'ไก่ทอด', price: 40, cost: 22, category: 'Fried' },
  ],
  LMN: [
    { name: 'แซนด์วิชมะม่วง', price: 50, cost: 31, category: 'Sandwich' },
    { name: 'แซนด์วิชแฮมชีส', price: 55, cost: 34, category: 'Sandwich' },
    { name: 'แซนด์วิชทูน่า', price: 50, cost: 30, category: 'Sandwich' },
    { name: 'ชาเย็น', price: 40, cost: 21, category: 'Drink' },
    { name: 'กาแฟลาเต้', price: 45, cost: 24, category: 'Drink' },
    { name: 'ส้มตำไทย', price: 44, cost: 22, category: 'Salad' },
    { name: 'ไก่ทอด', price: 42, cost: 23, category: 'Fried' },
    { name: 'ข้าวผัด', price: 45, cost: 24, category: 'Rice' },
  ],
  RBN: [
    { name: 'แซนด์วิชมะม่วง', price: 48, cost: 30, category: 'Sandwich' },
    { name: 'แซนด์วิชแฮมชีส', price: 53, cost: 33, category: 'Sandwich' },
    { name: 'ชาเย็น', price: 38, cost: 19, category: 'Drink' },
    { name: 'กาแฟลาเต้', price: 43, cost: 23, category: 'Drink' },
    { name: 'ส้มตำไทย', price: 42, cost: 21, category: 'Salad' },
  ],
};

const CHANNEL_NAMES: Record<string, string> = {
  CND: 'Condo',
  GRB: 'GrabFood',
  LMN: 'Lineman',
  RBN: 'Robinhood',
};

export default function ChannelDetailPage() {
  const params = useParams<{ name: string }>();
  const router = useRouter();
  const channelCode = params.name;
  const channelName = CHANNEL_NAMES[channelCode] ?? channelCode;
  const products = CHANNEL_PRODUCTS[channelCode] ?? [];

  return (
    <div>
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-3">
          <button
            onClick={() => router.back()}
            className="text-sm text-muted-foreground hover:text-primary flex items-center gap-1 transition-colors"
          >
            <ArrowLeft className="w-4 h-4" /> กลับ
          </button>
          <div>
            <h1 className="text-2xl font-bold text-primary">{channelName}</h1>
            <p className="text-sm text-muted-foreground">สินค้าทั้งหมดของ {channelName} ({products.length} รายการ)</p>
          </div>
        </div>

        {/* Actions */}
        <button className="btn-action flex items-center gap-2 text-sm">
          <PlusCircle className="w-4 h-4" /> เพิ่มสินค้า
        </button>
      </div>

      {/* Category filter tabs */}
      <div className="flex items-center gap-2 mb-6 overflow-x-auto pb-1">
        <span className="text-sm text-muted-foreground whitespace-nowrap mr-1">กรองตามหมวด:</span>
        {['ทั้งหมด', ...Array.from(new Set(products.map(p => p.category)))].map(cat => (
          <button key={cat} className={cn(
            'px-3 py-1.5 rounded-full text-sm transition-colors whitespace-nowrap',
            cat === 'ทั้งหมด' ? 'bg-primary/15 text-primary font-semibold' : 'bg-surface text-muted-foreground hover:bg-action/10 hover:text-primary border border-border/50'
          )}>
            {cat}
          </button>
        ))}
      </div>

      {/* Product cards grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
        {products.map((product, i) => (
          <div key={`${channelCode}-${i}`} className="card-panel group hover:border-action/50 transition-all cursor-pointer relative">
            {/* Category badge */}
            <span className="absolute top-3 right-3 text-xs px-2 py-0.5 rounded bg-surface border border-border/50 text-muted-foreground group-hover:text-primary group-hover:border-action/30 transition-colors">
              {product.category}
            </span>

            <div className="pt-1">
              {/* Product name */}
              <h3 className="font-semibold text-primary mb-2 pr-8">{product.name}</h3>

              {/* Price & cost */}
              <div className="flex items-baseline gap-3 mb-3">
                <span className="text-xl font-bold text-action">฿{product.price.toLocaleString()}</span>
                <span className="text-sm text-muted-foreground line-through">ต้นทุน ฿{product.cost}</span>
              </div>

              {/* Action row */}
              <div className="flex gap-2 pt-2 border-t border-border/30">
                <button className="flex-1 text-xs py-1.5 rounded bg-primary/10 text-primary hover:bg-primary/20 transition-colors font-medium">
                  แก้ไข
                </button>
                <button className="flex-1 text-xs py-1.5 rounded bg-surface text-muted-foreground hover:text-primary border border-border/50 transition-colors">
                  ดูรายละเอียด
                </button>
              </div>
            </div>
          </div>
        ))}

        {/* Add new product card */}
        <button className="card-panel flex items-center justify-center min-h-[200px] border-dashed border-2 border-border/50 hover:border-action hover:bg-action/5 transition-all group">
          <div className="text-center">
            <div className="w-10 h-10 rounded-full bg-surface border border-border/50 mx-auto mb-3 flex items-center justify-center group-hover:bg-action/20 group-hover:border-action/50 transition-colors">
              <PlusCircle className="w-5 h-5 text-muted-foreground group-hover:text-primary" />
            </div>
            <p className="text-sm text-muted-foreground group-hover:text-primary font-medium">เพิ่มสินค้าใหม่</p>
          </div>
        </button>
      </div>

      {/* Footer info */}
      <div className="mt-8 p-4 bg-surface rounded-xl border border-border/50 flex items-center justify-between">
        <div className="flex gap-6 text-sm text-muted-foreground">
          <span><strong className="text-primary">{products.length}</strong> รายการ</span>
          <span><strong className="text-success">฿{products.reduce((s, p) => s + p.price * 3, 0).toLocaleString()}</strong> ยอดขายโดยประมาณ (x3)</span>
        </div>
        <button className="flex items-center gap-1 text-sm text-action hover:text-primary transition-colors">
          Export ข้อมูล <ChevronDown className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
}
