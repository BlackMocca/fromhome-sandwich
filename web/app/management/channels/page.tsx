'use client';

import { useRouter } from 'next/navigation';
import { useQuery } from '@tanstack/react-query';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { getChannels } from '@/lib/db';
import type { Channel } from '@/types/channel';

function ChannelCard({ channel }: { channel: Channel }) {
  const router = useRouter();

  return (
    <Card className="group border border-primary/20 bg-white shadow-sm transition-shadow hover:shadow-md">
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

  if (channels.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center gap-4 py-20 text-primary/50">
        <p>ยังไม่มีช่องทางการขาย</p>
        <Button
          variant="primary"
          onClick={() => window.location.href = '/management/channels/create'}
        >
          เพิ่มช่องทางใหม่
        </Button>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5">
      {channels.map(channel => (
        <ChannelCard key={channel.id} channel={channel} />
      ))}
    </div>
  );
}
