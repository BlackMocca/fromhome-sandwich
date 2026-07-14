'use server';

/**
 * Server Actions (Reserved for future server-only operations)
 */

export async function cancelReceipt(_receiptId: number): Promise<{ success: boolean }> {
  // TODO: PATCH status to 'cancelled'
  return { success: true };
}
