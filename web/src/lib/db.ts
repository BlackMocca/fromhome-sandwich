/**
 * PostgREST REST Client — Direct API calls (SPEC.md §3.A)
 * 
 * Uses native fetch with apiKey and JWT headers.
 * No WebSocket/Realtime due to IPv6 constraints on dev machine.
 */

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
const SUPABASE_ANON_KEY = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
  || process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY
  || '';
const SUPABASE_SERVICE_KEY = process.env.SUPABASE_SECRET_KEY || process.env.SUPABASE_SERVICE_KEY || '';

/** Auth token from cookies or Supabase auth */
function getAuthToken(): string {
  // In production: use cookie-based JWT from Next.js
  if (typeof window !== 'undefined') {
    const cookie = document.cookie
      .split('; ')
      .find(row => row.startsWith('sb-'));
    
    if (!cookie) return SUPABASE_ANON_KEY;
    
    let rawValue = cookie.split('=')[1];

    // Handle base64-prefixed cookies: strip "base64-", decode, then parse
    if (rawValue.startsWith('base64-')) {
      try {
        const b64Str = rawValue.slice(7); // strip prefix
        // URL-safe base64 → standard base64 for atob
        const decoded = atob(b64Str.replace(/-/g, '+').replace(/_/g, '/'));
        const parsed = JSON.parse(decoded);
        if (parsed && typeof parsed === 'object' && parsed.access_token) {
          return parsed.access_token;
        }
      } catch (err) {
        console.error('[db] Failed to decode base64 cookie:', err);
      }
    }

    // Fallback: try parsing raw value as JSON directly
    try {
      // Cookie may be a JSON object with an access_token field
      const parsed = JSON.parse(decodeURIComponent(rawValue));
      if (parsed && typeof parsed === 'object' && parsed.access_token) {
        return parsed.access_token;
      }
      // Parsed OK but no access_token field — fall back to raw value
    } catch (err) {
      // Not valid JSON — raw string token, use as-is
      console.error('[db] Failed to parse cookie as JSON:', err);
    }
    
    return rawValue || SUPABASE_ANON_KEY;
  }
  // Server-side: use service role key for admin operations
  return SUPABASE_SERVICE_KEY || SUPABASE_ANON_KEY;
}

/** Build request headers for PostgREST */
function getHeaders(contentType = 'application/json'): Record<string, string> {
  const token = getAuthToken();

  return {
    'Authorization': `Bearer ${token}`,
    'apikey': SUPABASE_ANON_KEY,
    'Content-Type': contentType,
    'Accept': 'application/json',
  };
}

/** Build the REST URL for a table — appends apikey as query param fallback */
function url(path: string): string {
  let reqUrl = `${SUPABASE_URL}/rest/v1/${path}`;
  // if (SUPABASE_ANON_KEY && !reqUrl.includes('apikey=')) {
  //   const sep = reqUrl.includes('?') ? '&' : '?';
  //   reqUrl += `${sep}apikey=${SUPABASE_ANON_KEY}`;
  // }
  return reqUrl;
}

// ─── Generic CRUD Operations ──────────────────────────────

export async function get<T>(table: string, opts?: { params?: Record<string, string>; [key: string]: any }): Promise<T> {
  let reqUrl = url(table);
  
  if (opts?.params) {
    const qs = new URLSearchParams(opts.params).toString();
    reqUrl += `?${qs}`;
  }

  console.log(`[db.get] ${reqUrl}`);
  const res = await fetch(reqUrl, { headers: getHeaders(), cache: 'no-store' });
  
  if (!res.ok) {
    const body = await res.text().catch(() => '');
    console.error(`[db.get] FAILED ${res.status}: ${body}`);
    throw new Error(`GET ${table} failed: ${res.status} ${res.statusText}`);
  }
  
  return res.json() as Promise<T>;
}

/** Get single row (returns array with one item, or first element) */
export async function getOne<T>(table: string, id: number | string, select: string = "*"): Promise<T> {
  const rows = await get<T[]>(`${table}?id=eq.${id}&select=${select}`);
  return Array.isArray(rows) && rows.length > 0 ? rows[0] : null as unknown as T;
}

/** Get multiple items with query params */
export async function getMany<T>(table: string, options?: {
  params?: Record<string, string>;
  limit?: number;
  offset?: number;
}): Promise<T[]> {
  const params = options?.params || {};
  if (options?.limit) params['limit'] = String(options.limit);
  if (options?.offset) params['offset'] = String(options.offset);
  
  return get<T[]>(table, params);
}

