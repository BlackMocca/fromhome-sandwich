# Plan: Receipt Creation from Draft Order Page

> แผนงานสำหรับสร้างใบเสร็จจากหน้า `/management/orders/draft/`
> รวมถึง: DB Migration, Server Actions, Receipt No Auto-Generate, Form Updates

---

## Current State (ปัจจุบัน)

| Component | Status |
|-----------|--------|
| DB tables `receipts` / `receipt_items` | ❌ ยังไม่มี migration |
| `Receipt` type (types/receipt.ts) | ❌ schema เก่า (`total_amount`, ไม่มี snapshot fields) |
| `server-actions.ts` | ❌ schema เก่า, ไม่ได้เรียกจาก UI |
| `step-invoice-form.tsx` | ❌ `handleSubmit` แค่ `console.log` + `clearOrder()` |
| `OrderContext` | ❌ ไม่มี `channelCode` (มีแค่ `channelId`, `channelName`) |
| `receipt-no.ts` | ❌ hardcoded `0001`, ไม่ได้ fetch จาก DB |
| Form `note` field | ❌ ยังไม่มี |

---

## Step-by-Step Plan

### Step 1: DB Migration — Create `receipts` + `receipt_items` tables

**File:** `supabase/migrations/YYYYMMDDHHMMSS_create_receipts.sql`

สร้าง 2 tables ตาม schema ใน `spec/research/receipt-schema.md`:

```sql
-- receipts
CREATE TABLE receipts (
  id              BIGSERIAL PRIMARY KEY,
  channel_id      BIGINT NOT NULL REFERENCES channels(id),
  channel_code    TEXT NOT NULL,
  receipt_no      TEXT NOT NULL UNIQUE,
  customer_name   TEXT,
  bill_date       DATE NOT NULL DEFAULT CURRENT_DATE,
  total_quantity  INT NOT NULL DEFAULT 0,
  subtotal        NUMERIC(10,2) NOT NULL DEFAULT 0,
  discount_total  NUMERIC(10,2) NOT NULL DEFAULT 0,
  grand_total     NUMERIC(10,2) NOT NULL DEFAULT 0,
  discounts       JSONB NOT NULL DEFAULT '[]',
  status          TEXT NOT NULL DEFAULT 'active' CHECK (status IN ('active','cancelled')),
  note            TEXT,
  created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at      TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- receipt_items
CREATE TABLE receipt_items (
  id              BIGSERIAL PRIMARY KEY,
  receipt_id      BIGINT NOT NULL REFERENCES receipts(id) ON DELETE CASCADE,
  product_id      BIGINT REFERENCES products(id) ON DELETE SET NULL,
  product_name    TEXT NOT NULL,
  product_price   NUMERIC(10,2) NOT NULL,
  product_cost    NUMERIC(10,2) NOT NULL,
  product_options JSONB NOT NULL DEFAULT '[]',
  quantity        INT NOT NULL DEFAULT 1,
  line_total      NUMERIC(10,2) NOT NULL,
  note            TEXT,
  created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Indexes
CREATE INDEX idx_receipts_channel_id ON receipts(channel_id);
CREATE INDEX idx_receipts_bill_date ON receipts(bill_date);
CREATE INDEX idx_receipts_status ON receipts(status);
CREATE INDEX idx_receipt_items_receipt_id ON receipt_items(receipt_id);
CREATE INDEX idx_receipt_items_product_id ON receipt_items(product_id);
```

---

### Step 2: Update Types — `types/receipt.ts`

**File:** `web/src/types/receipt.ts`

อัปเดตให้ตรงกับ schema ใหม่:

```ts
export interface Receipt {
  id: number;
  channel_id: number;
  channel_code: string;
  receipt_no: string;
  customer_name: string | null;
  bill_date: string;
  total_quantity: number;
  subtotal: number;
  discount_total: number;
  grand_total: number;
  discounts: DiscountSnapshot[];
  status: 'active' | 'cancelled';
  note: string | null;
  created_at: string;
  updated_at: string;
}

export interface ReceiptItem {
  id: number;
  receipt_id: number;
  product_id: number | null;
  product_name: string;
  product_price: number;
  product_cost: number;
  product_options: ProductOptionSnapshot[];
  quantity: number;
  line_total: number;
  note: string | null;
  created_at: string;
}

export interface DiscountSnapshot {
  type: 'pricing' | 'percentage' | 'coupon';
  price?: number;
  percentage?: number;
  code?: string;
}

export interface ProductOptionSnapshot {
  id: number;
  name: string;
  price: number;
}
```

---

### Step 3: Add `channelCode` to OrderContext

**File:** `web/src/contexts/OrderContext.tsx`

เพิ่ม `channelCode` field:

```ts
// เพิ่มใน OrderContextValue interface
channelCode: string | null;  // ← NEW

// เพิ่มใน addItem callback — ดึง code จาก channelProduct.products หรือ fetch
// เนื่องจาก ChannelProduct ไม่มี channel.code ตรงๆ ต้อง store ไว้ตอน add
```

