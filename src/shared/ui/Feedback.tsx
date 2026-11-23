import type { ReactNode } from 'react';
import { CircleAlert, Inbox, TriangleAlert } from 'lucide-react';
import { cn } from './cn';
import Button from './Button';

export function Spinner({ label = 'Loading' }: { label?: string }) {
  return (
    <span role="status" className="inline-flex items-center gap-2 text-sm text-charcoal-600">
      <span className="spinner" aria-hidden="true" />
      <span>{label}</span>
    </span>
  );
}

export function Skeleton({ className }: { className?: string }) {
  return <div aria-hidden="true" className={cn('animate-pulse rounded-lg bg-warm-200', className)} />;
}

/** Full-area loading placeholder for pages and panels. */
export function PageSkeleton() {
  return (
    <div role="status" aria-label="Loading page" className="space-y-4 p-1">
      <Skeleton className="h-8 w-1/3" />
      <Skeleton className="h-4 w-1/2" />
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {[0, 1, 2, 3].map((index) => (
          <Skeleton key={index} className="h-28" />
        ))}
      </div>
      <Skeleton className="h-64" />
    </div>
  );
}

interface StateProps {
  title: string;
  description?: string;
  action?: ReactNode;
  icon?: ReactNode;
  className?: string;
}

export function EmptyState({ title, description, action, icon, className }: StateProps) {
  return (
    <div className={cn('flex flex-col items-center justify-center rounded-xl border border-dashed border-warm-300 bg-warm-50 px-6 py-10 text-center', className)}>
      <div className="text-charcoal-400" aria-hidden="true">
        {icon ?? <Inbox size={32} />}
      </div>
      <p className="mt-3 font-medium text-charcoal-900">{title}</p>
      {description && <p className="mt-1 max-w-md text-sm text-charcoal-600">{description}</p>}
      {action && <div className="mt-4 flex flex-wrap justify-center gap-3">{action}</div>}
    </div>
  );
}

interface ErrorStateProps {
  title?: string;
  description?: string;
  onRetry?: () => void;
  className?: string;
}

export function ErrorState({ title = 'Something went wrong', description, onRetry, className }: ErrorStateProps) {
  return (
    <div role="alert" className={cn('flex flex-col items-center justify-center rounded-xl border border-danger-200 bg-danger-50 px-6 py-10 text-center', className)}>
      <CircleAlert size={32} className="text-danger-700" aria-hidden="true" />
      <p className="mt-3 font-medium text-danger-800">{title}</p>
      {description && <p className="mt-1 max-w-md text-sm text-danger-700">{description}</p>}
      {onRetry && (
        <Button className="mt-4" onClick={onRetry}>
          Try again
        </Button>
      )}
    </div>
  );
}

type AlertTone = 'info' | 'warning' | 'danger' | 'success';
const ALERT_STYLE: Record<AlertTone, string> = {
  info: 'border-secondary-200 bg-secondary-50 text-secondary-800',
  warning: 'border-warning-200 bg-warning-50 text-warning-800',
  danger: 'border-danger-200 bg-danger-50 text-danger-800',
  success: 'border-success-200 bg-success-50 text-success-800',
};

export function Alert({ tone = 'info', title, children, className }: { tone?: AlertTone; title?: string; children?: ReactNode; className?: string }) {
  return (
    <div role={tone === 'danger' ? 'alert' : 'status'} className={cn('flex gap-3 rounded-xl border px-4 py-3 text-sm', ALERT_STYLE[tone], className)}>
      <TriangleAlert size={18} className="mt-0.5 shrink-0" aria-hidden="true" />
      <div className="min-w-0">
        {title && <p className="font-semibold">{title}</p>}
        {children && <div className={title ? 'mt-0.5' : undefined}>{children}</div>}
      </div>
    </div>
  );
}