/** Create a new row */
export async function create<T>(table: string, data: Record<string, unknown>): Promise<T> {
  const res = await fetch(url(table), {
    method: 'POST',
    headers: { ...getHeaders(), 'Content-Type': 'application/json', 'Prefer': 'return=representation' },
    body: JSON.stringify(data),
  });

  if (!res.ok) {
    throw new Error(`POST ${table} failed: ${res.status} ${res.statusText}`);
  }

  let json: any;
  try {
    const text = await res.text();
    if (!text || text.trim() === '') {
      return data as unknown as T;
    }
    json = JSON.parse(text);
  } catch (err) {
    return data as unknown as T;
  }

  // PostgREST returns representations as a JSON array: [ {...} ]
  if (Array.isArray(json)) {
    if (json.length > 0) {
      return json[0] as T;
    }
    return data as unknown as T;
  }

  return json as T;
}

/** Update a row by ID */
export async function update<T>(table: string, id: number | string, data: Record<string, unknown>): Promise<T> {
  const res = await fetch(`${url(table)}?id=eq.${id}`, {
    method: 'PATCH',
    headers: { ...getHeaders(), 'Content-Type': 'application/json', 'Prefer': 'return=representation' },
    body: JSON.stringify(data),
  });

  if (!res.ok) {
    throw new Error(`PATCH ${table}/${id} failed: ${res.status} ${res.statusText}`);
  }

  // Supabase returns 204 with empty body — return data as-is
  if (res.status === 204 && res.body) {
    const contentLength = res.headers.get('content-length');
    if (contentLength === '0' || !contentLength) {
      return data as unknown as T;
    }
  }

  let json: any;
  try {
    const text = await res.text();
    if (!text || text.trim() === '') {
      // For PATCH/204, PostgREST sometimes returns empty body even without content-length header
      return data as unknown as T;
    }
    json = JSON.parse(text);
  } catch (err) {
    // JSON parse failed — fallback to input
    return data as unknown as T;
  }

  // PostgREST returns representations for insert/update/delete as a **JSON array** of objects: [ {...} ]
  if (Array.isArray(json)) {
    if (json.length > 0) {
      return json[0] as T; // Return first element from the representation array
    }
    return data as unknown as T;
  }

  return json as T;
}

/** Delete a row by ID */
export async function remove(table: string, id: number | string): Promise<void> {
  const res = await fetch(`${url(table)}?id=eq.${id}`, {
    method: 'DELETE',
    headers: getHeaders('application/json'),
  });

  if (!res.ok) {
    throw new Error(`DELETE ${table}/${id} failed: ${res.status} ${res.statusText}`);
  }
}

// ─── Type-safe helpers (SPEC.md §3.C) ──────────────────────

export async function getCategories() {
  return get<import('@/types/category').Category[]>('categories', {
    params: { 
      order: 'name.asc'
    },
  });
}

export async function getActiveCategories() {
  return get<import('@/types/category').Category[]>('categories', {
    params: { 
      is_active: 'eq.true',
      order: 'name.asc'
    },
  });
}

export async function getProducts(search?: string, categoryIds?: number[]) {
  const params: Record<string, string> = {};
  
  if (search?.trim()) {
    params['name'] = `ilike.*${search.trim()}*`;
  }
  
  if (categoryIds && categoryIds.length > 0) {
    // PostgREST 'in' filter: column.in.(val1,val2,...)
    const idsStr = categoryIds.map(id => String(id)).join(',');
    params['category_id'] = `in.(${idsStr})`;
  }

  // Use resource embedding for many-to-many relationship:
  // products -> product_mapping_addons -> product_addons
  return get<import('@/types/product').Product[]>('products', {
    params: {
      ...params,
      select: '*,product_mapping_addons(addon_id,product_addons(*)),categories(*)'
    },
  });
}

export async function getProductById(id: number | string) {
  const select = '*,product_mapping_addons(addon_id,product_addons(*)),categories(*)'
  return getOne<import('@/types/product').Product>('products', id, select);
}

/** Get products with their mapped addons via product_mapping_addons junction table */
export async function getProductsWithAddons(search?: string, categoryIds?: number[]) {
  const params: Record<string, string> = {};
  
  if (search?.trim()) {
    params['name'] = `ilike.*${search.trim()}*`;
  }
  
  if (categoryIds && categoryIds.length > 0) {
    // PostgREST 'in' filter: column.in.(val1,val2,...)
    const idsStr = categoryIds.map(id => String(id)).join(',');
    params['category_id'] = `in.(${idsStr})`;
  }

  // Use resource embedding for many-to-many relationship:
  // products -> product_mapping_addons -> product_addons
  return get<Record<string, unknown>[]>('products', { 
    params: {
      ...params,
      select: '*,product_mapping_addons(addon_id,product_addons(*)),categories(*)'
    }
  });
}

