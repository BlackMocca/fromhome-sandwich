/** Receipt (Bill) entity — Billing system (Requirement.md §3) */
export interface Receipt {
  id: number;
  receipt_no: string;        // e.g., "LMN202607030001"
  channel_code: string;      // Short code, e.g., "LMN"
  customer_name: string | null;
  bill_date: string;         // YYYY-MM-DD
  total_amount: number;
  status: 'Active' | 'Cancelled';
}

/** Receipt line item — Products + Options per bill */
export interface ReceiptLineItem {
  id: number;
  receipt_id: number;
  product_id: number;
  option_id: number | null;
  quantity: number;
  price: number;             // Price at time of billing (may include channel override)
}
