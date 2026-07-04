'use client';

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { BarChart3, Package, PlusCircle, ReceiptText } from 'lucide-react';

const stats = [
  { label: 'หมวดหมู่', value: '12', icon: <Package className="w-5 h-5 text-primary" />, color: 'bg-primary/10' },
  { label: 'สินค้าทั้งหมด', value: '48', icon: <Package className="w-5 h-5 text-action" />, color: 'bg-action/10' },
  { label: 'ช่องทางขาย', value: '4', icon: <ReceiptText className="w-5 h-5 text-success" />, color: 'bg-success/10' },
  { label: 'บิลวันนี้', value: '23', icon: <BarChart3 className="w-5 h-5 text-destructive" />, color: 'bg-destructive/10' },
];

const recentChannels = [
  { name: 'Condo', code: 'CND', items: 18, sales: '฿12,450' },
  { name: 'GrabFood', code: 'GRB', items: 15, sales: '฿18,320' },
  { name: 'Lineman', code: 'LMN', items: 20, sales: '฿24,680' },
  { name: 'Robinhood', code: 'RBN', items: 12, sales: '฿9,870' },
];

export default function ManagementPage() {
  return (
    <div>
      {/* Header */}
      <h1 className="text-2xl font-bold text-primary mb-6">ภาพรวมระบบจัดการ</h1>

      {/* Stats cards */}
      <div className="grid grid-cols-4 gap-4 mb-8">
        {stats.map(stat => (
          <Card key={stat.label} className={`${stat.color} border-border/50`}>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm text-muted-foreground">{stat.label}</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-3xl font-bold text-primary">{stat.value}</p>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Channel overview */}
      <Card className="border-border/50">
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle>ช่องทางขายทั้งหมด</CardTitle>
            <button className="flex items-center gap-1 text-sm text-action hover:text-action-dark transition-colors">
              <PlusCircle className="w-4 h-4" /> เพิ่มช่องทาง
            </button>
          </div>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 gap-3">
            {recentChannels.map(ch => (
              <div key={ch.code} className="card-panel hover:border-action/50 transition-colors cursor-pointer">
                <div className="flex items-center justify-between mb-1">
                  <span className="font-semibold text-primary">{ch.name}</span>
                  <span className="text-xs px-2 py-0.5 rounded bg-surface border border-border/50">{ch.code}</span>
                </div>
                <div className="flex justify-between text-sm text-muted-foreground">
                  <span>{ch.items} สินค้า</span>
                  <span className="text-success font-medium">{ch.sales}</span>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Quick actions */}
      <div className="mt-6 flex gap-3">
        <a href="/management/categories" className="btn-primary text-sm">จัดการหมวดหมู่</a>
        <a href="/management/products" className="btn-action text-sm">จัดการสินค้า</a>
        <a href="/receipt" className="btn-success text-sm">ออกบิลใหม่</a>
      </div>
    </div>
  );
}
export const dynamic = 'force-dynamic';
