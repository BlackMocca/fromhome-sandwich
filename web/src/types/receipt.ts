/** Receipt (Bill) entity — snapshot order schema */

export interface Receipt {
  id: number;
  channel_id: number;
  channel_code: string;
  receipt_no: string;
  customer_name: string | null;
  bill_date: string;
  total_quantity: number;
  subtotal: number;
  discount_total: number;
  grand_total: number;
  discounts: DiscountSnapshot[];
  status: 'active' | 'cancelled';
  note: string | null;
  created_at: string;
  updated_at: string;
}

/** Receipt line item — Product snapshot at order time */
export interface ReceiptItem {
  id: number;
  receipt_id: number;
  product_id: number | null;
  product_name: string;
  product_price: number;
  product_cost: number;
  product_options: ProductOptionSnapshot[];
  quantity: number;
  line_total: number;
  note: string | null;
  created_at: string;
}

export interface DiscountSnapshot {
  type: 'pricing' | 'percentage' | 'coupon';
  price?: number;
  percentage?: number;
  code?: string;
}

export interface ProductOptionSnapshot {
  id: number;
  name: string;
  price: number;
}
