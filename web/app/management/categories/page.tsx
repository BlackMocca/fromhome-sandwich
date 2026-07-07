'use client';

import { useState, useEffect } from 'react';
import { PlusCircle, Edit2 } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Input } from '@/components/ui/input';
import { ToggleSwitch } from '@/components/ui/toggle-switch';
import type { Category } from '@/types/category';
import { getCategories, update } from '@/lib/db';
import { useRouter } from 'next/navigation';

export default function CategoriesPage() {
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [activeCategories, setActiveCategories] = useState<Record<number, boolean>>({});
  const router = useRouter()

  useEffect(() => {
    getCategories().then(data => {
      setCategories(data);
      setActiveCategories(Object.fromEntries(data.map(c => [c.id, c.is_active])));
      setLoading(false);
    }).catch(() => {
      // Fallback to empty on error — keeps UI stable
      setCategories([]);
      setLoading(false);
    });
  }, []);

  // Toggle is_active via API (ไม่มี spinner)
  const handleToggle = async (catId: number) => {
    try {
      await update('categories', catId, { is_active: !activeCategories[catId] });
      
      // Optimistic update — เปลี่ยนทันทีไม่ต้องรอ response กลับ
      setActiveCategories(prev => ({ ...prev, [catId]: !prev[catId] }));

      // Re-fetch เพื่อ sync กับ server
      const data = await getCategories();
      setCategories(data);
    } catch (err) {
      console.error('[categories] Toggle failed:', err);
    }
  };

  // Filter by search
  const filteredCategories = categories.filter(cat =>
    cat.name.toLowerCase().includes(search.toLowerCase()),
  );

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <p className="text-muted-foreground">กำลังโหลด...</p>
      </div>
    );
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold text-primary">หมวดหมู่สินค้า (Categories)</h1>
        <button className="btn-primary text-white flex items-center gap-2 text-sm" 
          onClick={() => router.push('/management/categories/create')}
        >
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
                on={activeCategories[cat.id] ?? false}
                onToggle={() => handleToggle(cat.id)}
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
