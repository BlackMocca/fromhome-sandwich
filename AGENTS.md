# AGENTS.md

## 📚 Context & Core Files (Always Read)
You are working on **From Home Sandwich**, a rewrite of the `old_web` codebase into a modern Next.js 19 web app. 
When starting any task, designing UI, or writing code, you must strictly consult these files:

### 1. [DESIGN.md](./DESIGN.md) (Root)
- **Role**: The source of truth for the Design System.
- **Key Info**: 
    - **Colors**: Primary Brown `#695848`, Soft Gold `#e0b554`, Sage Green `#5E845A`.
    - **Typography**: Kanit (all weights).
    - **UI Style**: shadcn/ui with Tailwind utility-first.
- **Instruction**: Map your UI components to these tokens directly. Do not invent new colors unless necessary.

### 2. [specs/](./specs/) Directory 
*(If files are in root, treat `SPEC.md` and `Requirement.md` as part of the "specs")*
- **Role**: Contains technical architecture, database schema (PostgREST), and business logic.
- **Key Files**: 
    - **[SPEC.md](./specs/SPEC.md)**: Next.js 19 setup, Supabase REST API strategy.
    - **[Requirement.md](./specs/Requirement.md)**: Product management, Billing flow, Dashboard KPIs.
- **Instruction**: Follow the database constraints (Direct REST, no IPv6 issues) and billing rules defined here.

---

## 🛠️ Tech Stack & Implementation Rules
- **Framework**: Next.js 19 (App Router, Server Components).
- **Database**: Supabase (PostgreSQL) via PostgREST (Direct REST API).
- **UI Library**: shadcn/ui + Tailwind CSS.
- **Deployment**: Vercel.

### Coding Standards:
1. **Strict TypeScript**: Use interfaces for DB entities from `specs/SPEC.md`.
2. **Server Actions**: Prefer Server Components and Actions for data fetching/mutations.
3. **Design Compliance**: Ensure all UI matches the **Warm & Natural** theme (Brown/Gold tones).
4. **Code Structure**: 
    - `app/` for routes.
    - `components/ui/` for shadcn components.
    - `lib/` for Supabase REST client logic.
    - `types/` for interfaces.

---

## 💡 Workflow Summary
1. **Load Context**: Read [DESIGN.md](./DESIGN.md) and relevant specs from [specs/](./specs/).
2. **Design & Code**: Generate code that strictly follows the Design System and Specs (Billing logic, DB schema).
3. **Verify**: Check against design tokens (`bg-primary`, `text-action`) and technical constraints.

---
*File auto-generated to ensure AI agents always reference the core specs and design system.*
