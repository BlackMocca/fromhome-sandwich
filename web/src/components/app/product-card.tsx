import Image from 'next/image';
import { Button } from '@/components/ui/button';
import type { Product, ProductOption } from '@/types/product';

interface ProductCardProps {
  product: Product;
  options: ProductOption[];
  onAdd: (product: Product, option?: ProductOption) => void;
}

/** Product card with add button — used in billing flow */
export function ProductCard({ product, options, onAdd }: ProductCardProps) {
  return (
    <div className="card-panel group relative">
      <h4 className="text-heading font-semibold mb-1">{product.name}</h4>
      
      {/* Price display — brown text, gold accent for price */}
      <p className="text-2xl font-bold text-primary mb-3">
        ฿{product.base_price.toLocaleString()}
        <span className="block text-xs font-normal text-primary/60 mt-1">
          ต้นทุน ฿{product.cost.toLocaleString()}
        </span>
      </p>

      {/* Options as chips */}
      {options.length > 0 && (
        <div className="flex flex-wrap gap-2 mb-3">
          {options.map(opt => (
            <button
              key={opt.id}
              onClick={() => onAdd(product, opt)}
              className="text-xs px-2 py-1 rounded-md bg-action/10 text-primary hover:bg-action/20 transition-colors border border-border/50"
            >
              +{opt.name} ฿{opt.price.toLocaleString()}
            </button>
          ))}
        </div>
      )}

      <Button variant="action" size="sm" onClick={() => onAdd(product)} className="w-full">
        เพิ่มลงบิล
      </Button>
    </div>
  );
}
