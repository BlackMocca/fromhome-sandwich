# 🧮 Calculation Logic — Product Cost จากวัตถุดิบ

> ไฟล์ส่วนหนึ่งของ `README.md` — สูตรคำนวณละเอียด, policy ราคา, edge cases และผลต่อ module เดิม

---

## 1. Concept — แยก 2 ชั้นให้ชัด

```
┌───────────────────────────────┐       ┌──────────────────────────────────┐
│ L1: Current Ingredient Prices │ ────► │ L2: Product Calculated Cost      │
│ (จาก purchases / manual price)│       │ (จาก BOM × L1)                   │
│                               │       │                                  │
│ view_ingredient_current_prices│       │ products.cost (recalc snapshot)  │
└──────────────────────────────┘       └──────────────────────────────────┘
                                                        │
                                                        ▼
                                        ┌──────────────────────────────────┐
                                        │ L3: Snapshot ใน Transaction       │
                                        │ receipt_items.product_cost       │
                                        │ claims.unit_cost                 │
                                        │ (ไม่เปลี่ยน — พฤติกรรมเดิม)         │
                                        └──────────────────────────────────┘
```

- **L1** ตอบคำถาม "วัตถุดิบนี้ราคาเท่าไหร่ตอนนี้ (สัปดาห์นี้)"
- **L2** ตอบคำถาม "ขายแซนวิชหนึ่งกล่อง/ถุง ต้นทุนเท่าไหร่" — คำนวณ live และ persist ไว้ที่ `products.cost`
- **L3** คือความเดิมดีเก่าของระบบ: ตัวเลขที่ขาย/เคลมไปแล้วไม่ถูกแก้ภายหลัง (ราคาวัตถุดิบเปลี่ยนวันพรุ่งนี้ **ไม่** ทำให้กำไรย้อนหลังเปลี่ยน)

### 2a. แยกเพิ่ม: L1-history — "ราคา ณ ตอนนั้น" สำหรับ Dashboard

Dashboard ต้องตอบคำถาม **"ยอดขายวันนั้น ต้นทุนวัตถุดิบ ณ ตอนนั้นเท่าไหร่"** — ไม่ต้องเก็บข้อมูลใหม่เพิ่ม เพราะ `ingredient_purchases` เป็น append-only ledger → แต่ละ row คือ "จุดเวลา" ของราคา (ซื้ออา. ฿40 → ซื้อเสริม พ. ฿44 = timeline ครบ):

```
price_as_of(ing, date) =
    manual_unit_price          ถ้าตั้ง manual price (packaging — ถือว่าราคา constant)
  = unit_price ของ purchase ล่าสุด ที่มี purchase_date <= date
                                (ORDER BY purchase_date DESC, created_at DESC LIMIT 1)

cogs_as_of(receipt) = Σ BOM_qty × price_as_of(ing, bill_date)
```

- **แยกจาก L3 snapshot** — 2 ตัวเลขคนละตัว: `total_cost` = ค่าที่ snapshot ตอนออกบิล (L3), `cogs_as_of` = "ถ้าขายวันนั้นด้วยราคาวัตถุดิบของวันนั้น" → ดูต้นทุนวัตถุดิบ ณ ตอนนั้นตรงกับ requirement และเทียบได้ว่าราคาวัตถุดิบขยับขึ้น/ลง vs ยอดขาย
- **Packaging (manual price)** ไม่มีประวัติราคา — ถือ constant ทั้งหมด (เหมาะกับ use case กล่อง 2.7 / กระดาษ 1.3)
- **Caveat ที่ต้องรู้:** as-of ใช้ **BOM ปัจจุบัน** (ยังไม่มี BOM history) — ถ้ามีการแก้สูตรสินค้าภายหลัง ตัว as-of ของวันเก่าจะใช้สูตรใหม่ + ราคาเก่า → ถ้าต้องการ audit 100% เพิ่ม `product_ingredient_history` (P5 optional)

> **ประเด็นสำคัญทางบัญชี:** ระบบนี้ **ไม่ใช่** COGS/FIFO inventory — เป็น **standard costing รายสัปดาห์** (price as-of ของ batch ที่ซื้อมา) เหมาะกับ use case "ซื้อใหม่ทุกสัปดาห์" และทำให้ dashboard เก่ายังอ่านง่าย (ไม่ต้องจับคู่ purchase ↔ receipts)

