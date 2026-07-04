'use client';

import Image from 'next/image';
import { Pencil, ToggleLeft, ToggleRight } from 'lucide-react';
import type { Product, ProductOption } from '@/types/product';
import type { Category } from '@/types/category';
import { ProductOptionsPills } from './product-options-pills';
import { useState } from 'react';

interface ProductCardProps {
  product: Product;
  category?: Category | null;
  options: ProductOption[];
  onAdd: (product: Product, option?: ProductOption) => void;
}

/** Management Product Card — same layout as ProductChannelCard but no quantity + edit button */
export function ProductCard({ product, category, options, onAdd }: ProductCardProps) {
  const [active, setActive] = useState(true);

  return (
    <div className="group relative bg-surface rounded-2xl shadow-xl hover:shadow-2xl transition-all duration-300 h-full flex flex-col">
      {/* ── Category Badge — frosted glass over image */}
      {category && (
        <span className="absolute top-3 right-3 z-10 px-3 py-1 rounded-xl bg-white/85 backdrop-blur-md shadow-lg border border-white/40 text-primary text-xs font-bold uppercase tracking-wider select-none">
          {category.name}
        </span>
      )}

      {/* ── 1. Image Section (fixed aspect ratio) */}
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
        <h3 className="text-2xl font-bold text-primary leading-tight flex-1 line-clamp-2 select-text min-h-0 mb-2">
          {product.name}
        </h3>

        {/* Price + Cost */}
        <div className="flex items-baseline gap-2 shrink-0 mb-2">
          <p className="text-3xl font-semibold text-primary tracking-tight select-text">
            ฿{product.base_price.toLocaleString()}
          </p>
          <span className="text-sm text-muted-foreground line-through">
            ต้นทุน ฿{product.cost.toLocaleString()}
          </span>
        </div>

        {/* Options */}
        <div className="shrink-0 mb-4">
          <ProductOptionsPills
            product={product}
            options={options}
            selectedOptionIds={[]}
            onSelect={() => {}}
          />
        </div>

        {/* ── Action row (Toggle on left, Edit on right) */}
        <div className="mt-auto flex items-center gap-2">
          {/* Toggle — aligned to left edge, icon height 38px full size */}
          <button 
            type="button" 
            onClick={() => setActive(!active)}
            className="flex items-center justify-center gap-1.5 h-[38px] px-4 rounded-xl hover:bg-action/10 transition-all"
          >
            {active ? (
              <ToggleRight className="w-[64px] h-[38px] text-success" />
            ) : (
              <ToggleLeft className="w-[64px] h-[38px] text-muted-foreground" />
            )}
          </button>

          {/* Edit — aligned to right edge */}
          <button 
            type="button" 
            onClick={() => onAdd(product)}
            className="flex items-center gap-1.5 flex-1 h-[38px] px-4 rounded-xl bg-primary text-white font-bold hover:bg-primary/90 active:scale-95 transition-all shadow-md"
          >
            <Pencil className="w-4 h-4 mr-1" />
            แก้ไข
          </button>
        </div>

      </div>
    </div>
  );
}