export async function createProduct(data: {
  name: string;
  category_id: number;
  cover_url?: string | null;
  base_price: number;
  cost: number;
  is_active: boolean;
}) {
  return create<import('@/types/product').Product>('products', data);
}

export async function updateProduct(id: number, data: {
  name?: string;
  category_id?: number;
  cover_url?: string | null;
  base_price?: number;
  cost?: number;
  is_active?: boolean;
}) {
  return update<import('@/types/product').Product>('products', id, data);
}

export async function getProductAddons(search?: string) {
  const params: Record<string, string> = { order: 'name.asc' };
  if (search?.trim()) {
    params.name = `ilike.*${search.trim()}*`;
  }
  return get<import('@/types/product_addon').ProductAddon[]>('product_addons', { params });
}

export async function getActiveProductAddons(search?: string) {
  const params: Record<string, string> = { 
    is_active: 'eq.true',
    order: 'name.asc' 
  };
  if (search?.trim()) {
    params.name = `ilike.*${search.trim()}*`;
  }
  return get<import('@/types/product_addon').ProductAddon[]>('product_addons', { params });
}

export async function getProductAddon(id: number) {
  return getOne<import('@/types/product_addon').ProductAddon>('product_addons', id);
}

export async function createProductAddon(data: { name: string; base_price: number; is_active?: boolean }) {
  return create<import('@/types/product_addon').ProductAddon>('product_addons', data);
}

export async function updateProductAddon(id: number, data: { name?: string; base_price?: number; is_active?: boolean }) {
  return update<import('@/types/product_addon').ProductAddon>('product_addons', id, data);
}

export async function deleteProductAddon(id: number) {
  return remove('product_addons', id);
}

/** Get product-addon mappings for a specific product */
export async function getProductAddonMappings(productId: number) {
  const rows = await get<Record<string, unknown>[]>('product_mapping_addons', {
    params: { product_id: `eq.${productId}` },
  });
  return (rows || []).map((row: any) => ({
    product_id: Number(row.product_id),
    addon_id: Number(row.addon_id),
  }));
}

/** Save/update product-addon mappings for a specific product */
export async function saveProductAddonMappings(productId: number, addonIds: number[]) {
  // First, delete existing mappings for this product
  const deleteUrl = `${SUPABASE_URL}/rest/v1/product_mapping_addons?product_id=eq.${productId}`;
  const delRes = await fetch(deleteUrl, {
    method: 'DELETE',
    headers: getHeaders('application/json'),
  });
  if (!delRes.ok) {
    throw new Error(`DELETE product_mapping_addons failed: ${delRes.status} ${delRes.statusText}`);
  }
  
  // Then insert new mappings
  if (addonIds.length > 0) {
    const mappings = addonIds.map(addonId => ({
      product_id: productId,
      addon_id: addonId,
    }));
    
    for (const mapping of mappings) {
      await create('product_mapping_addons', mapping);
    }
  }
}

export async function getChannels() {
  return get<import('@/types/channel').Channel[]>('channels', {
    params: { order: 'name.asc' },
  });
}

export async function getChannelById(id: number | string) {
  return getOne<import('@/types/channel').Channel>('channels', id);
}

// ─── Channel Products ──────────────────────────────────────

export async function getChannelProducts(channelId: number) {
  return get<import('@/types/channel_product').ChannelProduct[]>('channel_products', {
    params: {
      channel_id: `eq.${channelId}`,
      select: '*,products(*,categories(*)),channel_product_addons(addon_id,price,product_addons(*))',
      order: 'created_at.desc'
    }
  });
}

export async function getChannelProductById(id: number) {
  return getOne<import('@/types/channel_product').ChannelProduct>(
    'channel_products',
    id,
    '*,products(*,categories(*),product_mapping_addons(addon_id,product_addons(*))),channel_product_addons(addon_id,price,product_addons(*))',
  );
}

export async function createChannelProduct(data: {
  channel_id: number;
  product_id: number;
  price: number;
  cost: number;
  is_active?: boolean;
}) {
  return create<import('@/types/channel_product').ChannelProduct>('channel_products', data);
}

