'use client';

import { useState } from 'react';
import { PlusCircle, Edit2, Trash2 } from 'lucide-react';

// Force dynamic rendering for onClick prop serialization during prerender

const ADDONS = [
  { id: 1, name: 'เพิ่มไข่', price: 10 },
  { id: 2, name: 'ชีสเพิ่ม', price: 15 },
  { id: 3, name: 'ซอสพิเศษ', price: 8 },
  { id: 4, name: 'ขนมปังกรอบ', price: 12 },
];

export default function AddonsPage() {
  const [addons] = useState(ADDONS);
  
  return (
    <div className='w-full'>
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold text-primary">ตัวเลือกสินค้า (Product Add-on)</h1>
        <button type="button" className="btn-action flex items-center gap-2 text-sm">
          <PlusCircle className="w-4 h-4" /> เพิ่มตัวเลือก
        </button>
      </div>

      {/* Data Table */}
      <table className="w-full text-sm">
        <thead>
          <tr className="border-b border-border/50 bg-surface/60">
            <th className="text-left py-3 px-4 font-semibold text-muted-foreground w-12">#</th>
            <th className="text-left py-3 px-4 font-semibold text-muted-foreground">ชื่อตัวเลือก</th>
            <th className="text-right py-3 px-4 font-semibold text-muted-foreground w-40">ราคาเพิ่มเติม</th>
            <th className="text-center py-3 px-4 font-semibold text-muted-foreground w-24">สถานะ</th>
            <th className="text-right py-3 px-4 font-semibold text-muted-foreground w-28">จัดการ</th>
          </tr>
        </thead>
        <tbody>
          {addons.map((addon, i) => (
            <tr key={addon.id} className="border-b border-border/30 hover:bg-surface transition-colors">
              <td className="py-3 px-4 text-muted-foreground">{i + 1}</td>
              <td className="py-3 px-4 font-medium text-primary">{addon.name}</td>
              <td className="py-3 px-4 text-right">
                <span className="font-semibold text-action">+฿{addon.price.toLocaleString()}</span>
              </td>
              <td className="py-3 px-4 text-center">
                <span className="inline-flex px-2 py-0.5 rounded-full text-xs font-medium bg-success/15 text-success">
                  เปิดใช้งาน
                </span>
              </td>
              <td className="py-3 px-4 text-right">
                <div className="flex items-center justify-end gap-2">
                  <button type="button" className="p-1.5 rounded hover:bg-primary/10 text-muted-foreground hover:text-primary transition-colors">
                    <Edit2 className="w-4 h-4" />
                  </button>
                  <button type="button" className="p-1.5 rounded hover:bg-error/10 text-muted-foreground hover:text-destructive transition-colors">
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
export const dynamic = 'force-dynamic';
