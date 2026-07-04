'use client';

/** Gateway-specific receipt page (SPEC.md §3.C) */
import { useState } from 'react';
import { useParams } from 'next/navigation';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { ChevronLeft, ExternalLink } from 'lucide-react';

export default function GatewayReceiptPage() {
  const params = useParams<{ gateway: string }>();
  const gateway = params.gateway.toUpperCase();
  const [channelName] = useState(() => {
    switch (gateway) {
      case 'LMN': return 'Lineman';
      case 'RBN': return 'Robinhood';
      case 'GRB': return 'Grabfood';
      case 'CND': return 'Condo';
      default: return gateway;
    }
  });

  return (
    <div className="flex flex-col items-center justify-center min-h-[70vh] px-6">
      <Link href="/receipt" className="text-primary/60 hover:text-primary transition-colors mb-8 flex items-center gap-1 text-sm">
        <ChevronLeft className="w-4 h-4" /> กลับหน้าออกบิล
      </Link>

      <div className="card-panel max-w-lg w-full text-center">
        <p className="text-muted-foreground text-sm mb-2">ช่องทาง</p>
        <h1 className="text-heading text-5xl font-bold mb-4">{gateway}</h1>
        <p className="text-primary/70 mb-8">{channelName} — กำลังดำเนินการ...</p>

        <div className="flex gap-3 justify-center">
          <Button variant="primary" asChild>
            <a href={`/${gateway.toLowerCase()}/orders`} className="flex items-center gap-2">
              ดูคำสั่งซื้อ <ExternalLink className="w-4 h-4" />
            </a>
          </Button>
          <Button variant="action" onClick={() => window.location.href = '/receipt'}>
            กลับไปออกบิล
          </Button>
        </div>
      </div>
    </div>
  );
}