export async function saveChannelProductAddonMappings(
  channelProductId: number,
  addons: { addon_id: number; price: number }[]
) {
  const deleteUrl = `${SUPABASE_URL}/rest/v1/channel_product_addons?channel_product_id=eq.${channelProductId}`;
  const delRes = await fetch(deleteUrl, {
    method: 'DELETE',
    headers: getHeaders('application/json'),
  });
  if (!delRes.ok) {
    throw new Error(`DELETE channel_product_addons failed: ${delRes.status}`);
  }
  
  if (addons.length > 0) {
    for (const addon of addons) {
      await create('channel_product_addons', {
        channel_product_id: channelProductId,
        addon_id: addon.addon_id,
        price: addon.price,
      });
    }
  }
}

export async function updateChannelProduct(id: number, data: {
  price?: number;
  cost?: number;
  is_active?: boolean;
  updated_at?: string;
}) {
  return update<import('@/types/channel_product').ChannelProduct>('channel_products', id, data);
}

// ─── Telegram Settings ────────────────────────────────────

/** Read the (single) Telegram config row, or null if not set. */
export async function getTelegramSettings(): Promise<import('@/types/telegram').TelegramSettings | null> {
  const rows = await get<import('@/types/telegram').TelegramSettings[]>('telegram_settings', {
    params: { limit: '1', order: 'id.asc' },
  });
  return rows && rows.length > 0 ? rows[0] : null;
}

/** Create a new Telegram config row. */
export async function createTelegramSettings(
  data: import('@/types/telegram').TelegramSettingsInput,
) {
  return create<import('@/types/telegram').TelegramSettings>('telegram_settings', {
    bot_token: data.bot_token,
    chat_id: data.chat_id ?? null,
    is_active: data.is_active ?? true,
  });
}

/** Update an existing Telegram config row by id. */
export async function updateTelegramSettings(
  id: number,
  data: Partial<import('@/types/telegram').TelegramSettingsInput>,
) {
  return update<import('@/types/telegram').TelegramSettings>('telegram_settings', id, data);
}

/** Delete a Telegram config row by id. */
export async function deleteTelegramSettings(id: number) {
  return remove('telegram_settings', id);
}

// ─── Receipts (Header + Items) ────────────────────────

export async function getReceipts(options?: { channel_code?: string; search?: string; bill_date?: string }) {
  const params: Record<string, string> = { order: 'created_at.desc' };
  if (options?.channel_code) params.channel_code = `eq.${options.channel_code}`;
  if (options?.bill_date) params.bill_date = `eq.${options.bill_date}`;
  if (options?.search) {
    params.or = `(receipt_no.ilike.*${options.search}*,customer_name.ilike.*${options.search}*)`;
  }
  return get<import('@/types/receipt').Receipt[]>('receipts', { params });
}

export async function getReceipt(id: number) {
  return getOne<import('@/types/receipt').Receipt>('receipts', id);
}

export async function getReceiptItems(receiptId: number) {
  return get<import('@/types/receipt').ReceiptItem[]>('receipt_items', {
    params: {
      receipt_id: `eq.${receiptId}`,
      order: 'id.asc',
    },
  });
}

export async function searchReceipts(query: string) {
  return getReceipts({ search: query });
}

export async function updateReceiptStatus(id: number, status: 'active' | 'cancelled') {
  return update<import('@/types/receipt').Receipt>('receipts', id, { status, updated_at: new Date().toISOString() });
}

// ─── Dashboard Views ─────────────────────────────────────
// Views are security_invoker (RLS-aware) — see migration
// 20260717000001_dashboard_views_rls_and_best_sellers.sql.
// Access role `authenticated` is granted explicitly.

/**
 * Per-day, per-channel summary.
 * @param date single day as 'YYYY-MM-DD' (defaults to today, UTC)
 */
export async function getDailySummary(
  date?: string,
): Promise<import('@/types/dashboard').DailySummaryRow[]> {
  const targetDate = date || new Date().toISOString().split('T')[0];
  return get<import('@/types/dashboard').DailySummaryRow[]>('view_daily_summary', {
    params: { bill_date: `eq.${targetDate}`, order: 'channel_code.asc' },
  });
}

/**
 * Per-day, per-channel summary across an inclusive date range.
 * @param range { dateFrom, dateTo } as 'YYYY-MM-DD'
 */
export async function getDailySummaryRange(range: {
  dateFrom: string;
  dateTo: string;
}): Promise<import('@/types/dashboard').DailySummaryRow[]> {
  if (!range?.dateFrom || !range?.dateTo) return [];
  return get<import('@/types/dashboard').DailySummaryRow[]>('view_daily_summary', {
    params: {
      bill_date: `gte.${range.dateFrom}`,
      and: `(bill_date.lte.${range.dateTo})`,
      order: 'bill_date.asc,channel_code.asc',
    },
  });
}

