# 📘 SUPABASE — Architecture & Issues Log (From Home Sandwich)

> สรุปสถาปัตยกรรม, การเชื่อมต่อ, ปัญหาที่พบ และวิธีแก้ไข ที่เกี่ยวข้องกับ **Supabase / PostgREST** ในโครงการ From Home Sandwich  
> อัปเดตล่าสุด: 2026-07-07

---

## 1. สถาปัตยกรรมหลัก (Architecture)

### Database Access Pattern
```
┌──────────────┐     fetch + headers      ┌─────────────────┐
│   Next.js    │ ──────────────────────→  │  Supabase        │
│  Client/     │   { apiKey, JWT }        │  PostgreSQL      │
│  Server      │                          │                  │
│  Components  │ ←── JSON response ───────│  PostgREST API   │
└──────────────┘    (array/object)       └─────────────────┘
```

| รายละเอียด | ค่าที่ใช้ |
|-----------|----------|
| **Database** | Supabase PostgreSQL |
| **API Access** | PostgREST Direct REST (`/rest/v1/<table>`) |
| **Client Library** | Native `fetch` — ไม่มี heavy client SDK |
| **Authentication** | Cookie-based JWT (`sb-*` cookie) + API Key header |
| **Connection Mode** | HTTP REST (ไม่ใช้ WebSocket/Realtime เนื่องจาก Dev machine ไม่มี IPv6) |

### Endpoint Pattern
```
GET  https://<supabase_url>/rest/v1/<table>?<params>
POST https://<supabase_url>/rest/v1/<table>
PATCH https://<supabase_url>/rest/v1/<table>?id=eq.<id>
DELETE https://<supabase_url>/rest/v1/<table>?id=eq.<id>
```

### Headers ที่ส่งไปกับทุก request
| Header | ค่าที่มา |
|--------|----------|
| `Authorization` | `Bearer <JWT>` จาก cookie |
| `apikey` | `NEXT_PUBLIC_SUPABASE_ANON_KEY` หรือ `SUPABASE_SECRET_KEY` (server) |
| `Content-Type` | `application/json` |
| `Accept` | `application/json` |

---

## 2. Cookie & JWT Flow

### รูปแบบ cookie ที่รองรับ
| รูปแบบค่าใน cookie | ตัวอย่าง | การประมวลผล |
|-------------------|---------|-------------|
| **Plain JWT string** | `eyJhbGci...` | ใช้ตรงๆ เป็น token |
| **base64-encoded JSON object** | `base64-eyJhY2Nlc3NfdG9rZW4iOiJleUpo...` | strip prefix → base64 decode → parse JSON → extract `.access_token` |
| **Raw JSON string** | `'{"access_token":"eyJ...", "token_type":"bearer"}'` | parse JSON → extract `.access_token` |

### ขั้นตอนการ decode ใน `getAuthToken()` (`web/src/lib/db.ts`)
```ts
1. อ่าน cookie ที่ขึ้นต้นด้วย "sb-"
2. แยกค่าหลัง "=" → rawValue
3. ถ้า rawValue.startsWith("base64-"):
   ├── strip prefix "base64-"
   ├── แทนที่ URL-safe chars: "-" → "+", "_" → "/"
   ├── atob() → decoded JSON string
   └── JSON.parse(decoded).access_token
4. Fallback: JSON.parse(decodeURIComponent(rawValue)).access_token
5. ถ้า parse ไม่ผ่าน → ใช้ rawValue เป็น token ตรงๆ
```

---

## 3. ปัญหาที่พบ & วิธีแก้ไข

### 🔵 Issue #5: PATCH returns 204 with empty body — `res.json()` throw error

| วันที่พบ | 2026-07-08 |
|----------|------------|
| ไฟล์ที่เกี่ยวข้อง | `web/src/lib/db.ts` (`update()`) |

**อาการ:** เมื่ออัปเดตข้อมูลสำเร็จ PostgREST คืนค่า **status `204 No Content` พร้อม empty body** (content-length: 0) แต่ `res.json()` โยน error เพราะ empty string ≠ valid JSON

**วิธีแก้:** เพิ่มการตรวจสอบ status 204 + content-length ก่อน parse เช่นเดียวกับ POST:
```ts
export async function update<T>(table, id, data): Promise<T> {
  const res = await fetch(url + '?id=eq.' + id, { method: 'PATCH', ... });
  if (!res.ok) throw new Error(...);
  
  // 204 with empty body → ใช้ input data ทันที
  if (res.status === 204 && res.body) {
    const cl = res.headers.get('content-length');
    if (cl === '0' || !cl) return data as unknown as T;
  }
  
  try { return res.json(); } catch { return data; }
}
```

---

### 🔴 Issue #1: Create返回 201 with empty body → `res.json()` throw error

| วันที่พบ | 2026-07-07 |
|----------|------------|
| ไฟล์ที่เกี่ยวข้อง | `web/src/lib/db.ts` (`create()`) |

**อาการ:** เมื่อสร้างข้อมูลสำเร็จ PostgREST คืนค่า **status `201` พร้อม empty body** (content-length: 0) แต่ `create()` เรียก `res.json()` ซึ่งโยน error เพราะ empty string ≠ valid JSON → `"Unexpected end of JSON input"`

**วิธีแก้:** เพิ่มการตรวจสอบก่อน parse
```ts
if (res.status === 201 && res.body) {
  const contentLength = res.headers.get('content-length');
  if (contentLength === '0' || !contentLength) {
    return data as unknown as T;  // ใช้ input data ทันที
  }
}

try {
  return res.json() as Promise<T>;
} catch (err) {
  return data as unknown as T;  // JSON parse ล้มเหลว → fallback
}
```

---

