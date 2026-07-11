'use client';

import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { ReactQueryDevtools } from '@tanstack/react-query-devtools';
import { useState, type ReactNode } from 'react';
import { AuthProvider } from '@/contexts/AuthContext';
import { OrderProvider } from '@/contexts/OrderContext';
import { ChannelMismatchModal } from '@/components/app/channel-mismatch-modal';
import { ToastProvider, Toaster } from '@/lib/toast';

export default function Providers({ children }: { children: ReactNode }) {
  const [queryClient] = useState(
    () =>
      new QueryClient({
        defaultOptions: {
          queries: {
            staleTime: 60 * 1000, // 1 นาที
            retry: 1,
            refetchOnWindowFocus: false,
          },
        },
      }),
  );

  return (
    <QueryClientProvider client={queryClient}>
      <ToastProvider>
        <AuthProvider>
          <OrderProvider>
            {children}
            <ChannelMismatchModal />
          </OrderProvider>
        </AuthProvider>
        <ReactQueryDevtools initialIsOpen={false} />
        <Toaster />
      </ToastProvider>
    </QueryClientProvider>
  );
}