/**
 * Per receipt-item sales detail.
 * Pass a single date or an inclusive date range (both optional).
 */
export async function getProductSalesLines(
  range?: string | { dateFrom: string; dateTo: string },
): Promise<import('@/types/dashboard').SalesProductLine[]> {
  const params: Record<string, string> = { order: 'bill_date.desc,receipt_no.desc' };
  if (range) {
    if (typeof range === 'string') {
      params.bill_date = `eq.${range}`;
    } else {
      params.bill_date = `gte.${range.dateFrom}`;
      params.and = `(bill_date.lte.${range.dateTo})`;
    }
  }
  return get<import('@/types/dashboard').SalesProductLine[]>('view_sales_product_lines', {
    params,
  });
}

/**
 * Best-sellers / top products ranking (view_top_products).
 * Aggregates all active sales per product; client sorts/limits.
 * @param range optional { limit } (filtering by date is not applied
 *   server-side here; view groups by product_name across all time —
 *   keep endpoint stable & cheap).
 */
export async function getTopProducts(
  range?: { dateFrom?: string; dateTo?: string; limit?: number },
): Promise<import('@/types/dashboard').TopProductRow[]> {
  const params: Record<string, string> = {
    order: 'total_quantity.desc,total_revenue.desc',
  };
  if (range?.limit) params.limit = String(range.limit);
  return get<import('@/types/dashboard').TopProductRow[]>('view_top_products', { params });
}

/**
 * Best-selling add-ons / product options (view_top_addons).
 * Unnests receipt_items.product_options and ranks by total quantity
 * sold — all-time across active receipts. Optional `limit` for top-N.
 */
export async function getTopAddons(
  limit?: number,
): Promise<import('@/types/dashboard').TopAddonRow[]> {
  const params: Record<string, string> = {
    order: 'total_quantity.desc,total_revenue.desc',
  };
  if (limit) params.limit = String(limit);
  return get<import('@/types/dashboard').TopAddonRow[]>('view_top_addons', { params });
}

/**
 * Monthly sales/cost/profit trend (view_monthly_sales_profit).
 * @param months number of most-recent months to fetch (default 12)
 */
export async function getMonthlySalesProfit(
  months = 12,
): Promise<import('@/types/dashboard').MonthlySalesRow[]> {
  return get<import('@/types/dashboard').MonthlySalesRow[]>('view_monthly_sales_profit', {
    params: { order: 'bill_month.asc', limit: String(months) },
  });
}

// ─── Receipt Number ─────────────────────────────────────

export async function getNextReceiptNo(channelCode: string, billDate: string): Promise<string> {
  console.log(`[getNextReceiptNo] called with channelCode=${channelCode}, billDate=${billDate}`);
  try {
    const receipts = await get<import('@/types/receipt').Receipt[]>('receipts', {
      params: {
        channel_code: `eq.${channelCode}`,
        bill_date: `eq.${billDate}`,
        order: 'receipt_no.desc',
        limit: '1',
        select: 'receipt_no',
      },
    });

    console.log(`[getNextReceiptNo] query result:`, receipts);

    if (!receipts || receipts.length === 0) {
      const dateCompact = billDate.replace(/-/g, '');
      return `${channelCode}${dateCompact}0001`;
    }

    const lastNo = receipts[0].receipt_no;
    const lastSeq = parseInt(lastNo.slice(-4), 10);
    const nextSeq = String(lastSeq + 1).padStart(4, '0');
    const prefix = lastNo.slice(0, -4);
    return `${prefix}${nextSeq}`;
  } catch (err) {
    console.error('[getNextReceiptNo] Error:', err);
    const dateCompact = billDate.replace(/-/g, '');
    return `${channelCode}${dateCompact}0001`;
  }
}

// ─── Create Receipt (Header + Items) ───────────────────

interface CreateReceiptItemInput {
  product_id: number | null;
  product_name: string;
  product_price: number;
  product_cost: number;
  product_options: { id: number; name: string; price: number }[];
  quantity: number;
  line_total: number;
  note?: string | null;
}

export interface CreateReceiptInput {
  channel_id: number;
  channel_code: string;
  receipt_no: string;
  customer_name?: string;
  bill_date: string;
  total_quantity: number;
  subtotal: number;
  discount_total: number;
  grand_total: number;
  discounts: { type: string; price?: number; percentage?: number; code?: string }[];
  note?: string | null;
  items: CreateReceiptItemInput[];
}

