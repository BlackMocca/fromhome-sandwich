'use client';

import { Pencil } from 'lucide-react';
import type { Product } from '@/types/product';
import type { Category } from '@/types/category';
import type { ProductAddon } from '@/types/product_addon';
import { cn } from '@/lib/utils';
import { ToggleSwitch } from '../ui/toggle-switch';
import { ProductOptionsPills } from './product-options-pills';
import { useState } from 'react';

interface ProductCardProps {
  product: Product;
  category?: Category | null;
  options: ProductAddon[];
  onAdd: (product: Product) => void;
  hideActions?: boolean;
}

/** Management Product Card — same layout as ProductChannelCard but no quantity + edit button */
export function ProductCard({ product, category, options, onAdd, hideActions = false }: ProductCardProps) {
  const [active, setActive] = useState(true);

  return (
      <div
        onClick={hideActions ? () => onAdd(product) : undefined}
        className={cn(
          "group relative bg-surface rounded-2xl shadow-xl transition-all duration-300 h-full flex flex-col min-h-[500px]",
          hideActions || active ? 'opacity-100 hover:shadow-2xl' : 'opacity-50',
          hideActions && 'cursor-pointer hover:ring-2 hover:ring-action/50',
        )}
      >
      {/* ── Category Badge — frosted glass over image */}
      {category && (
        <span className="absolute top-3 right-3 z-10 px-3 py-1 rounded-xl bg-white/85 backdrop-blur-md shadow-lg border border-white/40 text-primary text-xs font-bold uppercase tracking-wider select-none">
          {category.name}
        </span>
      )}

      {/* ── 1. Image Section (fixed aspect ratio) */}
      <div className="relative w-full aspect-[4/3] bg-surface overflow-hidden rounded-t-2xl">
        {product.cover_url ? (
          <img
            src={product.cover_url}
            alt={product.name}
            className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center text-5xl select-none">🥪</div>
        )}
      </div>

      {/* ── 2. Content Section (white bg + rounded top + shadow) */}
      <div className="flex-1 flex flex-col p-5 bg-white -mt-4 rounded-t-3xl shadow-lg relative z-10">
        
        <div>
          {/* Product Name */}
          <h3 className={cn(
            "text-2xl font-bold text-primary leading-tight flex-1 line-clamp-2 select-text min-h-0 mb-2",
            !active && 'line-through text-muted-foreground',
          )}>
            {product.name}
          </h3>

          {/* Price + Cost */}
          <div className={cn("flex items-baseline gap-2 shrink-0 mb-2", !active && 'opacity-60')}>
            <p className="text-3xl font-semibold text-primary tracking-tight select-text">
              ฿{product.base_price.toLocaleString()}
            </p>
            <span className="text-sm text-destructive">
              ต้นทุน ฿{product.cost.toLocaleString()}
            </span>
          </div>
        </div>

        {/* Options */}
        <div className="shrink-0 mb-4">
          <ProductOptionsPills
            options={options}
            selectedOptionIds={[]}
            onSelect={() => {}}
          />
        </div>

        {/* ── Action row (iOS ToggleSwitch on left, Edit on right) */}
        {!hideActions && (
          <div className="mt-auto flex items-stretch justify-between gap-2">
            {/* iOS-style ToggleSwitch — green/gray sliding knob + right label */}
            <ToggleSwitch
              on={active}
              onToggle={(next) => setActive(next)}
              size="md"
              knobContent="เปิด"
            >
              เปิดใช้งาน
            </ToggleSwitch>

            {/* Edit — aligned to right edge */}
            <button 
              type="button" 
              disabled={!active}
              onClick={() => onAdd(product)}
              className={cn(
                "flex items-center gap-1.5 h-[38px] px-4 rounded-xl bg-primary text-white font-bold active:scale-95 transition-all shadow-md",
                active ? 'hover:bg-primary/90 cursor-pointer' : 'opacity-60 cursor-not-allowed select-none',
              )}
            >
              <Pencil className="w-4 h-4 mr-1" />
              แก้ไข
            </button>
          </div>
        )}

      </div>
    </div>
  );
}
