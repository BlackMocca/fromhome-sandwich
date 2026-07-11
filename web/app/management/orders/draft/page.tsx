'use client';

import { useOrder } from '@/contexts/OrderContext';
import { useRouter } from 'next/navigation';
import { ArrowLeft, Trash2, ShoppingBag } from 'lucide-react';
import { Button } from '@/components/ui/button';

function OrderRow({
  index,
  item,
}: {
  index: number;
  item: import('@/contexts/OrderContext').OrderItem;
}) {
  const { removeItem } = useOrder();
  const cp = item.channelProduct;
  const addonTotal = item.selectedAddons.reduce((s, a) => s + a.base_price, 0);
  const unitPrice = cp.price + addonTotal;
  const lineTotal = unitPrice * item.quantity;

  return (
    <div className="p-4 rounded-xl border border-border/50 bg-white hover:shadow-sm transition-shadow">
      <div className="flex items-end gap-4">
        {/* Cover */}
        <div className="w-24 h-24 rounded-lg overflow-hidden bg-surface shrink-0">
          {cp.products?.cover_url ? (
            <img src={cp.products.cover_url} alt={cp.products.name} className="w-full h-full object-cover" />
          ) : (
            <div className="w-full h-full flex items-center justify-center text-2xl">🥪</div>
          )}
        </div>

        {/* Info */}
        <div className="flex-1 min-w-0 space-y-2">
          <p className="text-2xl font-semibold text-primary text-xl truncate">
            {cp.products?.name ?? 'สินค้า'}
          </p>
          <p className="font-base text-sm truncate">
            ฿{cp.price}
          </p>

          {/* Addons */}
          {item.selectedAddons.length > 0 && (
            <div className="flex overflow-x-auto gap-1 mt-1.5 pb-1 -mb-1" style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}>
              <style>{`.order-addons::-webkit-scrollbar { display: none; }`}</style>
              {item.selectedAddons.map(a => (
              <span key={a.id} className="order-addons inline-flex items-center whitespace-nowrap px-3 py-1 rounded-full text-xs font-medium bg-primary text-white shadow-md border border-border">
                {a.name}
                {a.base_price > 0 && ` +${a.base_price}`}
              </span>
              ))}
            </div>
          )}
        </div>

        {/* Right column: price + detail top, delete bottom */}
        <div className="flex flex-col items-end justify-between h-24 shrink-0">
          <div className="flex flex-col space-y-1 text-right">
            <p className="text-2xl font-bold text-primary">
              ฿{lineTotal.toLocaleString()}
            </p>
            <p className="text-sm text-muted-foreground">
              ฿{unitPrice.toLocaleString()} × {item.quantity}
            </p>
          </div>
          <Button
            variant="destructive"
            size="sm"
            onClick={() => removeItem(index)}
          >
            <Trash2 className="w-4 h-4 mr-1" />
            ลบ
          </Button>
        </div>
      </div>
    </div>
  );
}

export default function OrderDraftPage() {
  const router = useRouter();
  const { items, channelName, totalQuantity, totalPrice, clearOrder } = useOrder();

  return (
    <div className="h-full w-full overflow-y-auto">
      {/* Header */}
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

      {/* Items */}
      {items.length > 0 ? (
        <>
          <div className="space-y-3 mb-6">
            {items.map((item, i) => (
              <OrderRow key={i} index={i} item={item} />
            ))}
          </div>

          {/* Summary */}
          <div className="sticky bottom-0 bg-white border-t border-border/50 pt-4 pb-2 rounded-b-xl">
            <div className="flex items-center justify-between mb-1 px-1">
              <span className="text-sm text-muted-foreground">จำนวนทั้งหมด</span>
              <span className="text-sm font-medium text-primary">{totalQuantity} ชิ้น</span>
            </div>
            <div className="flex items-center justify-between px-1 mb-4">
              <span className="text-base font-bold text-primary">รวมทั้งหมด</span>
              <span className="text-xl font-bold text-primary">฿{totalPrice.toLocaleString()}</span>
            </div>

            <Button variant="primary" className="w-full" size="lg">
              ยืนยันรายการ
            </Button>
          </div>
        </>
      ) : (
        /* Empty state */
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
    </div>
  );
}