export async function createReceipt(
  input: CreateReceiptInput,
): Promise<{ success: boolean; receipt: import('@/types/receipt').Receipt }> {
  // 1. Create receipt header
  const receipt = await create<import('@/types/receipt').Receipt>('receipts', {
    channel_id: input.channel_id,
    channel_code: input.channel_code,
    receipt_no: input.receipt_no,
    customer_name: input.customer_name || null,
    bill_date: input.bill_date,
    total_quantity: input.total_quantity,
    subtotal: input.subtotal,
    discount_total: input.discount_total,
    grand_total: input.grand_total,
    discounts: input.discounts,
    status: 'active',
    note: input.note || null,
  });

  // 2. Create receipt items
  for (const item of input.items) {
    await create('receipt_items', {
      receipt_id: receipt.id,
      product_id: item.product_id,
      product_name: item.product_name,
      product_price: item.product_price,
      product_cost: item.product_cost,
      product_options: item.product_options,
      quantity: item.quantity,
      line_total: item.line_total,
      note: item.note || null,
    });
  }

  return { success: true, receipt };
}

// ─── Claims (เคลมสินค้า — หมดอายุ / เสียหาย / สูญหาย) ──

export async function getClaims(options?: { reason?: import('@/types/claim').ClaimReason; search?: string; claim_date?: string }) {
  const params: Record<string, string> = { order: 'created_at.desc' };
  if (options?.reason) params.reason = `eq.${options.reason}`;
  if (options?.claim_date) params.claim_date = `eq.${options.claim_date}`;
  if (options?.search) {
    params.or = `(claim_no.ilike.*${options.search}*,note.ilike.*${options.search}*)`;
  }
  return get<import('@/types/claim').Claim[]>('claims', { params });
}

export async function getClaim(id: number) {
  return getOne<import('@/types/claim').Claim>('claims', id);
}

export async function getClaimItems(claimId: number) {
  return get<import('@/types/claim').ClaimItem[]>('claim_items', {
    params: {
      claim_id: `eq.${claimId}`,
      order: 'id.asc',
    },
  });
}

export async function searchClaims(query: string) {
  return getClaims({ search: query });
}

export async function updateClaimStatus(id: number, status: 'active' | 'cancelled') {
  return update<import('@/types/claim').Claim>('claims', id, { status, updated_at: new Date().toISOString() });
}

// ─── Claim Number ─────────────────────────────────────
// Format: CLM + YYYYMMDD + running seq (reset รันใหม่ทุกวัน)
export async function getNextClaimNo(claimDate: string): Promise<string> {
  console.log(`[getNextClaimNo] called with claimDate=${claimDate}`);
  try {
    const claims = await get<import('@/types/claim').Claim[]>('claims', {
      params: {
        claim_date: `eq.${claimDate}`,
        order: 'claim_no.desc',
        limit: '1',
        select: 'claim_no',
      },
    });

    console.log(`[getNextClaimNo] query result:`, claims);

    if (!claims || claims.length === 0) {
      const dateCompact = claimDate.replace(/-/g, '');
      return `CLM${dateCompact}0001`;
    }

    const lastNo = claims[0].claim_no;
    const lastSeq = parseInt(lastNo.slice(-4), 10);
    const nextSeq = String(lastSeq + 1).padStart(4, '0');
    const prefix = lastNo.slice(0, -4);
    return `${prefix}${nextSeq}`;
  } catch (err) {
    console.error('[getNextClaimNo] Error:', err);
    const dateCompact = claimDate.replace(/-/g, '');
    return `CLM${dateCompact}0001`;
  }
}

// ─── Create Claim (Header + Items) ───────────────────

interface CreateClaimItemInput {
  product_id: number | null;
  product_name: string;
  unit_cost: number;
  quantity: number;
  line_cost: number;
  note?: string | null;
}

export interface CreateClaimInput {
  claim_no: string;
  claim_date: string;
  reason: import('@/types/claim').ClaimReason;
  note?: string | null;
  total_quantity: number;
  total_cost: number;
  items: CreateClaimItemInput[];
}

export async function createClaim(
  input: CreateClaimInput,
): Promise<{ success: boolean; claim: import('@/types/claim').Claim }> {
  // 1. Create claim header
  const claim = await create<import('@/types/claim').Claim>('claims', {
    claim_no: input.claim_no,
    claim_date: input.claim_date,
    reason: input.reason,
    total_quantity: input.total_quantity,
    total_cost: input.total_cost,
    status: 'active',
    note: input.note || null,
  });

  // 2. Create claim items
  for (const item of input.items) {
    await create('claim_items', {
      claim_id: claim.id,
      product_id: item.product_id,
      product_name: item.product_name,
      unit_cost: item.unit_cost,
      quantity: item.quantity,
      line_cost: item.line_cost,
      note: item.note || null,
    });
  }

  return { success: true, claim };
}

