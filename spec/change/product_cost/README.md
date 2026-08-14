# Change: Product Cost — คำนวณต้นทุนสินค้าจากวัตถุดิบ (BOM-based Costing)

> **สถานะ**: Draft for review
> **วันที่**: 2026-07-24
> **ผู้เขียน**: (AI Agent — ในมุม Senior Software Engineer)
> **เป้าหมาย**: เปลี่ยน `products.cost` จาก "กรอกเอง" → "คำนวณอัตโนมัติจากวัตถุดิบ + BOM" โดยยังคง `ingredient_purchases` หน้าที่เดิม (ledger รายจ่าย) แต่ขยายให้ทำหน้าที่เป็น **source of price** สำหรับวัตถุดิบไปด้วย

---

## 1. ปัญหาปัจจุบัน (As-Is)

| # | ปัญหา | ผลกระทบ |
|---|--------|---------|
| P1 | `products.cost` ต้องพิมพ์เองทุกสินค้า | ไม่แม่น (เดา/ไม่อัปเดต), ใช้เวลานาน, dashboard กำไรคลาดเคลื่อน |
| P2 | วัตถุดิบซื้อใหม่ทุกสัปดาห์ (อา. + เสริม พ.) ราคาเปลี่ยน | ต้นทุนจริงเปลี่ยน แต่ `cost` ในระบบเก่าไม่ย้ายตาม |
| P3 | `ingredient_purchases` เป็นเพียง ledger จดว่าซื้ออะไร | ราคาที่ซื้อมาจริงไม่ถูกนำกลับไปคำนวณต้นทุนสินค้า (ข้อมูล 2 ส่วนไม่เกี่ยวกัน) |
| P4 | หน่วยนับไม่ตรงกัน เช่น ซื้อ "ขนมปังใหญ่ (หัว)” ได้ 18 ชิ้น | ซื้อแบบแพ็คใหญ่ แต่ใช้แบบชิ้น → ต้องมี **conversion factor** |
| P5 | สินค้าหลายตัวใช้วัตถุดิบซ้ำกัน (ไข่ทูน่า vs ปูอัดไข่ ใช้ ขนมปัง+ไข่ ตัวเดียวกัน) | แก้ BOM 1 จุด ต้องอัปเดตต้นทุนสินค้าหลายตัวพร้อมกัน — ต้องการ **recalc cascade** |

## 2. เป้าหมาย (To-Be)

1. คำนวณ `product cost` = Σ (usage ของวัตถุดิบ × unit price วัตถุดิบ) — BOM-driven cost
2. ราคาสัปดาห์ (ซื้ออา/เสริม พ.) อัปเดตต้นทุนสินค้า **อัตโนมัติ** ผ่าน trigger
3. รองรับ portion 2 ขนาด: **ต่อกล่อง / ต่อถุง** (ถุง = ครึ่งกล่อง ตามข้อมูลตัวอย่าง)
4. คง snapshot pattern เดิม: ใบเสร็จ (`receipt_items.product_cost`) และ claims (`unit_cost`) ไม่เปลี่ยนพฤติกรรม — แค่เปลี่ยน "ที่มาของตัวเลข"
5. Dashboard ตอบคำถาม**ย้อนหลัง**ได้: "ยอดขายวันนั้น เทียบกับต้นทุนวัตถุดิบ ณ ตอนนั้นเท่าไหร่" (price as-of ต่อวันที่ ดู §2a ใน `02-...`)

## 3. Files ในโฟลเดอร์นี้

| File | เนื้อหา |
|------|---------|
| [`01-database-design.md`](./01-database-design.md) | ERD, DDL, migrations, triggers, views, RLS, การ migrate ข้อมูล |
| [`02-calculation-logic.md`](./02-calculation-logic.md) | สูตรคำนวณ, policy ราคา, timing, edge cases, ตาราง validate กับตัวอย่าง, ผลต่อ module เดิม |
| [`03-implementation-plan.md`](./03-implementation-plan.md) | แผนงานราย phase, ไฟล์ที่ต้องแก้, test plan, risks, rollback |

