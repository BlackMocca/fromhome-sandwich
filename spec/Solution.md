# Solution.md — บันทึก error และวิธีแก้ (Next.js / From Home Sandwich)

---

## `layout.tsx` : Error "metadata exported from Client Component" + "generateMetadata signature mismatch"

| วันที่พบ | 2026-07-04 |
|----------|------------|
| ไฟล์ที่เกี่ยวข้อง | `web/app/layout.tsx`, `web/app/Navbar.tsx`, `web/app/mobile-sidebar.ts` |

### 🔴 อาการ error

**Error 1:** `You are attempting to export "metadata" from a component marked with "use client"`  
เมื่อเพิ่ม `"use client"` หรือเมื่อ Next.js วินิจฉัย layout เป็น Client Component (เพราะใช้ `document` ใน module-level function + import จาก Navbar ที่เป็น Client Component) → `export const metadata` ใช้ไม่ได้

**Error 2:** `Turbopack build ผ่านแต่ Failed to type check` — signature ของ `generateMetadata(props, parent)` ไม่ตรงกับ Next.js ที่คาดหวัง

### ✅ วิธีแก้

| ขั้นตอน | รายละเอียด |
|---------|------------|
| **1. แยก sidebar functions ออกไฟล์ใหม่** | สร้าง `mobile-sidebar.ts` เก็บ `openMobileSidebar`, `closeMobileSidebar`, `subscribeMobileSidebar`, `unsubscribeMobileSidebar`, `MOBILE_SIDEBAR_TOGGLE` ออกจาก layout โดยตรง |
| **2. layout กลับเป็น Server Component** | ลบ `"use client"` ออกจาก `layout.tsx` → คืนสถานะ Server Component ให้ `metadata`/`generateMetadata` ทำงานได้ |
| **3. แก้ circular import** | `Navbar.tsx` เปลี่ยน import `openMobileSidebar` จาก `"./layout"` → `'./mobile-sidebar'` ตัดวงจร circular client cascade |
| **4. ใช้ generateMetadata แทน export const metadata** | เปลี่ยนเป็น `export async function generateMetadata(props: any, parent: ResolvingMetadata)` พร้อม import `ResolvingMetadata` |
| **5. Re-export functions กลับมา** | layout re-export ฟังก์ชันจาก mobile-sidebar สำหรับ backward compatibility |

### 📁 โครงสร้างหลังแก้

```
layout.tsx (Server Component)
  └─ generateMetadata(props, parent: ResolvingMetadata) ← signature ถูกต้อง
  
Navbar.tsx ("use client")
  └─ openMobileSidebar ← จาก mobile-sidebar.ts ไม่ circular
  
mobile-sidebar.ts (pure module)
  └─ export functions ทั้งหมดที่ layout และ Navbar ใช้ร่วมกัน
```

### 🔧 Code snippet สำคัญ

**mobile-sidebar.ts:**
```ts
export const MOBILE_SIDEBAR_TOGGLE = 'mobile-sidebar:toggle';
export function openMobileSidebar(): void { document.dispatchEvent(...) }
// ... ฟังก์ชันอื่น ๆ
```

**layout.tsx:**
```ts
import type { Metadata, ResolvingMetadata } from 'next';
export async function generateMetadata(props: any, parent: ResolvingMetadata): Promise<Metadata> {
  return { title: ..., description: ... };
}
export { openMobileSidebar, closeMobileSidebar, ... } from './mobile-sidebar';
```

**Navbar.tsx:**
```tsx
"use client";
import { openMobileSidebar } from './mobile-sidebar'; // ไม่ circular แล้ว ✓
```

---

*สร้างเมื่อ 2026-07-04 — บันทึกเพื่อให้อาจค้นหาวิธีแก้ในภายหลัง*
