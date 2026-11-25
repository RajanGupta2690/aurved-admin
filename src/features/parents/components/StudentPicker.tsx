import { useState } from 'react';
import type { KeyboardEvent } from 'react';
import { Plus, X } from 'lucide-react';
import { findStudentByCode, getParentForStudent, parentFullLabel, searchStudents } from '../../../core/api/familyLogic';
import type { FamilyState } from '../../../core/api/familyLogic';
import type { Student } from '../../../types';

interface StudentPickerProps {
  idPrefix: string;
  students: Student[];
  family: FamilyState;
  selected: string[];
  onChange: (ids: string[]) => void;
  error?: string;
}

/**
 * Links a parent record to students by the school student ID (the admission number) or by name.
 * A student who already has a parent record cannot be picked here. That is changed on the student page.
 */
export default function StudentPicker({ idPrefix, students, family, selected, onChange, error }: StudentPickerProps) {
  const [query, setQuery] = useState('');
  const [message, setMessage] = useState('');
  const inputId = `${idPrefix}-student-search`;
  const picked = selected.map((id) => students.find((student) => student.id === id)).filter((student): student is Student => Boolean(student));
  const matches = searchStudents(students, query).filter((student) => !selected.includes(student.id));

  const add = (student: Student) => {
    const current = getParentForStudent(family, student.id);
    if (current) {
      setMessage(`${student.fullName} (${student.admissionNumber}) is already linked to ${parentFullLabel(current)}. Open the student and use the Parent/Guardian tab to change it.`);
      return;
    }
    if (!selected.includes(student.id)) onChange([...selected, student.id]);
    setQuery('');
    setMessage('');
  };

  const onEnter = (event: KeyboardEvent<HTMLInputElement>) => {
    if (event.key !== 'Enter') return;
    event.preventDefault();
    if (!query.trim()) return;
    const exact = findStudentByCode(students, query);
    if (exact) return add(exact);
    if (matches.length === 1) return add(matches[0]);
    setMessage(matches.length > 1 ? 'More than one student matches. Choose one from the list.' : `No student has the school student ID "${query.trim()}".`);
  };

  return (
    <div>
      <label htmlFor={inputId} className="block text-sm font-medium text-charcoal-800 mb-1.5">
        School student ID or name{' '}
        <span className="text-danger-700" aria-hidden="true">
          *
        </span>
      </label>
      <input
        id={inputId}
        type="text"
        autoComplete="off"
        value={query}
        onChange={(event) => {
          setQuery(event.target.value);
          setMessage('');
        }}
        onKeyDown={onEnter}
        aria-describedby={`${inputId}-hint`}
        aria-invalid={error ? true : undefined}
        className={`input ${error ? 'input-error' : ''}`}
        placeholder="For example SUN/2024/001"
      />
      <p id={`${inputId}-hint`} className="mt-1 text-xs text-charcoal-600">
        Type the school student ID and press Enter, or type a name and choose from the list. Add every child this family has in the school.
      </p>

      {query.trim().length >= 2 && matches.length > 0 && (
        <ul aria-label="Matching students" className="mt-2 divide-y divide-warm-200 rounded-lg border border-warm-200">
          {matches.map((student) => {
            const current = getParentForStudent(family, student.id);
            return (
              <li key={student.id} className="flex items-center justify-between gap-3 px-3 py-2 text-sm">
                <span>
                  <span className="block font-medium text-charcoal-900">{student.fullName}</span>
                  <span className="block text-xs text-charcoal-600">
                    {student.admissionNumber}
                    {current ? ` · already linked to ${parentFullLabel(current)}` : ''}
                  </span>
                </span>
                <button type="button" className="btn-secondary flex items-center gap-1 px-3 py-1.5 text-sm" disabled={Boolean(current)} onClick={() => add(student)} aria-label={`Add ${student.fullName}, ${student.admissionNumber}`}>
                  <Plus size={14} aria-hidden="true" />
                  Add
                </button>
              </li>
            );
          })}
        </ul>
      )}

      <p role="status" className="mt-2 min-h-[1rem] text-xs text-warning-800">
        {message}
      </p>
      {error && (
        <p role="alert" data-error-focus="true" tabIndex={-1} className="mt-1 text-xs text-danger-700">
          {error}
        </p>
      )}

      {picked.length > 0 && (
        <ul aria-label="Students to link" className="mt-3 flex flex-wrap gap-2">
          {picked.map((student) => (
            <li key={student.id} className="inline-flex items-center gap-2 rounded-lg bg-primary-50 px-3 py-1.5 text-sm text-primary-900">
              <span>
                {student.fullName} <span className="text-xs text-charcoal-600">{student.admissionNumber}</span>
              </span>
              <button type="button" onClick={() => onChange(selected.filter((id) => id !== student.id))} aria-label={`Remove ${student.fullName}`} className="rounded p-0.5 hover:bg-primary-100">
                <X size={14} aria-hidden="true" />
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
