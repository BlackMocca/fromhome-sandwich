# 🗓️ Implementation Plan — BOM-based Product Cost

> ไฟล์ส่วนหนึ่งของ `README.md` — แผนลงมือทำราย phase, ไฟล์ที่ต้องแก้, test และ risks
> **Blocker ก่อน P1**: ตอบคำถาม `Q1–Q5` ใน `README.md` §5 โดยเฉพาะ **Q1 (rounding rule)** และ **Q4 (unique index)**

## 0. Dependency

```
P0: Migrations & DB engine     ✅ ready
P1: Purchase form + price view
P2: BOM editor + product cost UI
P3: Wire receipts/effective cost
P4: Dashboard as-of (required) + P5 Polish
P5: Nice-to-have
```

---

## P0 — Database (ตาม `01-database-design.md`)

> ไฟล์ใหม่ใน `supabase/migrations/` — ตามชื่อ naming pattern ที่มีอยู่

| # | Migration file (เสนอ) | ทำอะไร |
|---|----------------------|-------|
| 1 | `20260724000001_ingredients_upgrade_bom.sql` | `ingredients`: + `base_unit`, `manual_unit_price`; `ingredient_purchases`: + `conversion_factor`, `base_units` (generated), `unit_price` (generated), `purchase_group`; **DROP** unique index `(ingredient_id, purchase_date)` |
| 2 | `20260724000002_product_ingredients.sql` | CREATE `product_ingredients` + RLS + index |
| 3 | `20260724000003_products_cost_recalc.sql` | `products.cost_override`; `fn_get_ingredient_unit_price`, `fn_recalc_product_costs`, triggers บน `product_ingredients` และ `ingredient_purchases` |
| 4 | `20260724000004_bom_views.sql` | `view_ingredient_current_prices`, `v_product_calculated_costs`, `fn_ingredient_price_as_of` + grants |
| 5 | `20260724000005_bom_dashboard_as_of.sql` | recreate dashboard views เพิ่ม `cogs_as_of` column (§7.2) |
| 6 | (script แยก, รัน 1 ครั้ง) `spec/change/product_cost/backfill_seed.sql` | Backfill ตาม 01-database-design §9 — ยึด Q1/Q2 ที่ confirm แล้ว |

**Acceptance:** test cases 1, 2, 3, 7, 8 ใน `02-...` §7 ผ่านเมื่อรัน SQL ตรง ๆ บน DB

---

## P1 — Purchase Form: รองรับ Conversion + Unit Price

**เป้าหมาย:** บันทึก "ซื้อขนมปังใหญ่ 1 หัว (18 ชิ้น) ฿40" ได้ในระบบ และ UI แสดง `unit_price` + ราคาปัจจุบันของทุกวัตถุดิบ

**Files ที่ต้องแก้:**
- `web/src/types/ingredient_purchase.ts` — เพิ่ม `conversion_factor`, `base_units`, `unit_price`, `purchase_group` ต่อ `IngredientPurchase` และ `CreateIngredientPurchaseInput`
- `web/src/types/ingredient.ts` — เพิ่ม `base_unit`, `manual_unit_price`
- `web/src/lib/db.ts` — เพิ่ม `getCurrentIngredientPrices()` (อ่าน `view_ingredient_current_prices`) และ `getProductCalculatedCosts()`
- `web/app/management/ingredient-purchases/create/page.tsx` — เพิ่ม field "1 หน่วยที่ซื้อ = base unit กี่หน่วย" (conversion factor, default 1), แสดง `unit_price` preview แบบ live (amount ÷ (qty × factor))
- `web/app/management/ingredient-purchases/[id]/edit/page.tsx` — เหมือน create
- `web/app/management/ingredient-purchases/page.tsx` — column "unit price" ต่อ row + filter/group ตาม `purchase_group`
- `web/app/management/ingredients/create/page.tsx` — เพิ่ม `base_unit`, `manual_unit_price`

**Acceptance:** test case 5 ผ่าน; UI ledger เดิมยังทำงานได้หลังเปลี่ยน schema (compat ของ `quantity`/`unit`/`amount`)

---

## P2 — BOM Editor + Product cost (core feature)

