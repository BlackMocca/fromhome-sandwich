/** Mobile sidebar event keys — exported for both layout and Navbar */
export const MOBILE_SIDEBAR_TOGGLE = 'mobile-sidebar:toggle';

// Document event keys for mobile sidebar toggle (for use in Server Components)
export function openMobileSidebar(): void {
  document.dispatchEvent(new CustomEvent(MOBILE_SIDEBAR_TOGGLE));
}

export function closeMobileSidebar(): void {
  document.dispatchEvent(
    new CustomEvent(MOBILE_SIDEBAR_TOGGLE, { detail: { forceClose: true } }),
  );
}

// Module-level handler reference to prevent re-creation on render
let isMobileSidebarOpen = false;
const handlers = new Map<string, () => void>();

export function subscribeMobileSidebar(cb: () => void): string {
  const id = Math.random().toString(36).substr(2, 9);
  handlers.set(id, cb);
  return id;
}

export function unsubscribeMobileSidebar(id: string): void {
  handlers.delete(id);
}