// ─── Claim Loss (สำหรับ Dashboard) ───────────────────
/**
 * ดึงต้นทุนของเสียรายวันในช่วง [dateFrom, dateTo] (status='active')
 * รวมฝั่ง client ให้ได้ยอดรวมต้นทุนของเสียของช่วงเวลานั้น
 */
export async function getClaimLossRange(
  dateFrom: string,
  dateTo: string,
): Promise<import('@/types/claim').ClaimLossRow[]> {
  if (!dateFrom || !dateTo) return [];
  return get<import('@/types/claim').ClaimLossRow[]>('claims', {
    params: {
      claim_date: `gte.${dateFrom}`,
      and: `(claim_date.lte.${dateTo})`,
      status: 'eq.active',
      select: 'claim_date,total_cost',
      order: 'claim_date.asc',
    },
  });
}

// ─── Disbursements (เบิกเงิน) ──────────────────────────

export async function getDisbursements(options?: {
  status?: import('@/types/disbursement').DisbursementStatus;
  search?: string;
  withdraw_date?: string;
}) {
  const params: Record<string, string> = { order: 'created_at.desc' };
  if (options?.status) params.status = `eq.${options.status}`;
  if (options?.withdraw_date) params.withdraw_date = `eq.${options.withdraw_date}`;
  if (options?.search) {
    params.or = `(withdraw_no.ilike.*${options.search}*,description.ilike.*${options.search}*,note.ilike.*${options.search}*)`;
  }
  return get<import('@/types/disbursement').Disbursement[]>('disbursements', { params });
}

export async function getDisbursement(id: number) {
  return getOne<import('@/types/disbursement').Disbursement>('disbursements', id);
}

export async function searchDisbursements(query: string) {
  return getDisbursements({ search: query });
}

export async function updateDisbursementStatus(id: number, status: 'paid' | 'unpaid') {
  return update<import('@/types/disbursement').Disbursement>('disbursements', id, {
    status,
    updated_at: new Date().toISOString(),
  });
}

export async function updateDisbursement(
  id: number,
  data: {
    description?: string;
    amount?: number;
    withdraw_date?: string;
    status?: 'paid' | 'unpaid';
    note?: string | null;
  },
) {
  return update<import('@/types/disbursement').Disbursement>('disbursements', id, {
    ...data,
    updated_at: new Date().toISOString(),
  });
}

// ─── Withdraw Number ─────────────────────────────────
// Format: WD + YYYYMMDD + running seq (reset รันใหม่ทุกวัน)
export async function getNextWithdrawNo(withdrawDate: string): Promise<string> {
  console.log(`[getNextWithdrawNo] called with withdrawDate=${withdrawDate}`);
  try {
    const rows = await get<import('@/types/disbursement').Disbursement[]>('disbursements', {
      params: {
        withdraw_date: `eq.${withdrawDate}`,
        order: 'withdraw_no.desc',
        limit: '1',
        select: 'withdraw_no',
      },
    });

    console.log(`[getNextWithdrawNo] query result:`, rows);

    if (!rows || rows.length === 0) {
      const dateCompact = withdrawDate.replace(/-/g, '');
      return `WD${dateCompact}0001`;
    }

    const lastNo = rows[0].withdraw_no;
    const lastSeq = parseInt(lastNo.slice(-4), 10);
    const nextSeq = String(lastSeq + 1).padStart(4, '0');
    const prefix = lastNo.slice(0, -4);
    return `${prefix}${nextSeq}`;
  } catch (err) {
    console.error('[getNextWithdrawNo] Error:', err);
    const dateCompact = withdrawDate.replace(/-/g, '');
    return `WD${dateCompact}0001`;
  }
}

// ─── Create Disbursement ─────────────────────────────

export async function createDisbursement(
  input: import('@/types/disbursement').CreateDisbursementInput,
): Promise<{ success: boolean; disbursement: import('@/types/disbursement').Disbursement }> {
  const disbursement = await create<import('@/types/disbursement').Disbursement>('disbursements', {
    withdraw_no: input.withdraw_no,
    withdraw_date: input.withdraw_date,
    description: input.description,
    amount: input.amount,
    status: input.status,
    note: input.note || null,
  });

  return { success: true, disbursement };
}

