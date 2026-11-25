import { useState } from 'react';
import { Plus, X } from 'lucide-react';
import { snapshot } from '../../../core/api/worldStore';
import { usePortal } from '../../../core/context/portalContext';
import { isExited } from '../../../core/staff/model';
import type { StaffMember } from '../../../core/staff/model';
import { assignTeaching, endAssignment, policyOf, workloadOf } from '../../../core/staff/ops';
import PageContainer from '../../../shared/layout/PageContainer';
import { Badge } from '../../../shared/ui/Badge';
import Button from '../../../shared/ui/Button';
import DataTable from '../../../shared/ui/DataTable';
import type { Column } from '../../../shared/ui/DataTable';
import { SelectField, TextField } from '../../../shared/ui/Field';
import { Alert, EmptyState } from '../../../shared/ui/Feedback';
import { Card, PageHeader, TabPanel, Tabs } from '../../../shared/ui/Layout';
import { Dialog } from '../../../shared/ui/Overlay';
import { useApply } from '../../organization/hooks';
import StaffNav from '../components/StaffNav';
import { useCurrentSessionId, useInstStaff } from '../hooks';

/** STF-14 (teaching assignments), STF-15 (class and subject), STF-16 (workload). */
export default function StaffAssignmentsPage() {
  const { can, path } = usePortal();
  const { inst, state, members, nameOf } = useInstStaff();
  const sessionId = useCurrentSessionId();
  const apply = useApply();
  const [tab, setTab] = useState('teachers');
  const [form, setForm] = useState<{ staffId: string; group: string; subject: string; periods: number } | null>(null);
  const [formError, setFormError] = useState('');
  const [error, setError] = useState('');
  const canCreate = can('staff.assignments.create').allowed;
  const canArchive = can('staff.assignments.archive').allowed;
  const bank = state.banks[inst.id] ?? { groups: [], subjects: [] };
  const teachers = members.filter((member) => member.employment.category === 'teaching' && !isExited(member.employment.status));
  const active = state.assignments.filter((item) => item.instId === inst.id && item.sessionId === sessionId && item.status === 'active');
  const max = policyOf(snapshot(), inst.id).maxPeriodsPerWeek;
  const load = (id: string) => workloadOf(snapshot(), id, sessionId);

  const submit = () => {
    if (!form) return;
    const result = apply((snap, now, actor) => assignTeaching(snap, { instId: inst.id, sessionId, staffId: form.staffId, group: form.group, subject: form.subject, periods: form.periods }, actor, now), 'Assignment saved.');
    if (result.ok) setForm(null);
    else setFormError(result.error);
  };
  const open = (patch: Partial<NonNullable<typeof form>>) => { setFormError(''); setForm({ staffId: '', group: '', subject: '', periods: 5, ...patch }); };

  const columns: Column<StaffMember>[] = [
    { key: 'name', header: 'Teacher', sortable: true, accessor: (row) => row.person.fullName, cell: (row) => <span className="font-medium text-charcoal-900">{row.person.fullName}</span> },
    {
      key: 'assignments',
      header: 'Teaches',
      accessor: (row) => active.filter((item) => item.staffId === row.id).map((item) => `${item.subject} ${item.group}`).join('; '),
      cell: (row) => (
        <ul className="flex flex-wrap gap-1.5">
          {active.filter((item) => item.staffId === row.id).map((item) => (
            <li key={item.id} className="inline-flex items-center gap-1 rounded-full border border-warm-300 bg-white py-0.5 pl-2.5 pr-1 text-xs">
              {item.subject}, {item.group} ({item.periods})
              <button type="button" disabled={!canArchive} onClick={() => { const r = apply((snap, now, actor) => endAssignment(snap, item.id, actor, now), 'Assignment ended.'); setError(r.ok ? '' : r.error); }} aria-label={`End ${item.subject} in ${item.group} for ${row.person.fullName}`} className="rounded-full p-0.5 hover:bg-warm-100"><X size={12} aria-hidden="true" /></button>
            </li>
          ))}
        </ul>
      ),
    },
    { key: 'periods', header: 'Periods a week', sortable: true, align: 'right', accessor: (row) => load(row.id), cell: (row) => `${load(row.id)} of ${max}` },
  ];

  const workloadColumns: Column<StaffMember>[] = [
    { key: 'name', header: 'Teacher', sortable: true, accessor: (row) => row.person.fullName },
    { key: 'periods', header: 'Periods', sortable: true, align: 'right', accessor: (row) => load(row.id) },
    { key: 'limit', header: 'Limit', align: 'right', accessor: () => max },
    { key: 'bar', header: 'Used', accessor: (row) => Math.round((load(row.id) / max) * 100), cell: (row) => (<div className="h-2.5 w-32 overflow-hidden rounded-full bg-warm-200" role="img" aria-label={`${Math.round((load(row.id) / max) * 100)} percent of the limit`}><div className={load(row.id) / max >= 0.9 ? 'h-full bg-warning-600' : 'h-full bg-primary-700'} style={{ width: `${Math.min(100, (load(row.id) / max) * 100)}%` }} /></div>) },
    { key: 'state', header: 'State', accessor: (row) => (load(row.id) === 0 ? 'Free' : load(row.id) / max >= 0.9 ? 'Near the limit' : 'Fine'), cell: (row) => <Badge tone={load(row.id) === 0 ? 'neutral' : load(row.id) / max >= 0.9 ? 'warning' : 'success'}>{load(row.id) === 0 ? 'No assignment' : load(row.id) / max >= 0.9 ? 'Near the limit' : 'Fine'}</Badge> },
  ];

  return (
    <PageContainer>
      <PageHeader
        title="Teaching assignments"
        eyebrow="STF-14 to STF-16"
        description={`Who teaches which class and subject in the current session. A class and subject has one teacher. The weekly limit is ${max} periods.`}
        breadcrumbs={[{ label: inst.shortName, to: path() }, { label: 'Teaching assignments' }]}
        actions={<Button variant="primary" icon={<Plus size={16} aria-hidden="true" />} disabled={!canCreate} onClick={() => open({})}>Assign teacher</Button>}
      />
      <StaffNav />
      {error && <Alert tone="danger" className="mb-4">{error}</Alert>}
      <Tabs label="Assignment views" value={tab} onChange={setTab} items={[{ id: 'teachers', label: 'By teacher' }, { id: 'classes', label: 'By class and subject' }, { id: 'workload', label: 'Workload' }]} />
      <TabPanel id="teachers" value={tab}>
        <div className="card !p-0 overflow-hidden">
          <DataTable caption="Assignments by teacher" rows={teachers} columns={columns} rowKey={(row) => row.id} searchText={(row) => row.person.fullName} searchPlaceholder="Search teachers" initialSort={{ key: 'name', direction: 'asc' }} rowActions={(row) => <Button size="sm" disabled={!canCreate} onClick={() => open({ staffId: row.id })} aria-label={`Assign ${row.person.fullName}`}>Assign</Button>} emptyTitle="No teaching staff" />
        </div>
      </TabPanel>
      <TabPanel id="classes" value={tab}>
        {bank.groups.length === 0 ? (
          <EmptyState title="No classes" description="Classes and subjects come from the academic structure of the institution." />
        ) : (
          <Card padded={false}>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <caption className="sr-only">Teacher for every class and subject</caption>
                <thead>
                  <tr className="border-b border-warm-200 bg-warm-50 text-left">
                    <th scope="col" className="sticky left-0 bg-warm-50 px-4 py-3 font-semibold text-charcoal-800">Class</th>
                    {bank.subjects.map((subject) => <th key={subject} scope="col" className="px-3 py-3 font-semibold text-charcoal-800">{subject}</th>)}
                  </tr>
                </thead>
                <tbody>
                  {bank.groups.map((group) => (
                    <tr key={group} className="border-b border-warm-100 last:border-0">
                      <th scope="row" className="sticky left-0 bg-white px-4 py-2 text-left font-medium text-charcoal-900">{group}</th>
                      {bank.subjects.map((subject) => {
                        const found = active.find((item) => item.group === group && item.subject === subject);
                        return (
                          <td key={subject} className="px-3 py-2">
                            {found ? <span className="text-charcoal-900">{nameOf(found.staffId)} <span className="text-xs text-charcoal-600">({found.periods})</span></span> : <button type="button" disabled={!canCreate} onClick={() => open({ group, subject })} className="text-xs font-medium text-primary-700 hover:underline disabled:text-charcoal-400" aria-label={`Assign a teacher for ${subject} in ${group}`}>Open</button>}
                          </td>
                        );
                      })}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </Card>
        )}
      </TabPanel>
      <TabPanel id="workload" value={tab}>
        <Alert tone="info" className="mb-4">Periods are counted per week for the current session. The period-by-period timetable is part of the timetable module.</Alert>
        <div className="card !p-0 overflow-hidden">
          <DataTable caption="Teaching workload" rows={teachers} columns={workloadColumns} rowKey={(row) => row.id} searchText={(row) => row.person.fullName} searchPlaceholder="Search teachers" initialSort={{ key: 'periods', direction: 'desc' }} />
        </div>
      </TabPanel>

      <Dialog open={form !== null} onClose={() => setForm(null)} title="Assign a teacher" footer={<><Button onClick={() => setForm(null)}>Cancel</Button><Button variant="primary" onClick={submit}>Assign</Button></>}>
        {form && (
          <form onSubmit={(event) => { event.preventDefault(); submit(); }} noValidate className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            {formError && <div className="sm:col-span-2"><Alert tone="danger">{formError}</Alert></div>}
            <SelectField className="sm:col-span-2" label="Teacher" required placeholder="Choose" options={teachers.map((member) => ({ value: member.id, label: `${member.person.fullName} (${load(member.id)} of ${max})` }))} value={form.staffId} onChange={(value) => setForm({ ...form, staffId: value })} />
            <SelectField label="Class" required placeholder="Choose" options={bank.groups.map((group) => ({ value: group, label: group }))} value={form.group} onChange={(value) => setForm({ ...form, group: value })} />
            <SelectField label="Subject" required placeholder="Choose" options={bank.subjects.map((subject) => ({ value: subject, label: subject }))} value={form.subject} onChange={(value) => setForm({ ...form, subject: value })} />
            <TextField label="Periods a week" type="number" min={1} max={12} value={form.periods} onChange={(value) => setForm({ ...form, periods: Number(value) })} />
          </form>
        )}
      </Dialog>
    </PageContainer>
  );
}
