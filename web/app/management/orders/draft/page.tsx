'use client';

import { useOrder } from '@/contexts/OrderContext';
import { useRouter } from 'next/navigation';
import { ArrowLeft, Trash2, ShoppingBag } from 'lucide-react';
import { Button } from '@/components/ui/button';

function OrderCover({ coverUrl, name, className = '' }: { coverUrl?: string | null; name: string; className?: string }) {
  return (
    <div className={`rounded-lg overflow-hidden bg-surface shrink-0 flex items-center justify-center ${className}`}>
      {coverUrl ? (
        <img src={coverUrl} alt={name} className="max-w-full max-h-full object-contain" />
      ) : (
        <div className="text-2xl">🥪</div>
      )}
    </div>
  );
}

function AddonBadges({ addons }: { addons: import('@/types/product_addon').ProductAddon[] }) {
  return (
    <div className="h-7">
      <div className="flex overflow-x-auto gap-1" style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}>
        {addons.map(a => (
          <span key={a.id} className="no-scrollbar inline-flex items-center whitespace-nowrap px-3 py-1 rounded-full text-xs font-medium bg-primary text-white shadow-md border border-border">
            {a.name}
            {a.base_price > 0 && ` +${a.base_price}`}
          </span>
        ))}
      </div>
    </div>
  );
}

function OrderRowMobile({
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
    <div className="flex items-start gap-3">
      <OrderCover coverUrl={cp.products?.cover_url} name={cp.products?.name ?? 'สินค้า'} className="w-20 h-20" />
      <div className="flex-1 min-w-0 space-y-1">
        <p className="text-base font-semibold text-primary truncate">{cp.products?.name ?? 'สินค้า'}</p>
        <p className="text-xs text-muted-foreground">฿{cp.price.toLocaleString()}</p>
        <div className='pt-1'>
          <AddonBadges addons={item.selectedAddons} />
        </div>
      </div>
      <div className="flex flex-col items-start justify-between gap-2 shrink-0">
        <div className="text-right">
          <p className="text-lg font-bold text-primary">฿{lineTotal.toLocaleString()}</p>
          <p className="text-xs text-muted-foreground">×{item.quantity}</p>
        </div>
        <Button variant="destructive" size="sm" onClick={() => removeItem(index)}>
          <Trash2 className="w-4 h-4" />
        </Button>
      </div>
    </div>
  );
}

function OrderRowDesktop({
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
    <div className="flex items-start gap-4">
      <OrderCover coverUrl={cp.products?.cover_url} name={cp.products?.name ?? 'สินค้า'} className="w-24 h-24" />
      <div className="flex-1 min-w-0 space-y-1">
        <p className="text-xl font-semibold text-primary truncate">{cp.products?.name ?? 'สินค้า'}</p>
        <p className="text-sm text-muted-foreground">฿{cp.price.toLocaleString()}</p>
        <div className='lg:pt-2'>
          <AddonBadges addons={item.selectedAddons} />
        </div>
      </div>
      <div className="flex flex-col items-end gap-2 shrink-0">
        <div className="text-right">
          <p className="text-2xl font-bold text-primary">฿{lineTotal.toLocaleString()}</p>
          <p className="text-sm text-muted-foreground">×{item.quantity}</p>
        </div>
        <Button variant="destructive" size="sm" onClick={() => removeItem(index)}>
          <Trash2 className="w-4 h-4 mr-1" />
          ลบ
        </Button>
      </div>
    </div>
  );
}

function OrderRow({
  index,
  item,
}: {
  index: number;
  item: import('@/contexts/OrderContext').OrderItem;
}) {
  return (
    <div className="p-4 rounded-xl border border-border/50 bg-white hover:shadow-sm transition-shadow">
      <div className="md:hidden">
        <OrderRowMobile index={index} item={item} />
      </div>
      <div className="hidden md:block">
        <OrderRowDesktop index={index} item={item} />
      </div>
    </div>
  );
}

export default function OrderDraftPage() {
  const router = useRouter();
  const { items, channelName, totalQuantity, totalPrice, clearOrder } = useOrder();

  return (
    <div className="no-scrollbar h-full w-full overflow-y-auto">
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
          <div className="sticky bottom-0 bg-white border-t border-gray-200 pt-4 pb-2 rounded-b-xl">
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
