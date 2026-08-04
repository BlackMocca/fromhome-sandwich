/**
 * Convert an ISO timestamp (UTC+0, e.g. "2026-08-04T09:09:11+00:00")
 * to a YYYY-MM-DD string in Thailand timezone (Asia/Bangkok = UTC+7).
 * Uses the full Date parsing so timezones are respected correctly;
 * for date-only strings ("2026-08-04") it returns them as-is.
 */
export function toLocalDate(iso: string): string {
  if (!iso) return '';
  // If no timezone info → treat as local (date input values are already in Thai time)
  if (!/[Z+\-]/.test(iso)) return iso.split('T')[0];
  const d = new Date(iso);
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
}

/** Thai Buddhist date from a UTC ISO timestamp → "4 ส.ค. 2569" */
export function formatThaiBuddhistDate(iso: string): string {
  if (!iso) return '';
  const THAI_MONTHS = ['ม.ค.', 'ก.พ.', 'มี.ค.', 'เม.ย.', 'พ.ค.', 'มิ.ย.',
    'ก.ค.', 'ส.ค.', 'ก.ย.', 'ต.ค.', 'พ.ย.', 'ธ.ค.'];
  const dateStr = toLocalDate(iso);
  const [year, month, day] = dateStr.split('-').map(Number);
  if (!year || !month || !day) return iso;
  return `${String(day).padStart(2, '0')} ${THAI_MONTHS[month - 1]} ${year + 543}`;
}

/** Thai Buddhist datetime from a UTC ISO timestamp → "04 ส.ค. 2569 16:09" */
export function formatThaiBuddhistDateTime(iso: string, withTime = false): string {
  if (!iso) return '-';
  const d = new Date(iso);
  // Use explicit Bangkok timezone for correct display regardless of server locale
  const dateFmt = new Intl.DateTimeFormat('th-TH', {
    timeZone: 'Asia/Bangkok', day: '2-digit', month: 'short'
  }).formatToParts(d);
  const partMap = Object.fromEntries(dateFmt.map(p => [p.type, p.value]));
  // Buddhist year from Bangkok timezone
  const bangkokYearStr = new Intl.DateTimeFormat('en-CA', {
    timeZone: 'Asia/Bangkok', year: 'numeric'
  }).format(d);
  const buddhistYear = parseInt(bangkokYearStr) + 543;
  if (!withTime) return `${partMap.day} ${partMap.month} ${buddhistYear}`;
  // Time also converted to Bangkok timezone
  const timeFmt = new Intl.DateTimeFormat('th-TH', {
    timeZone: 'Asia/Bangkok', hour: '2-digit', minute: '2-digit', second: '2-digit', hour12: false,
  }).formatToParts(d);
  const tMap = Object.fromEntries(timeFmt.map(p => [p.type, p.value]));
  return `${partMap.day} ${partMap.month} ${buddhistYear} ${tMap.hour}:${tMap.minute}:${tMap.second}`;
}

/** Order receipt date: "2026-08-04T16:09:11+00:00" → "04/08/69 16:09:11"
 * NOTE: Uses d.getHours()/getMinutes()/getSeconds() which are LOCAL TIME methods.
 * These convert the UTC timestamp to the system's local timezone (Asia/Bangkok = UTC+7).
 * In a server deployed in Thailand, this works automatically. For browser rendering,
 * Intl.DateTimeFormat with explicit timeZone is more robust across all environments:
 */
export function formatDmyReceipt(iso: string): string {
  if (!iso) return '';
  // Date-only strings (from form inputs, no timezone info) pass through as-is
  if (!/[Z+\-]/.test(iso)) {
    const [year, month, day] = iso.split('-').map(Number);
    if (!year || !month || !day) return iso;
    const yy = String(year + 543).slice(-2);
    return `${String(day).padStart(2, '0')}/${String(month).padStart(2, '0')}/${yy}`;
  }
  // Use Intl.DateTimeFormat with explicit Bangkok timezone for reliable conversion
  const d = new Date(iso);
  const fmtParts = new Intl.DateTimeFormat('en-GB', {
    timeZone: 'Asia/Bangkok',
    day: '2-digit', month: '2-digit', year: '2-digit',
  }).formatToParts(d);
  // Format parts are always in order: day, month, year (for en-GB)
  const partMap = Object.fromEntries(fmtParts.map(p => [p.type, p.value]));
  const yy = String((parseInt(partMap.year) + 543)).slice(-2);
  const dateStr = `${partMap.day}/${partMap.month}/${yy}`;

  // Extract and convert time using the same Bangkok timezone via Intl
  let hms = '';
  if (iso.includes('T')) {
    const tFmt = new Intl.DateTimeFormat('en-GB', {
      timeZone: 'Asia/Bangkok', hour: '2-digit', minute: '2-digit', second: '2-digit', hour12: false,
    }).formatToParts(d);
    const tMap = Object.fromEntries(tFmt.map(p => [p.type, p.value]));
    hms = `${tMap.hour}:${tMap.minute}:${tMap.second}`;
  }
  return hms ? `${dateStr} ${hms}` : dateStr;
}