## 2. สูตร

### 2.1 L1 — Current unit price ของ ingredient

```
p_manual(ing) = ingredients.manual_unit_price

p_latest(ing) = unit_price ของ row ล่าสุดใน ingredient_purchases โดย
                ORDER BY purchase_date DESC, created_at DESC

current_price(ing) = p_manual(ing)   ถ้า p_manual ไม่ใช่ NULL
                  = p_latest(ing)    ถ้ามี purchase
                  = NULL             (ยังไม่มีข้อมูล → ดู §5 edge case)
```

### 2.2 L2 — Product cost

```
BOM(p)          = { (ing, qty) } จาก product_ingredients
cost_calc(p)    = Σ_{(ing,qty) ∈ BOM(p)} qty × current_price(ing)
effective(p)    = COALESCE(p.cost_override, cost_calc(p))
```

**Rounding policy — CONFIRMED (Q1, 14/8/26): CEIL “ปัดเศษขึ้น” ถ้ามีทศนิยม**
1. `unit_price` และค่าต่อ ingredient line เก็บเต็มทศนิยม — **ไม่ rounding ตอนกลาง**
2. **ปัดขึ้นครั้งเดียว** ตอนบันทึกลง `products.cost` → `CEIL(cost_calc × 100) / 100`
   - ค่าเต็มจำนวน (เช่น 2.70) → อยุ่ที่เดิม ไม่ +0.01
   - มีทศนิยมเกิน → ปัดขึ้น (เช่น 6.6667 → **6.67**, 8.175 → **8.18**)
3. ⚠️ Note: ตารางเดิมใช้ floor → ตัวเลขใหม่จะ **สูงกว่า** ตารางเดิมเล็กน้อย (6.6 → 6.67) → ต้นทุน conservative ขึ้น กำไรไม่โป่ง → ตามที่ต้องการ

### 2.3 ตัวอย่าง (รันตัวเลขจากตาราง requirements)

```
ราคาวัตถุดิบ (L1) — ซื้อ 09/08/26
  ขนมปัง        40 ÷ 18  = 2.2222  /ชิ้น
  ขนมปังโฮลวีต  44 ÷ 18  = 2.4444  /ชิ้น
  ไข่ไก่      118 ÷ 30  = 3.9333  /ฟอง
  คิวพี        129 ÷ 36  = 3.5833  /ครั้ง   (ซื้อ 1 ถุง, conversion = 36 ครั้ง/ถุง)
  ทูน่า       164 ÷ 4 ครั้ง/กระป๋อง  = 41.00  /ครั้งใช้   (ราคา 1 กระป๋อง = 164, ใช้ได้ 4 ครั้ง — confirm)
  ...

Product: แซนวิชไข่ทูน่า — BOM ต่อชิ้น: ขนมปัง 1.5, โฮลวีต 1.5, ไข่ 0.5, คิวพี 1 ครั้ง, ทูน่า 1 ครั้ง
  (แถวทูน่าในตารางเดิม 6.8/3.4 ไม่ตรงกับ 41 → ตารางเก่านับ floor/สูตรไม่ชัด — ตัวเลขที่ confirm แล้วเป็น authoritative)
  SKU กล่อง/ถุง คำนวณ **per-piece**: 1 ชิ้น = ขนมปัง 1.5, ไข่ 0.5, ... → qty(SKU กล่อง) = 2 × qty(SKU ถุง)

Packaging:
  กล่อง ×1 = 2.70, กระดาษ ×1 = 1.30 (ผ่าน manual_unit_price — ไม่ต้อง purchase จริง)
```

**ตรวจกับตารางเดิม (confirm แล้ว 14/8/26 — policy = CEIL):**