// ─── Ingredient Purchases (บันทึกการซื้อวัตถุดิบ) ──────

export async function getIngredientPurchases(options?: {
  search?: string;
  ingredient_id?: number;
  purchase_date_from?: string;
  purchase_date_to?: string;
}) {
  const params: Record<string, string> = { order: 'purchase_date.desc,id.desc' };
  if (options?.ingredient_id) params.ingredient_id = `eq.${options.ingredient_id}`;
  if (options?.purchase_date_from) {
    params.purchase_date = `gte.${options.purchase_date_from}`;
    if (options?.purchase_date_to) {
      params.and = `(purchase_date.lte.${options.purchase_date_to})`;
    }
  } else if (options?.purchase_date_to) {
    params.purchase_date = `lte.${options.purchase_date_to}`;
  }
  return get<import('@/types/ingredient_purchase').IngredientPurchase[]>('ingredient_purchases', { params });
}

export async function createIngredientPurchase(
  input: import('@/types/ingredient_purchase').CreateIngredientPurchaseInput,
): Promise<import('@/types/ingredient_purchase').IngredientPurchase> {
  return create<import('@/types/ingredient_purchase').IngredientPurchase>('ingredient_purchases', {
    ingredient_id: input.ingredient_id,
    purchase_date: input.purchase_date,
    quantity: input.quantity,
    unit: input.unit || 'ชิ้น',
    amount: input.amount,
    note: input.note || null,
  });
}

export async function updateIngredientPurchase(
  id: number,
  data: import('@/types/ingredient_purchase').UpdateIngredientPurchaseInput & { updated_at?: string },
): Promise<import('@/types/ingredient_purchase').IngredientPurchase> {
  return update<import('@/types/ingredient_purchase').IngredientPurchase>('ingredient_purchases', id, {
    ...data,
    updated_at: new Date().toISOString(),
  });
}

export async function deleteIngredientPurchase(id: number): Promise<void> {
  return remove('ingredient_purchases', id);
}

/** Get total ingredient purchase amount within a date range (for dashboard cost section) */
export async function getIngredientPurchaseTotal(dateFrom: string, dateTo: string): Promise<{ total_amount: number }> {
  if (!dateFrom || !dateTo) return { total_amount: 0 };
  const rows = await get<import('@/types/ingredient_purchase').IngredientPurchase[]>('ingredient_purchases', {
    params: {
      purchase_date: `gte.${dateFrom}`,
      and: `(purchase_date.lte.${dateTo})`,
    },
  });
  const total = (rows || []).reduce((sum, r) => sum + Number(r.amount || 0), 0);
  return { total_amount: total };
}

/** Get ingredient purchase amount per day within a date range (for dashboard trend chart) */
export async function getIngredientPurchaseDaily(
  dateFrom: string,
  dateTo: string,
): Promise<{ purchase_date: string; total_amount: number }[]> {
  if (!dateFrom || !dateTo) return [];
  const rows = await get<import('@/types/ingredient_purchase').IngredientPurchase[]>('ingredient_purchases', {
    params: {
      purchase_date: `gte.${dateFrom}`,
      and: `(purchase_date.lte.${dateTo})`,
      select: 'purchase_date,amount',
      order: 'purchase_date.asc',
    },
  });
  // Group by date on client-side (PostgREST can't GROUP BY on simple API)
  const byDate = new Map<string, number>();
  for (const r of rows || []) {
    const d = String(r.purchase_date).slice(0, 10);
    byDate.set(d, (byDate.get(d) || 0) + Number(r.amount || 0));
  }
  return Array.from(byDate.entries())
    .map(([purchase_date, total_amount]) => ({ purchase_date, total_amount }))
    .sort((a, b) => a.purchase_date.localeCompare(b.purchase_date));
}

/** Get all ingredients */
export async function getIngredients(): Promise<any[]> {
  return get<any[]>('ingredients', { params: { order: 'name.asc' } });
}

/** Create a new ingredient */
export async function createIngredient(input: {
  name: string;
  default_unit?: string | null;
  description?: string | null;
}): Promise<any> {
  return create<any>('ingredients', {
    name: input.name,
    default_unit: input.default_unit || null,
    description: input.description || null,
  });
}

/** Update an ingredient */
export async function updateIngredient(id: number, data: {
  name?: string;
  default_unit?: string | null;
  description?: string | null;
}): Promise<any> {
  return update<any>('ingredients', id, {
    ...data,
    updated_at: new Date().toISOString(),
  });
}
