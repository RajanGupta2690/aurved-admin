import { useState } from 'react';
import type { ReactNode } from 'react';
import { Link } from 'react-router-dom';
import { Archive, ArchiveRestore, Pencil, Plus } from 'lucide-react';
import { usePortal } from '../../../core/context/portalContext';
import { CATEGORY_LABEL, isExited } from '../../../core/staff/model';
import type { Department, Designation, StaffCategory, StaffMember } from '../../../core/staff/model';
import { saveDepartment, saveDesignation, setDepartmentActive, setDesignationActive } from '../../../core/staff/ops';
import PageContainer from '../../../shared/layout/PageContainer';
import { Badge, StatusBadge } from '../../../shared/ui/Badge';
import Button from '../../../shared/ui/Button';
import ConfirmDialog from '../../../shared/ui/ConfirmDialog';
import DataTable from '../../../shared/ui/DataTable';
import type { Column } from '../../../shared/ui/DataTable';
import { SelectField, TextareaField, TextField } from '../../../shared/ui/Field';
import { Alert, EmptyState } from '../../../shared/ui/Feedback';
import { Card, PageHeader, TabPanel, Tabs } from '../../../shared/ui/Layout';
import { Dialog } from '../../../shared/ui/Overlay';
import { useApply } from '../../organization/hooks';
import StaffNav from '../components/StaffNav';
import { useInstStaff } from '../hooks';

interface DesignationForm {
  id?: string;
  name: string;
  category: StaffCategory;
  level: number;
  summary: string;
  responsibilities: string;
  minQualification: string;
}

