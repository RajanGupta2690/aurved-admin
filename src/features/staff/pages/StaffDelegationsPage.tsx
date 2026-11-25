import { useState } from 'react';
import { Plus } from 'lucide-react';
import { usePortal } from '../../../core/context/portalContext';
import { formatDate } from '../../../core/org/rules';
import { isExited } from '../../../core/staff/model';
import type { Delegation } from '../../../core/staff/model';
import { createDelegation, delegationLive, endDelegation } from '../../../core/staff/ops';
import PageContainer from '../../../shared/layout/PageContainer';
import { Badge } from '../../../shared/ui/Badge';
import Button from '../../../shared/ui/Button';
import ConfirmDialog from '../../../shared/ui/ConfirmDialog';
import DataTable from '../../../shared/ui/DataTable';
import type { Column } from '../../../shared/ui/DataTable';
import { CheckboxField, SelectField, TextareaField, TextField } from '../../../shared/ui/Field';
import { Alert } from '../../../shared/ui/Feedback';
import { PageHeader } from '../../../shared/ui/Layout';
import { Dialog } from '../../../shared/ui/Overlay';
import { useApply } from '../../organization/hooks';
import StaffNav from '../components/StaffNav';
import { useInstStaff } from '../hooks';

/** What can be handed over. Each preset is a list of permissions. The giver must hold every one. */
const PRESETS = [
  { id: 'approvals', label: 'Approve and reject requests', permissions: ['inbox.tasks.approve', 'inbox.tasks.reject'] },
  { id: 'attendance', label: 'Mark attendance', permissions: ['attendance.students.view', 'attendance.students.create', 'attendance.students.edit'] },
  { id: 'notices', label: 'Publish notices', permissions: ['communication.notices.view', 'communication.notices.create', 'communication.notices.publish'] },
  { id: 'admissions', label: 'Handle admissions', permissions: ['admissions.applications.view', 'admissions.applications.create', 'admissions.applications.edit'] },
  { id: 'fees', label: 'View fees', permissions: ['finance.fees.view'] },
  { id: 'calendar', label: 'Manage the calendar', permissions: ['calendar.events.create', 'calendar.events.edit', 'calendar.events.archive'] },
];

type State = 'Running' | 'Starts later' | 'Expired' | 'Revoked' | 'Ended';
const stateOf = (item: Delegation, today: string): State => (item.status === 'revoked' ? 'Revoked' : item.status === 'ended' ? 'Ended' : delegationLive(item, today) ? 'Running' : item.from > today ? 'Starts later' : 'Expired');

