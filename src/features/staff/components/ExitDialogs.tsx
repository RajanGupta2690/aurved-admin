import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { usePortal } from '../../../core/context/portalContext';
import { isExternal } from '../../../core/org/rules';
import { exitStaff, transferStaff } from '../../../core/staff/ops';
import type { StaffMember, StaffStatus } from '../../../core/staff/model';
import Button from '../../../shared/ui/Button';
import { SelectField, TextareaField, TextField } from '../../../shared/ui/Field';
import { Alert } from '../../../shared/ui/Feedback';
import { Dialog } from '../../../shared/ui/Overlay';
import { useApply, useOrgData } from '../../organization/hooks';

type ExitKind = Extract<StaffStatus, 'resigned' | 'terminated' | 'retired'>;

/** Record that someone left, or move them to another institution of the same organization. */
export function ExitDialog({ member, onClose }: { member: StaffMember | null; onClose: () => void }) {
  const apply = useApply();
  const [kind, setKind] = useState<ExitKind>('resigned');
  const [date, setDate] = useState('');
  const [reason, setReason] = useState('');
  const [error, setError] = useState('');
  const [notes, setNotes] = useState<string[]>([]);
  const close = () => {
    setError('');
    setNotes([]);
    setReason('');
    onClose();
  };
  const submit = () => {
    if (!member) return;
    const result = apply((snap, now, actor) => exitStaff(snap, member.id, { kind, date: date || now.slice(0, 10), reason }, actor, now), `${member.person.fullName}: employment ended.`);
    if (!result.ok) return setError(result.error);
    setNotes(result.notes);
  };
  return (
    <Dialog
      open={member !== null}
      onClose={close}
      title={notes.length ? 'Employment ended' : `End the employment of ${member?.person.fullName ?? ''}`}
      description="The record is kept. Sign-in access, assignments, duties and delegations end with it."
      footer={
        notes.length ? (
          <Button variant="primary" onClick={close}>
            Done
          </Button>
        ) : (
          <>
            <Button onClick={close}>Cancel</Button>
            <Button variant="danger" onClick={submit}>
              End employment
            </Button>
          </>
        )
      }
    >
      {notes.length > 0 ? (
        <Alert tone="success" title="What changed">
          <ul className="list-disc pl-5">
            {notes.map((note) => (
              <li key={note}>{note}</li>
            ))}
          </ul>
        </Alert>
      ) : (
        <form onSubmit={(event) => { event.preventDefault(); submit(); }} noValidate className="space-y-4">
          {error && <Alert tone="danger">{error}</Alert>}
          <SelectField label="How did it end?" options={[{ value: 'resigned', label: 'Resigned' }, { value: 'retired', label: 'Retired' }, { value: 'terminated', label: 'Terminated' }]} value={kind} onChange={(value) => setKind(value as ExitKind)} />
          <TextField label="Last working day" type="date" value={date} onChange={setDate} hint="Today if left empty." />
          <TextareaField label="Reason" required rows={3} value={reason} onChange={setReason} />
        </form>
      )}
    </Dialog>
  );
}

export function TransferDialog({ member, onClose }: { member: StaffMember | null; onClose: () => void }) {
  const { institutions } = useOrgData();
  const { path } = usePortal();
  const navigate = useNavigate();
  const apply = useApply();
  const [target, setTarget] = useState('');
  const [date, setDate] = useState('');
  const [reason, setReason] = useState('');
  const [error, setError] = useState('');
  const from = institutions.find((inst) => inst.id === member?.instId);
  const options = institutions.filter((inst) => inst.orgId === from?.orgId && inst.id !== from?.id && !isExternal(inst) && inst.status === 'active');
  const submit = () => {
    if (!member) return;
    const result = apply((snap, now, actor) => transferStaff(snap, member.id, target, date || now.slice(0, 10), reason, actor, now), `${member.person.fullName} was transferred.`);
    if (!result.ok) return setError(result.error);
    onClose();
    navigate(path('staff-exits'));
  };
  return (
    <Dialog
      open={member !== null}
      onClose={() => { setError(''); onClose(); }}
      title={`Transfer ${member?.person.fullName ?? ''}`}
      description="A new record is created at the other institution. This record stays as transferred out."
      footer={
        <>
          <Button onClick={onClose}>Cancel</Button>
          <Button variant="primary" onClick={submit} disabled={options.length === 0}>
            Transfer
          </Button>
        </>
      }
    >
      <form onSubmit={(event) => { event.preventDefault(); submit(); }} noValidate className="space-y-4">
        {error && <Alert tone="danger">{error}</Alert>}
        {options.length === 0 && <Alert tone="info">There is no other institution in this organization that takes transfers.</Alert>}
        <SelectField label="Move to" required placeholder="Choose an institution" options={options.map((inst) => ({ value: inst.id, label: inst.name }))} value={target} onChange={setTarget} />
        <TextField label="From" type="date" value={date} onChange={setDate} hint="Today if left empty." />
        <TextareaField label="Reason" required rows={3} value={reason} onChange={setReason} />
      </form>
    </Dialog>
  );
}
