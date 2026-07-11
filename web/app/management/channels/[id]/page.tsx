'use client';

import { useParams, useRouter } from 'next/navigation';
import React, { useEffect, useState } from 'react';
import { ArrowLeft, PlusCircle } from 'lucide-react';
import Link from 'next/link';
import { cn } from '@/lib/utils';
import { ProductChannelCard } from '@/components/app/product-channel-card';
import { getChannelById, getChannelProducts } from '@/lib/db';
import type { Channel } from '@/types/channel';
import type { ChannelProduct } from '@/types/channel_product';
import type { ProductAddon } from '@/types/product_addon';

export default function ChannelDetailPage() {
  const params   = useParams<{ id: string }>();
  const router   = useRouter();
  const channelId = params.id;
  
  const [channel, setChannel] = useState<Channel | null>(null);
  const [products, setProducts] = useState<ChannelProduct[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeFilter, setActiveFilter] = useState<string>('ทั้งหมด');

  useEffect(() => {
    async function loadData() {
      try {
        const [ch, prods] = await Promise.all([
          getChannelById(channelId),
          getChannelProducts(Number(channelId)),
        ]);
        setChannel(ch);
        setProducts(prods);
      } catch (err) {
        console.error('Failed to load channel data:', err);
      } finally {
        setLoading(false);
      }
    }
    loadData();
  }, [channelId]);

  // Extract unique category names from products via joined master product
  const categories = Array.from(new Set(products.map(p => p.products?.categories?.name).filter(Boolean))) as string[];
  const allCategoryNames = ['ทั้งหมด', ...categories];

  const filteredProducts = activeFilter === 'ทั้งหมด'
    ? products
    : products.filter(p => p.products?.categories?.name === activeFilter);

  // Build options from all channel products' addon mappings
  const allOptions: ProductAddon[] = products
    .flatMap(p => p.channel_product_addons ?? [])
    .map(m => m.product_addons)
    .filter((a): a is ProductAddon => a !== undefined)
    .filter((a, i, arr) => arr.findIndex(x => x.id === a.id) === i);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
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
            <h1 className="text-2xl font-bold text-primary">{channel?.name ?? channelId}</h1>
            <p className="text-sm text-muted-foreground">สินค้าทั้งหมดของ {channel?.name ?? channelId} ({products.length} รายการ)</p>
          </div>
        </div>

        {/* Add Product Button */}
        <Link
          href={`/management/channels/${channelId}/add`}
          className="bg-primary text-secondary px-4 py-2 rounded-lg flex items-center gap-2 text-sm hover:bg-primary/90 transition-colors"
        >
          <PlusCircle className="w-4 h-4" /> เพิ่มสินค้า
        </Link>
      </div>

      {/* Category filter tabs */}
      <div className="flex items-center gap-2 mb-6 overflow-x-auto pb-1">
        <span className="text-sm text-muted-foreground whitespace-nowrap mr-1">กรองตามหมวด:</span>
        {allCategoryNames.map(cat => (
          <button
            key={cat}
            onClick={() => setActiveFilter(cat)}
            className={cn(
              'px-3 py-1.5 rounded-full text-sm transition-colors whitespace-nowrap',
              activeFilter === cat
                ? 'bg-primary/15 text-primary font-semibold'
                : 'bg-surface text-muted-foreground hover:bg-action/10 hover:text-primary border border-border/50',
            )}
          >
            {cat}
          </button>
        ))}
      </div>

      {/* Product cards grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
        {filteredProducts.map(cp => {
          return (
            <ProductChannelCard
              key={cp.id}
              product={cp}
              category={cp.products?.categories ?? null}
              options={allOptions}
              onAdd={() => {}}
            />
          );
        })}
      </div>
    </div>
    </>
  );
}
