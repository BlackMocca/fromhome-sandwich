'use client';

import { useParams, useRouter } from 'next/navigation';
import React, { useState } from 'react';
import { ArrowLeft, PlusCircle, ChevronDown } from 'lucide-react';
import Link from 'next/link';
import { cn } from '@/lib/utils';
import { ProductChannelCard } from '@/components/app/product-channel-card';
import type { Product, ProductOption } from '@/types/product';
import type { Category } from '@/types/category';

// ─── Mock categories (shared across channels) ─────────────
const ALL_CATEGORIES: Category[] = [
  { id: 1, name: 'Sandwich', is_active: true },
  { id: 2, name: 'Drink',     is_active: true },
  { id: 3, name: 'Salad',     is_active: true },
  { id: 4, name: 'Fried',     is_active: true },
  { id: 5, name: 'Rice',      is_active: true },
];

// ─── Image file mapping (product name → /images/products/filename) ──
const PRODUCT_IMAGE_MAP: Record<string, string> = {
  'แซนด์วิชมะม่วง':    'sw_bolona_egg.jpg',
  'แซนด์วิชแฮมชีส':   'sw_bolona_crabstick.jpg',
  'แซนด์วิชทูน่า':     'sw_crabstick_tuna.jpg',
  'ชาเย็น':              'iced_mali.jpg',
  'กาแฟลาเต้':           'cocoa.jpg',
  'ส้มตำไทย':             'mali.jpg',
  'ไก่ทอด':              'sw_crabstick_egg.jpg',
  'ข้าวผัด':              'chathai.jpg',
};

function productImageUrl(name: string): string | undefined {
  const file = PRODUCT_IMAGE_MAP[name];
  return file ? `/images/products/${file}` : undefined;
}

/** Convert a mock product row into the Product interface */
function toProduct(
  channelCode: string,
  item: { name: string; price: number; cost: number; category: string },
  idx: number,
): Product {
  const cat = ALL_CATEGORIES.find(c => c.name === item.category);
  return {
    id: parseInt(`${channelCode}${idx}`, 36),
    category_id: cat?.id ?? 0,
    name: item.name,
    base_price: item.price,
    cost: item.cost,
    image_url: productImageUrl(item.name),
  };
}

/** Build a set of shared options for every product in the channel */
function toOptions(channelCode: string): ProductOption[] {
  return [
    { id: parseInt(`${channelCode}10`, 36), name: 'ไม่เพิ่ม',          price: 0 },
    { id: parseInt(`${channelCode}20`, 36), name: 'เพิ่มชีส',         price: 10 },
    { id: parseInt(`${channelCode}30`, 36), name: 'เปลี่ยนเป็นข้าวไรซ์', price: 5 },
    { id: parseInt(`${channelCode}40`, 36), name: 'ไข่ดาว +12',       price: 12 },
    { id: parseInt(`${channelCode}50`, 36), name: 'ทอดกรอบ extra',   price: 8 },
  ];
}

// ─── Mock products per channel (will be PostgREST later) ──
const CHANNEL_PRODUCTS: Record<string, Array<{ name: string; price: number; cost: number; category: string }>> = {
  1: [
    { name: 'แซนด์วิชมะม่วง',   price: 45, cost: 28, category: 'Sandwich' },
    { name: 'แซนด์วิชแฮมชีส',  price: 50, cost: 32, category: 'Sandwich' },
    { name: 'แซนด์วิชทูน่า',    price: 45, cost: 27, category: 'Sandwich' },
    { name: 'ชาเย็น',             price: 35, cost: 18, category: 'Drink'   },
    { name: 'กาแฟลาเต้',         price: 40, cost: 22, category: 'Drink'   },
    { name: 'ส้มตำไทย',           price: 40, cost: 20, category: 'Salad'   },
  ],
  CND: [
    { name: 'แซนด์วิชมะม่วง',   price: 45, cost: 28, category: 'Sandwich' },
    { name: 'แซนด์วิชแฮมชีส',  price: 50, cost: 32, category: 'Sandwich' },
    { name: 'แซนด์วิชทูน่า',    price: 45, cost: 27, category: 'Sandwich' },
    { name: 'ชาเย็น',             price: 35, cost: 18, category: 'Drink'   },
    { name: 'กาแฟลาเต้',         price: 40, cost: 22, category: 'Drink'   },
    { name: 'ส้มตำไทย',           price: 40, cost: 20, category: 'Salad'   },
  ],
  GRB: [
    { name: 'แซนด์วิชมะม่วง',   price: 52, cost: 30, category: 'Sandwich' },
    { name: 'แซนด์วิชแฮมชีส',  price: 58, cost: 35, category: 'Sandwich' },
    { name: 'แซนด์วิชทูน่า',    price: 52, cost: 30, category: 'Sandwich' },
    { name: 'ชาเย็น',             price: 42, cost: 20, category: 'Drink'   },
    { name: 'กาแฟลาเต้',         price: 47, cost: 25, category: 'Drink'   },
    { name: 'ส้มตำไทย',           price: 46, cost: 23, category: 'Salad'   },
    { name: 'ไก่ทอด',            price: 40, cost: 22, category: 'Fried'   },
  ],
  LMN: [
    { name: 'แซนด์วิชมะม่วง',   price: 50, cost: 31, category: 'Sandwich' },
    { name: 'แซนด์วิชแฮมชีส',  price: 55, cost: 34, category: 'Sandwich' },
    { name: 'แซนด์วิชทูน่า',    price: 50, cost: 30, category: 'Sandwich' },
    { name: 'ชาเย็น',             price: 40, cost: 21, category: 'Drink'   },
    { name: 'กาแฟลาเต้',         price: 45, cost: 24, category: 'Drink'   },
    { name: 'ส้มตำไทย',           price: 44, cost: 22, category: 'Salad'   },
    { name: 'ไก่ทอด',            price: 42, cost: 23, category: 'Fried'   },
    { name: 'ข้าวผัด',            price: 45, cost: 24, category: 'Rice'    },
  ],
  RBN: [
    { name: 'แซนด์วิชมะม่วง',   price: 48, cost: 30, category: 'Sandwich' },
    { name: 'แซนด์วิชแฮมชีส',  price: 53, cost: 33, category: 'Sandwich' },
    { name: 'ชาเย็น',             price: 38, cost: 19, category: 'Drink'   },
    { name: 'กาแฟลาเต้',         price: 43, cost: 23, category: 'Drink'   },
    { name: 'ส้มตำไทย',           price: 42, cost: 21, category: 'Salad'   },
  ],
};

