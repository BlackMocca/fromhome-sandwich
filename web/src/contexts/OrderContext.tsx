'use client';

import {
  createContext,
  useCallback,
  useContext,
  useMemo,
  useRef,
  useState,
  type ReactNode,
} from 'react';
import type { ChannelProduct } from '@/types/channel_product';
import type { ProductAddon } from '@/types/product_addon';

export interface OrderItem {
  channelProduct: ChannelProduct;
  quantity: number;
  selectedAddons: ProductAddon[];
  note?: string;
}

interface OrderContextValue {
  channelId: number | null;
  channelName: string | null;
  items: OrderItem[];
  pendingItem: OrderItem | null;
  pendingChannelName: string | null;
  addItem: (channelProduct: ChannelProduct, quantity: number, selectedAddons: ProductAddon[], channelName?: string, note?: string) => void;
  confirmReplace: () => void;
  cancelPending: () => void;
  removeItem: (index: number) => void;
  updateItem: (index: number, patch: Partial<Omit<OrderItem, 'channelProduct'>>) => void;
  clearOrder: () => void;
  totalQuantity: number;
  totalPrice: number;
}

const OrderContext = createContext<OrderContextValue | undefined>(undefined);

export function OrderProvider({ children }: { children: ReactNode }) {
  const [channelId, setChannelId] = useState<number | null>(null);
  const [channelName, setChannelName] = useState<string | null>(null);
  const [items, setItems] = useState<OrderItem[]>([]);
  const [pendingItem, setPendingItem] = useState<OrderItem | null>(null);
  const [pendingChannelName, setPendingChannelName] = useState<string | null>(null);

  // Use ref to avoid stale closure in callbacks
  const channelIdRef = useRef(channelId);
  channelIdRef.current = channelId;
  const pendingItemRef = useRef(pendingItem);
  pendingItemRef.current = pendingItem;
  const pendingChannelNameRef = useRef(pendingChannelName);
  pendingChannelNameRef.current = pendingChannelName;

  const addItem = useCallback(
    (channelProduct: ChannelProduct, quantity: number, selectedAddons: ProductAddon[], channelNameArg?: string, note?: string) => {
      const newItem: OrderItem = { channelProduct, quantity, selectedAddons, note };
      const currentChannelId = channelIdRef.current;

      // Empty bill — add directly and lock channel
      if (currentChannelId === null) {
        setChannelId(channelProduct.channel_id);
        setChannelName(channelNameArg ?? null);
        setItems([newItem]);
        return;
      }

      // Same channel — add directly
      if (currentChannelId === channelProduct.channel_id) {
        setItems(prev => [...prev, newItem]);
        return;
      }

      // Different channel — pause and show confirmation modal
      setPendingItem(newItem);
      setPendingChannelName(channelNameArg ?? null);
    },
    [],
  );

  const confirmReplace = useCallback(() => {
    const pending = pendingItemRef.current;
    if (!pending) return;
    setChannelId(pending.channelProduct.channel_id);
    setChannelName(pendingChannelNameRef.current);
    setItems([pending]);
    setPendingItem(null);
    setPendingChannelName(null);
  }, []);

  const cancelPending = useCallback(() => {
    setPendingItem(null);
    setPendingChannelName(null);
  }, []);

  const removeItem = useCallback((index: number) => {
    setItems(prev => {
      const next = prev.filter((_, i) => i !== index);
      if (next.length === 0) setChannelId(null);
      return next;
    });
  }, []);

  const updateItem = useCallback((index: number, patch: Partial<Omit<OrderItem, 'channelProduct'>>) => {
    setItems(prev =>
      prev.map((item, i) => (i === index ? { ...item, ...patch } : item)),
    );
  }, []);

  const clearOrder = useCallback(() => {
    setItems([]);
    setChannelId(null);
    setChannelName(null);
    setPendingItem(null);
    setPendingChannelName(null);
  }, []);

  const totalQuantity = useMemo(() => items.reduce((s, i) => s + i.quantity, 0), [items]);

  const totalPrice = useMemo(
    () =>
      items.reduce((s, item) => {
        const addonPrice = item.selectedAddons.reduce((a, ad) => a + ad.base_price, 0);
        return s + (item.channelProduct.price + addonPrice) * item.quantity;
      }, 0),
    [items],
  );

  const value = useMemo<OrderContextValue>(
    () => ({
      channelId,
      channelName,
      items,
      pendingItem,
      pendingChannelName,
      addItem,
      confirmReplace,
      cancelPending,
      removeItem,
      updateItem,
      clearOrder,
      totalQuantity,
      totalPrice,
    }),
    [channelId, channelName, items, pendingItem, pendingChannelName, addItem, confirmReplace, cancelPending, removeItem, updateItem, clearOrder, totalQuantity, totalPrice],
  );

  return <OrderContext.Provider value={value}>{children}</OrderContext.Provider>;
}

export function useOrder(): OrderContextValue {
  const ctx = useContext(OrderContext);
  if (!ctx) {
    throw new Error('useOrder must be used within an <OrderProvider>');
  }
  return ctx;
}
