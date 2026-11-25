import { useMemo, useState } from 'react';
import { snapshot } from '../../../core/api/worldStore';
import { formatDate } from '../../../core/org/rules';
import { DUTY_TITLES, EVENT_ROLES, isExited } from '../../../core/staff/model';
import { addDuty, openEventsOf } from '../../../core/staff/ops';
import Button from '../../../shared/ui/Button';
import { SelectField, TextField } from '../../../shared/ui/Field';
import { Alert } from '../../../shared/ui/Feedback';
import { Dialog } from '../../../shared/ui/Overlay';
import { useApply } from '../../organization/hooks';
import { useInstStaff } from '../hooks';

interface DutyDialogProps {
  open: boolean;
  onClose: () => void;
  /** Fixes the person, for example from a profile. Otherwise the person is chosen. */
  staffId?: string;
  /** Opens with this kind selected. */
  initialKind?: 'standing' | 'event';
  /** Opens with this event selected. */
  eventId?: string;
}

interface Form {
  kind: 'standing' | 'event';
  staffId: string;
  title: string;
  custom: string;
  eventId: string;
  role: string;
  customRole: string;
  from: string;
  to: string;
  note: string;
}

const today = () => new Date().toISOString().slice(0, 10);

/** Adds a duty. An ongoing duty is something like class teacher. An event duty is a job at one event of the Events module. */
export default function DutyDialog({ open, onClose, staffId, initialKind = 'standing', eventId }: DutyDialogProps) {
  if (!open) return null;
  return <Body onClose={onClose} staffId={staffId} initialKind={initialKind} eventId={eventId} />;
}

function Body({ onClose, staffId, initialKind, eventId }: Omit<DutyDialogProps, 'open'>) {
  const { inst, state, members, nameOf } = useInstStaff();
  const apply = useApply();
  const bank = state.banks[inst.id] ?? { groups: [], subjects: [] };
  const events = useMemo(() => openEventsOf(snapshot(), inst.id).sort((a, b) => String(a.data.date).localeCompare(String(b.data.date))), [inst.id]);
  const pick = events.find((item) => item.id === eventId);
  const [form, setForm] = useState<Form>(() => ({
    kind: initialKind ?? 'standing',
    staffId: staffId ?? '',
    title: DUTY_TITLES[0],
    custom: '',
    eventId: pick?.id ?? '',
    role: EVENT_ROLES[0],
    customRole: '',
    from: pick ? String(pick.data.date) : today(),
    to: pick ? String(pick.data.date) : '',
    note: '',
  }));
  const [error, setError] = useState('');
  const set = (patch: Partial<Form>) => setForm((current) => ({ ...current, ...patch }));
  const event = events.find((item) => item.id === form.eventId);
  const isEvent = form.kind === 'event';

  const submit = () => {
    const title = isEvent ? (form.role === 'other' ? form.customRole : form.role) : form.title === 'other' ? form.custom : form.title;
    const result = apply(
      (snap, now, actor) => addDuty(snap, { instId: inst.id, staffId: form.staffId, title, from: form.from, to: form.to || undefined, note: form.note, eventId: isEvent ? form.eventId : undefined, role: isEvent ? title : undefined }, actor, now),
      isEvent ? 'Event duty added.' : 'Duty added.',
    );
    if (result.ok) onClose();
    else setError(result.error);
  };

  return (
    <Dialog
      open
      onClose={onClose}
      title={isEvent ? 'Add an event duty' : 'Add a duty'}
      footer={
        <>
          <Button onClick={onClose}>Cancel</Button>
          <Button variant="primary" onClick={submit}>
            {isEvent ? 'Add event duty' : 'Add duty'}
          </Button>
        </>
      }
    >
      <form onSubmit={(e) => { e.preventDefault(); submit(); }} noValidate className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        {error && (
          <div className="sm:col-span-2">
            <Alert tone="danger">{error}</Alert>
          </div>
        )}
        <SelectField className="sm:col-span-2" label="Kind of duty" options={[{ value: 'standing', label: 'Ongoing duty (class teacher, in-charge)' }, { value: 'event', label: 'Job at an event' }]} value={form.kind} onChange={(value) => set({ kind: value as Form['kind'] })} />
        {staffId ? (
          <p className="sm:col-span-2 text-sm text-charcoal-800">
            Person: <span className="font-medium">{nameOf(staffId)}</span>
          </p>
        ) : (
          <SelectField className="sm:col-span-2" label="Person" required placeholder="Choose" options={members.filter((member) => !isExited(member.employment.status)).map((member) => ({ value: member.id, label: `${member.person.fullName} (${member.employment.category === 'teaching' ? 'teaching' : 'non-teaching'})` }))} value={form.staffId} onChange={(value) => set({ staffId: value })} />
        )}

        {isEvent ? (
          <>
            {events.length === 0 ? (
              <div className="sm:col-span-2">
                <Alert tone="warning">There is no event to give duties for. Add an event in Events first. Events that are held or cancelled are closed.</Alert>
              </div>
            ) : (
              <SelectField className="sm:col-span-2" label="Event" required placeholder="Choose" options={events.map((item) => ({ value: item.id, label: `${String(item.data.title)} (${formatDate(String(item.data.date))})` }))} value={form.eventId} onChange={(value) => { const chosen = events.find((item) => item.id === value); set({ eventId: value, from: chosen ? String(chosen.data.date) : form.from, to: chosen ? String(chosen.data.date) : form.to }); }} />
            )}
            <SelectField label="Job at the event" options={[...EVENT_ROLES.map((role) => ({ value: role, label: role })), { value: 'other', label: 'Other' }]} value={form.role} onChange={(value) => set({ role: value })} />
            {form.role === 'other' && <TextField label="Name of the job" required value={form.customRole} onChange={(value) => set({ customRole: value })} />}
          </>
        ) : (
          <>
            <SelectField label="Duty" options={[...DUTY_TITLES.map((title) => ({ value: title, label: title })), { value: 'other', label: 'Other' }]} value={form.title} onChange={(value) => set({ title: value })} />
            {form.title === 'other' && <TextField label="Name of the duty" required value={form.custom} onChange={(value) => set({ custom: value })} />}
          </>
        )}
        <TextField label="From" type="date" required value={form.from} onChange={(value) => set({ from: value })} />
        <TextField label="Until" type="date" hint={isEvent ? (event ? `The event is on ${formatDate(String(event.data.date))}. The duty also ends when the event is held or cancelled.` : 'Ends when the event is held or cancelled.') : 'Leave empty for no end date.'} value={form.to} onChange={(value) => set({ to: value })} />
        {!isEvent && form.title === 'Class teacher' && bank.groups.length > 0 ? (
          <SelectField className="sm:col-span-2" label="Class" placeholder="Choose" options={bank.groups.map((group) => ({ value: group, label: group }))} value={form.note} onChange={(value) => set({ note: value })} />
        ) : (
          <TextField className="sm:col-span-2" label="Note" hint={isEvent ? 'For example the place or the time.' : 'For example the class.'} value={form.note} onChange={(value) => set({ note: value })} />
        )}
      </form>
    </Dialog>
  );
}
