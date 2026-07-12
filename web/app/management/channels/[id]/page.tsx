'use client';

import { useParams, useRouter } from 'next/navigation';
import React, { useEffect, useState } from 'react';
import { ArrowLeft, PlusCircle, Loader2 } from 'lucide-react';
import Link from 'next/link';
import { cn } from '@/lib/utils';
import { Input } from '@/components/ui/input';
import { BadgeCategoryCarousel } from '@/components/ui/badge-category-carousel';
import { ProductChannelCard } from '@/components/app/product-channel-card';
import { getChannelById, getChannelProducts, getActiveCategories } from '@/lib/db';
import type { Channel } from '@/types/channel';
import type { ChannelProduct } from '@/types/channel_product';
import type { Category } from '@/types/category';

export default function ChannelDetailPage() {
  const params   = useParams<{ id: string }>();
  const router   = useRouter();
  const channelId = params.id;

  const [channel, setChannel] = useState<Channel | null>(null);
  const [products, setProducts] = useState<ChannelProduct[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [selectedCategories, setSelectedCategories] = useState<number[]>([]);

  useEffect(() => {
    async function loadData() {
      try {
        const [ch, prods, cats] = await Promise.all([
          getChannelById(channelId),
          getChannelProducts(Number(channelId)),
          getActiveCategories(),
        ]);
        setChannel(ch);
        setProducts(prods);
        setCategories(cats);
      } catch (err) {
        console.error('Failed to load channel data:', err);
      } finally {
        setLoading(false);
      }
    }
    loadData();
  }, [channelId]);

  const toggleCategory = (categoryId: number) => {
    setSelectedCategories(prev =>
      prev.includes(categoryId)
        ? prev.filter(id => id !== categoryId)
        : [...prev, categoryId]
    );
  };

  const filteredProducts = products.filter(p => {
    const matchSearch = !search.trim() || p.products?.name?.toLowerCase().includes(search.trim().toLowerCase());
    const matchCategory = selectedCategories.length === 0 || (p.products?.category_id != null && selectedCategories.includes(p.products.category_id));
    return matchSearch && matchCategory;
  });

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="mr-2 h-6 w-6 animate-spin text-muted-foreground" />
        <p className="text-muted-foreground">กำลังโหลด...</p>
      </div>
    );
  }

  return (
    <>
      <style>{`
        .scrollbar-hide::-webkit-scrollbar { display: none; }
        .scrollbar-hide {
          -ms-overflow-style: none;
          scrollbar-width: none;
        }
      `}</style>
    <div className="h-full w-full overflow-y-auto scrollbar-hide">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-3">
          <div>
            <h1 className="text-xl lg:text-2xl font-bold text-primary">
              สินค้า {channel?.name ?? channelId} ({filteredProducts.length} รายการ)
            </h1>
          </div>
        </div>

        {/* Add Product Button */}
        <Link
          href={`/management/channels/${channelId}/add`}
          className="bg-primary text-white px-4 py-2 rounded-lg flex items-center gap-2 text-sm hover:bg-primary/90 transition-colors"
        >
          <PlusCircle className="w-4 h-4" /> เพิ่มสินค้า
        </Link>
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

      {/* Product cards grid */}
      {filteredProducts.length > 0 ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
          {filteredProducts.map(cp => (
            <ProductChannelCard
              key={cp.id}
              product={cp}
              category={cp.products?.categories ?? null}
              channelName={channel?.name}
            />
          ))}
        </div>
      ) : (
        <div className="flex items-center justify-center py-20 text-muted-foreground">
          {products.length === 0 ? 'ยังไม่มีสินค้าในช่องทางนี้' : 'ไม่พบสินค้าที่ค้นหา'}
        </div>
      )}
    </div>
    </>
  );
}
