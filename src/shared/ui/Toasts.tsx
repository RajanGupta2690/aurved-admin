import { useCallback, useMemo, useRef, useState } from 'react';
import type { ReactNode } from 'react';
import { CheckCircle2, Info, TriangleAlert, X, XCircle } from 'lucide-react';
import { cn } from './cn';
import { ToastContext } from './toastContext';
import type { ToastApi } from './toastContext';

type Tone = 'success' | 'error' | 'info' | 'warning';
interface ToastItem {
  id: number;
  tone: Tone;
  message: string;
}

const ICONS = { success: CheckCircle2, error: XCircle, info: Info, warning: TriangleAlert };
const STYLES: Record<Tone, string> = {
  success: 'border-success-200 bg-success-50 text-success-800',
  error: 'border-danger-200 bg-danger-50 text-danger-800',
  info: 'border-secondary-200 bg-secondary-50 text-secondary-800',
  warning: 'border-warning-200 bg-warning-50 text-warning-800',
};
const MAX_VISIBLE = 4;

/** Mount once near the root. Use useToast() anywhere below it. */
export function ToastProvider({ children }: { children: ReactNode }) {
  const [items, setItems] = useState<ToastItem[]>([]);
  const counter = useRef(0);

  const dismiss = useCallback((id: number) => setItems((current) => current.filter((item) => item.id !== id)), []);

  const push = useCallback(
    (tone: Tone, message: string) => {
      const id = ++counter.current;
      setItems((current) => [...current.slice(-(MAX_VISIBLE - 1)), { id, tone, message }]);
      // Errors stay longer so they can be read.
      setTimeout(() => dismiss(id), tone === 'error' ? 9000 : 5000);
    },
    [dismiss],
  );

  const api = useMemo<ToastApi>(
    () => ({
      success: (message) => push('success', message),
      error: (message) => push('error', message),
      info: (message) => push('info', message),
      warning: (message) => push('warning', message),
    }),
    [push],
  );

  return (
    <ToastContext.Provider value={api}>
      {children}
      <div className="pointer-events-none fixed right-4 top-4 z-[80] flex w-[min(24rem,calc(100vw-2rem))] flex-col gap-2">
        {items.map((item) => {
          const Icon = ICONS[item.tone];
          return (
            <div
              key={item.id}
              role={item.tone === 'error' ? 'alert' : 'status'}
              className={cn('pointer-events-auto flex items-start gap-3 rounded-xl border p-3 shadow-lg animate-fade-in', STYLES[item.tone])}
            >
              <Icon size={20} className="mt-0.5 shrink-0" aria-hidden="true" />
              <p className="flex-1 text-sm font-medium">{item.message}</p>
              <button type="button" onClick={() => dismiss(item.id)} aria-label="Dismiss message" className="rounded p-1 hover:bg-white/60">
                <X size={14} aria-hidden="true" />
              </button>
            </div>
          );
        })}
      </div>
    </ToastContext.Provider>
  );
}