/** STF-10 (designations), STF-11 (job profile), STF-12 (departments), STF-13 (reporting hierarchy). */
export default function StaffStructurePage() {
  const { can, path } = usePortal();
  const { inst, members, designations, departments, nameOf, designationName } = useInstStaff();
  const apply = useApply();
  const [tab, setTab] = useState('designations');
  const [desg, setDesg] = useState<DesignationForm | null>(null);
  const [dept, setDept] = useState<{ id?: string; name: string; headId: string } | null>(null);
  const [formError, setFormError] = useState('');
  const [archive, setArchive] = useState<{ kind: 'designation' | 'department'; id: string; name: string } | null>(null);
  const [error, setError] = useState('');
  const canCreate = can('staff.structure.create').allowed;
  const canEdit = can('staff.structure.edit').allowed;
  const canArchive = can('staff.structure.archive').allowed;
  const current = members.filter((member) => !isExited(member.employment.status));
  const holders = (id: string, field: 'designationId' | 'departmentId') => current.filter((member) => member.employment[field] === id).length;

  const submitDesignation = () => {
    if (!desg) return;
    const result = apply((snap, now, actor) => saveDesignation(snap, { id: desg.id, instId: inst.id, name: desg.name, category: desg.category, level: desg.level, summary: desg.summary, responsibilities: desg.responsibilities.split('\n'), minQualification: desg.minQualification }, actor, now), desg.id ? 'Designation saved.' : 'Designation added.');
    if (result.ok) setDesg(null);
    else setFormError(result.error);
  };
  const submitDepartment = () => {
    if (!dept) return;
    const result = apply((snap, now, actor) => saveDepartment(snap, { id: dept.id, instId: inst.id, name: dept.name, headId: dept.headId || null }, actor, now), dept.id ? 'Department saved.' : 'Department added.');
    if (result.ok) setDept(null);
    else setFormError(result.error);
  };

  const dColumns: Column<Designation>[] = [
    { key: 'name', header: 'Designation', sortable: true, accessor: (row) => row.name, cell: (row) => (<div><p className="font-medium text-charcoal-900">{row.name}</p><p className="text-xs text-charcoal-600">{row.summary}</p></div>) },
    { key: 'category', header: 'Category', sortable: true, accessor: (row) => CATEGORY_LABEL[row.category] },
    { key: 'level', header: 'Level', sortable: true, align: 'right', accessor: (row) => row.level },
    { key: 'people', header: 'People', sortable: true, align: 'right', accessor: (row) => holders(row.id, 'designationId') },
    { key: 'status', header: 'Status', accessor: (row) => (row.active ? 'active' : 'archived'), cell: (row) => <StatusBadge status={row.active ? 'active' : 'archived'} /> },
  ];
  const pColumns: Column<Department>[] = [
    { key: 'name', header: 'Department', sortable: true, accessor: (row) => row.name, cell: (row) => <span className="font-medium text-charcoal-900">{row.name}</span> },
    { key: 'head', header: 'Head', sortable: true, accessor: (row) => nameOf(row.headId) },
    { key: 'people', header: 'People', sortable: true, align: 'right', accessor: (row) => holders(row.id, 'departmentId') },
    { key: 'status', header: 'Status', accessor: (row) => (row.active ? 'active' : 'archived'), cell: (row) => <StatusBadge status={row.active ? 'active' : 'archived'} /> },
  ];

  // Reporting tree: roots are people who report to nobody.
  const renderNode = (member: StaffMember, depth: number): ReactNode => {
    const reports = current.filter((item) => item.employment.reportsToId === member.id);
    return (
      <li key={member.id} className={depth ? 'border-l border-warm-200 pl-4' : ''}>
        <div className="rounded-xl border border-warm-200 bg-white p-3 text-sm">
          <Link to={path(`staff/${member.id}`)} className="font-medium text-primary-700 hover:underline">{member.person.fullName}</Link>
          <span className="ml-2 text-charcoal-600">{designationName(member.employment.designationId)}</span>
          {reports.length > 0 && <Badge className="ml-2">{reports.length} report{reports.length === 1 ? '' : 's'}</Badge>}
        </div>
        {reports.length > 0 && <ul className="mt-2 space-y-2">{reports.map((item) => renderNode(item, depth + 1))}</ul>}
      </li>
    );
  };
  const roots = current.filter((member) => !member.employment.reportsToId);

  return (
    <PageContainer>
      <PageHeader title="Designations and departments" eyebrow="STF-10 to STF-13" description="The posts of the institution, what each one does, the departments, and who reports to whom." breadcrumbs={[{ label: inst.shortName, to: path() }, { label: 'Staff structure' }]} />
      <StaffNav />
      {error && <Alert tone="danger" className="mb-4">{error}</Alert>}
      <Tabs label="Structure views" value={tab} onChange={setTab} items={[{ id: 'designations', label: 'Designations and job profiles', badge: designations.filter((item) => item.active).length }, { id: 'departments', label: 'Departments', badge: departments.filter((item) => item.active).length }, { id: 'hierarchy', label: 'Reporting hierarchy' }]} />

      <TabPanel id="designations" value={tab}>
        <div className="mb-3 flex justify-end">
          <Button variant="primary" icon={<Plus size={16} aria-hidden="true" />} disabled={!canCreate} onClick={() => { setFormError(''); setDesg({ name: '', category: 'teaching', level: 4, summary: '', responsibilities: '', minQualification: '' }); }}>Add designation</Button>
        </div>
        <div className="card !p-0 overflow-hidden">
          <DataTable
            caption="Designations"
            rows={designations}
            columns={dColumns}
            rowKey={(row) => row.id}
            searchText={(row) => `${row.name} ${row.summary}`}
            searchPlaceholder="Search designations"
            initialSort={{ key: 'level', direction: 'asc' }}
            rowActions={(row) => (
              <div className="flex flex-wrap justify-end gap-2">
                <Button size="sm" icon={<Pencil size={14} aria-hidden="true" />} disabled={!canEdit} onClick={() => { setFormError(''); setDesg({ id: row.id, name: row.name, category: row.category, level: row.level, summary: row.summary, responsibilities: row.responsibilities.join('\n'), minQualification: row.minQualification }); }} aria-label={`Edit ${row.name}`}>Edit</Button>
                {row.active ? (
                  <Button size="sm" icon={<Archive size={14} aria-hidden="true" />} disabled={!canArchive} onClick={() => { setError(''); setArchive({ kind: 'designation', id: row.id, name: row.name }); }} aria-label={`Archive ${row.name}`}>Archive</Button>
                ) : (
                  <Button size="sm" icon={<ArchiveRestore size={14} aria-hidden="true" />} disabled={!canArchive} onClick={() => { const r = apply((snap, now, actor) => setDesignationActive(snap, row.id, true, actor, now), `${row.name} restored.`); setError(r.ok ? '' : r.error); }} aria-label={`Restore ${row.name}`}>Restore</Button>
                )}
              </div>
            )}
          />
        </div>
      </TabPanel>

      <TabPanel id="departments" value={tab}>
        <div className="mb-3 flex justify-end">
          <Button variant="primary" icon={<Plus size={16} aria-hidden="true" />} disabled={!canCreate} onClick={() => { setFormError(''); setDept({ name: '', headId: '' }); }}>Add department</Button>
        </div>
        <div className="card !p-0 overflow-hidden">
          <DataTable
            caption="Departments"
            rows={departments}
            columns={pColumns}
            rowKey={(row) => row.id}
            searchText={(row) => row.name}
            searchPlaceholder="Search departments"
            initialSort={{ key: 'name', direction: 'asc' }}
            rowActions={(row) => (
              <div className="flex flex-wrap justify-end gap-2">
                <Button size="sm" icon={<Pencil size={14} aria-hidden="true" />} disabled={!canEdit} onClick={() => { setFormError(''); setDept({ id: row.id, name: row.name, headId: row.headId ?? '' }); }} aria-label={`Edit ${row.name}`}>Edit</Button>
                {row.active ? (
                  <Button size="sm" icon={<Archive size={14} aria-hidden="true" />} disabled={!canArchive} onClick={() => { setError(''); setArchive({ kind: 'department', id: row.id, name: row.name }); }} aria-label={`Archive ${row.name}`}>Archive</Button>
                ) : (
                  <Button size="sm" icon={<ArchiveRestore size={14} aria-hidden="true" />} disabled={!canArchive} onClick={() => { const r = apply((snap, now, actor) => setDepartmentActive(snap, row.id, true, actor, now), `${row.name} restored.`); setError(r.ok ? '' : r.error); }} aria-label={`Restore ${row.name}`}>Restore</Button>
                )}
              </div>
            )}
          />
        </div>
      </TabPanel>

      <TabPanel id="hierarchy" value={tab}>
        <Card title="Who reports to whom" description="Change a reporting line in the Employment tab of a person. A loop is never allowed.">
          {roots.length === 0 ? <EmptyState title="Nobody yet" /> : <ul className="space-y-2">{roots.map((member) => renderNode(member, 0))}</ul>}
        </Card>
      </TabPanel>

      <Dialog open={desg !== null} onClose={() => setDesg(null)} title={desg?.id ? 'Edit designation' : 'Add designation'} description="The job profile is what the post is for. It is kept with the designation." size="md" footer={<><Button onClick={() => setDesg(null)}>Cancel</Button><Button variant="primary" onClick={submitDesignation}>Save</Button></>}>
        {desg && (
          <form onSubmit={(event) => { event.preventDefault(); submitDesignation(); }} noValidate className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            {formError && <div className="sm:col-span-2"><Alert tone="danger">{formError}</Alert></div>}
            <TextField label="Name" required autoFocus value={desg.name} onChange={(value) => setDesg({ ...desg, name: value })} />
            <SelectField label="Category" options={Object.entries(CATEGORY_LABEL).map(([value, label]) => ({ value, label }))} value={desg.category} onChange={(value) => setDesg({ ...desg, category: value as StaffCategory })} />
            <TextField label="Level (1 is the top)" type="number" min={1} max={9} value={desg.level} onChange={(value) => setDesg({ ...desg, level: Number(value) })} />
            <TextField label="Minimum qualification" value={desg.minQualification} onChange={(value) => setDesg({ ...desg, minQualification: value })} />
            <TextField className="sm:col-span-2" label="Summary" value={desg.summary} onChange={(value) => setDesg({ ...desg, summary: value })} />
            <TextareaField className="sm:col-span-2" label="Responsibilities" rows={4} hint="One per line." value={desg.responsibilities} onChange={(value) => setDesg({ ...desg, responsibilities: value })} />
          </form>
        )}
      </Dialog>

      <Dialog open={dept !== null} onClose={() => setDept(null)} title={dept?.id ? 'Edit department' : 'Add department'} size="sm" footer={<><Button onClick={() => setDept(null)}>Cancel</Button><Button variant="primary" onClick={submitDepartment}>Save</Button></>}>
        {dept && (
          <form onSubmit={(event) => { event.preventDefault(); submitDepartment(); }} noValidate className="space-y-4">
            {formError && <Alert tone="danger">{formError}</Alert>}
            <TextField label="Name" required autoFocus value={dept.name} onChange={(value) => setDept({ ...dept, name: value })} />
            <SelectField label="Head" placeholder="Nobody yet" options={current.map((member) => ({ value: member.id, label: member.person.fullName }))} value={dept.headId} onChange={(value) => setDept({ ...dept, headId: value })} />
          </form>
        )}
      </Dialog>

      <ConfirmDialog
        open={archive !== null}
        onClose={() => setArchive(null)}
        onConfirm={(reason) => {
          if (!archive) return;
          const result = apply((snap, now, actor) => (archive.kind === 'designation' ? setDesignationActive(snap, archive.id, false, actor, now, reason) : setDepartmentActive(snap, archive.id, false, actor, now, reason)), `${archive.name} archived.`);
          setError(result.ok ? '' : result.error);
        }}
        title={`Archive ${archive?.kind ?? ''}`}
        message="It can no longer be chosen for new people. Records that use it keep it. You can restore it."
        itemName={archive?.name}
        confirmLabel="Archive"
        requireReason
      />
    </PageContainer>
  );
}
