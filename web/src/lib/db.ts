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

export async function getReceipts(options?: { channel_code?: string }) {
  const params: Record<string, string> = options?.channel_code 
    ? { channel_code: `eq.${options.channel_code}`, order: 'bill_date.desc' }
    : { order: 'bill_date.desc' };
  return get<import('@/types/receipt').Receipt[]>('receipts', { params });
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
