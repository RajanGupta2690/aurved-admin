export type Validator<V = Record<string, unknown>> = (value: unknown, values: V) => string | undefined;

const text = (value: unknown) => (typeof value === 'string' ? value.trim() : value == null ? '' : String(value));

export const required =
  (message = 'This field is required.'): Validator =>
  (value) => {
    if (Array.isArray(value)) return value.length === 0 ? message : undefined;
    if (typeof value === 'boolean') return value ? undefined : message;
    return text(value) === '' ? message : undefined;
  };

export const minLength =
  (min: number, message?: string): Validator =>
  (value) => (text(value) !== '' && text(value).length < min ? message ?? `Use at least ${min} characters.` : undefined);

export const maxLength =
  (max: number, message?: string): Validator =>
  (value) => (text(value).length > max ? message ?? `Use at most ${max} characters.` : undefined);

export const email =
  (message = 'Enter a valid email address.'): Validator =>
  (value) => (text(value) !== '' && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(text(value)) ? message : undefined);

/** 7 to 15 digits, optional leading +. Spaces, dashes and brackets are ignored. Works for any country. */
export const phone =
  (message = 'Enter 7 to 15 digits. A leading + is allowed.'): Validator =>
  (value) => (text(value) !== '' && !/^\+?\d{7,15}$/.test(text(value).replace(/[\s().-]/g, '')) ? message : undefined);

export const pattern =
  (re: RegExp, message: string): Validator =>
  (value) => (text(value) !== '' && !re.test(text(value)) ? message : undefined);

export const minNumber =
  (min: number, message?: string): Validator =>
  (value) => (text(value) !== '' && Number(value) < min ? message ?? `Must be ${min} or more.` : undefined);

export const maxNumber =
  (max: number, message?: string): Validator =>
  (value) => (text(value) !== '' && Number(value) > max ? message ?? `Must be ${max} or less.` : undefined);

/** Dates are ISO strings (yyyy-mm-dd), so string comparison is correct. */
export const notBefore =
  (otherKey: string, message: string): Validator =>
  (value, values) => {
    const other = text((values as Record<string, unknown>)[otherKey]);
    return text(value) !== '' && other !== '' && text(value) < other ? message : undefined;
  };

export function firstError(value: unknown, values: Record<string, unknown>, validators: Validator[]): string | undefined {
  for (const validator of validators) {
    const error = validator(value, values);
    if (error) return error;
  }
  return undefined;
}
