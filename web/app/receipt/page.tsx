'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { ProductCard } from '@/components/app/product-card';
import type { Product, ProductOption } from '@/types/product';
import type { Channel } from '@/types/channel';
import { generateReceiptNo } from '@/utils/receipt-no';

// ─── Mock data (to be replaced with DB calls) ────────────
const MOCK_CHANNELS: Channel[] = [
  { id: 1, short_code: 'LMN', name: 'Lineman', gp_percentage: 20 },
  { id: 2, short_code: 'RBN', name: 'Robinhood', gp_percentage: 15 },
  { id: 3, short_code: 'GRB', name: 'Grabfood', gp_percentage: 18 },
  { id: 4, short_code: 'CND', name: 'Condo', gp_percentage: 10 },
];

const MOCK_OPTIONS: ProductOption[] = [
  { id: 1, name: 'เพิ่มไข่', price: 10 },
  { id: 2, name: 'ชีสเพิ่ม', price: 15 },
  { id: 3, name: 'ซอสพิเศษ', price: 8 },
];

const MOCK_PRODUCTS: Product[] = [
  { id: 1, category_id: 1, name: 'แซนด์วิชมะม่วง', base_price: 45, cost: 28 },
  { id: 2, category_id: 1, name: 'แซนด์วิชแฮมชีส', base_price: 50, cost: 32 },
  { id: 3, category_id: 1, name: 'แซนด์วิชทูน่า', base_price: 45, cost: 27 },
  { id: 4, category_id: 2, name: 'ชาเย็น', base_price: 35, cost: 18 },
  { id: 5, category_id: 2, name: 'กาแฟลาเต้', base_price: 40, cost: 22 },
];

// ─── Cart item type ──────────────────────────────────────
interface CartItem {
  product: Product;
  option?: ProductOption;
  quantity: number;
}