const CHANNEL_NAMES: Record<string, string> = {
  CND: 'Condo',
  GRB: 'GrabFood',
  LMN: 'Lineman',
  RBN: 'Robinhood',
};

export default function ChannelDetailPage() {
  const params   = useParams<{ id: string }>();
  const router   = useRouter();
  const channelId = params.id;
  const channelName     = CHANNEL_NAMES[channelId] ?? channelId;
  const rawProducts     = CHANNEL_PRODUCTS[channelId] ?? [];

  // Map to typed entities
  const products: Product[]      = rawProducts.map((p, i) => toProduct(channelId, p, i));
  const options:   ProductOption[] = toOptions(channelId);
  const categories    = Array.from(new Set(rawProducts.map(p => p.category))).map(
    name => ALL_CATEGORIES.find(c => c.name === name),
  ).filter(Boolean) as Category[];

  // ── Add-to-bill callback (from ProductChannelCard) ──
  const handleAdd = (product: Product, option?: ProductOption) => {
    const total = product.base_price + (option?.price ?? 0);
    console.log(`[Add to bill] ${product.name}${option ? ` +${option.name}` : ''} → ฿${total.toLocaleString()}`);
    // TODO: dispatch to order / bill context later
  };

  // ── Category filter state ──
  const [activeFilter, setActiveFilter] = useState<string>('ทั้งหมด');

  const filteredProducts = activeFilter === 'ทั้งหมด'
    ? products
    : products.filter(p => {
        const cat = ALL_CATEGORIES.find(c => c.id === p.category_id);
        return cat?.name === activeFilter;
      });

  const allCategoryNames = ['ทั้งหมด', ...Array.from(new Set(rawProducts.map(p => p.category)))];

  console.log(products)
  return (
    <>
      {/* ซ่อน scrollbar ทั้ง vertical และ horizontal */}
      <style>{`
        .scrollbar-hide::-webkit-scrollbar { display: none; }
        .scrollbar-hide {
          -ms-overflow-style: none;
          scrollbar-width: none;
        }
      `}</style>
    <div className="h-full w-full overflow-y-auto scrollbar-hide">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-3">
          <div>
            <h1 className="text-2xl font-bold text-primary">{channelName}</h1>
            <p className="text-sm text-muted-foreground">สินค้าทั้งหมดของ {channelName} ({products.length} รายการ)</p>
          </div>
        </div>

        {/* Actions */}
        <button className="btn-primary text-white flex items-center gap-2 text-sm">
          <PlusCircle className="w-4 h-4" /> เพิ่มสินค้า
        </button>
      </div>

      {/* Category filter tabs */}
      <div className="flex items-center gap-2 mb-6 overflow-x-auto pb-1">
        <span className="text-sm text-muted-foreground whitespace-nowrap mr-1">กรองตามหมวด:</span>
        {allCategoryNames.map(cat => (
          <button
            key={cat}
            onClick={() => setActiveFilter(cat)}
            className={cn(
              'px-3 py-1.5 rounded-full text-sm transition-colors whitespace-nowrap',
              activeFilter === cat
                ? 'bg-primary/15 text-primary font-semibold'
                : 'bg-surface text-muted-foreground hover:bg-action/10 hover:text-primary border border-border/50',
            )}
          >
            {cat}
          </button>
        ))}
      </div>

      {/* Product cards grid using ProductChannelCard */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
        {filteredProducts.map(product => (
          <ProductChannelCard
            key={product.id}
            product={product}
            category={ALL_CATEGORIES.find(c => c.id === product.category_id) ?? null}
            options={options}
            onAdd={handleAdd}
          />
        ))}

      </div>
    </div>
    </>
  );
}


