import { useState } from 'react';
import { Link } from 'react-router-dom';
import { Briefcase, Link2, Mail, MapPin, Pencil, Phone, Unlink, UserPlus, Users } from 'lucide-react';
import { students as allStudents } from '../../../data/mockData';
import { useFamily } from '../../../core/api/familyStore';
import { getParentForStudent, parentFullLabel, parentPeople } from '../../../core/api/familyLogic';
import type { ParentPerson } from '../../../core/api/familyLogic';
import DeleteConfirmation from '../../../shared/components/DeleteConfirmation';
import Toast from '../../../shared/components/Toast';
import ParentEditDialog from '../../parents/components/ParentEditDialog';
import StudentParentDialog from './StudentParentDialog';
import type { ParentDialogMode } from './StudentParentDialog';
import type { Student } from '../../../types';

type DialogState = { kind: 'add'; mode: ParentDialogMode } | { kind: 'edit' } | { kind: 'unlink' } | null;
type ToastState = { show: boolean; message: string };

function PersonCard({ person }: { person: ParentPerson }) {
  return (
    <div className="rounded-xl border border-warm-200 bg-warm-50 p-4">
      <p className="text-xs font-medium uppercase tracking-wide text-charcoal-500">{person.role}</p>
      <p className="mt-1 font-semibold text-charcoal-950">{person.name}</p>
      <dl className="mt-3 space-y-1.5 text-sm text-charcoal-700">
        {person.phone && (
          <div className="flex items-center gap-2">
            <dt className="sr-only">Mobile</dt>
            <Phone size={14} className="text-charcoal-400" aria-hidden="true" />
            <dd>
              <a href={`tel:${person.phone.replace(/[^\d+]/g, '')}`} className="text-primary-700 hover:underline">
                {person.phone}
              </a>
            </dd>
          </div>
        )}
        {person.email && (
          <div className="flex items-center gap-2">
            <dt className="sr-only">Email</dt>
            <Mail size={14} className="text-charcoal-400" aria-hidden="true" />
            <dd className="break-all">
              <a href={`mailto:${person.email}`} className="text-primary-700 hover:underline">
                {person.email}
              </a>
            </dd>
          </div>
        )}
        {person.occupation && (
          <div className="flex items-center gap-2">
            <dt className="sr-only">Occupation</dt>
            <Briefcase size={14} className="text-charcoal-400" aria-hidden="true" />
            <dd>{person.occupation}</dd>
          </div>
        )}
      </dl>
    </div>
  );
}

/** Content of the Parent/Guardian tab on the student page. */
export default function StudentParentsPanel({ student }: { student: Student }) {
  const { family, actions } = useFamily();
  const [dialog, setDialog] = useState<DialogState>(null);
  const [toast, setToast] = useState<ToastState>({ show: false, message: '' });

  const parent = getParentForStudent(family, student.id);
  const notify = (message: string) => setToast({ show: true, message });

  const people = parent ? parentPeople(parent) : [];

  const siblings = parent
    ? parent.studentIds
        .filter((id) => id !== student.id)
        .map((id) => allStudents.find((candidate) => candidate.id === id))
        .filter((candidate): candidate is Student => Boolean(candidate))
    : [];

  return (
    <section aria-labelledby="student-parents-heading" className="space-y-6">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h3 id="student-parents-heading" className="font-semibold text-charcoal-950">
            Parents and guardians
          </h3>
          <p className="text-sm text-charcoal-600 mt-1">
            {parent
              ? `Linked record: ${parentFullLabel(parent)}`
              : `No parent or guardian is linked to ${student.firstName} yet.`}
          </p>
        </div>

        {parent && (
          <div className="flex flex-wrap gap-2">
            <button type="button" onClick={() => setDialog({ kind: 'edit' })} className="btn-secondary flex items-center gap-2 text-sm">
              <Pencil size={16} aria-hidden="true" />
              Edit details
            </button>
            <button
              type="button"
              onClick={() => setDialog({ kind: 'add', mode: 'existing' })}
              className="btn-secondary flex items-center gap-2 text-sm"
            >
              <Link2 size={16} aria-hidden="true" />
              Change record
            </button>
            <button
              type="button"
              onClick={() => setDialog({ kind: 'unlink' })}
              className="btn-ghost flex items-center gap-2 text-sm text-danger-700"
            >
              <Unlink size={16} aria-hidden="true" />
              Remove link
            </button>
          </div>
        )}
      </div>

      {!parent ? (
        <div className="rounded-xl border border-dashed border-warm-300 bg-warm-50 px-6 py-10 text-center">
          <Users size={32} className="mx-auto text-charcoal-400" aria-hidden="true" />
          <p className="mt-3 font-medium text-charcoal-900">This student has no parent record</p>
          <p className="mt-1 text-sm text-charcoal-600 max-w-md mx-auto">
            Add the parents here, or link a family that is already in the school if {student.firstName} has a brother or sister.
          </p>
          <div className="mt-5 flex flex-wrap justify-center gap-3">
            <button type="button" onClick={() => setDialog({ kind: 'add', mode: 'new' })} className="btn-primary flex items-center gap-2">
              <UserPlus size={18} aria-hidden="true" />
              Add parent
            </button>
            <button
              type="button"
              onClick={() => setDialog({ kind: 'add', mode: 'existing' })}
              className="btn-secondary flex items-center gap-2"
            >
              <Link2 size={18} aria-hidden="true" />
              Link existing parent
            </button>
          </div>
        </div>
      ) : (
        <>
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
            {people.map((person) => (
              <PersonCard key={person.key} person={person} />
            ))}
          </div>

          <div className="flex items-start gap-2 text-sm text-charcoal-700">
            <MapPin size={16} className="mt-0.5 text-charcoal-400 shrink-0" aria-hidden="true" />
            <p>{parent.address}</p>
          </div>

          {siblings.length > 0 && (
            <div className="rounded-xl border border-warm-200 px-4 py-3">
              <p className="text-sm font-medium text-charcoal-900">Other children of this family</p>
              <ul className="mt-2 flex flex-wrap gap-2">
                {siblings.map((sibling) => (
                  <li key={sibling.id}>
                    <Link
                      to={`/students/${sibling.id}`}
                      className="inline-flex items-center rounded-lg bg-warm-100 px-3 py-1.5 text-sm text-primary-700 hover:underline"
                    >
                      {sibling.fullName}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          )}
        </>
      )}

      {dialog?.kind === 'add' && (
        <StudentParentDialog student={student} initialMode={dialog.mode} onClose={() => setDialog(null)} onDone={notify} />
      )}
      {dialog?.kind === 'edit' && parent && (
        <ParentEditDialog parent={parent} onClose={() => setDialog(null)} onSaved={notify} />
      )}
      <DeleteConfirmation
        isOpen={dialog?.kind === 'unlink' && Boolean(parent)}
        onClose={() => setDialog(null)}
        onConfirm={() => {
          actions.unlink(student.id);
          notify(`Link removed. ${student.firstName} no longer has a parent record linked.`);
        }}
        title="Remove parent link"
        message={`${student.fullName} will no longer be linked to this record. The record and its other children are kept.`}
        itemName={parent ? parentFullLabel(parent) : undefined}
        confirmLabel="Remove link"
        warning="You can link the record again at any time."
      />

      <Toast show={toast.show} type="success" message={toast.message} onClose={() => setToast((previous) => ({ ...previous, show: false }))} />
    </section>
  );
}
