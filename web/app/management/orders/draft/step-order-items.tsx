'use client';

import { useOrder } from '@/contexts/OrderContext';
import { useRouter } from 'next/navigation';
import { ArrowLeft, ArrowRight, Trash2, ShoppingBag } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { OrderRow } from './page';

export function StepOrderItems({ onNext }: { onNext: () => void }) {
  const router = useRouter();
  const { items, channelName, totalQuantity, totalPrice, clearOrder } = useOrder();

  return (
    <>
      <div className="flex items-start justify-between mb-6">
        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={() => router.back()}
            className="p-2 rounded-lg hover:bg-surface transition-colors"
          >
            <ArrowLeft className="w-5 h-5 text-primary" />
          </button>
          <div>
            <h1 className="text-2xl font-bold text-primary">รายการสั่งซื้อ</h1>
            {channelName && (
              <span className="inline-flex items-center px-2.5 py-0.5 rounded-full bg-primary/10 text-primary text-xs font-medium mt-1">
                {channelName}
              </span>
            )}
          </div>
        </div>

        {items.length > 0 && (
          <Button variant="destructive" size="sm" onClick={clearOrder}>
            <Trash2 className="w-4 h-4 mr-1" />
            ล้างทั้งหมด
          </Button>
        )}
      </div>

      {items.length > 0 ? (
        <>
          <div className="space-y-3 mb-6">
            {items.map((item, i) => (
              <OrderRow key={i} index={i} item={item} />
            ))}
          </div>

          <div className="sticky bottom-0 bg-white border-t border-gray-200 pt-4 pb-2 rounded-b-xl">
            <div className="flex items-center justify-between mb-1 px-1">
              <span className="text-sm text-muted-foreground">จำนวนทั้งหมด</span>
              <span className="text-sm font-medium text-primary">{totalQuantity} ชิ้น</span>
            </div>
            <div className="flex items-center justify-between px-1 mb-4">
              <span className="text-base font-bold text-primary">รวมทั้งหมด</span>
              <span className="text-xl font-bold text-primary">฿{totalPrice.toLocaleString()}</span>
            </div>

            <Button variant="primary" className="w-full" size="lg" onClick={onNext}>
              ถัดไป <ArrowRight className="w-4 h-4 ml-1" />
            </Button>
          </div>
        </>
      ) : (
        <div className="flex flex-col items-center justify-center py-24 text-muted-foreground">
          <ShoppingBag className="w-16 h-16 mb-4 text-primary/20" />
          <p className="text-lg font-medium text-primary/40">ยังไม่มีรายการสั่งซื้อ</p>
          <p className="text-sm text-primary/30 mt-1">เลือกสินค้าจากช่องทางขายเพื่อเริ่มสร้างบิล</p>
          <Button
            variant="primary"
            size="sm"
            className="mt-6"
            onClick={() => router.push('/management/channels')}
          >
            เลือกสินค้า
          </Button>
        </div>
      )}
    </>
  );
}
