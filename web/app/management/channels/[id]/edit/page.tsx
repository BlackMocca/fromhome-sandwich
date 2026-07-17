'use client';

import { useParams } from 'next/navigation';
import { ChannelForm } from '@/components/channel/channel-form';

export default function EditChannelPage() {
  const params = useParams<{ id: string | undefined }>();
  return <ChannelForm mode="edit" channelId={params?.id} />;
}
