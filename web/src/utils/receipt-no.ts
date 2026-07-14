/**
 * Generate receipt number — Requirement.md §3.2
 *
 * Format: ${ShortCode}${YYYYMMDD}${Seq}
 * Example: LMN + 20260714 + 0001 → LMN202607140001
 * Running number resets daily at 00:00
 */

/** Get today's date string in YYYYMMDD format (Gregorian year) */
export function getTodayString(): string {
  const now = new Date();
  const year = now.getFullYear();
  const month = String(now.getMonth() + 1).padStart(2, '0');
  const day = String(now.getDate()).padStart(2, '0');
  return `${year}${month}${day}`;
}

/** Get current date as YYYY-MM-DD for bill_date field */
export function getTodayDate(): string {
  const today = new Date();
  const year = today.getFullYear();
  const month = String(today.getMonth() + 1).padStart(2, '0');
  const day = String(today.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}
