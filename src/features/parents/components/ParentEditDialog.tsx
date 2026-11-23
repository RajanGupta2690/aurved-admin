import { useMemo, useRef, useState } from 'react';
import type { FormEvent } from 'react';
import { TriangleAlert } from 'lucide-react';
import Modal from '../../../shared/components/Modal';
import { students } from '../../../data/mockData';
import { useFamily } from '../../../core/api/familyStore';
import {
  findDuplicateParents,
  formToParentFields,
  parentFullLabel,
  parentToForm,
  validateParentForm,
} from '../../../core/api/familyLogic';
import type { FormErrors, ParentFormValues } from '../../../core/api/familyLogic';
import type { Parent } from '../../../types';
import ParentFormFields from './ParentFormFields';

interface ParentEditDialogProps {
  parent: Parent;
  onClose: () => void;
  onSaved: (message: string) => void;
}

/** Mount this only while it is open, so the form starts fresh each time. */
export default function ParentEditDialog({ parent, onClose, onSaved }: ParentEditDialogProps) {
  const { family, actions } = useFamily();
  const formRef = useRef<HTMLFormElement>(null);
  const [values, setValues] = useState<ParentFormValues>(() => parentToForm(parent));
  const [errors, setErrors] = useState<FormErrors>({});

  const children = parent.studentIds
    .map((id) => students.find((student) => student.id === id)?.fullName)
    .filter((name): name is string => Boolean(name));
  const duplicates = useMemo(() => findDuplicateParents(family, values, parent.id), [family, values, parent.id]);

  const handleChange = (field: keyof ParentFormValues, value: string) => {
    setValues((current) => ({ ...current, [field]: value }));
    setErrors((current) => (current[field] || current.form ? { ...current, [field]: undefined, form: undefined } : current));
  };

  const handleSubmit = (event: FormEvent) => {
    event.preventDefault();
    const found = validateParentForm(values);
    setErrors(found);
    if (Object.values(found).some(Boolean)) {
      setTimeout(() => formRef.current?.querySelector<HTMLElement>('[aria-invalid="true"]')?.focus(), 0);
      return;
    }
    actions.update(parent.id, formToParentFields(values));
    onSaved(`Details of ${parentFullLabel({ ...parent, ...formToParentFields(values) })} updated.`);
    onClose();
  };

  return (
    <Modal isOpen onClose={onClose} title="Edit parent details" size="lg">
      <form ref={formRef} onSubmit={handleSubmit} noValidate className="space-y-5">
        {children.length > 0 && (
          <p className="rounded-lg bg-warm-50 border border-warm-200 px-4 py-3 text-sm text-charcoal-700">
            This record is shared. Changes apply to {children.length === 1 ? 'its child' : `all ${children.length} children`}:{' '}
            <strong className="font-semibold">{children.join(', ')}</strong>.
          </p>
        )}

        {duplicates.length > 0 && (
          <div role="status" className="flex gap-3 rounded-lg border border-warning-200 bg-warning-50 px-4 py-3 text-sm text-warning-800">
            <TriangleAlert size={18} className="mt-0.5 shrink-0" aria-hidden="true" />
            <p>
              Another record uses the same phone or email: {duplicates.map((match) => parentFullLabel(match.parent)).join(', ')}.
              Check that this is not a duplicate.
            </p>
          </div>
        )}

        <ParentFormFields idPrefix="edit-parent" values={values} errors={errors} onChange={handleChange} />

        <div className="flex gap-3 pt-4 border-t border-warm-200">
          <button type="button" onClick={onClose} className="btn-secondary flex-1">
            Cancel
          </button>
          <button type="submit" className="btn-primary flex-1">
            Save changes
          </button>
        </div>
      </form>
    </Modal>
  );
}