| File | ทำอะไร |
|------|-------|
| `web/src/lib/db.ts` | CRUD `product_ingredients` (`getProductIngredients`, `upsertProductIngredients`, `deleteProductIngredient`) |
| `web/src/lib/costing.ts` (ใหม่) | `recalcProductCost`, `recalcAllProductCosts`, `previewProductCost` (ดู `02-...` §4) |
| `web/app/management/products/create/page.tsx` | ลบ/ซ่อน input `cost` → แสดง **BOM editor** (เลือก ingredient + qty ต่อหน่วย) และ **live preview** ของ cost ที่คำนวณ (ยังไม่กดบันทึก) + optional `cost_override` input (default ว่าง) |
| `web/app/management/products/[id]/edit/page.tsx` | เหมือน create (โหลด BOM เดิมมา edit) |
| `web/src/components/app/bom-editor.tsx` (ใหม่) | ตาราง ingredient + qty row, เพิ่ม/ลบ row, live total cost, **warning banner** ถ้า ingredient ใดไม่มีราคา (test 6) |
| `web/app/management/dashboard/product/page.tsx` | อ่าน cost จาก `v_product_calculated_costs` / `effective(p)` แทนที่ `p.cost` ตรง ๆ |

**Acceptance:** test case 4, 6, 10, 12 ผ่าน; สร้างสินค้าใหม่ + BOM → เห็น cost ก่อนกด submit

---

## P3 — Wire Receipt & Effective Cost

| File | เปลี่ยนอะไร |
|------|-----------|
| `web/app/management/orders/draft/step-invoice-form.tsx` | `product_cost: item.channelProduct.cost` → `effective = channelProducts.cost ?? product.cost_override ?? product.cost` (priority ตาม `02-...` §5) |
| `web/app/management/claims/create/page.tsx` | `unit_cost` snapshot → อ่านจาก `effective(p)` เช่นกัน (แหล่งข้อมูลเดียว) |
| `web/app/management/channels/[id]/product/[productId]/edit/page.tsx` | (ถ้า Q5 = ยังใช้ channel override) คงไว้; (ถ้าทิ้ง) ลบ field + read จาก product |

**Acceptance:** test case 9 ผ่าน (receipt snapshot); ออกบิล → purchase price เปลี่ยน → ค่าใน receipt คงเดิม

**Regression check:**
- `getNextReceiptNo`, channel add product step2, addon pricing — ไม่แตะ แต่ smoke test สร้างบิล 1 ใบผ่าน ๆ

---

## P4 — Dashboard “ต้นทุนวัตถุดิบ ณ ตอนนั้น” (Required) + P5 Polish

> P4 = required ตาม requirement (dashboard ต้องเห็นต้นทุนวัตถุดิบ ณ ตอนนั้น) / P5 = nice-to-have

### P4 — As-of dashboard (required)
1. **`cogs_as_of` บน views เดิม (required):** รัน migration `..._bom_05_dashboard_as_of.sql` (recreate `view_daily_summary` / `view_monthly_sales_profit` เพิ่ม column `cogs_as_of` — ดู §7.2 ใน `01-...`) + UI อ่าน `cogs_as_of` แสดงเทียบ `total_cost` บน KPI cards และกราฟ → ตอบคำถาม “ยอดขายวันนั้น เทียบกับต้นทุนวัตถุดิบ ณ ตอนนั้นเท่าไหร่”
2. **ราคา as-of ต่อวัน (required):** function `fn_ingredient_price_as_of(ingredient, date)` + ตารางในหน้า dashboard/ingredient “ราคาวัตถุดิบ ณ ตอนนั้น” แยกตามวันที่ (อ่านจาก `ingredient_purchases` ตรง ๆ — purchase = timeline) → ใช้เทียบราคาพุ่งขึ้น/ลงช่วงไหน + วางแผนซื้ออาทิตย์หน้า
3. **Smoke test:** test cases 13–15 ใน `02-...` §7 ผ่าน (as-of ย้อนหลัง, ก่อน purchase แรก, คำนวณ column dashboard)
4. **Channel fee view (จาก Q5):** GP% เปลี่ยนจากสูตรคำนวณต้นทุน → **channel fee ใน P&L** — เพิ่ม view/summary `channel_pnl = revenue − COGS − (GP% × revenue)` + pricing suggestion `แนะนำราคาขาย = COGS ÷ (1 − GP%)` ในหน้า channel settings, UI edit ของ `channel_products.cost` ลดลงเหลือ override อย่างเดียว

