'use client';

import { useState, useEffect } from 'react';
import { PlusCircle, Search } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { Input } from '@/components/ui/input';
import type { Product } from '@/types/product';
import type { Category } from '@/types/category';
import type { ProductAddon } from '@/types/product_addon';
import { ProductCard } from '@/components/app/product-card';
import { BadgeCategoryCarousel } from '@/components/ui/badge-category-carousel';
import { getActiveCategories, getProductsFiltered, getActiveProductAddons } from '@/lib/db';

// ─── Component ──────────────────────────────────────
export default function ProductsPage() {
  const router = useRouter();
  const [categories, setCategories] = useState<Category[]>([]);
  const [selectedCategories, setSelectedCategories] = useState<number[]>([]);
  const [search, setSearch] = useState('');
  const [products, setProducts] = useState<Product[]>([]);
  const [options, setOptions] = useState<ProductAddon[]>([]);

  // Fetch active categories and product addons on mount
  useEffect(() => {
    getActiveCategories().then(setCategories).catch(console.error);
    getActiveProductAddons().then(setOptions).catch(console.error);
  }, []);

  // Fetch products when search or selectedCategories change (with debounce)
  useEffect(() => {
    const fetchProducts = async () => {
      try {
        const data = await getProductsFiltered(search, selectedCategories.length > 0 ? selectedCategories : undefined);
        setProducts(data || []);
      } catch (err) {
        console.error('Failed to fetch products:', err);
        setProducts([]);
      }
    };

    const delayDebounce = setTimeout(fetchProducts, 300);
    return () => clearTimeout(delayDebounce);
  }, [search, selectedCategories]);

  const toggleCategory = (categoryId: number) => {
    setSelectedCategories(prev => 
      prev.includes(categoryId)
        ? prev.filter(id => id !== categoryId)
        : [...prev, categoryId]
    );
  };

  const handleAction = (product: Product) => {
    console.log(`[ProductCard action] ${product.name}`);
  };

  return (
    <div className="min-h-screen">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold text-primary">สินค้าทั้งหมด (Products)</h1>
        <button 
          onClick={() => router.push('/management/products/create')}
          className="btn-primary text-white flex items-center gap-2 text-sm px-4 py-2 rounded-xl shadow-md cursor-pointer"
        >
          <PlusCircle className="w-4 h-4" /> เพิ่มสินค้า
        </button>
      </div>

      {/* Search */}
      <div className="mb-6 max-w-md">
        <Input
          placeholder="ค้นหาสินค้า..."
          value={search}
          onChange={e => setSearch(e.target.value)}
          className="h-11"
        />
      </div>

      {/* Category Filter Carousel */}
      <div className="mb-6">
        <BadgeCategoryCarousel
          categories={categories}
          selectedCategories={selectedCategories}
          onToggleCategory={toggleCategory}
        />
      </div>

      {/* Search & Product cards grid */}
      {products.length > 0 ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
          {products.map(product => {
            const category = categories.find(c => c.id === product.category_id);
            return (
              <ProductCard
                key={product.id}
                product={{ ...product }}
                category={category}
                options={options.filter(o => o.is_active)}
                onAdd={handleAction}
              />
            );
          })}
        </div>
      ) : (
        <div className="flex items-center justify-center py-20 text-muted-foreground">
          ไม่พบสินค้าที่ค้นหา
        </div>
      )}
    </div>
  );
}

export const dynamic = 'force-dynamic';
