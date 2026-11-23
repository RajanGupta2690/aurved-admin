import { useCallback, useState } from 'react';
import type { FormEvent } from 'react';
import { firstError } from './validators';
import type { Validator } from './validators';

export type FormSchema<V> = { [K in keyof V]?: Validator | Validator[] };
export type FormErrors<V> = Partial<Record<keyof V, string>>;

function same(a: unknown, b: unknown): boolean {
  return JSON.stringify(a) === JSON.stringify(b);
}

/**
 * Small form state helper. Values live here, rules live in a schema of validators.
 * The same schema can later be shared with the API layer.
 */
export function useForm<V extends Record<string, unknown>>(initial: V | (() => V), schema: FormSchema<V> = {}) {
  const [values, setValues] = useState<V>(initial);
  const [baseline, setBaseline] = useState<V>(values);
  const [errors, setErrors] = useState<FormErrors<V>>({});

  const set = useCallback(<K extends keyof V>(key: K, value: V[K]) => {
    setValues((previous) => ({ ...previous, [key]: value }));
    setErrors((previous) => (previous[key] ? { ...previous, [key]: undefined } : previous));
  }, []);

  const validate = useCallback(
    (candidate: V = values): boolean => {
      const found: FormErrors<V> = {};
      (Object.keys(schema) as Array<keyof V>).forEach((key) => {
        const rules = schema[key];
        if (!rules) return;
        const list = Array.isArray(rules) ? rules : [rules];
        const message = firstError(candidate[key], candidate, list);
        if (message) found[key] = message;
      });
      setErrors(found);
      return Object.keys(found).length === 0;
    },
    [schema, values],
  );

  /** Wraps a submit handler: validates, focuses the first invalid field, then calls onValid with the values. */
  const handleSubmit = (onValid: (values: V) => void) => (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const root = event.currentTarget;
    if (!validate()) {
      setTimeout(() => root.querySelector<HTMLElement>('[aria-invalid="true"]')?.focus(), 0);
      return;
    }
    onValid(values);
  };

  const reset = useCallback(
    (next?: V) => {
      const value = next ?? baseline;
      setBaseline(value);
      setValues(value);
      setErrors({});
    },
    [baseline],
  );

  /** Props for the field components in Field.tsx. */
  const bind = <K extends keyof V>(key: K) => ({
    name: String(key),
    value: values[key],
    error: errors[key],
    onChange: (value: V[K]) => set(key, value),
  });

  return {
    values,
    errors,
    set,
    setValues,
    setErrors,
    validate,
    handleSubmit,
    reset,
    bind,
    dirty: !same(values, baseline),
  };
}
