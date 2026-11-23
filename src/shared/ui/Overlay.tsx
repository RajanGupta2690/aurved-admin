import { useEffect, useId, useRef } from 'react';
import type { ReactNode, RefObject } from 'react';
import { createPortal } from 'react-dom';
import { X } from 'lucide-react';
import { cn } from './cn';

const FOCUSABLE =
  'a[href],button:not([disabled]),textarea:not([disabled]),input:not([disabled]),select:not([disabled]),[tabindex]:not([tabindex="-1"])';

/** Open overlays, top one last. Only the top one reacts to Escape and Tab. */
const stack: symbol[] = [];

function useOverlayBehavior(open: boolean, onClose: () => void, panel: RefObject<HTMLDivElement | null>) {
  // The latest onClose is read through a ref, so a new function each render never re-runs the effect.
  const closeRef = useRef(onClose);
  useEffect(() => {
    closeRef.current = onClose;
  });

  useEffect(() => {
    if (!open) return;
    const token = Symbol('overlay');
    stack.push(token);
    const previous = document.activeElement as HTMLElement | null;
    const node = panel.current;
    const first = node?.querySelector<HTMLElement>('[data-autofocus]') ?? node?.querySelector<HTMLElement>(FOCUSABLE);
    (first ?? node)?.focus();
    const overflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';

    const onKey = (event: KeyboardEvent) => {
      if (stack[stack.length - 1] !== token) return;
      if (event.key === 'Escape') {
        event.preventDefault();
        closeRef.current();
        return;
      }
      if (event.key !== 'Tab' || !node) return;
      const items = Array.from(node.querySelectorAll<HTMLElement>(FOCUSABLE)).filter((el) => el.getClientRects().length > 0);
      if (items.length === 0) {
        event.preventDefault();
        node.focus();
        return;
      }
      const firstItem = items[0];
      const lastItem = items[items.length - 1];
      if (event.shiftKey && (document.activeElement === firstItem || document.activeElement === node)) {
        event.preventDefault();
        lastItem.focus();
      } else if (!event.shiftKey && document.activeElement === lastItem) {
        event.preventDefault();
        firstItem.focus();
      }
    };
    document.addEventListener('keydown', onKey);

    return () => {
      document.removeEventListener('keydown', onKey);
      const index = stack.indexOf(token);
      if (index >= 0) stack.splice(index, 1);
      if (stack.length === 0) document.body.style.overflow = overflow;
      previous?.focus?.();
    };
  }, [open, panel]);
}

interface OverlayProps {
  open: boolean;
  onClose: () => void;
  title: string;
  description?: string;
  children: ReactNode;
  footer?: ReactNode;
  /** Clicking the dark area closes the overlay. Off by default so a stray click never loses typed data. */
  closeOnBackdrop?: boolean;
  size?: 'sm' | 'md' | 'lg' | 'xl';
}

const DIALOG_WIDTH = { sm: 'sm:max-w-md', md: 'sm:max-w-2xl', lg: 'sm:max-w-4xl', xl: 'sm:max-w-6xl' };
const DRAWER_WIDTH = { sm: 'sm:max-w-md', md: 'sm:max-w-xl', lg: 'sm:max-w-3xl', xl: 'sm:max-w-5xl' };

function Base({ placement, ...props }: OverlayProps & { placement: 'center' | 'right' | 'left' }) {
  const { open, onClose, title, description, children, footer, closeOnBackdrop = false, size = 'md' } = props;
  const panel = useRef<HTMLDivElement>(null);
  const titleId = useId();
  const descriptionId = useId();
  useOverlayBehavior(open, onClose, panel);
  if (!open) return null;

  const isDrawer = placement !== 'center';
  return createPortal(
    <div className={cn('fixed inset-0 z-[60] flex', placement === 'right' ? 'justify-end' : placement === 'left' ? 'justify-start' : 'items-end sm:items-center justify-center sm:p-4')}>
      <div className="absolute inset-0 bg-black/50" onClick={closeOnBackdrop ? onClose : undefined} aria-hidden="true" />
      <div
        ref={panel}
        role="dialog"
        aria-modal="true"
        aria-labelledby={titleId}
        aria-describedby={description ? descriptionId : undefined}
        tabIndex={-1}
        className={cn(
          'relative flex w-full flex-col bg-white shadow-2xl outline-none',
          isDrawer
            ? cn('h-full animate-fade-in', DRAWER_WIDTH[size])
            : cn('max-h-[92vh] rounded-t-2xl sm:rounded-2xl animate-slide-up sm:animate-fade-in', DIALOG_WIDTH[size]),
        )}
      >
        <div className="flex items-start justify-between gap-4 border-b border-warm-200 px-4 py-3 sm:px-6 sm:py-4">
          <div className="min-w-0">
            <h2 id={titleId} className="text-lg font-semibold text-charcoal-950">
              {title}
            </h2>
            {description && (
              <p id={descriptionId} className="mt-0.5 text-sm text-charcoal-600">
                {description}
              </p>
            )}
          </div>
          <button type="button" onClick={onClose} aria-label="Close" className="rounded-lg p-2 text-charcoal-600 hover:bg-warm-100">
            <X size={20} aria-hidden="true" />
          </button>
        </div>
        <div className="flex-1 overflow-y-auto px-4 py-4 sm:px-6">{children}</div>
        {footer && <div className="flex flex-wrap justify-end gap-3 border-t border-warm-200 px-4 py-3 sm:px-6">{footer}</div>}
      </div>
    </div>,
    document.body,
  );
}

/** Centered dialog (bottom sheet on phones). Traps focus, closes on Escape, returns focus. */
export function Dialog(props: OverlayProps) {
  return <Base {...props} placement="center" />;
}

/** Side panel for details and short forms. Same behavior as Dialog. */
export function Drawer(props: OverlayProps) {
  return <Base {...props} placement="right" />;
}

/** Panel from the left edge. Used for the menu on small screens. */
export function SideSheet(props: OverlayProps) {
  return <Base {...props} placement="left" />;
}
