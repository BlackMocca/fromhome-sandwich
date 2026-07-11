'use client';

import { useState } from 'react';
import { PlusCircle, Loader2 } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { useQuery, keepPreviousData } from '@tanstack/react-query';
import { Input } from '@/components/ui/input';
import { ProductCard } from '@/components/app/product-card';
import { BadgeCategoryCarousel } from '@/components/ui/badge-category-carousel';
import { getActiveCategories, getProducts } from '@/lib/db';

// ─── Component ──────────────────────────────────────
export default function ProductsPage() {
  const router = useRouter();
  const [selectedCategories, setSelectedCategories] = useState<number[]>([]);
  const [search, setSearch] = useState('');

  // Fetch active categories on mount using React Query
  const { data: categories = [] } = useQuery({
    queryKey: ['active-categories'],
    queryFn: getActiveCategories,
  });

  // Fetch products with relations (categories + addons) using React Query
  const { data: products = [], isLoading, isFetching } = useQuery({
    queryKey: ['products', search.trim(), selectedCategories],
    queryFn: async () => {
      const data = await getProducts(search.trim() || undefined, selectedCategories.length > 0 ? selectedCategories : undefined);
      return data || [];
    },
    placeholderData: keepPreviousData,
    staleTime: 5 * 60 * 1000, // 5 minutes
  });

  const toggleCategory = (categoryId: number) => {
    setSelectedCategories(prev => 
      prev.includes(categoryId)
        ? prev.filter(id => id !== categoryId)
        : [...prev, categoryId]
    );
  };

  const handleAction = (product: any) => {
    router.push(`/management/products/${product?.id}/edit`);
  };

  return (
    <div className="min-h-screen">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold text-primary">สินค้าทั้งหมด ({products?.length} รายการ)</h1>
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

      {/* Loading or Product cards grid */}
      {isLoading || (products.length === 0 && isFetching) ? (
        <div className="flex items-center justify-center py-20 text-muted-foreground">
          <Loader2 className="mr-2 h-6 w-6 animate-spin" /> กำลังโหลดสินค้า...
        </div>
      ) : products.length > 0 ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
          {products.map(product => {
            return (
              <ProductCard
                key={product.id}
                product={product}
                category={product.categories || null}
                options={(product.product_mapping_addons?.map(item => item.product_addons) || []).filter(data => data !== undefined).filter(o => o.is_active) || []}
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
