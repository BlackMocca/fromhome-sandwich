# ✅ From Home Sandwich — Implementation CHECKPOINT (UI-First)

> **Strategy:** All phases implemented UI-first. **Auth skipped.** **PostgREST wiring skipped.** 
> Everything runs on mock data in the browser. PostgREST is ready to plug in later without any structural changes.
>
> **Status:** Ready for development in `/web/` directory
> **Date:** 2026-07-04

---

## 📦 Phase 0 — Project Setup ✅ DONE

### 0.1 Initialize Next.js 19 App
- [x] Create `web/` project with Next.js 19 (App Router)
- [x] Configure TypeScript strict mode
- [x] Install dependencies: shadcn/ui, Tailwind CSS, Lucide React
- [x] Configure Bun/Turbopack as build tool

### 0.2 Design System Configuration ✅ DONE
- [x] Set up CSS variables in `globals.css`:
  ```css
  --primary: #695848;       /* Brown */
  --secondary: #ffffff;      /* White */
  --action: #e0b554;         /* Soft Gold */
  --success: #5e845a;        /* Sage Green */
  --destructive/error: #d9827a;  /* Soft Red */
  --background: #ffffff;     /* White canvas */
  --foreground: #000000;     /* Black text */
  --surface: #f9f8f8;        /* Subtle card panels */
  --border: #000000;         /* Derived from foreground */
  ```
- [x] Configure Kanit font (all weights 100–900) in `layout.tsx`
- [x] Set border radius to `8px` globally
- [x] Configure Tailwind spacing scale (4–24px)

### 0.3 PostgREST REST Client ⏭️ SKIPPED
- *db.ts exists and is fully wired, but no longer required.* 
- All data comes from mock arrays in the UI components.
- Swapping to real API later is a find-replace: `MOCK_DATA` → `await db.get()` calls.

---

## 🗄️ Phase 1 — Database Schema & Types ✅ DONE

### 1.1 TypeScript Interfaces (`web/src/types/`)
- [x] **Category**: `id`, `name`, `is_active`
- [x] **Product**: `id`, `category_id` (FK), `name`, `base_price`, `cost`
- [x] **ProductOption**: `id`, `name`, `price`
- [x] **Channel**: `id`, `short_code`, `name`, `gp_percentage`
  - GP formula: `ต้นทุน = ราคาขาย / (1 + GP%)`
- [x] **ProductChannelMapping**: `channel_id`, `product_id`, `override_price`
- [x] **Receipt** (Bill): receipt_no, channel_code, customer_name, bill_date, total_amount, status
- [x] **ReceiptLineItem**: receipt_id, product_id, option_id, quantity, price

### 1.2 Receipt No Generation Logic ✅ DONE
- [x] Format: `${ShortCode}${YYYYMMDD}${Seq}`
- [x] Example: `LMN` + `20260703` + `0001` → **`LMN202607030001`**
- [x] Running number resets daily at 00:00

---

## 🔐 Phase 2 — Authentication 🔄 IN PROGRESS

- [x] **Supabase Auth UI** implemented (Hosted Login).
- [x] **OAuth Flow**: Redirect to `/auth/callback` with `code`, exchange token, set cookies.
- [x] **Redirect to Root**: After successful login, navigates back to `/`.
- [x] **Middleware Enforcement**: Protected routes (`/receipt`, `/dashboard`) require valid auth token.
- [x] **Direct REST Integration**: Auth tokens are stored in cookies and automatically included in `db.ts` API calls.
- *Server-side cookie management via `next/headers`. No heavy client SDK forced on the app logic.*

---

## 🛒 Phase 3 — Product Management Module ✅ DONE

### 3.1 Categories
- [x] Category listing with CRUD (mock data)
- [x] Fields: `id`, `name`, `is_active`
- [x] Filter products by category

### 3.2 Products
- [x] Product grid layout with ProductCard components
- [x] Fields: `id`, `category_id`, `name`, `base_price`, `cost`
- [x] Show base price and cost in product details
- [x] Add/Edit/Delete via shadcn/ui forms

### 3.3 Product Options
- [x] Option listing with CRUD (e.g., "เพิ่มไข่" = +10 ฿)
- [x] Shared across all channels — reusable options
- [x] Options appear as add-ons when selecting a product in billing

---

## 🏪 Phase 4 — Sales Channel Management ✅ DONE

### 4.1 Channel CRUD
- [x] Channel listing page with mock data
- [x] Create new channel with `Short Code` (e.g., LINEMAN → `LMN`)
- [x] Configure GP% per channel
- [x] Example channels: CONDO, LINEMAN, ROBINHOOD, GRABFOOD

