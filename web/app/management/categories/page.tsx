'use client';

import { useState } from 'react';
import { PlusCircle, Edit2, Trash2 } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Input } from '@/components/ui/input';

const CATEGORIES = [
  { id: 1, name: 'Sandwich', active: true },
  { id: 2, name: 'Drink', active: true },
  { id: 3, name: 'Salad', active: true },
  { id: 4, name: 'Fried Food', active: false },
  { id: 5, name: 'Rice Dish', active: true },
];

export default function CategoriesPage() {
  const [categories] = useState(CATEGORIES);
  const [search, setSearch] = useState('');

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold text-primary">หมวดหมู่สินค้า (Categories)</h1>
        <button className="btn-action flex items-center gap-2 text-sm">
          <PlusCircle className="w-4 h-4" /> เพิ่มหมวดหมู่
        </button>
      </div>

      {/* Search */}
      <div className="mb-6 max-w-md">
        <Input
          placeholder="ค้นหาหมวดหมู่..."
          value={search}
          onChange={e => setSearch(e.target.value)}
        />
      </div>

      {/* Data Table */}
      <table className="w-full text-sm">
        <thead>
          <tr className="border-b border-border/50 bg-surface/60">
            <th className="text-left py-3 px-4 font-semibold text-muted-foreground w-12">#</th>
            <th className="text-left py-3 px-4 font-semibold text-muted-foreground">ชื่อหมวดหมู่</th>
            <th className="text-center py-3 px-4 font-semibold text-muted-foreground w-24">สถานะ</th>
            <th className="text-right py-3 px-4 font-semibold text-muted-foreground w-28">จัดการ</th>
          </tr>
        </thead>
        <tbody>
          {categories.map((cat, i) => (
            <tr key={cat.id} className="border-b border-border/30 hover:bg-surface transition-colors">
              <td className="py-3 px-4 text-muted-foreground">{i + 1}</td>
              <td className="py-3 px-4 font-medium text-primary">{cat.name}</td>
              <td className="py-3 px-4 text-center">
                <span className={cn(
                  'inline-flex px-2 py-0.5 rounded-full text-xs font-medium',
                  cat.active ? 'bg-success/15 text-success' : 'bg-muted text-muted-foreground'
                )}>
                  {cat.active ? 'เปิดใช้งาน' : 'ปิดใช้งาน'}
                </span>
              </td>
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
