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

  const res = await fetch(reqUrl, { headers: getHeaders(), cache: 'no-store' });
  
  if (!res.ok) {
    throw new Error(`GET ${table} failed: ${res.status} ${res.statusText}`);
  }
  
  return res.json() as Promise<T>;
}

/** Get single row (returns array with one item, or first element) */
export async function getOne<T>(table: string, id: number | string): Promise<T> {
  const rows = await get<T[]>(`${table}?id=eq.${id}`);
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
    headers: { ...getHeaders(), 'Content-Type': 'application/json' },
    body: JSON.stringify(data),
  });

  if (!res.ok) {
    throw new Error(`POST ${table} failed: ${res.status} ${res.statusText}`);
  }

  return res.json() as Promise<T>;
}

/** Update a row by ID */
export async function update<T>(table: string, id: number | string, data: Record<string, unknown>): Promise<T> {
  const res = await fetch(`${url(table)}?id=eq.${id}`, {
    method: 'PATCH',
    headers: { ...getHeaders(), 'Content-Type': 'application/json' },
    body: JSON.stringify(data),
  });

  if (!res.ok) {
    throw new Error(`PATCH ${table}/${id} failed: ${res.status} ${res.statusText}`);
  }

  return res.json() as Promise<T>;
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
    params: { order: 'name.asc' },
  });
}

export async function getProducts(params?: Record<string, string>) {
  return get<import('@/types/product').Product[]>('products', params);
}

export async function getProductOptions() {
  return get<import('@/types/product').ProductOption[]>('product_options');
}

export async function getChannels() {
  return get<import('@/types/channel').Channel[]>('channels', {
    params: { order: 'name.asc' },
  });
}

export async function getReceipts(options?: { channel_code?: string }) {
  const params: Record<string, string> = options?.channel_code 
    ? { channel_code: `eq.${options.channel_code}`, order: 'bill_date.desc' }
    : { order: 'bill_date.desc' };
  return get<import('@/types/receipt').Receipt[]>('receipts', { params });
}

export async function createReceipt(data: Record<string, unknown>) {
  return create<import('@/types/receipt').Receipt>('receipts', data);
}
