import { useState } from 'react';
import { Plus } from 'lucide-react';
import { usePortal } from '../../../core/context/portalContext';
import { formatDate } from '../../../core/org/rules';
import { DUTY_TITLES, isExited } from '../../../core/staff/model';
import type { Duty } from '../../../core/staff/model';
import { addDuty, endDuty } from '../../../core/staff/ops';
import PageContainer from '../../../shared/layout/PageContainer';
import { StatusBadge } from '../../../shared/ui/Badge';
import Button from '../../../shared/ui/Button';
import DataTable from '../../../shared/ui/DataTable';
import type { Column } from '../../../shared/ui/DataTable';
import { SelectField, TextField } from '../../../shared/ui/Field';
import { Alert } from '../../../shared/ui/Feedback';
import { PageHeader } from '../../../shared/ui/Layout';
import { Dialog } from '../../../shared/ui/Overlay';
import { useApply } from '../../organization/hooks';
import StaffNav from '../components/StaffNav';
import { useInstStaff } from '../hooks';

/** STF-17 */
export default function StaffDutiesPage() {
  const { can, path } = usePortal();
  const { inst, state, members, nameOf } = useInstStaff();
  const apply = useApply();
  const [form, setForm] = useState<{ staffId: string; title: string; custom: string; from: string; to: string; note: string } | null>(null);
  const [formError, setFormError] = useState('');
  const [error, setError] = useState('');
  const canCreate = can('staff.duties.create').allowed;
  const canEnd = can('staff.duties.archive').allowed;
  const rows = state.duties.filter((duty) => duty.instId === inst.id);

  const submit = () => {
    if (!form) return;
    const title = form.title === 'other' ? form.custom : form.title;
    const result = apply((snap, now, actor) => addDuty(snap, { instId: inst.id, staffId: form.staffId, title, from: form.from, to: form.to || undefined, note: form.note }, actor, now), 'Duty added.');
    if (result.ok) setForm(null);
    else setFormError(result.error);
  };

  const columns: Column<Duty>[] = [
    { key: 'title', header: 'Duty', sortable: true, accessor: (row) => row.title, cell: (row) => (<div><p className="font-medium text-charcoal-900">{row.title}</p>{row.note && <p className="text-xs text-charcoal-600">{row.note}</p>}</div>) },
    { key: 'who', header: 'Person', sortable: true, accessor: (row) => nameOf(row.staffId) },
    { key: 'from', header: 'From', sortable: true, accessor: (row) => row.from, cell: (row) => formatDate(row.from) },
    { key: 'to', header: 'Until', sortable: true, accessor: (row) => row.to ?? '', cell: (row) => (row.to ? formatDate(row.to) : 'No end date') },
    { key: 'status', header: 'Status', sortable: true, accessor: (row) => row.status, cell: (row) => <StatusBadge status={row.status === 'active' ? 'active' : 'closed'} label={row.status} /> },
  ];

  return (
    <PageContainer>
      <PageHeader title="Additional duties" eyebrow="STF-17" description="Duties on top of the job: class teacher, exam coordinator, in-charge roles. A duty ends when the person leaves." breadcrumbs={[{ label: inst.shortName, to: path() }, { label: 'Duties' }]} actions={<Button variant="primary" icon={<Plus size={16} aria-hidden="true" />} disabled={!canCreate} onClick={() => { setFormError(''); setForm({ staffId: '', title: DUTY_TITLES[0], custom: '', from: new Date().toISOString().slice(0, 10), to: '', note: '' }); }}>Add duty</Button>} />
      <StaffNav />
      {error && <Alert tone="danger" className="mb-4">{error}</Alert>}
      <div className="card !p-0 overflow-hidden">
        <DataTable caption="Additional duties" rows={rows} columns={columns} rowKey={(row) => row.id} searchText={(row) => `${row.title} ${nameOf(row.staffId)} ${row.note ?? ''}`} searchPlaceholder="Search duties" initialSort={{ key: 'from', direction: 'desc' }} rowActions={(row) => row.status === 'active' ? <Button size="sm" disabled={!canEnd} onClick={() => { const r = apply((snap, now, actor) => endDuty(snap, row.id, actor, now), 'Duty ended.'); setError(r.ok ? '' : r.error); }} aria-label={`End the duty ${row.title} of ${nameOf(row.staffId)}`}>End</Button> : null} emptyTitle="No duties" />
      </div>
      <Dialog open={form !== null} onClose={() => setForm(null)} title="Add a duty" footer={<><Button onClick={() => setForm(null)}>Cancel</Button><Button variant="primary" onClick={submit}>Add duty</Button></>}>
        {form && (
          <form onSubmit={(event) => { event.preventDefault(); submit(); }} noValidate className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            {formError && <div className="sm:col-span-2"><Alert tone="danger">{formError}</Alert></div>}
            <SelectField className="sm:col-span-2" label="Person" required placeholder="Choose" options={members.filter((member) => !isExited(member.employment.status)).map((member) => ({ value: member.id, label: member.person.fullName }))} value={form.staffId} onChange={(value) => setForm({ ...form, staffId: value })} />
            <SelectField label="Duty" options={[...DUTY_TITLES.map((title) => ({ value: title, label: title })), { value: 'other', label: 'Other' }]} value={form.title} onChange={(value) => setForm({ ...form, title: value })} />
            {form.title === 'other' && <TextField label="Name of the duty" required value={form.custom} onChange={(value) => setForm({ ...form, custom: value })} />}
            <TextField label="From" type="date" required value={form.from} onChange={(value) => setForm({ ...form, from: value })} />
            <TextField label="Until" type="date" hint="Leave empty for no end date." value={form.to} onChange={(value) => setForm({ ...form, to: value })} />
            <TextField className="sm:col-span-2" label="Note" hint="For example the class." value={form.note} onChange={(value) => setForm({ ...form, note: value })} />
          </form>
        )}
      </Dialog>
    </PageContainer>
  );
}
