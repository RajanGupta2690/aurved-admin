import { useMemo, useRef, useState } from 'react';
import type { FormEvent } from 'react';
import { TriangleAlert } from 'lucide-react';
import Modal from '../../../shared/components/Modal';
import { useStudents } from '../../../core/api/studentStore';
import { useFamily } from '../../../core/api/familyStore';
import {
  emptyParentForm,
  findDuplicateParents,
  formToParentFields,
  parentFullLabel,
  validateParentForm,
} from '../../../core/api/familyLogic';
import type { FormErrors, ParentFormValues } from '../../../core/api/familyLogic';
import ParentFormFields from './ParentFormFields';
import StudentPicker from './StudentPicker';

interface AddParentDialogProps {
  onClose: () => void;
  onSaved: (message: string) => void;
}

/**
 * Adds a new family record from the Parents page. A parent must belong to at least one student.
 * The student is found by the school student ID (admission number) or by name. A student who already
 * has a parent record cannot be picked, because replacing a link is done on the student's own page.
 */
export default function AddParentDialog({ onClose, onSaved }: AddParentDialogProps) {
  const { family, actions } = useFamily();
  const students = useStudents();
  const formRef = useRef<HTMLFormElement>(null);
  const [values, setValues] = useState<ParentFormValues>(() => emptyParentForm());
  const [errors, setErrors] = useState<FormErrors>({});
  const [selected, setSelected] = useState<string[]>([]);
  const [childError, setChildError] = useState('');

  const duplicates = useMemo(() => findDuplicateParents(family, values), [family, values]);

  const handleChange = (field: keyof ParentFormValues, value: string) => {
    setValues((current) => ({ ...current, [field]: value }));
    setErrors((current) => (current[field] || current.form ? { ...current, [field]: undefined, form: undefined } : current));
  };

  const handleSubmit = (event: FormEvent) => {
    event.preventDefault();
    const found = validateParentForm(values);
    setErrors(found);
    const missingChild = selected.length === 0;
    setChildError(missingChild ? 'Add at least one student by school student ID. A parent record must belong to a student.' : '');
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
        <StudentPicker idPrefix="add-parent" students={students} family={family} selected={selected} onChange={(ids) => { setSelected(ids); setChildError(''); }} error={childError} />

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
