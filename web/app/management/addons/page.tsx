'use client';

import { useState } from 'react';
import { PlusCircle, Edit2 } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { ToggleSwitch } from '@/components/ui/toggle-switch';
import { cn } from '@/lib/utils';

// Force dynamic rendering for onClick prop serialization during prerender

const ADDONS = [
  { id: 1, name: 'เพิ่มไข่', price: 10 },
  { id: 2, name: 'ชีสเพิ่ม', price: 15 },
  { id: 3, name: 'ซอสพิเศษ', price: 8 },
  { id: 4, name: 'ขนมปังกรอบ', price: 12 },
];

export default function AddonsPage() {
  const [addons] = useState(ADDONS);
  const [activeAddons, setActiveAddons] = useState<Record<number, boolean>>(
    Object.fromEntries(ADDONS.map(a => [a.id, true])) // default active
  );
  const [search, setSearch] = useState('');
  
  return (
    <div className='w-full'>
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold text-primary">ตัวเลือกสินค้า (Product Add-on)</h1>
        <button type="button" className="bg-primary text-white font-semibold px-4 py-2 rounded-lg hover:bg-primary/90 transition-colors border border-transparent shadow-sm flex items-center gap-2 text-sm">
          <PlusCircle className="w-4 h-4" /> เพิ่มตัวเลือก
        </button>
      </div>

      {/* Search */}
      <div className="mb-6 max-w-md">
        <Input
          placeholder="ค้นหาตัวเลือก..."
          value={search}
          onChange={e => setSearch(e.target.value)}
        />
      </div>

      {/* Data Table Layout — ใช้ grid แทน table */}
      <div className="w-full bg-white rounded-xl border border-border/50 overflow-hidden">
        {/* Header Row */}
        <div className="grid grid-cols-12 gap-4 px-4 py-3 bg-surface/60 border-b border-border/50 text-sm font-semibold text-muted-foreground">
          <div className="col-span-1">#</div>
          <div className="col-span-3">ชื่อตัวเลือก</div>
          <div className="col-span-2 text-start">ราคา</div>
          <div className="col-span-2 text-center">สถานะ</div>
          <div className="col-span-4 text-right">&nbsp;</div>
        </div>

        {/* Data Rows */}
        {addons
          .filter(addon => addon.name.toLowerCase().includes(search.toLowerCase()))
          .map((addon, i) => (
          <div 
            key={addon.id} 
            className={cn(
              "grid grid-cols-12 gap-4 px-4 py-3 border-b transition-colors text-sm",
              i === addons.length - 1 && 'border-b-0',
              "hover:bg-surface",
            )}
          >
            <div className="col-span-1 text-muted-foreground">{i + 1}</div>
            <div className="col-span-3 font-medium text-primary">{addon.name}</div>
            <div className="col-span-2 flex items-center justify-start">
              <span className="text-primary">+฿{addon.price.toLocaleString()}</span>
            </div>
            <div className="col-span-2 flex items-center justify-center">
              <ToggleSwitch
                on={activeAddons[addon.id]}
                onToggle={() => {
                  setActiveAddons(prev => ({ ...prev, [addon.id]: !prev[addon.id] }));
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
export const dynamic = 'force-dynamic';
