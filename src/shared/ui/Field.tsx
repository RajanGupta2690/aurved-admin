import { useId } from 'react';
import type { ReactNode } from 'react';
import { cn } from './cn';

interface CommonProps {
  label: string;
  name?: string;
  error?: string;
  hint?: string;
  required?: boolean;
  disabled?: boolean;
  /** Hide the visible label but keep it for screen readers (for search boxes and table filters). */
  hideLabel?: boolean;
  className?: string;
}

function Shell({
  id,
  label,
  hideLabel,
  required,
  hint,
  error,
  className,
  children,
}: CommonProps & { id: string; children: ReactNode }) {
  return (
    <div className={className}>
      <label htmlFor={id} className={cn('block text-sm font-medium text-charcoal-800 mb-1.5', hideLabel && 'sr-only')}>
        {label}
        {required && (
          <span className="text-danger-700" aria-hidden="true">
            {' '}
            *
          </span>
        )}
      </label>
      {children}
      {hint && !error && (
        <p id={`${id}-hint`} className="mt-1 text-xs text-charcoal-500">
          {hint}
        </p>
      )}
      {error && (
        <p id={`${id}-error`} className="mt-1 text-xs text-danger-700">
          {error}
        </p>
      )}
    </div>
  );
}

function describedBy(id: string, error?: string, hint?: string) {
  if (error) return `${id}-error`;
  if (hint) return `${id}-hint`;
  return undefined;
}

interface TextFieldProps extends CommonProps {
  value: unknown;
  onChange: (value: string) => void;
  type?: 'text' | 'email' | 'tel' | 'number' | 'date' | 'password' | 'search' | 'time' | 'url';
  placeholder?: string;
  autoFocus?: boolean;
  min?: number | string;
  max?: number | string;
  step?: number | string;
}

export function TextField(props: TextFieldProps) {
  const { value, onChange, type = 'text', placeholder, autoFocus, min, max, step, ...shell } = props;
  const id = useId();
  return (
    <Shell id={id} {...shell}>
      <input
        id={id}
        name={shell.name}
        type={type}
        inputMode={type === 'tel' ? 'tel' : undefined}
        autoComplete="off"
        placeholder={placeholder}
        value={value == null ? '' : String(value)}
        onChange={(event) => onChange(event.target.value)}
        disabled={shell.disabled}
        autoFocus={autoFocus}
        data-autofocus={autoFocus || undefined}
        min={min}
        max={max}
        step={step}
        aria-required={shell.required || undefined}
        aria-invalid={shell.error ? true : undefined}
        aria-describedby={describedBy(id, shell.error, shell.hint)}
        className={cn('input', shell.error && 'input-error')}
      />
    </Shell>
  );
}

interface SelectFieldProps extends CommonProps {
  value: unknown;
  onChange: (value: string) => void;
  options: Array<{ value: string; label: string; disabled?: boolean }>;
  placeholder?: string;
}

export function SelectField({ value, onChange, options, placeholder, ...shell }: SelectFieldProps) {
  const id = useId();
  return (
    <Shell id={id} {...shell}>
      <select
        id={id}
        name={shell.name}
        value={value == null ? '' : String(value)}
        onChange={(event) => onChange(event.target.value)}
        disabled={shell.disabled}
        aria-required={shell.required || undefined}
        aria-invalid={shell.error ? true : undefined}
        aria-describedby={describedBy(id, shell.error, shell.hint)}
        className={cn('input', shell.error && 'input-error')}
      >
        {placeholder !== undefined && <option value="">{placeholder}</option>}
        {options.map((option) => (
          <option key={option.value} value={option.value} disabled={option.disabled}>
            {option.label}
          </option>
        ))}
      </select>
    </Shell>
  );
}

interface TextareaFieldProps extends CommonProps {
  value: unknown;
  onChange: (value: string) => void;
  rows?: number;
  placeholder?: string;
}

export function TextareaField({ value, onChange, rows = 3, placeholder, ...shell }: TextareaFieldProps) {
  const id = useId();
  return (
    <Shell id={id} {...shell}>
      <textarea
        id={id}
        name={shell.name}
        rows={rows}
        placeholder={placeholder}
        value={value == null ? '' : String(value)}
        onChange={(event) => onChange(event.target.value)}
        disabled={shell.disabled}
        aria-required={shell.required || undefined}
        aria-invalid={shell.error ? true : undefined}
        aria-describedby={describedBy(id, shell.error, shell.hint)}
        className={cn('input', shell.error && 'input-error')}
      />
    </Shell>
  );
}

interface CheckboxFieldProps {
  label: string;
  checked: boolean;
  onChange: (checked: boolean) => void;
  hint?: string;
  disabled?: boolean;
  error?: string;
  className?: string;
}

export function CheckboxField({ label, checked, onChange, hint, disabled, error, className }: CheckboxFieldProps) {
  const id = useId();
  return (
    <div className={className}>
      <label htmlFor={id} className={cn('flex items-start gap-3 text-sm', disabled ? 'text-charcoal-500' : 'text-charcoal-800 cursor-pointer')}>
        <input
          id={id}
          type="checkbox"
          checked={checked}
          disabled={disabled}
          onChange={(event) => onChange(event.target.checked)}
          aria-invalid={error ? true : undefined}
          aria-describedby={describedBy(id, error, hint)}
          className="mt-0.5 h-4 w-4 rounded border-warm-300 accent-primary-700"
        />
        <span>
          <span className="font-medium">{label}</span>
          {hint && (
            <span id={`${id}-hint`} className="block text-xs text-charcoal-500">
              {hint}
            </span>
          )}
        </span>
      </label>
      {error && (
        <p id={`${id}-error`} className="mt-1 text-xs text-danger-700">
          {error}
        </p>
      )}
    </div>
  );
}

interface SwitchProps {
  label: string;
  checked: boolean;
  onChange: (checked: boolean) => void;
  disabled?: boolean;
  /** Short text next to the switch, such as the reason it is locked. */
  description?: string;
}

/** An on/off control. Announced as a switch with its state. */
export function Switch({ label, checked, onChange, disabled, description }: SwitchProps) {
  const id = useId();
  return (
    <div className="flex items-start gap-3">
      <button
        id={id}
        type="button"
        role="switch"
        aria-checked={checked}
        aria-label={label}
        aria-describedby={description ? `${id}-d` : undefined}
        disabled={disabled}
        onClick={() => onChange(!checked)}
        className={cn(
          'relative mt-0.5 h-6 w-11 shrink-0 rounded-full transition-colors disabled:opacity-50 disabled:cursor-not-allowed',
          checked ? 'bg-primary-700' : 'bg-charcoal-300',
        )}
      >
        <span
          aria-hidden="true"
          className={cn('absolute top-0.5 left-0.5 h-5 w-5 rounded-full bg-white shadow transition-transform', checked && 'translate-x-5')}
        />
      </button>
      {description && (
        <span id={`${id}-d`} className="text-xs text-charcoal-600">
          {description}
        </span>
      )}
    </div>
  );
}
