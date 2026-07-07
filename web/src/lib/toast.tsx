'use client';

import * as React from 'react';
import * as Toast from '@radix-ui/react-toast';

/* ─── Types ─────────────────────────────────────── */
type ToastProps = {
  id?: string;
  title?: string;
  description?: string;
  action?: React.ReactNode;
};

interface ToastState {
  toasts: Array<ToastProps & { open: boolean }>;
}

/* ─── Context ───────────────────────────────────── */
const ToastContext = React.createContext<{
  toast: (props: Omit<ToastProps, 'id'>) => void;
  dismiss: (id?: string) => void;
  state: React.MutableRefObject<ToastState>;
}>({ toast: () => {}, dismiss: () => {}, state: { current: { toasts: [] } } });

/* ─── Provider ──────────────────────────────────── */
export function ToastProvider({ children }: { children: React.ReactNode }) {
  const [toasts, setToasts] = React.useState<Array<ToastProps & { open: boolean }>>([]);

  const stateRef = React.useRef<ToastState>({ toasts });
  stateRef.current = { toasts };

  const toast = React.useCallback((props: Omit<ToastProps, 'id'>) => {
    const id = Math.random().toString(36).slice(2, 9);
    setToasts(prev => [...prev, { ...props, id, open: true }]);
  }, []);

  const dismiss = React.useCallback((id?: string) => {
    setToasts(prev => prev.map(t => (id !== undefined && t.id === id) || id === undefined ? { ...t, open: false } : t));
    if (id !== undefined) {
      setTimeout(() => {
        setToasts(prev => prev.filter(t => t.id !== id));
      }, 300);
    } else {
      setTimeout(() => setToasts([]), 300);
    }
  }, []);

  return (
    <Toast.Provider swipeDirection="right">
      <ToastContext.Provider value={{ toast, dismiss, state: stateRef }}>
        {children}
      </ToastContext.Provider>
    </Toast.Provider>
  );
}

/* ─── Hook ──────────────────────────────────────── */
export function useToast() {
  const context = React.useContext(ToastContext);
  if (!context) throw new Error('useToast must be used within a ToastProvider');
  return context;
}

/* ─── Shorthand toast() for import anywhere ─────── */
let globalToast: ReturnType<typeof useToast>['toast'] | null = null;

export function setGlobalToast(fn: typeof globalToast) {
  globalToast = fn;
}

export const toast = (props: Omit<ToastProps, 'id'>) => {
  if (globalToast) globalToast(props);
};

/* ─── Toaster Component (renders the Radix roots) ─ */
export function Toaster() {
  const { state } = useToast();
  return (
    <>
      {state.current.toasts.map((t, i) => (
        <Toast.Root
          key={t.id}
          open={t.open}
          onOpenChange={(open) => { if (!open) t.open = false; }}
          className="max-w-sm w-full bg-white shadow-lg rounded-lg pointer-events-auto ring-1 ring-black/5 mb-3"
        >
          <div className="flex items-start gap-3 p-4">
            <div className={`mt-0.5 size-5 shrink-0 rounded-full flex items-center justify-center ${
              t.description?.includes('สร้าง') ? 'bg-emerald-100 text-emerald-600' :
              t.description?.includes('สำเร็จ') ? 'bg-emerald-100 text-emerald-600' :
              'bg-blue-100 text-blue-600'
            }`}>
              <svg width="12" height="12" viewBox="0 0 12 12" fill="currentColor">
                {t.description?.includes('สร้าง') || t.description?.includes('สำเร็จ') ? (
                  <path d="M9.5 3.5L4.75 8.25L2.5 6" stroke="currentColor" strokeWidth="1.5" fill="none" strokeLinecap="round"/>
                ) : (
                  <circle cx="6" cy="6" r="3" />
                )}
              </svg>
            </div>
            <div className="flex-1">
              {t.title && <Toast.Title className="text-sm font-semibold text-gray-900">{t.title}</Toast.Title>}
              {t.description && <Toast.Description className="mt-0.5 text-sm text-gray-600">{t.description}</Toast.Description>}
            </div>
          </div>
          <Toast.Close className="absolute top-3 right-3 text-gray-400 hover:text-gray-600">
            <svg width="12" height="12" viewBox="0 0 12 12" fill="currentColor">
              <path d="M9.5 2.5L2.5 9.5M2.5 2.5L9.5 9.5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/>
            </svg>
          </Toast.Close>
        </Toast.Root>
      ))}
      <Toast.Viewport className="fixed top-0 right-0 z-[100] flex flex-col gap-2 p-4 pointer-events-none">
      </Toast.Viewport>
    </>
  );
}