**ปัญหา:** `ChannelProduct` มีแค่ `channel_id` ไม่มี `code`
**วิธีแก้:** เปลี่ยน `addItem` signature ให้รับ `channelCode` เพิ่ม หรือ store `Channel` object ไว้ตอน first add

→ **ตัดสินใจ:** เพิ่ม parameter `channelCode` ใน `addItem()` เรียกจาก ProductChannelCard ที่มีข้อมูล channel อยู่แล้ว

---

### Step 4: New Server Action — `getNextReceiptNo`

**File:** `web/src/lib/server-actions.ts`

สร้าง action สำหรับดึงเลขบิลล่าสุดของช่องทางนั้นในวันนั้น แล้ว generate เลขถัดไป:

```ts
'use server';

export async function getNextReceiptNo(
  channelCode: string,
  billDate: string  // YYYY-MM-DD
): Promise<string> {
  // 1. Query receipts WHERE channel_code = X AND bill_date = Y
  //    ORDER BY receipt_no DESC LIMIT 1
  // 2. Extract running number from last receipt_no
  // 3. Increment + pad to 4 digits
  // 4. Return: {channelCode}{YYYYMMDD}{nextSeq}

  // Example:
  //   Last receipt: LMN256907140003
  //   Next: LMN256907140004
  //   If no receipt today: LMN256907140001
}
```

**Logic:**
```
 receipts table
 ┌──────────────────────────────────────────────────┐
 │ channel_code = 'LMN' AND bill_date = '2569-07-14'│
 │ ORDER BY receipt_no DESC LIMIT 1                 │
 └──────────────────────────────────────────────────┘
         │
         ▼
 Last: LMN256907140003 → Next: LMN256907140004
 None: → LMN256907140001
```

---

### Step 5: New Server Action — `createReceipt` (rewrite)

**File:** `web/src/lib/server-actions.ts`

ลบ `createBill` + `createReceiptItems` เก่าออก แล้วเขียนใหม่:

```ts
'use server';

import { create } from './db';
import { getMany } from './db';
import type { Receipt, ReceiptItem } from '@/types/receipt';

// ─── Get next receipt number ─────────────────────────
export async function getNextReceiptNo(channelCode: string, billDate: string): Promise<string> {
  // Fetch last receipt for this channel + date
  const receipts = await getMany<Receipt>('receipts', {
    params: {
      channel_code: `eq.${channelCode}`,
      bill_date: `eq.${billDate}`,
      order: 'receipt_no.desc',
      limit: '1',
      select: 'receipt_no',
    }
  });

  if (receipts.length === 0) {
    // First receipt today
    const dateCompact = billDate.replace(/-/g, '');
    return `${channelCode}${dateCompact}0001`;
  }

  // Extract last 4 digits and increment
  const lastNo = receipts[0].receipt_no;
  const lastSeq = parseInt(lastNo.slice(-4), 10);
  const nextSeq = String(lastSeq + 1).padStart(4, '0');
  const prefix = lastNo.slice(0, -4);
  return `${prefix}${nextSeq}`;
}

// ─── Create receipt + items (transaction-like) ────────
interface CreateReceiptInput {
  channel_id: number;
  channel_code: string;
  receipt_no: string;
  customer_name?: string;
  bill_date: string;
  total_quantity: number;
  subtotal: number;
  discount_total: number;
  grand_total: number;
  discounts: any[];
  note?: string;
  items: CreateReceiptItemInput[];
}

interface CreateReceiptItemInput {
  product_id: number | null;
  product_name: string;
  product_price: number;
  product_cost: number;
  product_options: any[];
  quantity: number;
  line_total: number;
  note?: string;
}

export async function createReceipt(
  input: CreateReceiptInput
): Promise<{ success: boolean; receipt: Receipt }> {
  // 1. Create receipt header
  const receipt = await create<Receipt>('receipts', {
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
```

---

### Step 6: Update `step-invoice-form.tsx` — Add Note + Wire Up

**File:** `web/app/management/orders/draft/step-invoice-form.tsx`

#### 6a. เพิ่ม `note` field ใน form
```tsx
const [note, setNote] = useState('');
// เพิ่ม textarea ใน form:
<textarea placeholder="หมายเหตุ (ถ้ามี)" value={note} onChange={e => setNote(e.target.value)} />
```

#### 6b. Auto-fetch receipt_no
```tsx
const [receiptNo, setReceiptNo] = useState('');

// useEffect เมื่อ billDate หรือ channel เปลี่ยน → fetch next receipt no
useEffect(() => {
  if (channelCode && invoiceDate) {
    getNextReceiptNo(channelCode, invoiceDate).then(setReceiptNo);
  }
}, [channelCode, invoiceDate]);
```

