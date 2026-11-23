import { UserPlus } from 'lucide-react';
import { useFamily } from '../../../core/api/familyStore';
import { getParentForStudent, parentPeople } from '../../../core/api/familyLogic';
import type { Student } from '../../../types';

interface StudentParentSummaryProps {
  student: Student;
  /** Opens the Parent/Guardian tab, where the details are managed. */
  onManage: () => void;
}

/** Short parent block for the Overview tab. Same data as the Parent/Guardian tab. */
export default function StudentParentSummary({ student, onManage }: StudentParentSummaryProps) {
  const { family } = useFamily();
  const parent = getParentForStudent(family, student.id);

  const people = parent ? parentPeople(parent) : [];

  return (
    <div>
      <div className="flex items-center justify-between mb-4">
        <h3 className="font-semibold text-charcoal-950">Parent/Guardian Information</h3>
        <button type="button" onClick={onManage} className="text-sm font-medium text-primary-700 hover:underline">
          {parent ? 'Manage' : 'Add parent'}
        </button>
      </div>

      {parent ? (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {people.map((person) => (
            <div key={person.key} className="p-4 bg-warm-50 rounded-lg">
              <p className="text-xs text-charcoal-500 mb-2">{person.role}</p>
              <p className="font-medium text-charcoal-900">{person.name}</p>
              {person.phone && <p className="text-sm text-charcoal-600 mt-2">{person.phone}</p>}
              {person.email && <p className="text-sm text-charcoal-600">{person.email}</p>}
            </div>
          ))}
        </div>
      ) : (
        <div className="rounded-lg border border-dashed border-warm-300 bg-warm-50 px-4 py-6 text-center">
          <p className="text-sm text-charcoal-700">No parent or guardian is linked to {student.firstName}.</p>
          <button type="button" onClick={onManage} className="btn-primary mt-3 inline-flex items-center gap-2 text-sm">
            <UserPlus size={16} aria-hidden="true" />
            Add parent
          </button>
        </div>
      )}
    </div>
  );
}
