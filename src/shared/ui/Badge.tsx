import type { ReactNode } from 'react';
import { cn } from './cn';

export type Tone = 'success' | 'warning' | 'danger' | 'info' | 'neutral' | 'brand';

const TONE_CLASS: Record<Tone, string> = {
  success: 'badge-success',
  warning: 'badge-warning',
  danger: 'badge-error',
  info: 'badge-info',
  neutral: 'badge-neutral',
  brand: 'bg-primary-50 text-primary-800 border border-primary-200',
};

export function Badge({ tone = 'neutral', children, className }: { tone?: Tone; children: ReactNode; className?: string }) {
  return <span className={cn('badge', TONE_CLASS[tone], className)}>{children}</span>;
}

const STATUS_TONE: Record<string, Tone> = {
  active: 'success',
  approved: 'success',
  completed: 'success',
  published: 'success',
  paid: 'success',
  present: 'success',
  enabled: 'success',
  verified: 'success',
  resolved: 'success',
  pending: 'warning',
  pending_approval: 'warning',
  draft: 'warning',
  on_leave: 'warning',
  scheduled: 'warning',
  in_review: 'warning',
  in_progress: 'warning',
  partial: 'warning',
  suspended: 'danger',
  rejected: 'danger',
  terminated: 'danger',
  overdue: 'danger',
  failed: 'danger',
  absent: 'danger',
  revoked: 'danger',
  expired: 'danger',
  inactive: 'neutral',
  archived: 'neutral',
  closed: 'neutral',
  resigned: 'neutral',
  disabled: 'neutral',
  cancelled: 'neutral',
};

/** Colored badge from a status word. Unknown words show as neutral. The text is always shown, never color alone. */
export function StatusBadge({ status, label }: { status: string; label?: string }) {
  const key = status.toLowerCase().replace(/[\s-]+/g, '_');
  return <Badge tone={STATUS_TONE[key] ?? 'neutral'}>{label ?? status.replace(/_/g, ' ')}</Badge>;
}