## 4. Key Assumptions / Decisions (เสนอให้ confirm)

| ID | Decision | เหตุผล |
|----|----------|--------|
| **D1** | **"กล่อง / ถุง" เป็น SKU แยกกัน** — แต่ **BOM คำนวณเป็นรายชิ้น sandwich**: **ถุง = 1 ชิ้น, กล่อง = 2 ชิ้น** (confirm 14/8/26) → BOM ของ SKU กล่อง = 2× usage ของ SKU ถุง, UI auto-generate กัน drift |
| **D2** | **Unit price = ราคาล่าสุดของ ingredient ในสัปดาห์นั้น** ("price as-of" จาก purchase ล่าสุด) ไม่ใช่ moving average | ซื้อเป็น batch รายสัปดาห์ → ราคา batch ปัจจุบันสะท้อนต้นทุนที่แท้จริงของสัปดาห์นั้นตรงกว่า average และทำได้ด้วย pure SQL view |
| **D3** | `products.cost` คงอยู่เป็น **calculated snapshot** (system เขียนทับตอน recalc) + เพิ่ม `products.cost_override` (nullable) สำหรับ override กรณีพิเศษ | Module เก่า (receipts, claims, dashboard) อ่านจาก `products.cost` / `channel_products.cost` อยู่แล้ว → ไม่แตก |
| **D4** | Recalc ทำใน **Postgres trigger function** (ไม่ใช่แค่ app-level) | ปลอดภัยต่อทุก writer — ไม่ว่าจะบันทึกจาก UI, seed, หรือ curl ตรงก็ตาม ตัวเลขไม่เคย drift |
| **D5** | **packaging/ค่าคงที่** (กล่อง 2.7, กระดาษ 1.3) เป็น ingredient ที่มี `manual_unit_price` (ค่าคงที่ไม่ต้องซื้อจริง) หรือซื้อเป็น record ปกติก็ได้ | ใช้ pipeline เดียวกัน ไม่ต้องมี logic พิเศษแยก |

## 5. ✅ Q&A — Confirmed (14/8/26)

| # | คำถาม | **คำตอบ Confirm** | ผลกระทบต่อ design |
|---|--------|-------------------|-------------------|
| Q1 | Rounding rule | **CEIL (ปัดเศษขึ้น) ถ้ามีทศนิยม** — ค่าเต็มจำนวนอยู่ที่เดิม | ไม่ trunc ตอนกลาง เก็บเต็มทศนิยม → `CEIL(cost×100)/100` ครั้งเดียว ตอนจับเข้า `products.cost`; ค่าใหม่จะสูงกว่าตารางเก่าเล็กน้อย (เพราะเก่านับ floor) → กำไร conservative |
| Q2 | BOM ตัวเลขจริง | คิวพี: 1 ถุง = 36 ครั้ง · ทูน่า: **1 กระป๋อง 164 บาท, ใช้ได้ 4 ครั้ง** → 41 บาท/ครั้ง · BOM ต่อชิ้นแซนด์วิช: คิวพี 1 ครั้ง, ทูน่า 1 ครั้ง (confirm 14/8/26 — ทุกข้อ clear)|
| Q3 | ถุง vs กล่อง | **ถุง = 1 ชิ้น, กล่อง = 2 ชิ้น** → คำนวณเป็น **รายชิ้น** | D1: BOM per-piece, qty กล่อง = 2× qty ถุง (auto) |
| Q4 | ซื้อซ้ำวันเดียวกัน | **ได้** | DROP unique index `(ingredient_id, purchase_date)` — เตรียมไว้ใน P0 แล้ว |
| Q5 | Channel override / GP | **GP% = ค่าช่องทาง (commission) ไม่ใช่ต้นทุน** — ต้นทุนมี source เดียว = BOM. `channel_products.cost` คงเป็น manual override เท่านั้น. GP% ใช้หักระดับ channel ใน P&L + เป็น pricing suggestion (ดู `02-...` §6) | P3: อ่าน effective cost ตาม priority, `03-...` P4.3: channel fee view |