export default function ReceiptPage() {
  const [selectedChannel, setSelectedChannel] = useState<Channel | null>(null);
  const [customerName, setCustomerName] = useState('');
  const [cart, setCart] = useState<CartItem[]>([]);
  const [showPreview, setShowPreview] = useState(false);

  // ─── Cart operations ──────────────────────────────────
  function addToCart(product: Product, option?: ProductOption) {
    const existingIndex = cart.findIndex(
      item => item.product.id === product.id && item.option?.id === option?.id
    );

    if (existingIndex >= 0) {
      const updated = [...cart];
      updated[existingIndex] = { ...updated[existingIndex], quantity: updated[existingIndex].quantity + 1 };
      setCart(updated);
    } else {
      setCart([...cart, { product, option, quantity: 1 }]);
    }
  }

  function removeFromCart(index: number) {
    const item = cart[index];
    if (item.quantity > 1) {
      const updated = [...cart];
      updated[index] = { ...item, quantity: item.quantity - 1 };
      setCart(updated);
    } else {
      setCart(cart.filter((_, i) => i !== index));
    }
  }

  // ─── Total calculation ────────────────────────────────
  const totalAmount = cart.reduce((sum, item) => {
    const price = item.option ? item.product.base_price + item.option.price : item.product.base_price;
    return sum + price * item.quantity;
  }, 0);

  const receiptNo = selectedChannel ? generateReceiptNo(selectedChannel.short_code) : '';

  // ─── Submit handler (Server Action in production) ──────
  function handleSubmit() {
    if (!selectedChannel || cart.length === 0) return;
    
    setShowPreview(true);
    
    // In production: call server action to save receipt + line items
    console.log('Creating bill:', {
      receipt_no: receiptNo,
      channel_code: selectedChannel.short_code,
      customer_name: customerName || null,
      total_amount: totalAmount,
      items: cart,
    });

    // Reset after preview
    setTimeout(() => setShowPreview(false), 3000);
  }

  return (
    <div className="flex min-h-[calc(100vh-8rem)]">
      
      {/* Left panel — Channel + Products */}
      <div className="flex-1 p-6 overflow-y-auto">
        
        {/* Channel selector */}
        <h2 className="text-heading text-lg mb-3 font-semibold">เลือกช่องทางการขาย</h2>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-6">
          {MOCK_CHANNELS.map(channel => (
            <button
              key={channel.id}
              onClick={() => setSelectedChannel(channel)}
              className={`card-panel text-center transition-all border-2 ${
                selectedChannel?.id === channel.id 
                  ? 'border-action bg-action/5' 
                  : 'border-border hover:border-primary/30'
              }`}
            >
              <p className="font-bold text-lg text-primary">{channel.short_code}</p>
              <p className="text-xs text-primary/60 mt-1">{channel.name}</p>
              <p className="text-xs text-muted-foreground">GP {channel.gp_percentage}%</p>
            </button>
          ))}
        </div>

        {/* Customer info */}
        {selectedChannel && (
          <>
            <h2 className="text-heading text-lg mb-3 font-semibold">ข้อมูลลูกค้า</h2>
            <div className="max-w-md mb-6 flex gap-3">
              <Input
                placeholder="ชื่อลูกค้า (ไม่บังคับ)"
                value={customerName}
                onChange={(e) => setCustomerName(e.target.value)}
                className="flex-1"
              />
            </div>

            {/* Product grid */}
            <h2 className="text-heading text-lg mb-3 font-semibold">สินค้า</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {MOCK_PRODUCTS.map(product => (
                <ProductCard
                  key={product.id}
                  product={product}
                  options={MOCK_OPTIONS}
                  onAdd={addToCart}
                />
              ))}
            </div>
          </>
        )}
      </div>

      {/* Right panel — Cart preview */}
      <div className="w-80 border-l border-border bg-surface p-6 overflow-y-auto">
        <h3 className="text-heading font-semibold mb-4 text-lg">รายการในบิล</h3>
        
        {selectedChannel && (
          <p className="text-sm text-primary/60 mb-2">
            เลขที่: <span className="font-mono font-medium">{receiptNo}</span>
          </p>
        )}

        {/* Cart items */}
        <div className="space-y-3 mb-4">
          {cart.length === 0 ? (
            <p className="text-sm text-primary/40 py-8 text-center">ยังไม่มีรายการสินค้า</p>
          ) : (
            cart.map((item, index) => {
              const price = item.option 
                ? item.product.base_price + item.option.price 
                : item.product.base_price;
              
              return (
                <div key={`${item.product.id}-${item.option?.id || 'base'}-${index}`} className="flex items-start justify-between py-2 border-b border-border/50">
                  <div className="flex-1">
                    <p className="text-sm font-medium text-primary">{item.product.name}</p>
                    {item.option && (
                      <p className="text-xs text-muted-foreground">+{item.option.name}</p>
                    )}
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-sm text-primary/70">x{item.quantity}</span>
                    <span className="text-sm font-semibold text-primary">฿{(price * item.quantity).toLocaleString()}</span>
                    <button
                      onClick={() => removeFromCart(index)}
                      className="ml-1 text-xs text-error hover:text-destructive"
                    >
                      ✕
                    </button>
                  </div>
                </div>
              );
            })
          )}
        </div>

        {/* Total */}
        <div className="pt-4 border-t-2 border-primary/20 mb-6">
          <div className="flex justify-between items-center">
            <span className="text-lg font-bold text-primary">รวมทั้งหมด</span>
            <span className="text-2xl font-bold text-primary">฿{totalAmount.toLocaleString()}</span>
          </div>
        </div>

        {/* Submit button */}
        <Button 
          variant="action" 
          size="lg" 
          onClick={handleSubmit}
          disabled={!selectedChannel || cart.length === 0}
          className="w-full text-base font-semibold"
        >
          สร้างบิล ✓
        </Button>

        {showPreview && (
          <div className="mt-4 p-3 bg-success/10 border border-success/30 rounded-lg">
            <p className="text-sm text-success font-medium text-center">
              บันทึกใบเสร็จเรียบร้อย!
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