/** STF-24 */
export default function StaffDelegationsPage() {
  const { can, path } = usePortal();
  const { inst, state, members, nameOf } = useInstStaff();
  const apply = useApply();
  const [today] = useState(() => new Date().toISOString().slice(0, 10));
  const [form, setForm] = useState<{ fromId: string; toId: string; presets: string[]; from: string; to: string; reason: string } | null>(null);
  const [formError, setFormError] = useState('');
  const [revoke, setRevoke] = useState<Delegation | null>(null);
  const [error, setError] = useState('');
  const canCreate = can('staff.delegation.create').allowed;
  const canRevoke = can('staff.delegation.archive').allowed;
  const rows = state.delegations.filter((item) => item.instId === inst.id);
  const withAccount = members.filter((member) => member.accountId && !isExited(member.employment.status));

  const submit = () => {
    if (!form) return;
    const permissions = PRESETS.filter((preset) => form.presets.includes(preset.id)).flatMap((preset) => preset.permissions);
    const result = apply((snap, now, actor) => createDelegation(snap, { instId: inst.id, fromId: form.fromId, toId: form.toId, permissions, from: form.from, to: form.to, reason: form.reason }, actor, now), 'Delegation created.');
    if (result.ok) setForm(null);
    else setFormError(result.error);
  };

  const columns: Column<Delegation>[] = [
    { key: 'from', header: 'From', sortable: true, accessor: (row) => nameOf(row.fromId) },
    { key: 'to', header: 'To', sortable: true, accessor: (row) => nameOf(row.toId) },
    { key: 'what', header: 'What', accessor: (row) => PRESETS.filter((preset) => preset.permissions.every((p) => row.permissions.includes(p))).map((preset) => preset.label).join('; '), cell: (row) => <span>{PRESETS.filter((preset) => preset.permissions.every((p) => row.permissions.includes(p))).map((preset) => preset.label).join('; ') || `${row.permissions.length} permissions`}</span> },
    { key: 'period', header: 'Period', sortable: true, accessor: (row) => row.from, cell: (row) => `${formatDate(row.from)} to ${formatDate(row.to)}` },
    { key: 'reason', header: 'Reason', accessor: (row) => row.reason, defaultHidden: true },
    { key: 'state', header: 'State', sortable: true, accessor: (row) => stateOf(row, today), cell: (row) => { const value = stateOf(row, today); return <Badge tone={value === 'Running' ? 'success' : value === 'Starts later' ? 'info' : 'neutral'}>{value}</Badge>; } },
  ];

  return (
    <PageContainer>
      <PageHeader title="Delegation" eyebrow="STF-24" description="Hand some permissions to a colleague for a period, for example during leave. You can only hand over what you hold. It stops by itself on the last day, and you can revoke it earlier." breadcrumbs={[{ label: inst.shortName, to: path() }, { label: 'Delegation' }]} actions={<Button variant="primary" icon={<Plus size={16} aria-hidden="true" />} disabled={!canCreate} onClick={() => { setFormError(''); setForm({ fromId: '', toId: '', presets: [], from: today, to: today, reason: '' }); }}>New delegation</Button>} />
      <StaffNav />
      {error && <Alert tone="danger" className="mb-4">{error}</Alert>}
      <div className="card !p-0 overflow-hidden">
        <DataTable caption="Delegations" rows={rows} columns={columns} rowKey={(row) => row.id} searchText={(row) => `${nameOf(row.fromId)} ${nameOf(row.toId)} ${row.reason}`} searchPlaceholder="Search delegations" initialSort={{ key: 'period', direction: 'desc' }} rowActions={(row) => (row.status === 'active' ? <Button size="sm" disabled={!canRevoke} onClick={() => { setError(''); setRevoke(row); }} aria-label={`Revoke the delegation from ${nameOf(row.fromId)} to ${nameOf(row.toId)}`}>Revoke</Button> : null)} emptyTitle="No delegations" emptyDescription="Create one when someone is away." />
      </div>
      <Dialog open={form !== null} onClose={() => setForm(null)} title="New delegation" description="Both people need a sign-in account." footer={<><Button onClick={() => setForm(null)}>Cancel</Button><Button variant="primary" onClick={submit}>Delegate</Button></>}>
        {form && (
          <form onSubmit={(event) => { event.preventDefault(); submit(); }} noValidate className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            {formError && <div className="sm:col-span-2"><Alert tone="danger">{formError}</Alert></div>}
            <SelectField label="Hand over from" required placeholder="Choose" options={withAccount.map((member) => ({ value: member.id, label: member.person.fullName }))} value={form.fromId} onChange={(value) => setForm({ ...form, fromId: value })} />
            <SelectField label="To" required placeholder="Choose" options={withAccount.filter((member) => member.id !== form.fromId).map((member) => ({ value: member.id, label: member.person.fullName }))} value={form.toId} onChange={(value) => setForm({ ...form, toId: value })} />
            <TextField label="First day" type="date" required value={form.from} onChange={(value) => setForm({ ...form, from: value })} />
            <TextField label="Last day" type="date" required hint="At most 90 days." value={form.to} onChange={(value) => setForm({ ...form, to: value })} />
            <fieldset className="sm:col-span-2">
              <legend className="mb-2 text-sm font-medium text-charcoal-800">What to hand over</legend>
              <div className="grid gap-2 sm:grid-cols-2">
                {PRESETS.map((preset) => (
                  <CheckboxField key={preset.id} label={preset.label} checked={form.presets.includes(preset.id)} onChange={(checked) => setForm({ ...form, presets: checked ? [...form.presets, preset.id] : form.presets.filter((id) => id !== preset.id) })} />
                ))}
              </div>
            </fieldset>
            <TextareaField className="sm:col-span-2" label="Reason" required rows={2} value={form.reason} onChange={(value) => setForm({ ...form, reason: value })} />
          </form>
        )}
      </Dialog>
      <ConfirmDialog open={revoke !== null} onClose={() => setRevoke(null)} onConfirm={(reason) => { if (!revoke) return; const r = apply((snap, now, actor) => endDelegation(snap, revoke.id, actor, now, reason), 'Delegation revoked.'); setError(r.ok ? '' : r.error); }} title="Revoke the delegation" message="The colleague loses the handed-over permissions at once." itemName={revoke ? `${nameOf(revoke.fromId)} to ${nameOf(revoke.toId)}` : undefined} confirmLabel="Revoke" requireReason />
    </PageContainer>
  );
}
