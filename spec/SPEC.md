# 📋 From Home Sandwich — Specification Document (Rewrite)

> **Goal**: Rewrite `old_web` → New **web** project  
> **Status**: Draft — Focus on Tech Stack & Implementation  
> **Date**: 2026-07-03

---

## 1. Executive Summary
- **Project Name**: From Home Sandwich
- **Users**: Private (Active user ~1–2 คน)
- **Key Constraint**: เครื่อง dev ไม่มี IPv6 → ยิง API ตรงผ่าน **PostgREST REST API**
- **Deployment**: Vercel

---

## 2. Tech Stack (Core)

### A. Framework & Runtime
| Layer | Technology | Version/Notes |
|-------|------------|---------------|
| **Framework** | Next.js | 19.x (App Router, TypeScript) |
| **Runtime** | React | 19 (Server Components เป็นหลัก) |
| **Language** | TypeScript | Strict mode |
| **Build Tool** | Bun / Turbopack | รวดเร็ว (สืบต่อจาก `old_web`) |

### B. Database & Connectivity
| Layer | Technology | Notes |
|-------|------------|-------|
| **Database** | Supabase | PostgreSQL backend |
| **Access API**| PostgREST | **Direct REST calls** (`GET`/`POST`) เพื่อแก้ปัญหา IPv6 บนเครื่อง dev |
| **Client** | `fetch` (Native) | ไม่ต้องใช้ heavy client library — ใช้ headers (`apiKey`, `JWT`) ตรงๆ |

### C. UI & Styling
| Layer | Technology | Notes |
|-------|------------|-------|
| **UI Library**| shadcn/ui | Components แบบ copyable — เหมาะกับ AI Agent เขียน code ได้ง่าย |
| **Styling** | Tailwind CSS | สืบต่อจาก `old_web` — Utility-first |
| **Icons** | Lucide React | Standard set สำหรับ shadcn |

---

## 3. Implementation Strategy (How it works)

### A. Database Connection (PostgREST Direct)
เนื่องจากไม่มี IPv6 เราจะไม่ใช้ Supabase WebSocket/Realtime feature แต่จะใช้ REST API แทน:
1. **Endpoint**: `https://<supabase_url>/rest/v1/<table_name>`
2. **Request**: ใช้ `fetch` native หรือ lightweight wrapper สำหรับเพิ่ม headers (API Key, JWT)
3. **Response**: ข้อมูลที่ได้เป็น JSON ตรงกับ TypeScript interfaces

### B. Architecture: Server-First
1. **Server Components** ดึงข้อมูลสินค้า/ใบเสร็จจาก PostgREST โดยตรง
2. **Client Components** ใช้สำหรับ state การเลือกของในตะกร้า (Product Selection)
3. **Server Actions** ใช้ในการ save ข้อมูลลงฐานข้อมูล (เช่น สร้างใบเสร็จ)

### C. Folder Structure (`web/`)
```text
web/
├── app/                    ← Next.js App Router
│   ├── layout.tsx          → Root Layout (Sidebar + Navbar)
│   ├── page.tsx            → Landing / Sign-in
│   └── receipt/            → Receipt Module
│       ├── page.tsx        → Main Receipt Page
│       └── [gateway]/page.tsx → Gateway-specific (Condo, Lineman...)
│
├── src/
│   ├── lib/                ← Core Logic & DB
│   │   ├── db.ts           → PostgREST REST Client
│   │   └── server-actions.ts → Actions สำหรับ Save/Update ข้อมูล
│   ├── components/ui/      ← shadcn/ui base components (Button, Card, etc.)
│   ├── components/app/     ← App-specific (ProductCard, ReceiptPreview)
│   ├── types/              ← TypeScript interfaces (Product, Receipt)
│   └── utils/              ← Helpers (Date formatting Thai Buddhist Year)
│
└── public/                 ← Static assets (logo, images)
```

---

## 4. Requirements & Features (To be defined next)
*(เราจะมาเขียนรายละเอียดส่วนนี้ในขั้นตอนถัดไป)*

### A. Core Requirements (Draft)
- [ ] **Authentication**: User login (1–2 คน), Cookie-based JWT
- [ ] **Product Management**: จัดการสินค้า, หมวดหมู่ (Category), ตัวเลือก (Option)
- [ ] **Receipt Creation**: สร้างใบเสร็จ, คำนวณราคารวม, เลขที่ใบเสร็จ auto
- [ ] **Sale Gateways**: รองรับ CONDO, LINEMAN, ROBINHOOD, GRABFOOD

### B. Feature Breakdown (Draft)
1. **Sign-in Module** — หน้า Login
2. **Product Module** — แสดงสินค้า, กรองหมวดหมู่, เพิ่มลงตะกร้า
3. **Receipt Module** — ดู Preview, พิมพ์ใบเสร็จ (Print/Generate PDF), บันทึกประวัติ

---

## 5. Open Questions / Decisions Needed
1. [ ] ต้องการหน้า **History (ประวัติใบเสร็จ)** ด้วยหรือไม่?
2. [ ] ข้อมูลสินค้าจะ Seed ไว้เลย หรือ Admin แก้ผ่าน UI ได้?
3. [ ] รองรับ Dark Mode หรือไม่?