### P5 — Nice-to-have (ไม่ block)
1. **Price history ต่อ ingredient:** ราคา change card ต่อ ingredient_id (view เดิมเป็น aggregate — เพิ่ม per-point-in-time) + price trend chart
2. **Cost history:** `product_cost_snapshots` (product_id, cost, unit_prices JSONB, valid_from) — เพิ่มตอนต้องการ audit trail จริง ๆ
3. **BOM history:** `product_ingredient_history` เก็บสูตรทุกครั้งที่แก้ → as-of ของวันเก่าใช้สูตรของวันนั้นแทนที่ BOM ปัจจุบัน (แก้ caveat ใน `02-...` §2a) — เพิ่มต่อ P4
4. **Weekly planning view:** สรุป “ต้องซื้ออะไรอีก” = current BOM ครอบคลุม → ปริมาณวัตถุดิบที่ประมาณว่าจะใช้ vs ซื้อจริง


---

## Risks & Mitigations

| Risk | Impact | Mitigation |
|------|--------|---------|
| ตัวเลขใหม่ (CEIL) สูงกว่าตารางเก่า (floor) เล็กน้อย | ผู้ใช้รู้สึกว่าเลขไม่ตรง spreadsheet เก่า | Q1 confirm แล้ว = CEIL → document ใน Release Note + แนบตารางเปรียบเทียบความแตกต่างต่อเมนูใน `02-...` §2.3 |
| Recalc trigger ช้าเมื่อ BOM ใหญ่ (P4 scale) | UI lag ตอนบันทึก purchase | P0 measure < 500ms; ถ้าช้า → ทำ trigger async (queue) หรือ batch recalc |
| `products.cost` ถูกอ่านจากหลายจุด (receipts, claims, dashboard) | ลอด 1 จุด → ตัวเลขต่างกัน | P3 ทำ search-and-replace + regression test list ใน `02-...` §7 ข้อ 9 |
| Unique index block purchase ซ้ำวัน (Q4) | ไม่สามารถซื้อเสริมวันเดียวกับวันอาทิตย์ | P0: DROP index + update UI form validation |
| User เข้าใจผิดว่า `cost_override` "ตายไปแล้ว" → ค่า override เก่ายังค้างอยู่ แต่ค่าจริงเปลี่ยน | กำไรคลาดเคลื่อนระยะสั้น | P1: dashboard "products ที่ใช้ override เกิน 7 วัน" (banner) |
| Trigger ทำงานไม่ตรง RLS / privilege | recalc fail เงียบ / permission error | P0: test trigger ด้วย `authenticated` role ตรง ๆ บน PostgREST (ไม่ใช่ DB admin role อย่างเดียว) |

## Rollback

- ทุก migration เป็น additive → rollback = 1 migration ใหม่ที่ DROP trigger → DROP function → DROP `product_ingredients` → ALTER DROP columns ของ `ingredients`/`ingredient_purchases`
- UI: P1–P3 ทุก commit เป็น feature-branch + tag `bom-cost` → ถ้า fail สามารถ revert commit ได้โดย schema ยัง additive อยู่ (safe)

## Open Items (track — ไม่ block P0–P1)

| Item | Status | Owner |
|------|--------|-------|
| Q1 Rounding rule | ✅ **CEIL** (14/8/26) | — |
| Q2 BOM ตัวเลขจริง | ✅ เสร็จ: คิวพี 36 ครั้ง/ถุง · ทูน่า 1 กระป๋อง 164 = 4 ครั้ง (41/ครั้ง) | — |
| Q3 ถุง/กล่อง | ✅ คำนวณ per-piece: ถุง=1 ชิ้น, กล่อง=2 ชิ้น, qty กล่อง = 2× qty ถุง (auto) | — |
| Q4 Unique index | ✅ ซื้อซ้ำวันเดิมได้ → DROP index ใน P0 | — |
| Q5 Channel/GP | ✅ GP% = channel fee ใน P&L, `channel_products.cost` = override อย่างเดียว, `suggested_price = COGS ÷ (1−GP%)` | — |
| P4 ticket (price change card, trend view) | — | AI agent (P5 — after P4 stable) |