| วัตถุดิบ | ตัวเลขเต็ม (ไม่ rounding) | CEIL 2 | ตารางเดิม (floor เก่า) |
|---|---|---|---|
| ขนมปัง (กล่อง, 3 ชิ้น) | 40/18×3 = 6.6667 | **6.67** | 6.6 (ต่ำกว่า) |
| ไข่ไก่ (กล่อง, 2 ฟอง) | 118/30×2 = 7.8667 | **7.87** | 3.9/อัน (2 อัน = 7.8) |
| ไข่ไก่ (ถุง, 1 ฟอง) | 118/30×1 = 3.9333 | **3.94** | 3.9 |
| คิวพี (1 ครั้ง) | 129/36 = 3.5833 | **3.59** | 3.5 |
| ขนมปังโฮลวีต (กล่อง, 3 ชิ้น) | 44/18×3 = 7.3333 | **7.34** | 7.2 |
| ปูอัด (3 ชิ้น) | 109/40×3 = 8.175 | **8.18** | 9.0 (ตารางเก่าไม่ตรงสูตร) |
| ถุง (1 ชิ้น) | 2.3/ชิ้น ×1 = 2.30 | **2.30** | 1.5 (ต่างกัน — Q2 ยังไม่ครบ? ตรวจก่อน backfill) |
| กล่อง (2 ชิ้น) | 2.7/กล่อง = 2.70 (manual) | **2.70** | 2.7 |

> Note: ตัวเลข "ตารางเดิม" หลายแถวมาจากสูตรที่ rounding ก่อน/ปัดลง → ระบบใหม่เป็น **สูตรเดียว (CEIL)** → อาจต่างจากตัวเลขใน spreadsheet เก่า → **ตัวเลขใหม่เป็น authoritative**

## 3. Price Policy — "ราคา as-of" ต่อสัปดาห์

| สถานการณ์ | พฤติกรรม |
|-----------|---------|
| ซื้อวัตถุดิบวันอาทิตย์ | Trigger `trg_purchase_recalc` → recalc products ที่ใช้วัตถุดิบนั้นทันที |
| ซื้อเสริมวันพุธ (ราคาเปลี่ยน) | row purchase ใหม่ → current_price กลายเป็นราคาล่าสุด (ราคา batch พ.) |
| วัตถุดิบเก่าราคาต่างกัน (อาทิตย์ 40, พุธ 44) | L2 ใช้ **44** (ล่าสุด) — ราคาเก่ายังอยู่ใน ledger สำหรับประวัติ/audit |
| วัตถุดิบไม่มี purchase ในปีนี้ | `current_price = NULL` → §5 |
| ดูราคาว่าเปลี่ยนเมื่อไหร่ | `view_ingredient_current_prices` + GROUP BY week บน `ingredient_purchases` (view trend เดิม cover ได้แล้ว) |

> **ไม่ทำ FIFO/stock:** ไม่มี "stock คงเหลือ" — สัปดาห์หน้าที่ซื้อใหม่ ราคาเก่าก็หายไปเองตามธรรมชาติ เหมาะกับระบบ single-user ไร้ inventory. ถ้าอนาคตต้องการ COGS จริง ๆ ค่อย upgrade (ไม่กระทบ schema)

## 4. Recalc cascade & Timing (สำคัญสำหรับ P5 — หลายเมนูใช้วัตถุดิบเดียวกัน)

| เหตุการณ์ (writer) | Recalc |
|---|---|
| INSERT/UPDATE/DELETE `ingredient_purchases` | products ทุกตัว whose BOM มี ingredient นั้น |
| INSERT/UPDATE/DELETE `product_ingredients` | product ที่ BOM เปลี่ยน (old + new) |
| เปลี่ยน `manual_unit_price` ของ ingredient | products ทุกรายการผ่าน **app-level** fn (trigger บน ingredients ยังไม่ทำ — ทำผ่าน server action `recalcAll` หลัง UI change) |
| สร้าง/ลบ product | `fn_recalc_product_costs(new_id)` |

**App-level helper (`web/src/lib/costing.ts` ใหม่):**

```ts
export async function recalcProductCost(productId: number) — เรียกหลัง UI edit BOM/product/ingredient override
export async function recalcAllProductCosts() — เรียกหลัง bulk seed / แก้ manual_unit_price
export function previewProductCost(bom: {ingredient_id, qty}[], currentPrices: Map<number, number>) → number
  // สำหรับ live preview ใน UI ก่อนกดบันทึก (ใช้ current_price จาก view_ingredient_current_prices)
```

