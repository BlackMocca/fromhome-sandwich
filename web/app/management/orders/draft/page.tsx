'use client';

import { useState } from 'react';
import { useOrder } from '@/contexts/OrderContext';
import { Trash2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { StepOrderItems } from './step-order-items';
import { StepInvoiceForm } from './step-invoice-form';

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
          <p className="text-xs text-muted-foreground">฿{unitPrice.toLocaleString()} × {item.quantity}</p>
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
          <p className="text-sm text-muted-foreground">฿{unitPrice.toLocaleString()} × {item.quantity}</p>
        </div>
        <Button variant="destructive" size="sm" onClick={() => removeItem(index)}>
          <Trash2 className="w-4 h-4 mr-1" />
          ลบ
        </Button>
      </div>
    </div>
  );
}

export function OrderRow({
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
  const [step, setStep] = useState<1 | 2>(1);

  return (
    <div className="no-scrollbar h-full w-full overflow-y-auto">
      {step === 1 ? (
        <StepOrderItems onNext={() => setStep(2)} />
      ) : (
        <StepInvoiceForm onBack={() => setStep(1)} />
      )}
    </div>
  );
}
