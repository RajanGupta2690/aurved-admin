import { useState } from 'react';
import { CalendarCheck, GraduationCap, Plus } from 'lucide-react';
import { snapshot } from '../../../core/api/worldStore';
import { usePortal } from '../../../core/context/portalContext';
import { formatDate } from '../../../core/org/rules';
import { delegationLive } from '../../../core/staff/ops';
import { SHIFT_LABEL } from '../../../core/staff/model';
import type { StaffMember } from '../../../core/staff/model';
import { assignTeaching, endAssignment, endDuty, policyOf, workloadOf } from '../../../core/staff/ops';
import { Badge } from '../../../shared/ui/Badge';
import Button from '../../../shared/ui/Button';
import { SelectField, TextField } from '../../../shared/ui/Field';
import { Alert } from '../../../shared/ui/Feedback';
import { Card, DescriptionList } from '../../../shared/ui/Layout';
import { Dialog } from '../../../shared/ui/Overlay';
import { useApply } from '../../organization/hooks';
import { useCurrentSessionId, useInstStaff } from '../hooks';
import DutyDialog from './DutyDialog';

/** Everything this person is responsible for: classes, duties, jobs at events, delegations. */
export default function ResponsibilitiesTab({ member }: { member: StaffMember }) {
  const { can } = usePortal();
  const { inst, state, departments, nameOf } = useInstStaff();
  const sessionId = useCurrentSessionId();
  const apply = useApply();
  const [error, setError] = useState('');
  const [duty, setDuty] = useState<'standing' | 'event' | null>(null);
  const [assign, setAssign] = useState<{ group: string; subject: string; periods: number } | null>(null);
  const [assignError, setAssignError] = useState('');
  const [today] = useState(() => new Date().toISOString().slice(0, 10));

  const left = ['resigned', 'terminated', 'retired', 'transferred'].includes(member.employment.status);
  const teaching = member.employment.category === 'teaching';
  const canAssign = can('staff.assignments.create').allowed && !left;
  const canUnassign = can('staff.assignments.archive').allowed && !left;
  const canDuty = can('staff.duties.create').allowed && !left;
  const canEnd = can('staff.duties.archive').allowed && !left;
  const bank = state.banks[inst.id] ?? { groups: [], subjects: [] };
  const max = policyOf(snapshot(), inst.id).maxPeriodsPerWeek;
  const load = workloadOf(snapshot(), member.id, sessionId);
  const classes = state.assignments.filter((item) => item.staffId === member.id && item.status === 'active' && item.sessionId === sessionId);
  const duties = state.duties.filter((item) => item.staffId === member.id && item.status === 'active');
  const classTeacher = duties.filter((item) => item.title === 'Class teacher' && !item.eventId);
  const ongoing = duties.filter((item) => !item.eventId && item.title !== 'Class teacher');
  const eventJobs = duties.filter((item) => item.eventId);
  const headOf = departments.filter((item) => item.headId === member.id && item.active);
  const given = state.delegations.filter((item) => item.fromId === member.id && delegationLive(item, today));
  const received = state.delegations.filter((item) => item.toId === member.id && delegationLive(item, today));
  const listed = new Set(member.work?.subjects ?? []);
  const subjectOptions = [...bank.subjects].sort((a, b) => Number(listed.has(b)) - Number(listed.has(a))).map((subject) => ({ value: subject, label: listed.has(subject) ? `${subject} (listed for this teacher)` : subject }));

  const end = (id: string) => {
    const result = apply((snap, now, actor) => endDuty(snap, id, actor, now), 'Duty ended.');
    setError(result.ok ? '' : result.error);
  };
  const submitAssign = () => {
    if (!assign) return;
    const result = apply((snap, now, actor) => assignTeaching(snap, { instId: inst.id, sessionId, staffId: member.id, group: assign.group, subject: assign.subject, periods: assign.periods }, actor, now), 'Assignment saved.');
    if (result.ok) setAssign(null);
    else setAssignError(result.error);
  };

  return (
    <div className="grid gap-6">
      {error && <Alert tone="danger">{error}</Alert>}
      {left && <Alert tone="info">This person has left. Their responsibilities ended with the employment.</Alert>}

      <Card title="Work" description={teaching ? 'The subjects this teacher can take.' : 'Where and when this person works.'}>
        {teaching ? (
          member.work?.subjects?.length ? (
            <ul aria-label="Subjects" className="flex flex-wrap gap-2">
              {member.work.subjects.map((subject) => (
                <li key={subject}>
                  <Badge tone="info">{subject}</Badge>
                </li>
              ))}
            </ul>
          ) : (
            <p className="text-sm text-charcoal-600">No subjects are listed for this teacher.</p>
          )
        ) : (
          <DescriptionList items={[{ label: 'Work area', value: member.work?.area || undefined }, { label: 'Shift', value: member.work?.shift ? SHIFT_LABEL[member.work.shift] : undefined }]} />
        )}
      </Card>

      {teaching && (
        <Card
          title="Classes and subjects"
          description={`Current session. ${load} of ${max} periods a week.`}
          actions={
            <Button size="sm" variant="primary" icon={<Plus size={14} aria-hidden="true" />} disabled={!canAssign} onClick={() => { setAssignError(''); setAssign({ group: '', subject: '', periods: 5 }); }}>
              Assign class and subject
            </Button>
          }
        >
          <div className="mb-4 h-2.5 w-full max-w-sm overflow-hidden rounded-full bg-warm-200" role="img" aria-label={`${Math.round((load / max) * 100)} percent of the weekly limit`}>
            <div className={load / max >= 0.9 ? 'h-full bg-warning-600' : 'h-full bg-primary-700'} style={{ width: `${Math.min(100, (load / max) * 100)}%` }} />
          </div>
          {classes.length === 0 ? (
            <p className="text-sm text-charcoal-600">No class or subject is assigned yet.</p>
          ) : (
            <ul className="divide-y divide-warm-200 text-sm">
              {classes.map((item) => (
                <li key={item.id} className="flex items-center justify-between gap-3 py-2">
                  <span>
                    <span className="font-medium text-charcoal-900">{item.subject}</span>, {item.group}
                    <span className="text-charcoal-600"> · {item.periods} periods a week</span>
                  </span>
                  <Button size="sm" disabled={!canUnassign} aria-label={`End ${item.subject} in ${item.group}`} onClick={() => { const r = apply((snap, now, actor) => endAssignment(snap, item.id, actor, now), 'Assignment ended.'); setError(r.ok ? '' : r.error); }}>
                    End
                  </Button>
                </li>
              ))}
            </ul>
          )}
        </Card>
      )}

      <Card
        title="Duties"
        description="Duties on top of the job."
        actions={
          <Button size="sm" variant="primary" icon={<Plus size={14} aria-hidden="true" />} disabled={!canDuty} onClick={() => setDuty('standing')}>
            Add duty
          </Button>
        }
      >
        {classTeacher.length > 0 && (
          <p className="mb-3 flex items-center gap-2 rounded-lg bg-primary-50 px-3 py-2 text-sm text-charcoal-900">
            <GraduationCap size={16} aria-hidden="true" />
            Class teacher{classTeacher[0].note ? ` of ${classTeacher[0].note}` : ''}
          </p>
        )}
        {headOf.length > 0 && <p className="mb-3 text-sm text-charcoal-800">Head of department: {headOf.map((item) => item.name).join(', ')}.</p>}
        {ongoing.length + classTeacher.length === 0 ? (
          <p className="text-sm text-charcoal-600">No ongoing duty.</p>
        ) : (
          <ul className="divide-y divide-warm-200 text-sm">
            {[...classTeacher, ...ongoing].map((item) => (
              <li key={item.id} className="flex items-center justify-between gap-3 py-2">
                <span>
                  <span className="font-medium text-charcoal-900">{item.title}</span>
                  {item.note && <span className="text-charcoal-700">, {item.note}</span>}
                  <span className="block text-xs text-charcoal-600">From {formatDate(item.from)}{item.to ? ` until ${formatDate(item.to)}` : ''}</span>
                </span>
                <Button size="sm" disabled={!canEnd} aria-label={`End the duty ${item.title}`} onClick={() => end(item.id)}>
                  End
                </Button>
              </li>
            ))}
          </ul>
        )}
      </Card>

      <Card
        title="Jobs at events"
        description="They end when the event is held or cancelled."
        actions={
          <Button size="sm" icon={<CalendarCheck size={14} aria-hidden="true" />} disabled={!canDuty} onClick={() => setDuty('event')}>
            Add event duty
          </Button>
        }
      >
        {eventJobs.length === 0 ? (
          <p className="text-sm text-charcoal-600">No job at an event.</p>
        ) : (
          <ul className="divide-y divide-warm-200 text-sm">
            {eventJobs.map((item) => (
              <li key={item.id} className="flex items-center justify-between gap-3 py-2">
                <span>
                  <span className="font-medium text-charcoal-900">{item.title}</span>
                  <span className="text-charcoal-700"> at {item.eventTitle}</span>
                  <span className="block text-xs text-charcoal-600">{formatDate(item.from)}{item.to && item.to !== item.from ? ` to ${formatDate(item.to)}` : ''}{item.note ? ` · ${item.note}` : ''}</span>
                </span>
                <Button size="sm" disabled={!canEnd} aria-label={`End the job ${item.title} at ${item.eventTitle}`} onClick={() => end(item.id)}>
                  End
                </Button>
              </li>
            ))}
          </ul>
        )}
      </Card>

      {(given.length > 0 || received.length > 0) && (
        <Card title="Delegation" description="Permissions handed over for a time.">
          <ul className="space-y-1.5 text-sm text-charcoal-800">
            {given.map((item) => (
              <li key={item.id}>Handed over to {nameOf(item.toId)} until {formatDate(item.to)}. {item.reason}</li>
            ))}
            {received.map((item) => (
              <li key={item.id}>Acting for {nameOf(item.fromId)} until {formatDate(item.to)}. {item.reason}</li>
            ))}
          </ul>
        </Card>
      )}

      <DutyDialog open={duty !== null} onClose={() => setDuty(null)} staffId={member.id} initialKind={duty ?? 'standing'} />
      <Dialog open={assign !== null} onClose={() => setAssign(null)} title={`Assign class and subject to ${member.person.fullName}`} footer={<><Button onClick={() => setAssign(null)}>Cancel</Button><Button variant="primary" onClick={submitAssign}>Assign</Button></>}>
        {assign && (
          <form onSubmit={(e) => { e.preventDefault(); submitAssign(); }} noValidate className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            {assignError && <div className="sm:col-span-2"><Alert tone="danger">{assignError}</Alert></div>}
            <SelectField label="Class" required placeholder="Choose" options={bank.groups.map((group) => ({ value: group, label: group }))} value={assign.group} onChange={(value) => setAssign({ ...assign, group: value })} />
            <SelectField label="Subject" required placeholder="Choose" options={subjectOptions} value={assign.subject} onChange={(value) => setAssign({ ...assign, subject: value })} />
            <TextField label="Periods a week" type="number" min={1} max={12} hint={`${load} of ${max} are used.`} value={assign.periods} onChange={(value) => setAssign({ ...assign, periods: Number(value) })} />
          </form>
        )}
      </Dialog>
    </div>
  );
}
