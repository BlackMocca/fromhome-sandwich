'use client';

import { useState } from 'react';
import { PlusCircle, Edit2 } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Input } from '@/components/ui/input';
import { ToggleSwitch } from '@/components/ui/toggle-switch';

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
  const [activeCategories, setActiveCategories] = useState<Record<number, boolean>>(
    Object.fromEntries(CATEGORIES.map(c => [c.id, c.active]))
  );

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold text-primary">หมวดหมู่สินค้า (Categories)</h1>
        <button className="btn-primary text-white flex items-center gap-2 text-sm">
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

      {/* Data Table Layout — ใช้ grid แทน table */}
      <div className="w-full bg-white rounded-xl border border-border/50 overflow-hidden">
        {/* Header Row */}
        <div className="grid grid-cols-12 gap-4 px-4 py-3 bg-surface/60 border-b border-border/50 text-sm font-semibold text-muted-foreground">
          <div className="col-span-1">#</div>
          <div className="col-span-4">ชื่อหมวดหมู่</div>
          <div className="col-span-3 text-center">สถานะ</div>
          <div className="col-span-4 text-right">&nbsp;</div>
        </div>

        {/* Data Rows */}
        {categories.map((cat, i) => (
          <div 
            key={cat.id} 
            className={cn(
              "grid grid-cols-12 gap-4 px-4 py-3 border-b transition-colors text-sm",
              i === categories.length - 1 && 'border-b-0',
              "hover:bg-surface",
            )}
          >
            <div className="col-span-1 text-muted-foreground">{i + 1}</div>
            <div className="col-span-4 font-medium text-primary">{cat.name}</div>
            <div className="col-span-3 flex items-center justify-center">
              <ToggleSwitch
                on={activeCategories[cat.id]}
                onToggle={() => {
                  setActiveCategories(prev => ({ ...prev, [cat.id]: !prev[cat.id] }));
                }}
                size="sm"
              />
            </div>
            <div className="col-span-4 flex items-center justify-end">
              <button type="button" className="btn-primary flex items-center gap-1.5 h-[34px] px-3 rounded-lg text-white">
                <Edit2 className="w-4 h-4" />
                แก้ไข
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

// Force dynamic rendering

export const dynamic = 'force-dynamic';
