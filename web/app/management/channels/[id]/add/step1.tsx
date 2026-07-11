'use client';

import { useState } from 'react';
import { Input } from '@/components/ui/input';
import { ProductCard } from '@/components/app/product-card';
import { BadgeCategoryCarousel } from '@/components/ui/badge-category-carousel';
import type { Product } from '@/types/product';
import type { Category } from '@/types/category';
import type { ProductAddon } from '@/types/product_addon';

interface Step1Props {
  products: Product[];
  categories: Category[];
  onSelect: (product: Product) => void;
}

export function Step1TemplateSelect({ products, categories, onSelect }: Step1Props) {
  const [selectedCategories, setSelectedCategories] = useState<number[]>([]);
  const [search, setSearch] = useState('');

  const filtered = products.filter(p => {
    const matchSearch = !search.trim() || p.name.toLowerCase().includes(search.trim().toLowerCase());
    const matchCategory = selectedCategories.length === 0 || selectedCategories.includes(p.category_id);
    return matchSearch && matchCategory;
  });

  const toggleCategory = (categoryId: number) => {
    setSelectedCategories(prev =>
      prev.includes(categoryId)
        ? prev.filter(id => id !== categoryId)
        : [...prev, categoryId]
    );
  };

  return (
    <div>
      <div className="mb-6 max-w-md">
        <Input
          placeholder="ค้นหาสินค้า..."
          value={search}
          onChange={e => setSearch(e.target.value)}
          className="h-11"
        />
      </div>

      <div className="mb-6">
        <BadgeCategoryCarousel
          categories={categories}
          selectedCategories={selectedCategories}
          onToggleCategory={toggleCategory}
        />
      </div>

      {filtered.length > 0 ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
          {filtered.map(product => (
            <ProductCard
              key={product.id}
              product={product}
              category={product.categories || null}
              options={(product.product_mapping_addons?.map(item => item.product_addons) || []).filter((a): a is ProductAddon => a !== undefined).filter(o => o.is_active)}
              onAdd={() => onSelect(product)}
              hideActions
            />
          ))}
        </div>
      ) : (
        <div className="flex items-center justify-center py-20 text-muted-foreground">
          ไม่พบสินค้าที่ค้นหา
        </div>
      )}
    </div>
  );
}
