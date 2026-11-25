import { useId, useMemo, useState } from 'react';
import type { FormEvent, ReactNode } from 'react';
import { TriangleAlert } from 'lucide-react';
import { classes } from '../../../data/mockData';
import { useFamily } from '../../../core/api/familyStore';
import { emptyParentForm, findDuplicateParents, isValidPhone, parentFullLabel, searchParents, validateParentForm } from '../../../core/api/familyLogic';
import type { FormErrors, ParentFormValues } from '../../../core/api/familyLogic';
import type { Student } from '../../../types';
import ParentFormFields from '../../parents/components/ParentFormFields';

export interface StudentFormValues {
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  dateOfBirth: string;
  gender: string;
  classId: string;
  sectionId: string;
  admissionNumber: string;
  rollNumber: string;
  bloodGroup: string;
  address: string;
}

/** What to do about parents when a student is added. */
export type ParentChoice = { kind: 'later' } | { kind: 'new'; values: ParentFormValues } | { kind: 'existing'; parentId: string };

interface StudentFormProps {
  mode: 'add' | 'edit';
  /** The student being changed (edit) or the list used to check roll numbers (add). */
  students: Student[];
  initial?: Student;
  /** The school student ID given to a new student. */
  nextCode?: string;
  onSubmit: (values: StudentFormValues, parent: ParentChoice) => void;
  onCancel: () => void;
}

type Errors = Partial<Record<keyof StudentFormValues | 'parent', string>>;

const EMAIL = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

function Field({ label, error, hint, required, children, className = '' }: { label: string; error?: string; hint?: string; required?: boolean; children: (id: string, describedBy?: string) => ReactNode; className?: string }) {
  const id = useId();
  const describedBy = error ? `${id}-error` : hint ? `${id}-hint` : undefined;
  return (
    <div className={className}>
      <label htmlFor={id} className="block text-sm font-medium text-charcoal-800 mb-1.5">
        {label}
        {required && (
          <span className="text-danger-700" aria-hidden="true">
            {' '}
            *
          </span>
        )}
      </label>
      {children(id, describedBy)}
      {error ? (
        <p id={`${id}-error`} className="mt-1 text-xs text-danger-700">
          {error}
        </p>
      ) : (
        hint && (
          <p id={`${id}-hint`} className="mt-1 text-xs text-charcoal-600">
            {hint}
          </p>
        )
      )}
    </div>
  );
}

/**
 * One form for adding and for changing a student. A new student gets the next school student ID.
 * The parents can be added now, linked to a family already in the school, or left for later.
 */
