'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { ArrowLeft, CheckCircle2, AlertCircle, Loader2 } from 'lucide-react';
import Link from 'next/link';

import { Step1TemplateSelect } from './step1';
import { Step2ChannelForm } from './step2';
import { getChannelById, getProducts, getActiveCategories, createChannelProduct, saveChannelProductAddonMappings } from '@/lib/db';
import { toast } from '@/lib/toast';
import type { Channel } from '@/types/channel';
import type { Product } from '@/types/product';
import type { Category } from '@/types/category';
import { cn } from '@/lib/utils';

export default function AddChannelProductPage() {
  const params = useParams<{ id: string }>();
  const router = useRouter();
  const channelId = Number(params.id);

  const [channel, setChannel] = useState<Channel | null>(null);
  const [templates, setTemplates] = useState<Product[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [selectedTemplate, setSelectedTemplate] = useState<Product | null>(null);
  const [banner, setBanner] = useState<{ kind: 'success' | 'error'; text: string } | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function load() {
      try {
        const [ch, prods, cats] = await Promise.all([
          getChannelById(channelId),
          getProducts(),
          getActiveCategories(),
        ]);
        setChannel(ch);
        setTemplates(prods);
        setCategories(cats);
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    }
    load();
  }, [channelId]);

  async function handleSubmit(values: { price: number; cost: number }, addonIds: number[]) {
    if (!selectedTemplate) return;
    setBanner(null);
    try {
      const result = await createChannelProduct({
        channel_id: channelId,
        product_id: selectedTemplate.id,
        price: values.price,
        cost: values.cost,
      });

      // Build addon payload with prices from template
      const addons = (selectedTemplate.product_mapping_addons ?? [])
        .map(m => m.product_addons)
        .filter((a): a is import('@/types/product_addon').ProductAddon => a !== undefined);

      const addonPayload = addonIds.map(addonId => {
        const addon = addons.find(a => a.id === addonId);
        return { addon_id: addonId, price: addon?.base_price ?? 0 };
      });
      await saveChannelProductAddonMappings(result.id, addonPayload);

      toast({ title: 'สำเร็จ!', description: 'เพิ่มสินค้าเข้าช่องทางเรียบร้อยแล้ว' });
      setBanner({ kind: 'success', text: 'เพิ่มสินค้าเรียบร้อยแล้ว' });
      setTimeout(() => router.push(`/management/channels/${channelId}`), 1200);
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'ไม่สามารถเพิ่มสินค้าได้';
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
            เพิ่มสินค้าไปยัง {channel?.name ?? channelId}
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

      {/* Step 1 or Step 2 */}
      {!selectedTemplate ? (
        <Step1TemplateSelect
          products={templates}
          categories={categories}
          onSelect={setSelectedTemplate}
        />
      ) : channel ? (
        <Step2ChannelForm
          channel={channel}
          template={selectedTemplate}
          onSubmit={handleSubmit}
          onBack={() => setSelectedTemplate(null)}
        />
      ) : null}
    </div>
  );
}
