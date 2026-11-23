import type { FormErrors, ParentFormValues } from '../../../core/api/familyLogic';

interface ParentFormFieldsProps {
  /** Unique per form on the page, so label and input ids never clash. */
  idPrefix: string;
  values: ParentFormValues;
  errors: FormErrors;
  onChange: (field: keyof ParentFormValues, value: string) => void;
}

interface TextFieldProps {
  id: string;
  label: string;
  value: string;
  error?: string;
  required?: boolean;
  type?: 'text' | 'email' | 'tel';
  list?: string;
  placeholder?: string;
  onChange: (value: string) => void;
}

function TextField({ id, label, value, error, required, type = 'text', list, placeholder, onChange }: TextFieldProps) {
  return (
    <div>
      <label htmlFor={id} className="block text-sm font-medium text-charcoal-800 mb-1.5">
        {label}
        {required && (
          <span className="text-danger-700" aria-hidden="true">
            {' '}
            *
          </span>
        )}
      </label>
      <input
        id={id}
        type={type}
        inputMode={type === 'tel' ? 'tel' : undefined}
        autoComplete="off"
        list={list}
        placeholder={placeholder}
        value={value}
        onChange={(event) => onChange(event.target.value)}
        aria-required={required || undefined}
        aria-invalid={error ? true : undefined}
        aria-describedby={error ? `${id}-error` : undefined}
        className={`input ${error ? 'input-error' : ''}`}
      />
      {error && (
        <p id={`${id}-error`} className="mt-1 text-xs text-danger-700">
          {error}
        </p>
      )}
    </div>
  );
}

const RELATION_SUGGESTIONS = ['Grandfather', 'Grandmother', 'Uncle', 'Aunt', 'Brother', 'Sister', 'Step-parent', 'Legal guardian'];

/**
 * Shared fields for a family record: father, mother, optional guardian and address.
 * Used by the student page and by the Parents page, so both ask the same questions.
 */
export default function ParentFormFields({ idPrefix, values, errors, onChange }: ParentFormFieldsProps) {
  const id = (name: keyof ParentFormValues) => `${idPrefix}-${name}`;
  const text = (
    name: keyof ParentFormValues,
    label: string,
    options: { required?: boolean; type?: 'text' | 'email' | 'tel'; list?: string; placeholder?: string } = {},
  ) => (
    <TextField
      id={id(name)}
      label={label}
      value={values[name]}
      error={errors[name]}
      onChange={(value) => onChange(name, value)}
      {...options}
    />
  );

  return (
    <div className="space-y-6">
      <p className="text-sm text-charcoal-600">
        Fill in the people who apply. Each person you add needs a name and a mobile number. Fields marked * are required
        for that person.
      </p>

      {errors.form && (
        <div role="alert" className="rounded-lg border border-danger-200 bg-danger-50 px-4 py-3 text-sm text-danger-700">
          {errors.form}
        </div>
      )}

      <fieldset className="space-y-3">
        <legend className="font-semibold text-charcoal-950 mb-3">Father</legend>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {text('fatherName', 'Name')}
          {text('fatherPhone', 'Mobile number', { type: 'tel', placeholder: '+91 98765 43210' })}
          {text('fatherEmail', 'Email', { type: 'email' })}
          {text('fatherOccupation', 'Occupation')}
        </div>
      </fieldset>

      <fieldset className="space-y-3">
        <legend className="font-semibold text-charcoal-950 mb-3">Mother</legend>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {text('motherName', 'Name')}
          {text('motherPhone', 'Mobile number', { type: 'tel', placeholder: '+91 98765 43210' })}
          {text('motherEmail', 'Email', { type: 'email' })}
          {text('motherOccupation', 'Occupation')}
        </div>
      </fieldset>

      <fieldset className="space-y-3">
        <legend className="font-semibold text-charcoal-950 mb-3">Guardian (optional)</legend>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {text('guardianName', 'Name')}
          {text('guardianPhone', 'Mobile number', { type: 'tel' })}
          {text('guardianRelation', 'Relation to student', { list: `${idPrefix}-relations`, placeholder: 'For example Uncle' })}
        </div>
        <datalist id={`${idPrefix}-relations`}>
          {RELATION_SUGGESTIONS.map((relation) => (
            <option key={relation} value={relation} />
          ))}
        </datalist>
      </fieldset>

      <div>
        <label htmlFor={id('address')} className="block text-sm font-medium text-charcoal-800 mb-1.5">
          Address{' '}
          <span className="text-danger-700" aria-hidden="true">
            *
          </span>
        </label>
        <textarea
          id={id('address')}
          rows={3}
          value={values.address}
          onChange={(event) => onChange('address', event.target.value)}
          aria-required="true"
          aria-invalid={errors.address ? true : undefined}
          aria-describedby={errors.address ? `${id('address')}-error` : undefined}
          className={`input ${errors.address ? 'input-error' : ''}`}
        />
        {errors.address && (
          <p id={`${id('address')}-error`} className="mt-1 text-xs text-danger-700">
            {errors.address}
          </p>
        )}
      </div>
    </div>
  );
}