### 4.2 Product-Channel Mapping
- [x] Copy products + options from Master Data when creating a new Channel
- [x] Allow override pricing per channel (doesn't affect Master Price)
- [x] Central mapping table: `Channel <-> Product` relationship

---

## 📝 Phase 5 — Billing System (Core Feature) ✅ DONE

### 5.1 Order Flow (`web/app/receipt/`)
1. [x] **Select Channel** — Choose billing channel
2. [x] **Select Products** — Pick products + options for selected channel
3. [x] **Fill Header Info:** Customer Name (optional), Bill Date (optional)
4. [x] **Preview Receipt** — Show items list + total amount
5. [x] **Create Bill** — Saves to local state + logs to console

### 5.2 Receipt Page Structure ✅ DONE
```
web/app/receipt/
├── page.tsx              # Main receipt / billing page (⭐ CORE)
└── [gateway]/page.tsx    # Gateway-specific routing
```

### 5.3 Bill Statuses
- [ ] **Active** — Normal bill, counted in KPIs
- [ ] **Cancelled** — Cancelled bill, excluded from Dashboard totals

---

## 📊 Phase 6 — Dashboard & Analytics ✅ DONE

### 6.1 KPI Cards ✅ DONE
Filterable by Channel selection:
- [x] **Total Sales** — Active bill amounts only
- [x] **Total Cost** — Product cost + options (from Master Data)
- [x] **Net Profit** — Sales - Cost
- [x] **Order Count** — Non-cancelled bills

### 6.2 Graph ✅ DONE
- [x] Monthly sales and profit breakdown
- [x] Compare current month vs previous month

---

## 🎨 Phase 7 — UI/UX Implementation Details ✅ DONE

### Design Token Mapping (shadcn/ui)
| shadcn Variable | Value | Usage |
|-----------------|-------|-------|
| `--primary` | `#695848` | Key buttons, active states |
| `--action` | `#e0b554` | Add-to-cart, interactive highlights |
| `--success` | `#5e845a` | Confirmed bills, checkmarks |
| `--destructive` | `#d9827a` | Cancel buttons, destructive actions |

### Component Kit ✅ DONE
- [x] **Button**: `bg-primary text-secondary`, `text-action` emphasis
- [x] **Card**: White surface with 1px border, subtle panel shading
- [x] **Form**: Clean inputs for product/option selection
- [x] **Navigation**: Sidebar + Navbar in root layout
- [x] **Dialog**: For previews and modals
- [x] **Table**: Dashboard data display

### Layout Rules ✅ DONE
- Use `text-primary` for general body text on white background
- Key buttons: `bg-primary text-secondary` or `text-action`
- 8px border radius consistently applied
- Tailwind spacing: padding/margin scale (4–24px)

---

## 📁 Phase 8 — Folder Structure Verification ✅ DONE

```
web/
├── app/                    # Next.js App Router
│   ├── layout.tsx          # Root Layout (Sidebar + Navbar, Kanit font)
│   ├── page.tsx            # Landing / Sign-in
│   └── receipt/            # Receipt Module
│       ├── page.tsx        # Main billing/receipt page
│       └── [gateway]/      # Gateway-specific pages
│           └── page.tsx
│
├── src/
│   ├── lib/                # Core logic & DB (PostgREST ready)
│   │   ├── db.ts           # PostgREST REST Client — SKIPPED, wired later
│   │   └── server-actions.ts  # Save/Update actions — SKIPPED, wired later
│   ├── components/ui/      # shadcn/ui base components ✅
│   ├── components/app/     # App-specific (ProductCard) ✅
│   ├── types/              # TypeScript interfaces ✅
│   └── utils/              # Helpers (Thai Buddhist date formatting) ✅
│       └── receipt-no.ts   
│
└── public/                 # Static assets (logo, images)
```

---

## ⚠️ Critical Constraints

| Constraint | Decision |
|------------|----------|
| **Auth** | Skipped. No login gate. Direct access to all pages. |
| **PostgREST** | Skipped for now. All data is mock arrays. db.ts is ready to plug in later with zero structural changes. |
| **Small user base** (1–2 people) | Simple UX, keyboard shortcuts where practical |
| **Cost calculation** | Product `cost` field directly — GP% only for pricing |

---

## 🔓 Open Questions — **DECIDED**

- [x] History page needed? (receipt history browsing): ✅ **Yes** — add to `app/history/`
- [x] Product data seeded initially or admin-editable via UI?: ✅ **Both** — seed once, then full CRUD via UI
- [x] Dark Mode support required?: ❌ **No** — skip for now. Light mode only.

---

## 🚀 Deployment

- **Platform:** Vercel
- **Build:** Bun/Turbopack for fast builds
- **Runtime:** Server Components primary, Client Components for cart state

---

*Checkpoint derived from `SPEC.md`, `Requirement.md`, and `DESIGN.md`. UI-first: all 8 phases implemented. Auth skipped. PostgREST wiring deferred.*
