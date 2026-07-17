'use client';

import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { useQuery } from '@tanstack/react-query';
import { PlusCircle, Edit2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { getChannels } from '@/lib/db';
import type { Channel } from '@/types/channel';

function ChannelCard({ channel }: { channel: Channel }) {
  const router = useRouter();

  return (
    <Card className="group relative border border-primary/20 bg-white shadow-sm transition-shadow hover:shadow-md">
      {/* Edit icon (top-right) */}
      <Link
        href={`/management/channels/${channel.id}/edit`}
        aria-label="แก้ไขช่องทาง"
        className="absolute right-3 top-3 z-10 flex h-8 w-8 items-center justify-center rounded-full bg-white/90 text-primary shadow-sm ring-1 ring-primary/20 transition-colors hover:bg-primary hover:text-white"
        onClick={(e) => e.stopPropagation()}
      >
        <Edit2 className="h-4 w-4" aria-hidden />
      </Link>
      <CardContent className="flex flex-col items-center gap-3 p-5">
        <div className="flex h-20 w-20 items-center justify-center overflow-hidden rounded-full bg-primary/5">
          {channel.cover_url ? (
            <img
              src={channel.cover_url}
              alt={channel.name}
              className="h-full w-full rounded-full object-cover"
            />
          ) : (
            <span className="text-2xl text-primary/30">📊</span>
          )}
        </div>

        <div className="w-full text-left">
          <p className="text-sm font-semibold text-primary">
            <span className="font-mono text-muted-foreground/70">[{channel.code}]</span>{' '}
            {channel.name}
          </p>
        </div>

        <div className="flex w-full justify-end">
          <Button
            type="button"
            variant="primary"
            size="sm"
            onClick={() => router.push(`/management/channels/${channel.id}`)}
          >
            จัดการข้อมูล
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}

export default function ChannelsPage() {
  const router = useRouter();
  const { data: channels = [], isLoading } = useQuery({
    queryKey: ['channels'],
    queryFn: getChannels,
  });

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-20 text-primary/50">
        กำลังโหลด...
      </div>
    );
  }

  return (
    <div className="min-h-screen">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold text-primary">
          ช่องทางการขายทั้งหมด ({channels.length} รายการ)
        </h1>
        <Button
          type="button"
          variant="primary"
          onClick={() => router.push('/management/channels/create')}
          className="flex items-center gap-2"
        >
          <PlusCircle className="w-4 h-4" /> เพิ่มช่องทางการขาย
        </Button>
      </div>

      {channels.length === 0 ? (
        <div className="flex flex-col items-center justify-center gap-4 py-20 text-primary/50">
          <p>ยังไม่มีช่องทางการขาย</p>
        </div>
      ) : (
        <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5">
        {channels.map(channel => (
          <ChannelCard key={channel.id} channel={channel} />
        ))}
      </div>
      )}
    </div>
  );
}
