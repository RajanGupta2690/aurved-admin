import { useRef } from 'react';
import type { KeyboardEvent, ReactNode } from 'react';
import { Link } from 'react-router-dom';
import { ChevronRight } from 'lucide-react';
import { cn } from './cn';

export interface Crumb {
  label: string;
  to?: string;
}

export function Breadcrumbs({ items }: { items: Crumb[] }) {
  if (items.length === 0) return null;
  return (
    <nav aria-label="Breadcrumb" className="mb-2">
      <ol className="flex flex-wrap items-center gap-1 text-sm text-charcoal-600">
        {items.map((item, index) => {
          const last = index === items.length - 1;
          return (
            <li key={`${item.label}-${index}`} className="flex items-center gap-1">
              {item.to && !last ? (
                <Link to={item.to} className="text-primary-700 hover:underline">
                  {item.label}
                </Link>
              ) : (
                <span aria-current={last ? 'page' : undefined} className={last ? 'font-medium text-charcoal-900' : undefined}>
                  {item.label}
                </span>
              )}
              {!last && <ChevronRight size={14} className="text-charcoal-400" aria-hidden="true" />}
            </li>
          );
        })}
      </ol>
    </nav>
  );
}

interface PageHeaderProps {
  title: string;
  description?: string;
  breadcrumbs?: Crumb[];
  actions?: ReactNode;
  /** Small text above the title, for example the screen id in review builds. */
  eyebrow?: string;
}

export function PageHeader({ title, description, breadcrumbs, actions, eyebrow }: PageHeaderProps) {
  return (
    <header className="mb-6">
      {breadcrumbs && <Breadcrumbs items={breadcrumbs} />}
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div className="min-w-0">
          {eyebrow && <p className="text-xs font-semibold uppercase tracking-wide text-primary-700">{eyebrow}</p>}
          <h1 className="text-2xl font-bold text-charcoal-950">{title}</h1>
          {description && <p className="mt-1 max-w-3xl text-sm text-charcoal-600">{description}</p>}
        </div>
        {actions && <div className="flex flex-wrap items-center gap-2">{actions}</div>}
      </div>
    </header>
  );
}

/** Classes for buttons that sit on the copper banner. Focus is white because the usual copper ring would vanish on copper. */
export const HERO_BUTTON = 'inline-flex items-center gap-2 rounded-xl bg-white px-4 py-2.5 text-sm font-medium text-primary-800 shadow-sm transition hover:bg-primary-50 focus-visible:outline-white';
export const HERO_BUTTON_QUIET = 'inline-flex items-center gap-2 rounded-xl border border-white/70 px-4 py-2.5 text-sm font-medium text-white transition hover:bg-white/10 focus-visible:outline-white';

/** The copper welcome banner at the top of a home page. Dark copper keeps white text at a readable contrast. */
export function PageHero({ eyebrow, greeting, title, description, note, badge, actions }: { eyebrow?: string; greeting?: string; title: string; description?: string; note?: string; badge?: ReactNode; actions?: ReactNode }) {
  return (
    <header className="mb-6 rounded-2xl bg-gradient-to-r from-primary-700 via-primary-700 to-primary-800 p-5 text-white shadow-lg shadow-primary-700/25 md:p-7">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div className="min-w-0">
          {eyebrow && <p className="text-xs font-semibold uppercase tracking-wide text-primary-100">{eyebrow}</p>}
          {greeting && <p className="text-sm font-medium text-primary-50">{greeting}</p>}
          <h1 className="text-2xl font-bold text-white md:text-3xl">{title}</h1>
          {description && <p className="mt-1 max-w-3xl text-sm text-primary-50">{description}</p>}
          {note && <p className="mt-1 max-w-3xl text-sm text-primary-100">{note}</p>}
        </div>
        {badge}
      </div>
      {actions && <div className="mt-4 flex flex-wrap items-center gap-2">{actions}</div>}
    </header>
  );
}

export function Card({ title, description, actions, children, className, padded = true }: { title?: string; description?: string; actions?: ReactNode; children: ReactNode; className?: string; padded?: boolean }) {
  return (
    <section className={cn('card !p-0 overflow-hidden', className)}>
      {(title || actions) && (
        <div className="flex flex-wrap items-start justify-between gap-3 border-b border-warm-200 px-4 py-3 md:px-6">
          <div>
            {title && <h2 className="font-semibold text-charcoal-950">{title}</h2>}
            {description && <p className="mt-0.5 text-sm text-charcoal-600">{description}</p>}
          </div>
          {actions && <div className="flex flex-wrap gap-2">{actions}</div>}
        </div>
      )}
      <div className={padded ? 'p-4 md:p-6' : undefined}>{children}</div>
    </section>
  );
}

export interface TabItem {
  id: string;
  label: string;
  badge?: string | number;
  disabled?: boolean;
}

interface TabsProps {
  items: TabItem[];
  value: string;
  onChange: (id: string) => void;
  label: string;
  className?: string;
}