```
Timeline 1 วัน:
  อาทิตย์ 08:00  ซื้อขนมปัง 40 ชิ้น ฿109 → purchase row → trigger → cost ของเมนูที่ใช้ขนมปังอัปเดตทันที ✅
  พฤหัส 09:00  ขายบิล 10 ใบ          → receipt_items.product_cost = snapshot ค่าปัจจุบัน ✅
  พุธ 10:00     ซื้อเสริมขนมปังใหม่ ฿44 → purchase row (ซ้ำวันได้) → trigger → products.cost อัปเดตใหม่
                              → บิลที่สร้างก่อนวันที่ 10 ยังใช้ค่าเดิม (snapshot L3) ✅
```

## 5. Edge cases

| Case | Handling |
|------|----------|
| วัตถุดิบไม่มี purchase data | `current_price = NULL` → cost_calc = 0 สำหรับตัวนั้น + ระบบขึ้น **warning** บนหน้า product ("ขนมปังยังไม่มีราคา — ซื้อครั้งแรกหรือตั้ง manual price") — **ไม่** block การสร้างบิล แต่ dashboard จะใต้ความเป็นจริง |
| Packaging ที่ไม่ได้ซื้อจริง (กล่อง 2.7, กระดาษ 1.3) | `manual_unit_price` = 2.70 / 1.30 — ใช้ pipeline เดียว ไม่ต้องเขียน logic พิเศษ |
| BOM ว่าง (product ใหม่ยังไม่ได้ตั้งสูตร) | `cost_calc = 0` → ถ้า `cost_override` ก็ 0 ด้วย → ขึ้น warning เหมือนเคส NULL — **แนะนำ:** UI ไม่ให้ active product ราคาก่อน BOM ครบ ถ้าอยากให้บังคับ hard → เพิ่ม CHECK/trigger guard (เลือกได้ใน Q) |
| ซื้อซ้ำ 2 ครั้งใน 1 วัน (อาทิตย์ + เสริม) | ต้อง drop unique index `(ingredient_id, purchase_date)` — ดู DDL §3 ของ `01-database-design.md` |
| ราคา 0 บาท (รับของฟรี/ของแถม) | `unit_price = 0` — trigger recalc ให้ cost=0 เป็นธรรมชาติ ✅ |
| ลบ purchase row | Trigger `TG_OP='DELETE'` → recalc โดยราคาที่ใหม่ที่สุด |
| Channel GP% (Q5 confirm) | **GP% ไม่ใช่ต้นทุน** — เป็นค่าช่องทาง/commission ใช้หักที่ P&L ระดับ channel เท่านั้น (ดู §6 ด้านล่าง) |
| การลบ ingredient ที่มี purchase | `ingredient_purchases` cascade → `current_price = NULL` → recalc product ทุกตัวที่ use มัน |

## 6. ผลต่อ Module เดิม

| Module | เปลี่ยน? | รายละเอียด |
|--------|--------|--------|
| `receipts` (create) | **พฤติกรรมเดิม** — `product_cost` snapshot เข้า `receipt_items` เหมือนเดิม | **แต่** source ของตัวเลขเปลี่ยน: `effective(p)` แทนที่ `channelProduct.cost` ที่กรอกเอง |
| `channel_products.cost` | **Q5 confirm** | คงเป็น **manual override** อย่างเดียว (rare case) — priority: `channel_products.cost` (ถ้ามี) > `products.cost_override` > `products.cost` (recalc) | 
| `channel.gp_percentage` | **เปลี่ยน semantics** | ไม่ได้เอาไปคำนวณ `ต้นทุน = ราคาขาย/(1+GP)` อีกต่อไป → **ค่าช่องทาง (channel fee)**: หัก P&L ว่า `GP% × revenue(channel)` + ใช้เป็น pricing สuggestion: `แนะนำราคาขาย = COGS ÷ (1 − GP%)` (ดู §5) |
| `claims` | **ไม่เปลี่ยน** — `unit_cost` ยัง snapshot จาก product cost (effective) — แค่ค่าที่ snapshot มาแม่นขึ้น |
| `view_daily_summary` / `view_monthly_sales_profit` | **ไม่เปลี่ยน** — `total_cost` มาจาก `receipt_items.product_cost` (L3) →แม่นขึ้นอัตโนมัติ; `ingredient_cost` เองยังแสดงผลแยกเหมือนเดิม |
| `view_weekly/monthly_ingredient_costs` | **ไม่เปลี่ยน** — ยังวัดจาก ledger เดิม (amount ที่จ่ายจริง) |
| Dashboard UI | **ไม่เปลี่ยน logic** — แค่ตัวเลขแม่นขึ้น + เพิ่ม card "วัตถุดิบที่ราคาเปลี่ยน" (optional, phase 4) |

