'use client';

import Image from 'next/image';
import { Plus } from 'lucide-react';
import { useState } from 'react';
import type { Product, ProductOption } from '@/types/product';
import type { Category } from '@/types/category';
import { ProductOptionsPills } from './product-options-pills';

interface ProductChannelCardProps {
  product: Product;
  category?: Category | null;
  options: ProductOption[];
  onAdd: (product: Product, option?: ProductOption) => void;
}

/** iPad-Optimized Product Card with Pill Options */
export function ProductChannelCard({
  product,
  category,
  options,
  onAdd,
}: ProductChannelCardProps) {
  const [quantity, setQuantity] = useState(1);
  const [selectedOptionIds, setSelectedOptionIds] = useState<number[]>([]);

  const handleSelect = (option: ProductOption) => {
    setSelectedOptionIds(prev =>
      prev.includes(option.id)
        ? prev.filter(id => id !== option.id)
        : [...prev, option.id],
    );
  };

  return (
    <div className="group relative bg-surface rounded-2xl shadow-xl hover:shadow-2xl transition-all duration-300 h-full flex flex-col">
      {/* ── Category Badge — frosted glass over image */}
      {category && (
        <span className="absolute top-3 right-3 z-10 px-3 py-1 rounded-xl bg-white/85 backdrop-blur-md shadow-lg border border-white/40 text-primary text-xs font-bold uppercase tracking-wider select-none">
          {category.name}
        </span>
      )}

      {/* ── 1. Image Section (fixed aspect ratio) ───────── */}
      <div className="relative w-full aspect-[4/3] bg-surface overflow-hidden rounded-t-2xl">
        {product.image_url ? (
          <Image src={product.image_url} alt={product.name} fill className="object-cover transition-transform duration-500 group-hover:scale-105" />
        ) : (
          <div className="w-full h-full flex items-center justify-center text-5xl select-none">🥪</div>
        )}
      </div>

      {/* ── 2. Content Section (white bg + rounded top + shadow) */}
      <div className="flex-1 flex flex-col p-5 bg-white -mt-4 rounded-t-3xl shadow-lg relative z-10">
        
        {/* Product Name */}
        <h3 className="text-xl font-bold text-primary leading-tight flex-1 line-clamp-2 select-text min-h-0 mb-2">
          {product.name}
        </h3>

        {/* Price (Prominent) */}
        <p className="text-3xl font-semibold text-primary tracking-tight select-text shrink-0 mb-2">
          ฿{product.base_price.toLocaleString()}
        </p>

        {/* Options — inside rounded border box */}
        <div className="shrink-0">
          <ProductOptionsPills
            product={product}
            options={options}
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
            onClick={() => onAdd(product)}
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