/** Tab list with arrow-key, Home and End support. Render the panel yourself with role="tabpanel". */
export function Tabs({ items, value, onChange, label, className }: TabsProps) {
  const refs = useRef<Record<string, HTMLButtonElement | null>>({});
  const enabled = items.filter((item) => !item.disabled);

  const onKeyDown = (event: KeyboardEvent<HTMLDivElement>) => {
    const index = enabled.findIndex((item) => item.id === value);
    let next = -1;
    if (event.key === 'ArrowRight') next = (index + 1) % enabled.length;
    else if (event.key === 'ArrowLeft') next = (index - 1 + enabled.length) % enabled.length;
    else if (event.key === 'Home') next = 0;
    else if (event.key === 'End') next = enabled.length - 1;
    if (next < 0) return;
    event.preventDefault();
    const target = enabled[next];
    onChange(target.id);
    refs.current[target.id]?.focus();
  };

  return (
    <div className={cn('overflow-x-auto border-b border-warm-200', className)}>
      <div role="tablist" aria-label={label} onKeyDown={onKeyDown} className="flex min-w-max">
        {items.map((item) => {
          const selected = item.id === value;
          return (
            <button
              key={item.id}
              ref={(node) => {
                refs.current[item.id] = node;
              }}
              type="button"
              role="tab"
              id={`tab-${item.id}`}
              aria-selected={selected}
              aria-controls={`panel-${item.id}`}
              tabIndex={selected ? 0 : -1}
              disabled={item.disabled}
              onClick={() => onChange(item.id)}
              className={cn(
                'whitespace-nowrap border-b-2 px-4 py-3 text-sm font-medium transition-colors disabled:opacity-50',
                selected ? 'border-primary-700 text-primary-700' : 'border-transparent text-charcoal-600 hover:text-charcoal-900',
              )}
            >
              {item.label}
              {item.badge !== undefined && (
                <span className="ml-2 rounded-full bg-warm-100 px-2 py-0.5 text-xs text-charcoal-700">{item.badge}</span>
              )}
            </button>
          );
        })}
      </div>
    </div>
  );
}

export function TabPanel({ id, value, children }: { id: string; value: string; children: ReactNode }) {
  if (id !== value) return null;
  return (
    <div role="tabpanel" id={`panel-${id}`} aria-labelledby={`tab-${id}`} tabIndex={0} className="pt-6 outline-none">
      {children}
    </div>
  );
}

/** Label and value pairs. Use for read-only details. */
export function DescriptionList({ items, columns = 2 }: { items: Array<{ label: string; value: ReactNode }>; columns?: 1 | 2 | 3 }) {
  const grid = columns === 1 ? '' : columns === 2 ? 'md:grid-cols-2' : 'md:grid-cols-3';
  return (
    <dl className={cn('grid grid-cols-1 gap-x-6 gap-y-4', grid)}>
      {items.map((item) => (
        <div key={item.label}>
          <dt className="text-sm text-charcoal-500">{item.label}</dt>
          <dd className="mt-0.5 text-sm font-medium text-charcoal-900 break-words">{item.value ?? 'Not set'}</dd>
        </div>
      ))}
    </dl>
  );
}

export interface TimelineItem {
  id: string;
  title: string;
  meta?: string;
  description?: string;
  tone?: 'success' | 'warning' | 'danger' | 'neutral';
}

const DOT: Record<NonNullable<TimelineItem['tone']>, string> = {
  success: 'bg-success-600',
  warning: 'bg-warning-600',
  danger: 'bg-danger-600',
  neutral: 'bg-charcoal-400',
};

/** History list, newest first as given. Used for audit trails and status history. */
export function Timeline({ items, empty = 'No history yet.' }: { items: TimelineItem[]; empty?: string }) {
  if (items.length === 0) return <p className="text-sm text-charcoal-500">{empty}</p>;
  return (
    <ol className="space-y-4">
      {items.map((item) => (
        <li key={item.id} className="flex gap-3">
          <span className={cn('mt-1.5 h-2.5 w-2.5 shrink-0 rounded-full', DOT[item.tone ?? 'neutral'])} aria-hidden="true" />
          <div className="min-w-0">
            <p className="text-sm font-medium text-charcoal-900">{item.title}</p>
            {item.meta && <p className="text-xs text-charcoal-500">{item.meta}</p>}
            {item.description && <p className="mt-1 text-sm text-charcoal-700">{item.description}</p>}
          </div>
        </li>
      ))}
    </ol>
  );
}

export function Stepper({ steps, current }: { steps: string[]; current: number }) {
  return (
    <ol className="flex flex-wrap items-center gap-2" aria-label="Progress">
      {steps.map((step, index) => {
        const done = index < current;
        const active = index === current;
        return (
          <li key={step} aria-current={active ? 'step' : undefined} className="flex items-center gap-2 text-sm">
            <span
              className={cn(
                'flex h-6 w-6 items-center justify-center rounded-full text-xs font-semibold',
                done ? 'bg-success-600 text-white' : active ? 'bg-primary-700 text-white' : 'bg-warm-200 text-charcoal-700',
              )}
            >
              {done ? '\u2713' : index + 1}
            </span>
            <span className={active ? 'font-semibold text-charcoal-950' : 'text-charcoal-600'}>{step}</span>
            {index < steps.length - 1 && <ChevronRight size={14} className="text-charcoal-400" aria-hidden="true" />}
          </li>
        );
      })}
    </ol>
  );
}