## 7. Validation / Test Cases (ต้อง pass ทุกเคสก่อน release)

1. **Basic:** สร้าง ingredient + purchase + BOM → `products.cost` = สูตรใน §2.2 (±rounding rule)
2. **Cascade:** ซื้อไข่ไก่ (ที่ use ใน 3 เมนู) → cost ทั้ง 3 เมนูอัปเดตใน 1 transaction (ดู DB ตรง)
3. **Week price:** ซื้อขนมปังอาทิตย์ ฿40 → cost=X. ซื้อเพิ่มพุธ ฿44 → cost เปลี่ยนเป็นค่าใหม่. บิลที่สร้างก่อนพุธยังเป็นค่าเก่า
4. **Override:** ตั้ง `cost_override = 99` → effective = 99 แม้ BOM/ราคาเปลี่ยน
5. **Manual price:** Packaging `manual_unit_price=2.7` + purchase record ปรากฏใน purchase → ไม่ double count
6. **Null price:** ingredient ไม่มี purchase → cost = 0 + warning surface ใน UI
7. **Delete purchase:** ลบ row ล่าสุด → cost กลับไปราคาก่อนหน้า
8. **Ceil:** cost_calc=6.6667 → 6.67; cost_calc=2.70 → 2.70 (ไม่ +0.01); cost_calc=8.175 → 8.18
9. **Receipt snapshot:** ออกบิล → purchase price เปลี่ยน → `receipt_items.product_cost` คงเดิม
10. **Trigger idempotency:** ลบ BOM 1 row แล้วใส่กลับ → cost กลับค่าเดิม (ไม่สะสม, ไม่ลบ)
11. **ซื้อซ้ำวันเดียว:** ซื้อวัตถุดิบซ้ำ 2 ครั้งในวันเดียวกัน → ไม่ถูก unique index block (Q4 ✅)
12. **Performance:** BOM 50 products × ~10 ingredients × trigger recalc < 500 ms ต่อ purchase row (load test เบา ๆ)
13. **Price as-of (ย้อนหลัง):** ซื้อขนมปัง 09/07 ฿40, 14/07 ฿44 → `fn_ingredient_price_as_of(ing, '07-11')` = 2.2222, `('07-15')` = 2.4444; บิลวันที่ 11/07 → cogs_as_of ใช้ 2.2222 / บิลวันที่ 15/07 → ใช้ 2.4444
14. **As-of ก่อน purchase แรก:** บิลที่ยังไม่มี purchase row เดิม → contribution ของ ingredient นั้น = 0 + ไม่ error ไม่ division by zero (ใน view ใช้ COALESCE)
15. **Dashboard col ใหม่:** `view_daily_summary.cogs_as_of` = Σ ของทุก items ในวัน — ตรวจด้วยมือจาก BOM + ราคาของวัน


## 8. Rollback

- Migrations เป็น additive ทั้งหมด (ADD COLUMN / CREATE TABLE / CREATE TRIGGER / VIEW ใหม่)
- Rollback = migration ใหม่ 1 ไฟล์: DROP TRIGGER, DROP FUNCTION, DROP TABLE `product_ingredients`, DROP เพิ่ม columns, DROP views — `products.cost` ค่าเก่ายังคงอยู่ (ยังกรอก manual ได้เหมือนเดิมในระหว่าง revert)
- **ไม่ drop ข้อมูลเดิม:** ทุกอย่าง revert ได้โดยไม่ได้ล้างข้อมูล
