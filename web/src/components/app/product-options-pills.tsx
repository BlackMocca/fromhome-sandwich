'use client';

import type { Product, ProductOption } from '@/types/product';

interface ProductOptionsPillsProps {
  options: ProductOption[];
  selectedOptionIds: number[];
  onSelect: (option: ProductOption) => void;
  product: Product;
}

/** Vertical list of option rows — each row is fully clickable */
export function ProductOptionsPills({
  options,
  selectedOptionIds,
  onSelect,
}: ProductOptionsPillsProps) {
  return (
    <div className="flex flex-col gap-1 pt-0.5">
      {options.map(opt => {
        const isActive = selectedOptionIds.includes(opt.id);

        return (
          <button
            key={opt.id}
            type="button"
            onClick={() => onSelect(opt)}
            className={[
              'flex items-center gap-3 w-full py-1.5 px-2 rounded-lg transition-all select-none',
              isActive
                ? 'bg-action/90'
                : 'hover:bg-surface',
            ].join(' ')}
          >
            {/* Checkbox */}
            <div className={[
              'w-5 h-5 shrink-0 rounded flex items-center justify-center border transition-all',
              isActive
                ? 'bg-primary border-primary'
                : 'border-border/60 bg-surface',
            ].join(' ')}>
              {isActive && (
                <svg className="w-3 h-3 text-white" viewBox="0 0 20 20" fill="currentColor">
                  <path
                    fillRule="evenodd"
                    d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"
                    clipRule="evenodd"
                  />
                </svg>
              )}
            </div>

            {/* Option name */}
            <span className="flex-1 text-left text-sm font-medium text-primary">
              {opt.name}
            </span>

            {/* Price */}
            <span className={['text-sm font-semibold',
              typeof opt.price === 'number' && opt.price > 0
                ? 'text-primary'
                : 'text-muted-foreground',
            ].join(' ')}>
              {typeof opt.price === 'number' && opt.price > 0
                ? `+฿${opt.price}`
                : ''}
            </span>
          </button>
        );
      })}
    </div>
  );
}
