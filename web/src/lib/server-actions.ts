'use server';

/**
 * Server Actions — Save/Update data to DB (SPEC.md §3.B)
 * Called by client components for creating receipts, updating products, etc.
 */

import { getTodayDate } from '@/utils/receipt-no';
import { create } from './db';
import type { Receipt } from '@/types/receipt';

// ─── Create Receipt (Core billing action) ────────────────

interface CreateReceiptInput {
  channel_code: string;
  customer_name?: string;
  bill_date?: string;
  total_amount: number;
  receipt_no?: string;
}

export async function createBill(input: CreateReceiptInput): Promise<{ success: boolean; receipt: Receipt }> {
  const today = getTodayDate();
  
  // Generate receipt number
  const receiptNo = input.receipt_no || `${input.channel_code}${today.replace(/-/g, '')}0001`;

  const data: Record<string, unknown> = {
    receipt_no: receiptNo,
    channel_code: input.channel_code,
    customer_name: input.customer_name || null,
    bill_date: input.bill_date || today,
    total_amount: input.total_amount,
    status: 'Active',
  };

  const receipt = await create<Receipt>('receipts', data);

  return { success: true, receipt };
}

// ─── Create Receipt Line Items ────────────────────────────

interface ReceiptLineItemInput {
  product_id: number;
  option_id?: number | null;
  quantity: number;
  price: number;
}

export async function createReceiptItems(
  receiptId: number,
  items: ReceiptLineItemInput[]
): Promise<void> {
  // Batch insert line items
  for (const item of items) {
    await create('receipt_line_items', {
      receipt_id: receiptId,
      product_id: item.product_id,
      option_id: item.option_id,
      quantity: item.quantity,
      price: item.price,
    });
  }
}

// ─── Cancel Receipt ──────────────────────────────────────

export async function cancelReceipt(receiptId: number): Promise<{ success: boolean }> {
  // In production: PATCH status to "Cancelled" via db.update()
  return { success: true };
}
