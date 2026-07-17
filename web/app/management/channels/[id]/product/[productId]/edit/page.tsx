'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { ArrowLeft, CheckCircle2, AlertCircle, Loader2 } from 'lucide-react';
import Link from 'next/link';

import { Step2ChannelForm } from '../../../add/step2';
import { getChannelById, getChannelProductById, updateChannelProduct, saveChannelProductAddonMappings } from '@/lib/db';
import { toast } from '@/lib/toast';
import { cn } from '@/lib/utils';
import type { Channel } from '@/types/channel';
import type { Product } from '@/types/product';
import type { ChannelProduct } from '@/types/channel_product';

export default function EditChannelProductPage() {
  const params = useParams<{ id: string; productId: string }>();
  const router = useRouter();
  const channelId = Number(params.id);
  const productId = Number(params.productId);

  const [channel, setChannel] = useState<Channel | null>(null);
  const [channelProduct, setChannelProduct] = useState<ChannelProduct | null>(null);
  const [banner, setBanner] = useState<{ kind: 'success' | 'error'; text: string } | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function load() {
      try {
        const [ch, cp] = await Promise.all([
          getChannelById(channelId),
          getChannelProductById(productId),
        ]);
        setChannel(ch);
        setChannelProduct(cp);
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    }
    load();
  }, [channelId, productId]);

  async function handleSubmit(
    values: { price: number; cost: number },
    addons: { addon_id: number; price: number }[],
  ) {
    if (!channelProduct) return;
    setBanner(null);
    try {
      await updateChannelProduct(channelProduct.id, {
        price: values.price,
        cost: values.cost,
        updated_at: new Date().toISOString(),
      });

      await saveChannelProductAddonMappings(channelProduct.id, addons);

      toast({ title: 'สำเร็จ!', description: 'แก้ไขสินค้าในช่องทางเรียบร้อยแล้ว' });
      setBanner({ kind: 'success', text: 'แก้ไขสินค้าเรียบร้อยแล้ว' });
      setTimeout(() => router.push(`/management/channels/${channelId}`), 1200);
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'ไม่สามารถแก้ไขสินค้าได้';
      toast({ title: 'เกิดข้อผิดพลาด', description: msg });
      setBanner({ kind: 'error', text: msg });
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="mr-2 h-6 w-6 animate-spin text-muted-foreground" />
        <p className="text-muted-foreground">กำลังโหลด...</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen">
      {/* Header */}
      <div className="flex items-center gap-3 mb-6">
        <Link
          href={`/management/channels/${channelId}`}
          className="p-2 rounded-lg hover:bg-surface transition-colors"
        >
          <ArrowLeft className="w-5 h-5 text-primary" />
        </Link>
        <div className="flex-1">
          <h1 className="text-2xl font-bold text-primary">
            แก้ไขสินค้าใน {channel?.name ?? channelId}
          </h1>
        </div>
      </div>

      {/* Banners */}
      {banner && (
        <div className={cn(
          'flex items-start gap-2 rounded-lg border p-3 text-sm mb-4',
          banner.kind === 'success'
            ? 'border-success/40 bg-success/10 text-success'
            : 'border-destructive/40 bg-destructive/10 text-destructive',
        )}>
          {banner.kind === 'success'
            ? <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0" />
            : <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" />
          }
          <span>{banner.text}</span>
        </div>
      )}

      {/* Edit form (same layout as add Step 2) */}
      {channel && channelProduct && channelProduct.products ? (
        <Step2ChannelForm
          channel={channel}
          template={channelProduct.products as Product}
          channelProduct={channelProduct}
          onSubmit={handleSubmit}
          onBack={() => router.push(`/management/channels/${channelId}`)}
        />
      ) : (
        <div className="flex items-center justify-center py-20 text-muted-foreground">
          ไม่พบข้อมูลสินค้าในช่องทางนี้
        </div>
      )}
    </div>
  );
}
