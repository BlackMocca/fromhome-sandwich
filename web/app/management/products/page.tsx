'use client';

import { useState } from 'react';
import { PlusCircle, Search } from 'lucide-react';
import { Input } from '@/components/ui/input';
import type { Product, ProductOption } from '@/types/product';
import type { Category } from '@/types/category';
import { ProductCard } from '@/components/app/product-card';

// ─── Mock categories (by name) ─────────────────────────────
const CATEGORY_NAMES: Record<number, string> = {
  1: 'Sandwich',
  2: 'Drink',
  3: 'Salad',
  4: 'Fried',
};

const ALL_CATEGORIES_BY_NAME: Record<string, Category> = {
  Sandwich: { id: 1, name: 'Sandwich', is_active: true },
  Drink:    { id: 2, name: 'Drink',    is_active: true },
  Salad:    { id: 3, name: 'Salad',     is_active: true },
  Fried:    { id: 4, name: 'Fried',     is_active: true },
};

// ─── Image file mapping ──────────────────────────────────
const PRODUCT_IMAGE_MAP: Record<string, string> = {
  'แซนด์วิชมะม่วง':   'sw_bolona_egg.jpg',
  'แซนด์วิชแฮมชีส':  'sw_bolona_crabstick.jpg',
  'แซนด์วิชทูน่า':    'sw_crabstick_tuna.jpg',
  'ชาเย็น':             'iced_mali.jpg',
  'กาแฟลาเต้':         'cocoa.jpg',
  'ส้มตำไทย':           'mali.jpg',
};

function productImageUrl(name: string): string | undefined {
  const file = PRODUCT_IMAGE_MAP[name];
  return file ? `/images/products/${file}` : undefined;
}

// ─── Mock data with image_url & options ──────────────────
const ALL_PRODUCTS: Product[] = [
  { id: 1, category_id: 1, name: 'แซนด์วิชมะม่วง',   base_price: 45, cost: 28, image_url: productImageUrl('แซนด์วิชมะม่วง') },
  { id: 2, category_id: 1, name: 'แซนด์วิชแฮมชีส',  base_price: 50, cost: 32, image_url: productImageUrl('แซนด์วิชแฮมชีส') },
  { id: 3, category_id: 1, name: 'แซนด์วิชทูน่า',    base_price: 45, cost: 27, image_url: productImageUrl('แซนด์วิชทูน่า') },
  { id: 4, category_id: 2, name: 'ชาเย็น',             base_price: 35, cost: 18, image_url: productImageUrl('ชาเย็น') },
  { id: 5, category_id: 2, name: 'กาแฟลาเต้',         base_price: 40, cost: 22, image_url: productImageUrl('กาแฟลาเต้') },
  { id: 6, category_id: 3, name: 'ส้มตำไทย',           base_price: 40, cost: 20, image_url: productImageUrl('ส้มตำไทย') },
];

const MOCK_OPTIONS: ProductOption[] = [
  { id: 1, name: 'ไม่เพิ่ม',     price: 0 },
  { id: 2, name: 'เพิ่มชีส',    price: 10 },
  { id: 3, name: 'ข้าวไรซ์',   price: 5 },
  { id: 4, name: 'ไข่ดาว',      price: 12 },
  { id: 5, name: 'ทอดกรอบ',    price: 8 },
];

export default function ProductsPage() {
  const [products] = useState<Product[]>(ALL_PRODUCTS);
  const [search, setSearch] = useState('');
  const filteredProducts = products.filter(p => p.name.includes(search));

  const handleAction = (product: Product) => {
    console.log(`[ProductCard action] ${product.name}`);
  };

  return (
    <div className="min-h-screen">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold text-primary">สินค้าทั้งหมด (Products)</h1>
        <button className="btn-primary flex items-center gap-2 text-sm px-4 py-2 rounded-xl shadow-md">
          <PlusCircle className="w-4 h-4" /> เพิ่มสินค้า
        </button>
      </div>

      {/* Search */}
      <div className="mb-6 max-w-md">
        <Input
          placeholder="ค้นหาสินค้า..."
          value={search}
          onChange={e => setSearch(e.target.value)}
          className="h-11"
        />
      </div>

      {/* Product cards grid */}
      {filteredProducts.length > 0 ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
          {filteredProducts.map(product => (
            <ProductCard
              key={product.id}
              product={product}
              category={ALL_CATEGORIES_BY_NAME[CATEGORY_NAMES[product.category_id] ?? '']}
              options={MOCK_OPTIONS}
              onAdd={handleAction}
            />
          ))}
        </div>
      ) : (
        <div className="flex items-center justify-center py-20 text-muted-foreground">
          ไม่พบสินค้าที่ค้นหา
        </div>
      )}
    </div>
  );
}

export const dynamic = 'force-dynamic';
