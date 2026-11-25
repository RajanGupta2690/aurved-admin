import { useMemo, useRef, useState } from 'react';
import type { FormEvent } from 'react';
import { Link2, Search, TriangleAlert, UserPlus } from 'lucide-react';
import Modal from '../../../shared/components/Modal';
import { useStudents } from '../../../core/api/studentStore';
import { useFamily } from '../../../core/api/familyStore';
import {
  emptyParentForm,
  findDuplicateParents,
  formToParentFields,
  getParentForStudent,
  parentFullLabel,
  searchParents,
  validateParentForm,
} from '../../../core/api/familyLogic';
import type { FormErrors, ParentFormValues } from '../../../core/api/familyLogic';
import type { Parent, Student } from '../../../types';
import ParentFormFields from '../../parents/components/ParentFormFields';

export type ParentDialogMode = 'new' | 'existing';

interface StudentParentDialogProps {
  student: Student;
  initialMode: ParentDialogMode;
  onClose: () => void;
  onDone: (message: string) => void;
}

function childNames(parent: Parent, allStudents: Student[]): string {
  return parent.studentIds
    .map((id) => allStudents.find((student) => student.id === id)?.fullName)
    .filter(Boolean)
    .join(', ');
}

/** Mount this only while it is open, so every opening starts clean. */
export default function StudentParentDialog({ student, initialMode, onClose, onDone }: StudentParentDialogProps) {
  const allStudents = useStudents();
  const { family, actions } = useFamily();
  const formRef = useRef<HTMLFormElement>(null);
  const [mode, setMode] = useState<ParentDialogMode>(initialMode);
  const [values, setValues] = useState<ParentFormValues>(() => emptyParentForm(student.address));
  const [errors, setErrors] = useState<FormErrors>({});
  const [query, setQuery] = useState('');

  const current = getParentForStudent(family, student.id);
  const duplicates = useMemo(() => findDuplicateParents(family, values), [family, values]);
  const results = useMemo(() => searchParents(family, query).slice(0, 8), [family, query]);
  const totalMatches = useMemo(() => searchParents(family, query).length, [family, query]);

  const handleChange = (field: keyof ParentFormValues, value: string) => {
    setValues((previous) => ({ ...previous, [field]: value }));
    setErrors((previous) => (previous[field] || previous.form ? { ...previous, [field]: undefined, form: undefined } : previous));
  };

  const linkExisting = (parent: Parent) => {
    actions.link(student.id, parent.id);
    onDone(`${student.fullName} is now linked to ${parentFullLabel(parent)}.`);
    onClose();
  };

  const handleCreate = (event: FormEvent) => {
    event.preventDefault();
    const found = validateParentForm(values);
    setErrors(found);
    if (Object.values(found).some(Boolean)) {
      setTimeout(() => formRef.current?.querySelector<HTMLElement>('[aria-invalid="true"]')?.focus(), 0);
      return;
    }
    const created = actions.createAndLink(student.id, formToParentFields(values));
    onDone(`${parentFullLabel(created)} added and linked to ${student.fullName}.`);
    onClose();
  };

  const tabClass = (active: boolean) =>
    `flex-1 flex items-center justify-center gap-2 px-4 py-2.5 text-sm font-medium rounded-lg transition-colors ${
      active ? 'bg-white text-primary-700 shadow-sm' : 'text-charcoal-600 hover:text-charcoal-900'
    }`;

  return (
    <Modal isOpen onClose={onClose} title={`Parent or guardian of ${student.fullName}`} size="lg">
      <div className="space-y-5">
        <div role="group" aria-label="How to add" className="flex gap-1 rounded-xl bg-warm-100 p-1">
          <button type="button" aria-pressed={mode === 'new'} onClick={() => setMode('new')} className={tabClass(mode === 'new')}>
            <UserPlus size={16} aria-hidden="true" />
            Add new
          </button>
          <button type="button" aria-pressed={mode === 'existing'} onClick={() => setMode('existing')} className={tabClass(mode === 'existing')}>
            <Link2 size={16} aria-hidden="true" />
            Link existing
          </button>
        </div>

        {current && (
          <div role="status" className="flex gap-3 rounded-lg border border-warning-200 bg-warning-50 px-4 py-3 text-sm text-warning-800">
            <TriangleAlert size={18} className="mt-0.5 shrink-0" aria-hidden="true" />
            <p>
              {student.firstName} is linked to {parentFullLabel(current)} now. Saving here replaces that link. The old record
              and its other children are not changed.
            </p>
          </div>
        )}

        {mode === 'new' ? (
          <form ref={formRef} onSubmit={handleCreate} noValidate className="space-y-5">
            {duplicates.length > 0 && (
              <div role="status" className="rounded-lg border border-warning-200 bg-warning-50 px-4 py-3 text-sm text-warning-800 space-y-3">
                <p className="flex gap-3">
                  <TriangleAlert size={18} className="mt-0.5 shrink-0" aria-hidden="true" />
                  <span>
                    This phone or email already belongs to a record. If {student.firstName} has a brother or sister here,
                    link that record instead of adding a copy.
                  </span>
                </p>
                <ul className="space-y-2">
                  {duplicates.map(({ parent, matched }) => (
                    <li key={parent.id} className="flex flex-wrap items-center justify-between gap-2 rounded-lg bg-white px-3 py-2">
                      <span className="text-charcoal-800">
                        <span className="font-medium">{parentFullLabel(parent)}</span>
                        <span className="block text-xs text-charcoal-500">
                          Same: {matched.join(', ')}
                          {childNames(parent, allStudents) ? ` · Children: ${childNames(parent, allStudents)}` : ''}
                        </span>
                      </span>
                      <button
                        type="button"
                        onClick={() => linkExisting(parent)}
                        disabled={current?.id === parent.id}
                        className="btn-secondary text-sm py-1.5 px-3 disabled:opacity-50"
                      >
                        {current?.id === parent.id ? 'Already linked' : 'Link this record'}
                      </button>
                    </li>
                  ))}
                </ul>
                <p className="text-xs">The same family can share one phone. If this is a different family, go on and add it as new.</p>
              </div>
            )}

            <ParentFormFields idPrefix="student-parent" values={values} errors={errors} onChange={handleChange} />

            <div className="flex gap-3 pt-4 border-t border-warm-200">
              <button type="button" onClick={onClose} className="btn-secondary flex-1">
                Cancel
              </button>
              <button type="submit" className="btn-primary flex-1">
                Add and link
              </button>
            </div>
          </form>
        ) : (
          <div className="space-y-4">
            <div>
              <label htmlFor="student-parent-search" className="block text-sm font-medium text-charcoal-800 mb-1.5">
                Search by name, phone or email
              </label>
              <div className="relative">
                <Search size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-charcoal-400" aria-hidden="true" />
                <input
                  id="student-parent-search"
                  type="search"
                  autoFocus
                  autoComplete="off"
                  value={query}
                  onChange={(event) => setQuery(event.target.value)}
                  className="input pl-10"
                  placeholder="For example Patel or 98765"
                />
              </div>
            </div>

            <p className="text-xs text-charcoal-500" aria-live="polite">
              {totalMatches === 0
                ? 'No matching parent record.'
                : totalMatches > results.length
                  ? `Showing ${results.length} of ${totalMatches}. Type more to narrow the list.`
                  : `${totalMatches} ${totalMatches === 1 ? 'record' : 'records'}`}
            </p>

            <ul className="space-y-2 max-h-80 overflow-y-auto">
              {results.map((parent) => {
                const linkedHere = current?.id === parent.id;
                return (
                  <li key={parent.id} className="flex flex-wrap items-start justify-between gap-3 rounded-lg border border-warm-200 px-4 py-3">
                    <div className="min-w-0 text-sm">
                      <p className="font-medium text-charcoal-900">{parentFullLabel(parent)}</p>
                      <p className="text-charcoal-600">
                        {[parent.fatherPhone, parent.motherPhone, parent.guardianPhone].filter(Boolean).join(' · ')}
                      </p>
                      <p className="text-xs text-charcoal-500 truncate">{parent.address}</p>
                      <p className="text-xs text-charcoal-500 mt-1">
                        {childNames(parent, allStudents) ? `Children: ${childNames(parent, allStudents)}` : 'No children linked yet'}
                      </p>
                    </div>
                    <button
                      type="button"
                      onClick={() => linkExisting(parent)}
                      disabled={linkedHere}
                      className="btn-secondary text-sm py-1.5 px-3 disabled:opacity-50"
                    >
                      {linkedHere ? 'Already linked' : `Link to ${student.firstName}`}
                    </button>
                  </li>
                );
              })}
            </ul>

            <div className="flex pt-4 border-t border-warm-200">
              <button type="button" onClick={onClose} className="btn-secondary flex-1">
                Close
              </button>
            </div>
          </div>
        )}
      </div>
    </Modal>
  );
}
