'use client';

import { useState, useEffect } from 'react';
import { PlusCircle, Edit2, Trash2 } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Input } from '@/components/ui/input';
import type { Ingredient } from '@/types/ingredient';
import { getIngredients, remove } from '@/lib/db';
import { useRouter } from 'next/navigation';

export default function IngredientsPage() {
  const [ingredients, setIngredients] = useState<Ingredient[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const router = useRouter();

  useEffect(() => {
    getIngredients().then(data => {
      setIngredients(data || []);
      setLoading(false);
    }).catch(err => {
      console.error('[ingredients] Failed to load:', err);
      setIngredients([]);
      setLoading(false);
    });
  }, []);

  // Filter by search
  const filteredIngredients = ingredients.filter(ing =>
    ing.name.toLowerCase().includes(search.toLowerCase()) ||
    (ing.description && ing.description.toLowerCase().includes(search.toLowerCase())),
  );

  const handleDelete = async (id: number) => {
    if (!confirm('คุณแน่ใจหรือไม่ที่จะลบวัตถุดิบนี้? การดำเนินการนี้ไม่สามารถย้อนกลับได้')) return;
    
    try {
      await remove('ingredients', id);
      setIngredients(prev => prev.filter(i => i.id !== id));
    } catch (err) {
      console.error('[ingredients] Delete failed:', err);
      alert('ลบวัตถุดิบไม่สำเร็จ');
    }
  };

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
        <h1 className="text-2xl font-bold text-primary">วัตถุดิบ (Ingredients)</h1>
        <button 
          className="btn-primary text-white flex items-center gap-2 text-sm" 
          onClick={() => router.push('/management/ingredients/create')}
        >
          <PlusCircle className="w-4 h-4" /> เพิ่มวัตถุดิบ
        </button>
      </div>

      {/* Search */}
      <div className="mb-6 max-w-md">
        <Input
          placeholder="ค้นหาวัตถุดิบ..."
          value={search}
          onChange={e => setSearch(e.target.value)}
        />
      </div>

      {/* Data Table Layout — ใช้ grid แทน table */}
      <div className="w-full bg-white rounded-xl border border-border/50 overflow-hidden">
        {/* Header Row */}
        <div className="grid grid-cols-12 gap-4 px-4 py-3 bg-surface/60 border-b border-border/50 text-sm font-semibold text-muted-foreground">
          <div className="col-span-1">#</div>
          <div className="col-span-5">ชื่อวัตถุดิบ</div>
          <div className="col-span-2 text-center">หน่วยนับ</div>
          <div className="col-span-3 text-right">&nbsp;</div>
        </div>

        {/* Data Rows */}
        {filteredIngredients.length === 0 ? (
          <div className="px-4 py-8 text-center text-muted-foreground">
            ไม่พบข้อมูลวัตถุดิบ
          </div>
        ) : (
          filteredIngredients.map((ing, i) => (
            <div 
              key={ing.id} 
              className={cn(
                "grid grid-cols-12 gap-4 px-4 py-3 border-b transition-colors text-sm",
                i === filteredIngredients.length - 1 && 'border-b-0',
                "hover:bg-surface",
              )}
            >
              <div className="col-span-1 text-muted-foreground">{i + 1}</div>
              <div className="col-span-5 font-medium text-primary truncate" title={ing.name}>{ing.name}</div>
              <div className="col-span-2 flex items-center justify-center text-muted-foreground">
                {ing.default_unit || '-'}
              </div>
              <div className="col-span-4 flex items-center justify-end gap-2">
                <button 
                  type="button" 
                  className="btn-secondary h-[34px] px-3 rounded-lg text-sm"
                  onClick={() => handleDelete(ing.id)}
                >
                  <Trash2 className="w-4 h-4 mr-1" /> ลบ
                </button>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}

export const dynamic = 'force-dynamic';
