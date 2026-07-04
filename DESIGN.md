---
name: "From Home Sandwich Web Design"
category: Brands
surface: web
colors:
  background: "#ffffff"      # var(--background) → #FFFFFF
  foreground: "#000000"      # var(--foreground) → #000000
  surface: "#f9f8f8"         # subtle card panels (derived)
  primary: "#695848"         # var(--primary) → Brown
  secondary: "#ffffff"       # var(--secondary) → White
  action: "#e0b554"          # var(--action) → Soft Gold
  success: "#5e845a"         # var(--success) → Sage Green
  error: "#d9827a"           # var(--error) → Soft Red
  border: "#000000"          # derived from foreground
---

# From Home Sandwich Web Design

> Category: Brands / Web App

> Surface: web

*Warm and natural — clean and modern with white canvas, brown text, and sage green accents.*

shadcn/ui + Tailwind design system with Kanit typography, warm brown primary (#695848), soft gold action accents, sage green success, and soft red error. White canvas with natural warmth.

## Color Palette (Source: `old_web/globals.css` + `tailwind.config.ts`)

| Role | Name | Hex | CSS Variable | Usage |
| --- | --- | --- | --- | --- |
| background | Background | `#ffffff` | `var(--background)` | white page canvas & card backgrounds |
| foreground | Foreground | `#000000` | `var(--foreground)` | black body text, headings & dividers |
| surface | Surface | `#f9f8f8` | — | subtle card panels & modal surfaces in shadcn/ui |
| **primary** | Primary (Brown) | `#695848` | `var(--primary)` | main UI color — headers, key buttons, active states |
| secondary | Secondary | `#ffffff` | `var(--secondary)` | card backgrounds where primary is text |
| action | Action (Gold) | `#e0b554` | `var(--action)` | action highlights, add-to-cart, icon actions |
| success | Success (Green) | `#5e845a` | `var(--success)` | success states, confirmed bills, checkmarks |
| error | Error / Destructive | `#d9827a` | `var(--error)` | cancel buttons, destructive actions, error messages |

## Typography
- **Display:** Kanit — weights 100–900 — fallbacks: sans-serif (used for page titles & large headers)
- **Body:** Kanit — weights 100–900 — fallbacks: sans-serif (used for product names, prices, & UI labels)

## Voice & Tone

- **Adjectives:** Warm, Natural, Clean, Modern
- **Tone:** Warm & Natural — clean and modern with white canvas, brown text, sage green accents. Brown (#695848) and sage green (#5E845A) create warmth; white background keeps it fresh.

### Messaging pillars
- Warm & Natural: brown and sage green tones feel organic and inviting for a food/sandwich brand
- Clean & Modern: white canvas with black/brown text for clarity in data-heavy UI (bills, dashboards)

### Vocabulary
- **Use:** Primary brown (#695848) for headings and key text, Soft Gold action color (#E0B554) for highlights and interactive elements, Sage Green success state (#5E845A) for active/confirmed states, White surface paired with primary for card components, shadcn/ui component conventions
- **Avoid:** Overly saturated colors, Harsh shadows or heavy effects

## Imagery

- **Style:** Warm natural photography, clean and unstyled
- **Subjects:** Product photos (sandwiches, drinks), bill previews, dashboard charts
- **Treatment:** Minimal styling with subtle borders and soft white surfaces; consistent with web app context
- **Avoid:** Overly saturated colors, Harsh shadows or heavy effects

## Layout

- **Radius:** 8px (standard shadcn/ui card & button radius)
- **Border weight:** 1px
- **Spacing:** Tailwind spacing scale (4–24px) for consistent padding/margins in grids and lists

### Posture rules
- Use colors from globals.css as the primary palette — do not invent new colors unless necessary
- Key buttons use `bg-primary text-secondary` or `text-action` for emphasis
- General text uses `text-primary` (default color on body)
- shadcn/ui mapped tokens: 
  - `--primary → #695848` (Brown)
  - `--secondary → #ffffff` (White)
  - `--action → #e0b554` (Gold)
  - `--success → #5e845a` (Green)
  - `--destructive → #d9827a` (Red)
- Component kit covers Button, Card, Form, Navigation, Dialog, and Table for dashboard data

---
*Design compiled from old_web globals.css & tailwind.config.ts. Ready for Next.js 19 + shadcn/ui implementation.*
