# From Home Sandwich — New Web App

Rewrite of `old_web` → Modern Next.js 19 web app.

## Tech Stack

- **Next.js 19** (App Router, TypeScript)
- **React 19** (Server Components primary)
- **Supabase** PostgreSQL via PostgREST direct REST API
- **shadcn/ui + Tailwind CSS** — design tokens from `DESIGN.md`
- **Bun / Turbopack** for fast development

## Design Tokens (from DESIGN.md)

| Token | Value | Usage |
|-------|-------|-------|
| Primary | `#695848` | Key buttons, active states |
| Action | `#e0b554` | Add-to-cart, highlights |
| Success | `#5e845a` | Confirmed bills, checkmarks |
| Background | `#ffffff` | White canvas |
| Foreground | `#000000` | Black text |

## Getting Started

```bash
cd web/
cp .env.example .env.local
bun install
bun run dev        # → http://localhost:3000
bun run build
bun run start
```

## Project Structure

```
web/
├── app/                    Next.js App Router
│   ├── layout.tsx          Root Layout (Sidebar + Navbar)
│   ├── page.tsx            Landing / Sign-in
│   ├── receipt/            Billing module
│   └── dashboard/          KPI + analytics
├── src/
│   ├── lib/                Core logic & DB client
│   │   ├── db.ts           PostgREST REST client
│   │   └── server-actions.ts Create/update receipts
│   ├── components/ui/      shadcn/ui base components
│   ├── components/app/     App-specific (ProductCard)
│   ├── types/              TypeScript interfaces
│   └── utils/              Helpers (receipt-no generation)
└── public/                 Static assets
```

## Key Features

- **Billing System** — Channel selection, product picker, receipt preview, auto-generated receipt numbers (`${code}${YYYYMMDD}${seq}`)
- **Product Management** — Categories, products, options with Master Data + Channel override pricing
- **Dashboard KPIs** — Total sales, total cost, net profit, order count (Requirement.md §4)
- **Sales Channels** — Lineman, Robinhood, Grabfood, Condo (with GP% calculation)

## Architecture Notes

- PostgREST direct REST API (no WebSocket/Realtime — IPv6 constraint)
- Server-first: Server Components fetch data, Client Components handle cart state
- Cookie-based JWT authentication for 1-2 active users
