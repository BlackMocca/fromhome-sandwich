'use client';

import { useState } from 'react';
import { PlusCircle, Edit2, Trash2 } from 'lucide-react';
import { Input } from '@/components/ui/input';

const PRODUCTS = [
  { id: 1, name: 'แซนด์วิชมะม่วง', category: 'Sandwich', price: 45, cost: 28 },
  { id: 2, name: 'แซนด์วิชแฮมชีส', category: 'Sandwich', price: 50, cost: 32 },
  { id: 3, name: 'แซนด์วิชทูน่า', category: 'Sandwich', price: 45, cost: 27 },
  { id: 4, name: 'ชาเย็น', category: 'Drink', price: 35, cost: 18 },
  { id: 5, name: 'กาแฟลาเต้', category: 'Drink', price: 40, cost: 22 },
  { id: 6, name: 'ส้มตำไทย', category: 'Salad', price: 40, cost: 20 },
];

export default function ProductsPage() {
  const [products] = useState(PRODUCTS);
  const [search, setSearch] = useState('');

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold text-primary">สินค้าทั้งหมด (Products)</h1>
        <button className="btn-action flex items-center gap-2 text-sm">
          <PlusCircle className="w-4 h-4" /> เพิ่มสินค้า
        </button>
      </div>

      {/* Search */}
      <div className="mb-6 max-w-md">
        <Input
          placeholder="ค้นหาสินค้า..."
          value={search}
          onChange={e => setSearch(e.target.value)}
        />
      </div>

      {/* Data Table */}
      <table className="w-full text-sm">
        <thead>
          <tr className="border-b border-border/50 bg-surface/60">
            <th className="text-left py-3 px-4 font-semibold text-muted-foreground w-12">#</th>
            <th className="text-left py-3 px-4 font-semibold text-muted-foreground">สินค้า</th>
            <th className="text-center py-3 px-4 font-semibold text-muted-foreground w-28">หมวดหมู่</th>
            <th className="text-right py-3 px-4 font-semibold text-muted-foreground w-28">ราคา</th>
            <th className="text-right py-3 px-4 font-semibold text-muted-foreground w-28">ต้นทุน</th>
            <th className="text-center py-3 px-4 font-semibold text-muted-foreground w-24">กำไร/ชิ้น</th>
            <th className="text-right py-3 px-4 font-semibold text-muted-foreground w-28">จัดการ</th>
          </tr>
        </thead>
        <tbody>
          {products.map((prod, i) => (
            <tr key={prod.id} className="border-b border-border/30 hover:bg-surface transition-colors">
              <td className="py-3 px-4 text-muted-foreground">{i + 1}</td>
              <td className="py-3 px-4 font-medium text-primary">{prod.name}</td>
              <td className="py-3 px-4 text-center text-muted-foreground">{prod.category}</td>
              <td className="py-3 px-4 text-right">฿{prod.price}</td>
              <td className="py-3 px-4 text-right text-muted-foreground">฿{prod.cost}</td>
              <td className="py-3 px-4 text-center text-success font-medium">฿{prod.price - prod.cost}</td>
              <td className="py-3 px-4 text-right">
                <div className="flex items-center justify-end gap-2">
                  <button className="p-1.5 rounded hover:bg-primary/10 text-muted-foreground hover:text-primary transition-colors">
                    <Edit2 className="w-4 h-4" />
                  </button>
                  <button className="p-1.5 rounded hover:bg-error/10 text-muted-foreground hover:text-destructive transition-colors">
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

// Force dynamic rendering
export const dynamic = 'force-dynamic';
