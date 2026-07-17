# html2canvas Research — old_web

> Research from `old_web/` codebase for html2canvas receipt capture implementation.

---

## 1. Dependency

**File:** `old_web/package.json`

```
"html2canvas": "^1.4.1"
```

- Version: `^1.4.1`
- Category: production dependency
- No other screenshot/canvas packages used

---

## 2. Logic

### 2.1 Import & Config

**File:** `old_web/features/presentation/transaction/components/receipt.tsx`

```typescript
import html2canvas from "html2canvas";
```

### 2.2 Capture Function (lines 135–161)

```typescript
const download = async () => {
  if (captureRef.current && props.receipt.kind === "printing") {
    // 1. Inject CSS to fix image rendering
    const style = document.createElement("style");
    document.head.appendChild(style);
    style.sheet?.insertRule(
      "body > div:last-child img { display: inline-block; }"
    );

    // 2. Scroll container to bottom
    captureRef.current.scrollTop = captureRef.current.scrollHeight;

    // 3. Capture DOM → canvas
    const canvas = await html2canvas(captureRef.current, {
      scale: window.devicePixelRatio,  // HiDPI-aware
      x: 0,
      y: 0,
      logging: true,
    });

    // 4. Canvas → JPEG data URL
    const image = canvas.toDataURL("image/jpeg", 1.0);

    // 5. Trigger file download
    const link = document.createElement("a");
    link.href = image;
    link.download = `${receipt_no || "screenshot"}.jpg`;
    link.click();
  }
};
```

### 2.3 html2canvas Options

| Option | Value | Purpose |
|---|---|---|
| `scale` | `window.devicePixelRatio` | Retina/HiDPI rendering |
| `x` | `0` | Full width capture |
| `y` | `0` | Top of container |
| `logging` | `true` | Debug logging |

### 2.4 Result Handling

- **NOT** clipboard copy
- **NOT** thermal printing
- **File download as `.jpg`** via `<a download>` link
- Filename: receipt number or `"screenshot.jpg"`

### 2.5 Trigger Chain

1. User creates bill → POST `/api/receipt` → receives `receipt_no`
2. Receipt state: `kind: "preview"` → `kind: "printing"`
3. "Download" button appears (disabled when no products)
4. Click → `setTimeout(() => download(), 0)` → html2canvas → JPEG download

---

## 3. Component & Element Structure

### 3.1 Target Element

**Ref:** `captureRef = useRef<HTMLDivElement>(null)`

**Attached to:**
```tsx
<div ref={captureRef} className="px-[14px] py-[24px]">
  {/* receipt content */}
</div>
```

This is the **inner content div** — NOT the outer wrapper (which has borders, rounding, overflow, `flip-y` class).

### 3.2 DOM Structure of Captured Element

```
<div ref={captureRef} className="px-[14px] py-[24px]">
  ├── [1] Merchant Logo          (img, 100x89)
  ├── [2] Customer Name          (optional, h4, centered)
  ├── [3] Date + Receipt No      (paragraphs)
  ├── [4] Dashed separator
  ├── [5] Products list          (loop)
  │      ├── Product name + amount × unit price
  │      ├── Product options (indented)
  │      └── Line total (right-aligned)
  ├── [6] Dashed separator
  ├── [7] Grand Total            (left label, right value)
  └── [8] Socials footer         (optional: slogan + icons)
```

### 3.3 Workarounds Found

1. **CSS rule injection** — Forces `display: inline-block` on images to fix html2canvas rendering with `next/image`
2. **`flip-y` class** — 360° Y-axis rotation on outer wrapper (repaint hack)

### 3.4 Parent Integration

**File:** `old_web/features/presentation/transaction/receipt.page.tsx`

```tsx
<ReceiptPreview
  receipt={recepit}
  onClear={onClear}
  onUpdateReceiptPreview={updateReceipt}
  onCreate={onCreateBill}
/>
```

- Parent manages receipt state via `newRecepit()` factory
- Two modes: `"preview"` (build receipt) → `"printing"` (finalized, downloadable)

### 3.5 Types

**File:** `old_web/features/domain/receipt.type.ts`

- `Recepit.kind`: `"preview"` | `"printing"`
- `Recepit` interface: `merchant_logo`, `receipt_no`, `products`, `grand_total`, `socials`

---

## 4. Key Takeaways for Rewrite

1. **Single use case** — html2canvas used for one thing: download receipt as JPEG
2. **Client-side only** — runs in browser, no server rendering
3. **No clipboard/thermal** — just browser file download
4. **Workarounds needed** — image `inline-block` fix and `flip-y` hack for html2canvas + Next.js compatibility
5. **Clean capture target** — inner div with padding, not the outer styled wrapper

---

*File auto-generated from research on `old_web/` codebase.*