export default function StudentForm({ mode, students, initial, nextCode = '', onSubmit, onCancel }: StudentFormProps) {
  const { family } = useFamily();
  const [values, setValues] = useState<StudentFormValues>(() => ({
    firstName: initial?.firstName ?? '',
    lastName: initial?.lastName ?? '',
    email: initial?.email ?? '',
    phone: initial?.phone ?? '',
    dateOfBirth: initial?.dateOfBirth ?? '',
    gender: initial?.gender ?? 'male',
    classId: initial?.classId ?? classes[0]?.id ?? '',
    sectionId: initial?.sectionId ?? '',
    admissionNumber: initial?.admissionNumber ?? nextCode,
    rollNumber: initial?.rollNumber ?? '',
    bloodGroup: initial?.bloodGroup ?? '',
    address: initial?.address ?? '',
  }));
  const [errors, setErrors] = useState<Errors>({});
  const [choice, setChoice] = useState<'later' | 'new' | 'existing'>('later');
  const [parentValues, setParentValues] = useState<ParentFormValues>(() => emptyParentForm());
  const [parentErrors, setParentErrors] = useState<FormErrors>({});
  const [familyQuery, setFamilyQuery] = useState('');
  const [familyId, setFamilyId] = useState('');
  const selectedClass = classes.find((item) => item.id === values.classId);
  const set = (patch: Partial<StudentFormValues>) => {
    setValues((current) => ({ ...current, ...patch }));
    setErrors((current) => ({ ...current, ...Object.fromEntries(Object.keys(patch).map((key) => [key, undefined])) }));
  };
  const duplicates = useMemo(() => (choice === 'new' ? findDuplicateParents(family, parentValues) : []), [choice, family, parentValues]);
  const familyMatches = useMemo(() => searchParents(family, familyQuery).slice(0, 6), [family, familyQuery]);

  const submit = (event: FormEvent) => {
    event.preventDefault();
    const found: Errors = {};
    if (values.firstName.trim().length < 1) found.firstName = 'Enter the first name.';
    if (values.lastName.trim().length < 1) found.lastName = 'Enter the last name.';
    if (!values.dateOfBirth) found.dateOfBirth = 'Enter the date of birth.';
    else if (values.dateOfBirth > new Date().toISOString().slice(0, 10)) found.dateOfBirth = 'The date of birth cannot be in the future.';
    if (!values.sectionId) found.sectionId = 'Choose the section.';
    if (values.email.trim() && !EMAIL.test(values.email.trim())) found.email = 'Enter a valid email address.';
    if (values.phone.trim() && !isValidPhone(values.phone.trim())) found.phone = 'Enter 7 to 15 digits. A leading + is allowed.';
    const roll = values.rollNumber.trim();
    if (roll && students.some((student) => student.id !== initial?.id && student.classId === values.classId && student.sectionId === values.sectionId && student.rollNumber === roll && student.status === 'active')) {
      found.rollNumber = 'Another student in this class and section has this roll number.';
    }
    let parent: ParentChoice = { kind: 'later' };
    if (mode === 'add' && choice === 'new') {
      const problems = validateParentForm(parentValues);
      setParentErrors(problems);
      if (Object.values(problems).some(Boolean)) found.parent = 'Complete the parent details, or choose "Add later".';
      else parent = { kind: 'new', values: parentValues };
    } else if (mode === 'add' && choice === 'existing') {
      if (!familyId) found.parent = 'Choose the family to link, or choose "Add later".';
      else parent = { kind: 'existing', parentId: familyId };
    }
    setErrors(found);
    if (Object.values(found).some(Boolean)) {
      setTimeout(() => document.querySelector<HTMLElement>('[role=dialog] [aria-invalid="true"], [role=dialog] [data-form-error]')?.focus(), 0);
      return;
    }
    onSubmit({ ...values, firstName: values.firstName.trim(), lastName: values.lastName.trim(), rollNumber: roll }, parent);
  };

  const fieldProps = (key: keyof StudentFormValues) => ({ value: values[key], onChange: (event: { target: { value: string } }) => set({ [key]: event.target.value } as Partial<StudentFormValues>) });

  return (
    <form onSubmit={submit} noValidate className="space-y-6">
      {mode === 'add' && (
        <div className="rounded-xl border border-primary-200 bg-primary-50 px-4 py-3 text-sm text-charcoal-800">
          School student ID: <span className="font-semibold text-charcoal-950">{values.admissionNumber}</span>. Parents are linked to the student with this ID.
        </div>
      )}
      <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
        <Field label="First name" required error={errors.firstName}>
          {(id, d) => <input id={id} type="text" aria-required="true" aria-invalid={errors.firstName ? true : undefined} aria-describedby={d} className="input" placeholder="Enter first name" {...fieldProps('firstName')} />}
        </Field>
        <Field label="Last name" required error={errors.lastName}>
          {(id, d) => <input id={id} type="text" aria-required="true" aria-invalid={errors.lastName ? true : undefined} aria-describedby={d} className="input" placeholder="Enter last name" {...fieldProps('lastName')} />}
        </Field>
        <Field label="Date of birth" required error={errors.dateOfBirth}>
          {(id, d) => <input id={id} type="date" aria-required="true" aria-invalid={errors.dateOfBirth ? true : undefined} aria-describedby={d} className="input" {...fieldProps('dateOfBirth')} />}
        </Field>
        <Field label="Gender" required>
          {(id) => (
            <select id={id} className="input" {...fieldProps('gender')}>
              <option value="male">Male</option>
              <option value="female">Female</option>
              <option value="other">Other</option>
            </select>
          )}
        </Field>
        <Field label="Class" required>
          {(id) => (
            <select id={id} className="input" value={values.classId} onChange={(event) => set({ classId: event.target.value, sectionId: '' })}>
              {classes.map((item) => (
                <option key={item.id} value={item.id}>
                  {item.name}
                </option>
              ))}
            </select>
          )}
        </Field>
        <Field label="Section" required error={errors.sectionId}>
          {(id, d) => (
            <select id={id} aria-required="true" aria-invalid={errors.sectionId ? true : undefined} aria-describedby={d} className="input" {...fieldProps('sectionId')}>
              <option value="">Select section</option>
              {selectedClass?.sections.map((item) => (
                <option key={item.id} value={item.id}>
                  Section {item.name}
                </option>
              ))}
            </select>
          )}
        </Field>
        <Field label="Roll number" error={errors.rollNumber}>
          {(id, d) => <input id={id} type="text" aria-invalid={errors.rollNumber ? true : undefined} aria-describedby={d} className="input" placeholder="Enter roll number" {...fieldProps('rollNumber')} />}
        </Field>
        <Field label="Blood group">
          {(id) => (
            <select id={id} className="input" {...fieldProps('bloodGroup')}>
              <option value="">Not stated</option>
              {['A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'O+', 'O-'].map((group) => (
                <option key={group} value={group}>
                  {group}
                </option>
              ))}
            </select>
          )}
        </Field>
        <Field label="Student email" error={errors.email}>
          {(id, d) => <input id={id} type="email" aria-invalid={errors.email ? true : undefined} aria-describedby={d} className="input" placeholder="student@email.com" {...fieldProps('email')} />}
        </Field>
        <Field label="Student phone" error={errors.phone}>
          {(id, d) => <input id={id} type="tel" aria-invalid={errors.phone ? true : undefined} aria-describedby={d} className="input" placeholder="+91 98765 43210" {...fieldProps('phone')} />}
        </Field>
        <Field label="Address" className="md:col-span-2">
          {(id) => <textarea id={id} rows={2} className="input" placeholder="Enter full address" {...fieldProps('address')} />}
        </Field>
      </div>

      {mode === 'add' && (
        <fieldset className="space-y-4 rounded-xl border border-warm-200 p-4" aria-describedby={errors.parent ? 'student-parent-error' : undefined}>
          <legend className="px-2 font-semibold text-charcoal-950">Parents and guardians</legend>
          <div className="flex flex-wrap gap-x-6 gap-y-2 text-sm">
            {(
              [
                ['later', 'Add later'],
                ['new', 'Add the parents now'],
                ['existing', 'Link to a family already in the school'],
              ] as const
            ).map(([value, label]) => (
              <label key={value} className="flex cursor-pointer items-center gap-2">
                <input
                  type="radio"
                  name="parent-choice"
                  checked={choice === value}
                  onChange={() => {
                    setChoice(value);
                    setErrors((current) => ({ ...current, parent: undefined }));
                    if (value === 'new' && !parentValues.address) setParentValues((current) => ({ ...current, address: values.address }));
                  }}
                />
                {label}
              </label>
            ))}
          </div>
          {choice === 'later' && <p className="text-sm text-charcoal-600">You can add the parents later: from the Parents page with this school student ID, or from the Parent/Guardian tab of the student.</p>}
          {choice === 'new' && (
            <div className="space-y-4">
              {duplicates.length > 0 && (
                <div role="status" className="flex gap-3 rounded-lg border border-warning-200 bg-warning-50 px-4 py-3 text-sm text-warning-800">
                  <TriangleAlert size={18} className="mt-0.5 shrink-0" aria-hidden="true" />
                  <p>A record with the same phone or email exists: {duplicates.map((match) => parentFullLabel(match.parent)).join(', ')}. If this is a brother or sister, choose "Link to a family already in the school" instead.</p>
                </div>
              )}
              <ParentFormFields idPrefix="new-student-parent" values={parentValues} errors={parentErrors} onChange={(field, value) => { setParentValues((current) => ({ ...current, [field]: value })); setParentErrors((current) => ({ ...current, [field]: undefined, form: undefined })); setErrors((current) => ({ ...current, parent: undefined })); }} />
            </div>
          )}
          {choice === 'existing' && (
            <div>
              <label htmlFor="family-search" className="mb-1.5 block text-sm font-medium text-charcoal-800">
                Find the family by parent name, phone or email
              </label>
              <input id="family-search" type="text" autoComplete="off" className="input" value={familyQuery} onChange={(event) => setFamilyQuery(event.target.value)} placeholder="For example Sharma or 98765" />
              {family.parents.length === 0 ? (
                <p className="mt-2 text-sm text-charcoal-600">No family records exist yet.</p>
              ) : (
                <ul aria-label="Families" className="mt-2 max-h-48 divide-y divide-warm-200 overflow-y-auto rounded-lg border border-warm-200">
                  {familyMatches.length === 0 && <li className="px-3 py-2 text-sm text-charcoal-600">No family matches.</li>}
                  {familyMatches.map((parent) => {
                    const children = parent.studentIds.map((id) => students.find((student) => student.id === id)?.fullName).filter(Boolean).join(', ');
                    return (
                      <li key={parent.id}>
                        <label className="flex cursor-pointer items-start gap-3 px-3 py-2 text-sm hover:bg-warm-50">
                          <input type="radio" name="family" className="mt-1" checked={familyId === parent.id} onChange={() => { setFamilyId(parent.id); setErrors((current) => ({ ...current, parent: undefined })); }} />
                          <span>
                            <span className="block font-medium text-charcoal-900">{parentFullLabel(parent)}</span>
                            <span className="block text-xs text-charcoal-600">{children ? `Children: ${children}` : 'No children linked yet'}</span>
                          </span>
                        </label>
                      </li>
                    );
                  })}
                </ul>
              )}
            </div>
          )}
          {errors.parent && (
            <p id="student-parent-error" role="alert" data-form-error="true" tabIndex={-1} className="text-xs text-danger-700">
              {errors.parent}
            </p>
          )}
        </fieldset>
      )}

      <div className="flex items-center justify-end gap-3 border-t border-warm-200 pt-4">
        <button type="button" onClick={onCancel} className="btn-secondary">
          Cancel
        </button>
        <button type="submit" className="btn-primary">
          {mode === 'add' ? 'Add student' : 'Save changes'}
        </button>
      </div>
    </form>
  );
}
