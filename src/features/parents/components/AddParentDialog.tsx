import { useMemo, useRef, useState } from 'react';
import type { FormEvent } from 'react';
import { TriangleAlert } from 'lucide-react';
import Modal from '../../../shared/components/Modal';
import { students } from '../../../data/mockData';
import { useFamily } from '../../../core/api/familyStore';
import {
  emptyParentForm,
  findDuplicateParents,
  formToParentFields,
  getParentForStudent,
  parentFullLabel,
  validateParentForm,
} from '../../../core/api/familyLogic';
import type { FormErrors, ParentFormValues } from '../../../core/api/familyLogic';
import ParentFormFields from './ParentFormFields';

interface AddParentDialogProps {
  onClose: () => void;
  onSaved: (message: string) => void;
}

/**
 * Adds a new family record from the Parents page. A parent must belong to at least one student,
 * so choosing a child is required. Students who already have a parent record are listed but locked,
 * because replacing a link is done on the student's own page where it is shown clearly.
 */
export default function AddParentDialog({ onClose, onSaved }: AddParentDialogProps) {
  const { family, actions } = useFamily();
  const formRef = useRef<HTMLFormElement>(null);
  const [values, setValues] = useState<ParentFormValues>(() => emptyParentForm());
  const [errors, setErrors] = useState<FormErrors>({});
  const [selected, setSelected] = useState<string[]>([]);
  const [childError, setChildError] = useState('');

  const duplicates = useMemo(() => findDuplicateParents(family, values), [family, values]);
  const rows = students.map((student) => ({ student, current: getParentForStudent(family, student.id) }));
  const availableCount = rows.filter((row) => !row.current).length;

  const handleChange = (field: keyof ParentFormValues, value: string) => {
    setValues((current) => ({ ...current, [field]: value }));
    setErrors((current) => (current[field] || current.form ? { ...current, [field]: undefined, form: undefined } : current));
  };

  const toggleChild = (studentId: string) => {
    setChildError('');
    setSelected((current) => (current.includes(studentId) ? current.filter((id) => id !== studentId) : [...current, studentId]));
  };

  const handleSubmit = (event: FormEvent) => {
    event.preventDefault();
    const found = validateParentForm(values);
    setErrors(found);
    const missingChild = selected.length === 0;
    setChildError(missingChild ? 'Choose at least one student. A parent record must belong to a student.' : '');
    if (Object.values(found).some(Boolean) || missingChild) {
      setTimeout(() => formRef.current?.querySelector<HTMLElement>('[data-error-focus], [aria-invalid="true"]')?.focus(), 0);
      return;
    }
    const [first, ...rest] = selected;
    const created = actions.createAndLink(first, formToParentFields(values));
    rest.forEach((studentId) => actions.link(studentId, created.id));
    onSaved(`${parentFullLabel(created)} added and linked to ${selected.length === 1 ? '1 student' : `${selected.length} students`}.`);
    onClose();
  };

  return (
    <Modal isOpen onClose={onClose} title="Add parent" size="lg">
      <form ref={formRef} onSubmit={handleSubmit} noValidate className="space-y-6">
        <fieldset aria-describedby={childError ? 'add-parent-children-error' : undefined}>
          <legend className="font-semibold text-charcoal-950 mb-1">
            Students{' '}
            <span className="text-danger-700" aria-hidden="true">
              *
            </span>
          </legend>
          <p className="text-sm text-charcoal-600 mb-3">Choose every child this family has in the school.</p>
          {availableCount === 0 && (
            <p className="rounded-lg bg-warm-50 border border-warm-200 px-4 py-3 text-sm text-charcoal-700">
              Every student already has a parent record. To change one, open the student and use the Parent/Guardian tab.
            </p>
          )}
          <ul className="grid grid-cols-1 sm:grid-cols-2 gap-2">
            {rows.map(({ student, current }) => (
              <li key={student.id}>
                <label
                  className={`flex items-start gap-3 rounded-lg border px-3 py-2 text-sm ${
                    current ? 'border-warm-200 bg-warm-50 text-charcoal-500' : 'border-warm-300 bg-white cursor-pointer hover:bg-warm-50'
                  }`}
                >
                  <input
                    type="checkbox"
                    className="mt-1"
                    checked={selected.includes(student.id)}
                    disabled={Boolean(current)}
                    onChange={() => toggleChild(student.id)}
                  />
                  <span>
                    <span className="block font-medium text-charcoal-900">{student.fullName}</span>
                    <span className="block text-xs">
                      {student.admissionNumber}
                      {current ? ` · already linked to ${parentFullLabel(current)}` : ''}
                    </span>
                  </span>
                </label>
              </li>
            ))}
          </ul>
          {childError && (
            <p id="add-parent-children-error" role="alert" data-error-focus="true" tabIndex={-1} className="mt-2 text-xs text-danger-700">
              {childError}
            </p>
          )}
        </fieldset>

        {duplicates.length > 0 && (
          <div role="status" className="flex gap-3 rounded-lg border border-warning-200 bg-warning-50 px-4 py-3 text-sm text-warning-800">
            <TriangleAlert size={18} className="mt-0.5 shrink-0" aria-hidden="true" />
            <p>
              A record with the same phone or email already exists: {duplicates.map((match) => parentFullLabel(match.parent)).join(', ')}.
              If this is the same family, open the student and link the existing record instead of adding a copy.
            </p>
          </div>
        )}

        <ParentFormFields idPrefix="add-parent" values={values} errors={errors} onChange={handleChange} />

        <div className="flex gap-3 pt-4 border-t border-warm-200">
          <button type="button" onClick={onClose} className="btn-secondary flex-1">
            Cancel
          </button>
          <button type="submit" className="btn-primary flex-1">
            Add parent
          </button>
        </div>
      </form>
    </Modal>
  );
}