### 🔴 Issue #2: `ToastViewport` must be used within `ToastProvider`

| วันที่พบ | 2026-07-07 |
|----------|------------|
| ไฟล์ที่เกี่ยวข้อง | `web/src/lib/toast.tsx`, `web/app/providers.tsx` |

**อาการ:** ใช้ custom `ToastProvider` ใน project แต่ไม่ได้ render `<Toast.Provider>` จาก Radix → `<Toaster>` ที่ใช้ `<Toast.Viewport>` หา provider ไม่เจอ

**วิธีแก้:** ล้อม `children` ด้วย `<Toast.Provider>` จาก Radix ใน custom ToastProvider:
```tsx
return (
  <Toast.Provider swipeDirection="right">           {/* ← เพิ่มนี้ */}
    <ToastContext.Provider value={{ toast, dismiss, state }}>
      {children}
    </ToastContext.Provider>
  </Toast.Provider>
);
```

---

### 🔴 Issue #3: Base64-prefixed cookie ไม่ถูก decode

| วันที่พบ | 2026-07-07 |
|----------|------------|
| ไฟล์ที่เกี่ยวข้อง | `web/src/lib/db.ts` (`getAuthToken()`) |

**อาการ:** Cookie ที่เป็น JSON object ถูก encode เป็น base64 และเติม prefix `"base64-"` แต่ระบบเดิม treat เป็น plain string → ใช้ทั้ง string ที่ยังไม่ได้ decode เป็น token

**วิธีแก้:** เพิ่ม branch ใน `getAuthToken()` สำหรับ cookie ที่ขึ้นต้นด้วย `"base64-"`:
```ts
if (rawValue.startsWith('base64-')) {
  const b64Str = rawValue.slice(7);
  const decoded = atob(b64Str.replace(/-/g, '+').replace(/_/g, '/'));
  const parsed = JSON.parse(decoded);
  if (parsed && typeof parsed === 'object' && parsed.access_token) {
    return parsed.access_token;
  }
}
```

---

### 🔴 Issue #4: Cookie parse fallback ไม่สมบูรณ์

| วันที่พบ | 2026-07-07 |
|----------|------------|
| ไฟล์ที่เกี่ยวข้อง | `web/src/lib/db.ts` (`getAuthToken()`) |

**อาการ:** เมื่อ cookie เป็น JSON object แต่ไม่มี field `access_token` → return ค่าเดิม (stringified JSON แทน token) หรือเมื่อ URI-encoded ไม่ถูกต้อง

**วิธีแก้:** เพิ่ม try-catch แยก และ log ด้วย `console.error`:
```ts
try {
  const parsed = JSON.parse(decodeURIComponent(rawValue));
  if (parsed && typeof parsed === 'object' && parsed.access_token) {
    return parsed.access_token;
  }
} catch (err) {
  console.error('[db] Failed to parse cookie as JSON:', err);
}
```

---

## 4. Component Tree สำหรับ Supabase / Toast

```
<Providers>                           ← web/app/providers.tsx
└─ QueryClientProvider                ← @tanstack/react-query
   └─ ToastProvider                    ← web/src/lib/toast.tsx (custom wrapper)
      ├─ <Toast.Provider />           ← Radix UI primitive (มีอยู่ใน lib)
      │  └─ <AuthContext.Provider>    ← web/contexts/AuthContext.tsx
      │     ├─ children               ← routing pages
      │     └─ Toaster                ← render active toasts
      │        └─ <Toast.Viewport>    ← Radix viewport (fixed top-right)
      └─ ReactQueryDevtools
```

---

## 5. Environment Variables ที่ใช้

| Variable | ความหมาย | ค่า default |
|----------|----------|-------------|
| `NEXT_PUBLIC_SUPABASE_URL` | URL ของ Supabase project | `''` |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Anon API key สำหรับ client | `''` |
| `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY` | fallback anon key | `''` |
| `SUPABASE_SECRET_KEY` | Service role key สำหรับ server | `''` |
| `SUPABASE_SERVICE_KEY` | fallback service key | `''` |

---

## 6. สรุป CRUD Flow (PostgREST Direct)

### GET — ดึงข้อมูล
```
GET /rest/v1/<table>?<params>
→ res.ok (2xx) → res.json() → return T
→ !res.ok → throw Error
```

### POST — สร้างข้อมูล (create)
```
POST /rest/v1/<table>
Body: JSON.stringify(data)
→ res.status === 201 + content-length=0 → return data (ไม่ต้อง parse)
→ res.status === 201 + มี body → res.json() → return T
→ res.json() throw → fallback return data
→ !res.ok → throw Error
```

### PATCH — อัปเดตข้อมูล (Update a row)
```
PATCH /rest/v1/<table>?id=eq.<id>
Body: JSON.stringify(data)
→ res.status === 204 + content-length=0 → return data (ไม่ต้อง parse)
→ res.json() → return T
→ !res.ok → throw Error
```

### DELETE — ลบข้อมูล
```
DELETE /rest/v1/<table>?id=eq.<id>
→ !res.ok → throw Error
→ return void
```

---

## 7. ตารางที่ใช้ (จาก SPEC.md)

| Table | Description | Key Fields |
|-------|-------------|------------|
| `categories` | หมวดหมู่สินค้า | name, is_active |
| `product_options` | ตัวเลือกสินค้า | — |
| `products` | สินค้าหลัก | category_id, channel_id |
| `channels` | Sale channels (CONDO, LINEMAN...) | code, name |
| `receipts` | ใบเสร็จ | bill_date, channel_code |

---

*เอกสารนี้รวมข้อมูลจาก: SPEC.md, Solution.md, DESIGN.md และปัญหาจริงที่พบระหว่างการพัฒนาโครงการ From Home Sandwich*