#### 6c. Wire up `handleSubmit`
```tsx
const handleSubmit = async (e: React.FormEvent) => {
  e.preventDefault();
  if (!customerName.trim()) return;
  if (!channelCode || !channelId) return;

  // 1. Build receipt items with snapshot data
  const receiptItems = items.map(item => {
    const addonTotal = item.selectedAddons.reduce((s, a) => s + a.base_price, 0);
    const unitPrice = item.channelProduct.price + addonTotal;
    return {
      product_id: item.channelProduct.product_id,
      product_name: item.channelProduct.products?.name ?? 'สินค้า',
      product_price: item.channelProduct.price,
      product_cost: item.channelProduct.cost,
      product_options: item.selectedAddons.map(a => ({
        id: a.id, name: a.name, price: a.base_price,
      })),
      quantity: item.quantity,
      line_total: unitPrice * item.quantity,
      note: item.note || null,
    };
  });

  // 2. Calculate totals
  const subtotal = totalPrice;
  const discountTotal = discounts.reduce((s, d) => {
    if (d.type === 'percentage') return s + ((d.percentage ?? 0) * totalPrice) / 100;
    return s + (d.price ?? 0);
  }, 0);
  const grandTotal = subtotal - discountTotal;

  // 3. Call server action
  const result = await createReceipt({
    channel_id: channelId,
    channel_code: channelCode,
    receipt_no: receiptNo,
    customer_name: customerName,
    bill_date: invoiceDate,
    total_quantity: totalQuantity,
    subtotal,
    discount_total: discountTotal,
    grand_total: grandTotal,
    discounts: discounts.map(d => ({
      type: d.discount_type,
      price: d.price,
      percentage: d.percentage,
      code: d.coupon_code,
    })),
    note,
    items: receiptItems,
  });

  if (result.success) {
    clearOrder();
    router.push('/management/orders');  // redirect to order history
  }
};
```

---

### Step 7: Update `db.ts` — Add `getReceiptByChannelAndDate`

**File:** `web/src/lib/db.ts`

เพิ่ม helper function:

```ts
export async function getLatestReceiptNo(channelCode: string, billDate: string) {
  return getMany<Receipt>('receipts', {
    params: {
      channel_code: `eq.${channelCode}`,
      bill_date: `eq.${billDate}`,
      order: 'receipt_no.desc',
      limit: '1',
      select: 'receipt_no',
    }
  });
}
```

---

### Step 8: Update `receipt-no.ts` — Fix Buddhist year

**File:** `web/src/utils/receipt-no.ts`

ปัจจุบันใช้ Buddhist year (+543) แต่ `step-invoice-form.tsx` ตั้ง `invoiceDate` เป็น `new Date().toISOString().split('T')[0]` ซึ่งเป็น Gregorian year

**ตัดสินใจ:** ใช้ Gregorian year (ค.ศ.) ตลอด เพราะ:
- `bill_date` ใน DB เป็น Gregorian
- ไม่ต้องแปลงไปมา
- receipt_no format: `LMN202607140001` (ไม่ใช่ `LMN256907140001`)

→ แก้ `receipt-no.ts` ให้ไม่ +543

---

## Summary: Files to Change

| # | File | Action |
|---|------|--------|
| 1 | `supabase/migrations/..._create_receipts.sql` | **CREATE** — new migration |
| 2 | `web/src/types/receipt.ts` | **REWRITE** — new schema types |
| 3 | `web/src/contexts/OrderContext.tsx` | **EDIT** — add `channelCode` |
| 4 | `web/src/lib/server-actions.ts` | **REWRITE** — new `getNextReceiptNo` + `createReceipt` |
| 5 | `web/src/lib/db.ts` | **EDIT** — add `getLatestReceiptNo` helper |
| 6 | `web/src/utils/receipt-no.ts` | **EDIT** — remove Buddhist year, fix format |
| 7 | `web/app/management/orders/draft/step-invoice-form.tsx` | **EDIT** — add note, auto receipt_no, wire submit |
| 8 | `spec/research/receipt-schema.md` | No change (already correct) |

---

## Dependencies & Order

```
1. Migration (DB) ──────────────────┐
2. Types (types/receipt.ts) ────────┤
                                    ├─► 7. StepInvoiceForm (wire up)
3. OrderContext (+channelCode) ─────┤
4. Server Actions (createReceipt) ──┤
5. db.ts helpers ───────────────────┤
6. receipt-no.ts (fix) ─────────────┘
```

Steps 1-6 ทำได้ parallel. Step 7 ต้องรอทุกอย่างเสร็จก่อน.

---

## Questions / Tradeoffs

1. **Buddhist vs Gregorian year?** → ใช้ Gregorian (ค.ศ.) เพราะ bill_date เป็น Gregorian
2. **channelCode source?** → เพิ่มใน OrderContext (ไม่ต้อง fetch ก่อน submit)
3. **Discount validation?** → ตรวจสอบ grand_total >= 0 ใน server action
4. **Error handling?** → ใช้ ActionResult pattern จาก user-actions.ts (ok/fail)
5. **redirect after create?** → redirect ไป `/management/orders` (order history page)

---

*Plan created 2026-07-14 for From Home Sandwich receipt creation feature.*
