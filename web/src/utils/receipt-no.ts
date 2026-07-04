/**
 * Generate receipt number — Requirement.md §3.2
 * 
 * Format: ${ShortCode}${YYYYMMDD}${Seq}
 * Example: LMN + 20260703 + 0001 → LMN202607030001
 * Running number resets daily at 00:00
 */

/** Get today's date string in YYYYMMDD format */
export function getTodayString(): string {
  const now = new Date();
  // Thai Buddhist Year calendar support (optional, using standard Gregorian)
  const year = now.getFullYear() + 543; // Convert to Buddhist era if needed
  const month = String(now.getMonth() + 1).padStart(2, '0');
  const day = String(now.getDate()).padStart(2, '0');
  return `${year}${month}${day}`;
}

/** Generate receipt number with padding */
export function generateReceiptNo(shortCode: string): string {
  const todayStr = getTodayString();
  // In production: fetch max sequence from DB for today
  // For now, default to 0001
  const seq = '0001';
  return `${shortCode}${todayStr}${seq}`;
}

/** Get current date as YYYY-MM-DD for bill_date field */
export function getTodayDate(): string {
  const today = new Date();
  const year = today.getFullYear() + 543;
  const month = String(today.getMonth() + 1).padStart(2, '0');
  const day = String(today.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}
