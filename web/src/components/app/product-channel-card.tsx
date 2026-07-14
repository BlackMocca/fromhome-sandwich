'use client';

import { Plus } from 'lucide-react';
import { useState } from 'react';
import type { ProductAddon } from '@/types/product_addon';
import type { Category } from '@/types/category';
import { ProductOptionsPills } from './product-options-pills';
import { ChannelProduct } from '@/types/channel_product';
import { useOrder } from '@/contexts/OrderContext';

interface ProductChannelCardProps {
  product: ChannelProduct;
  category?: Category | null;
  channelName?: string;
  channelCode?: string;
}

/** iPad-Optimized Product Card with Pill Options */
export function ProductChannelCard({
  product,
  category,
  channelName,
  channelCode,
}: ProductChannelCardProps) {
  const { addItem } = useOrder();
  const [quantity, setQuantity] = useState(1);
  const [selectedOptionIds, setSelectedOptionIds] = useState<number[]>([]);
  const channelProductAddOn: ProductAddon[] = (product?.channel_product_addons ?? [])
    .map(data => {
      if (!data?.product_addons) return undefined;
      return { ...data.product_addons, base_price: data.price };
    })
    .filter((a): a is ProductAddon => a !== undefined);

  const handleSelect = (option: ProductAddon) => {
    setSelectedOptionIds(prev =>
      prev.includes(option.id)
        ? prev.filter(id => id !== option.id)
        : [...prev, option.id],
    );
  };

  return (
    <div className="group relative bg-surface rounded-2xl shadow-xl hover:shadow-2xl transition-all duration-300 h-full flex flex-col min-h-[500px]">
      {/* ── Category Badge — frosted glass over image */}
      {category && (
        <span className="absolute top-3 right-3 z-10 px-3 py-1 rounded-xl bg-white/85 backdrop-blur-md shadow-lg border border-white/40 text-primary text-xs font-bold uppercase tracking-wider select-none">
          {category.name}
        </span>
      )}

      {/* ── 1. Image Section (fixed aspect ratio) ───────── */}
      <div className="relative w-full aspect-[4/3] bg-surface overflow-hidden rounded-t-2xl">
        {product.products?.cover_url ? (
          <img src={product.products?.cover_url} alt={product.products?.name} className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105" />
        ) : (
          <div className="w-full h-full flex items-center justify-center text-5xl select-none">🥪</div>
        )}
      </div>

      {/* ── 2. Content Section (white bg + rounded top + shadow) */}
      <div className="flex-1 flex flex-col p-5 bg-white -mt-4 rounded-t-3xl shadow-lg relative z-10">
        
        <div>
          {/* Product Name */}
          <h3 className="text-2xl font-bold text-primary leading-tight flex-1 line-clamp-2 select-text min-h-0 mb-2">
            {product.products?.name}
          </h3>

          {/* Price (Prominent) */}
          <p className="text-3xl font-semibold text-primary tracking-tight select-text shrink-0 mb-2">
            ฿{product.price.toLocaleString()}
          </p>
        </div>

        {/* Options — inside rounded border box */}
        <div className="shrink-0">
          <ProductOptionsPills
            options={channelProductAddOn}
            selectedOptionIds={selectedOptionIds}
            onSelect={handleSelect}
          />
        </div>

        {/* ── Bottom section (pushed to bottom by flex) ─ */}
        <div className="mt-auto">
          {/* Quantity: − qty + — centered above button */}
          <div className="flex items-center justify-center gap-3 select-none mb-3 mt-6">
            <button 
              type="button" 
              onClick={() => setQuantity(q => Math.max(1, q - 1))} 
              className="w-10 h-10 rounded-full border border-border/40 flex items-center justify-center hover:bg-surface active:bg-white transition-colors text-xl font-bold"
            >−</button>
            <span className="text-lg font-semibold text-primary w-6 text-center">{quantity}</span>
            <button 
              type="button" 
              onClick={() => setQuantity(q => q + 1)} 
              className="w-10 h-10 rounded-full bg-action text-white flex items-center justify-center hover:bg-action/90 active:scale-95 transition-all text-xl font-bold shadow-sm"
            >+</button>
          </div>

          {/* Add-to-bill button — always at bottom of card */}
          <button 
            type="button" 
            onClick={() => {
              const selectedAddons = channelProductAddOn.filter(a => selectedOptionIds.includes(a.id));
              addItem(product, quantity, selectedAddons, channelName, channelCode);
              setQuantity(1);
              setSelectedOptionIds([]);
            }}
            className="w-full px-4 py-2 rounded-xl bg-primary text-white flex items-center justify-center gap-1.5 hover:bg-primary/90 active:scale-95 transition-all shadow-md"
          >
            <Plus className="w-5 h-5" />
            <span className="text-sm font-bold">รายการ</span>
          </button>
        </div>

      </div>
    </div>
  );
}
