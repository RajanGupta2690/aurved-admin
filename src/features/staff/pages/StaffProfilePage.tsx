import { useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { Plus, Trash2 } from 'lucide-react';
import { useStore } from '../../../core/api/persistedStore';
import { accessStore } from '../../../core/api/stores';
import { snapshot } from '../../../core/api/worldStore';
import { usePortal } from '../../../core/context/portalContext';
import { permissionRows } from '../../../core/access/matrix';
import { rolesOf } from '../../../core/org/accessOps';
import { formatDate } from '../../../core/org/rules';
import { CATEGORY_LABEL, DOCUMENT_TYPES, EMPLOYMENT_LABEL, isExited, STATUS_LABEL } from '../../../core/staff/model';
import type { EmploymentType, Experience, Qualification, StaffDocument, StaffMember } from '../../../core/staff/model';
import { createAccount, documentGaps, saveStaffLists, setStaffGrants, setStaffRoles, setStaffStatus, updateStaff, workloadOf } from '../../../core/staff/ops';
import PageContainer from '../../../shared/layout/PageContainer';
import { Badge, StatusBadge } from '../../../shared/ui/Badge';
import Button from '../../../shared/ui/Button';
import ConfirmDialog from '../../../shared/ui/ConfirmDialog';
import { CheckboxField, SelectField, TextField } from '../../../shared/ui/Field';
import { Alert, EmptyState } from '../../../shared/ui/Feedback';
import { Card, DescriptionList, PageHeader, TabPanel, Tabs, Timeline } from '../../../shared/ui/Layout';
import { useApply } from '../../organization/hooks';
import { ExitDialog, TransferDialog } from '../components/ExitDialogs';
import StaffNav from '../components/StaffNav';
import { useCurrentSessionId, useInstStaff } from '../hooks';

/** STF-06 to STF-09, STF-18 to STF-21 (for one person), STF-25 and the start of STF-27. */
export default function StaffProfilePage() {
  const { id } = useParams();
  const { inst, find, state } = useInstStaff();
  const { path } = usePortal();
  const member = find(id);
  if (!member || member.instId !== inst.id) {
    return (
      <PageContainer>
        <EmptyState title="Person not found" description="The record does not exist at this institution." action={<Link to={path('staff')} className="btn-secondary">Back to staff</Link>} />
      </PageContainer>
    );
  }
  // Reading the state here keeps the page current after every change.
  return <Profile key={member.id} member={member} events={state.events.filter((event) => event.staffId === member.id)} />;
}

function Profile({ member, events }: { member: StaffMember; events: Array<{ id: string; at: string; byName: string; summary: string }> }) {
  const { can, path } = usePortal();
  const { inst, state, designationName, departmentName, nameOf } = useInstStaff();
  const sessionId = useCurrentSessionId();
  const navigate = useNavigate();
  const apply = useApply();
  const [tab, setTab] = useState('overview');
  const [exiting, setExiting] = useState<StaffMember | null>(null);
  const [transferring, setTransferring] = useState<StaffMember | null>(null);
  const [leave, setLeave] = useState<'on_leave' | 'active' | null>(null);
  const [error, setError] = useState('');
  const left = isExited(member.employment.status);
  const gaps = documentGaps(snapshot(), member);
  const load = workloadOf(snapshot(), member.id, sessionId);
  const canEdit = can('staff.profile.edit').allowed && !left;
  const duties = state.duties.filter((duty) => duty.staffId === member.id && duty.status === 'active');
  const assignments = state.assignments.filter((item) => item.staffId === member.id && item.status === 'active' && item.sessionId === sessionId);

  return (
    <PageContainer>
      <PageHeader
        title={member.person.fullName}
        eyebrow="STF-06"
        description={`${designationName(member.employment.designationId)}, ${departmentName(member.employment.departmentId)}. Employee ${member.employment.employeeId}.`}
        breadcrumbs={[{ label: inst.shortName, to: path() }, { label: 'Staff', to: path('staff') }, { label: member.person.fullName }]}
        actions={
          <>
            <StatusBadge status={member.employment.status} label={STATUS_LABEL[member.employment.status]} />
            {!left && can('staff.exits.create').allowed && (
              <>
                <Button onClick={() => setTransferring(member)}>Transfer</Button>
                <Button variant="danger" onClick={() => setExiting(member)}>
                  End employment
                </Button>
              </>
            )}
          </>
        }
      />
      <StaffNav />
      {left && (
        <Alert tone="warning" title={`${STATUS_LABEL[member.employment.status]} on ${formatDate(member.employment.exitDate)}`} className="mb-4">
          {member.employment.exitReason} The record is kept and cannot be edited.
        </Alert>
      )}
      {error && (
        <Alert tone="danger" className="mb-4">
          {error}
        </Alert>
      )}
      <Tabs
        label="Staff profile"
        value={tab}
        onChange={setTab}
        items={[
          { id: 'overview', label: 'Overview' },
          { id: 'employment', label: 'Employment' },
          { id: 'background', label: 'Qualifications and experience' },
          { id: 'documents', label: 'Documents', badge: gaps.length > 0 ? `${gaps.length} missing` : undefined },
          { id: 'access', label: 'Access' },
          { id: 'activity', label: 'Activity', badge: events.length },
        ]}
      />

      <TabPanel id="overview" value={tab}>
        <div className="grid gap-6 lg:grid-cols-3">
          <Card title="Person" className="lg:col-span-2">
            <DescriptionList items={[{ label: 'Full name', value: member.person.fullName }, { label: 'Gender', value: member.person.gender || undefined }, { label: 'Date of birth', value: member.person.dob ? formatDate(member.person.dob) : undefined }, { label: 'Phone', value: member.person.phone }, { label: 'Email', value: member.person.email }, { label: 'Address', value: member.person.address || undefined }]} />
          </Card>
          <Card title="Right now">
            <DescriptionList
              columns={1}
              items={[
                { label: 'Category', value: CATEGORY_LABEL[member.employment.category] },
                { label: 'Type', value: EMPLOYMENT_LABEL[member.employment.type] },
                { label: 'Reports to', value: nameOf(member.employment.reportsToId) },
                { label: 'Joined', value: formatDate(member.employment.joinDate) },
                { label: 'Sign-in', value: member.accountId ? <Badge tone="success">Has account</Badge> : 'No account' },
                ...(member.employment.category === 'teaching' ? [{ label: 'Weekly periods', value: `${load}` }] : []),
              ]}
            />
          </Card>
          {gaps.length > 0 && !left && (
            <div className="lg:col-span-3">
              <Alert tone="warning" title="Documents missing or not verified">
                {gaps.join(', ')}.{' '}
                <button type="button" className="font-medium underline" onClick={() => setTab('documents')}>
                  Open documents
                </button>
              </Alert>
            </div>
          )}
          <Card title="Assignments and duties" className="lg:col-span-3">
            {assignments.length === 0 && duties.length === 0 ? (
              <p className="text-sm text-charcoal-600">Nothing assigned.</p>
            ) : (
              <ul className="space-y-1.5 text-sm text-charcoal-800">
                {assignments.map((item) => (
                  <li key={item.id}>
                    {item.subject} in {item.group}, {item.periods} periods a week
                  </li>
                ))}
                {duties.map((duty) => (
                  <li key={duty.id}>
                    Duty: {duty.title}
                    {duty.note ? ` (${duty.note})` : ''}
                  </li>
                ))}
              </ul>
            )}
          </Card>
          {!left && can('staff.profile.edit').allowed && (
            <Card title="Status" className="lg:col-span-3">
              <div className="flex flex-wrap items-center gap-3">
                {member.employment.status === 'on_leave' ? (
                  <Button onClick={() => setLeave('active')}>Mark as returned from leave</Button>
                ) : (
                  <Button onClick={() => setLeave('on_leave')}>Mark as on leave</Button>
                )}
                <p className="text-sm text-charcoal-600">Leave does not end sign-in access or assignments. Ending employment does.</p>
              </div>
            </Card>
          )}
        </div>
      </TabPanel>

      <TabPanel id="employment" value={tab}>
        <EmploymentTab member={member} canEdit={canEdit} />
      </TabPanel>
      <TabPanel id="background" value={tab}>
        <BackgroundTab member={member} canEdit={canEdit} />
      </TabPanel>
      <TabPanel id="documents" value={tab}>
        <DocumentsTab member={member} canEdit={canEdit} gaps={gaps} />
      </TabPanel>
      <TabPanel id="access" value={tab}>
        <AccessTab member={member} />
      </TabPanel>
      <TabPanel id="activity" value={tab}>
        <Card title="Activity" description="Everything that changed on this record.">
          <Timeline items={events.map((event) => ({ id: event.id, title: event.summary, meta: `${event.byName} · ${formatDate(event.at)}` }))} empty="Nothing recorded yet." />
        </Card>
      </TabPanel>

      <ExitDialog member={exiting} onClose={() => { setExiting(null); navigate(path(`staff/${member.id}`)); }} />
      <TransferDialog member={transferring} onClose={() => setTransferring(null)} />
      <ConfirmDialog
        open={leave !== null}
        onClose={() => setLeave(null)}
        onConfirm={(reason) => {
          if (!leave) return;
          const result = apply((snap, now, actor) => setStaffStatus(snap, member.id, leave, actor, now, reason), leave === 'on_leave' ? 'Marked as on leave.' : 'Marked as returned.');
          setError(result.ok ? '' : result.error);
        }}
        title={leave === 'on_leave' ? 'Mark as on leave' : 'Mark as returned from leave'}
        message={leave === 'on_leave' ? 'The person stays on the staff list and keeps access.' : 'The person is active again.'}
        itemName={member.person.fullName}
        confirmLabel="Confirm"
        tone="primary"
        requireReason
      />
    </PageContainer>
  );
}

function EmploymentTab({ member, canEdit }: { member: StaffMember; canEdit: boolean }) {
  const { inst, members, designations, departments } = useInstStaff();
  const apply = useApply();
  const [values, setValues] = useState({ ...member.employment, ...{ reportsToId: member.employment.reportsToId ?? '' } });
  const [person, setPerson] = useState(member.person);
  const [error, setError] = useState('');
  const campuses = inst.campuses.filter((campus) => (campus.status ?? 'active') === 'active');
  const save = () => {
    const result = apply(
      (snap, now, actor) =>
        updateStaff(snap, member.id, { person, employment: { employeeId: values.employeeId, category: values.category, designationId: values.designationId, departmentId: values.departmentId, reportsToId: values.reportsToId || null, joinDate: values.joinDate, type: values.type, campusId: values.campusId } }, actor, now),
      'Record saved.',
    );
    setError(result.ok ? '' : result.error);
  };
  return (
    <Card title="Person and employment" description="STF-07. Changes are recorded in the activity.">
      {error && <Alert tone="danger" className="mb-4">{error}</Alert>}
      <form onSubmit={(event) => { event.preventDefault(); save(); }} noValidate className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
        <TextField label="Full name" value={person.fullName} onChange={(value) => setPerson({ ...person, fullName: value })} disabled={!canEdit} />
        <TextField label="Phone" type="tel" value={person.phone} onChange={(value) => setPerson({ ...person, phone: value })} disabled={!canEdit} />
        <TextField label="Email" type="email" value={person.email} onChange={(value) => setPerson({ ...person, email: value })} disabled={!canEdit} />
        <TextField label="Date of birth" type="date" value={person.dob} onChange={(value) => setPerson({ ...person, dob: value })} disabled={!canEdit} />
        <TextField label="Address" value={person.address} onChange={(value) => setPerson({ ...person, address: value })} disabled={!canEdit} />
        <TextField label="Employee number" value={values.employeeId} onChange={(value) => setValues({ ...values, employeeId: value })} disabled={!canEdit} />
        <SelectField label="Designation" options={designations.filter((item) => item.active && item.category === values.category).map((item) => ({ value: item.id, label: item.name }))} value={values.designationId} onChange={(value) => setValues({ ...values, designationId: value })} disabled={!canEdit} />
        <SelectField label="Department" options={departments.filter((item) => item.active).map((item) => ({ value: item.id, label: item.name }))} value={values.departmentId} onChange={(value) => setValues({ ...values, departmentId: value })} disabled={!canEdit} />
        <SelectField label="Reports to" placeholder="Nobody" options={members.filter((item) => item.id !== member.id && !isExited(item.employment.status)).map((item) => ({ value: item.id, label: item.person.fullName }))} value={values.reportsToId ?? ''} onChange={(value) => setValues({ ...values, reportsToId: value })} disabled={!canEdit} />
        <TextField label="Joining date" type="date" value={values.joinDate} onChange={(value) => setValues({ ...values, joinDate: value })} disabled={!canEdit} />
        <SelectField label="Employment type" options={Object.entries(EMPLOYMENT_LABEL).map(([value, label]) => ({ value, label }))} value={values.type} onChange={(value) => setValues({ ...values, type: value as EmploymentType })} disabled={!canEdit} />
        {campuses.length > 1 && <SelectField label="Campus" options={campuses.map((campus) => ({ value: campus.id, label: campus.name }))} value={values.campusId} onChange={(value) => setValues({ ...values, campusId: value })} disabled={!canEdit} />}
        <div className="sm:col-span-2 lg:col-span-3">
          <Button variant="primary" type="submit" disabled={!canEdit}>
            Save changes
          </Button>
        </div>
      </form>
    </Card>
  );
}

let counter = 0;
const uid = (prefix: string) => `${prefix}-${Date.now()}-${counter++}`;

function BackgroundTab({ member, canEdit }: { member: StaffMember; canEdit: boolean }) {
  const apply = useApply();
  const [qualifications, setQualifications] = useState<Qualification[]>(member.qualifications);
  const [experience, setExperience] = useState<Experience[]>(member.experience);
  const [error, setError] = useState('');
  const save = () => {
    const result = apply((snap, now, actor) => saveStaffLists(snap, member.id, { qualifications, experience }, actor, now), 'Saved.');
    setError(result.ok ? '' : result.error);
  };
  return (
    <div className="grid gap-6">
      {error && <Alert tone="danger">{error}</Alert>}
      <Card title="Qualifications" description="STF-08" actions={<Button size="sm" icon={<Plus size={14} aria-hidden="true" />} disabled={!canEdit} onClick={() => setQualifications([...qualifications, { id: uid('q'), degree: '', institution: '', year: new Date().getFullYear() }])}>Add</Button>}>
        {qualifications.length === 0 && <p className="text-sm text-charcoal-600">None recorded.</p>}
        <div className="space-y-3">
          {qualifications.map((item, index) => (
            <div key={item.id} className="grid grid-cols-1 gap-3 rounded-xl border border-warm-200 p-3 sm:grid-cols-[1.2fr_1.2fr_8rem_auto] sm:items-end">
              <TextField label={`Degree ${index + 1}`} value={item.degree} onChange={(value) => setQualifications(qualifications.map((q) => (q.id === item.id ? { ...q, degree: value } : q)))} disabled={!canEdit} />
              <TextField label="Institution" value={item.institution} onChange={(value) => setQualifications(qualifications.map((q) => (q.id === item.id ? { ...q, institution: value } : q)))} disabled={!canEdit} />
              <TextField label="Year" type="number" value={item.year} onChange={(value) => setQualifications(qualifications.map((q) => (q.id === item.id ? { ...q, year: Number(value) } : q)))} disabled={!canEdit} />
              <Button variant="ghost" disabled={!canEdit} onClick={() => setQualifications(qualifications.filter((q) => q.id !== item.id))} aria-label={`Remove qualification ${index + 1}`} icon={<Trash2 size={16} aria-hidden="true" />} />
            </div>
          ))}
        </div>
      </Card>
      <Card title="Experience" actions={<Button size="sm" icon={<Plus size={14} aria-hidden="true" />} disabled={!canEdit} onClick={() => setExperience([...experience, { id: uid('e'), organization: '', role: '', from: '', to: '' }])}>Add</Button>}>
        {experience.length === 0 && <p className="text-sm text-charcoal-600">None recorded.</p>}
        <div className="space-y-3">
          {experience.map((item, index) => (
            <div key={item.id} className="grid grid-cols-1 gap-3 rounded-xl border border-warm-200 p-3 sm:grid-cols-[1.2fr_1.2fr_1fr_1fr_auto] sm:items-end">
              <TextField label={`Organization ${index + 1}`} value={item.organization} onChange={(value) => setExperience(experience.map((e) => (e.id === item.id ? { ...e, organization: value } : e)))} disabled={!canEdit} />
              <TextField label="Role" value={item.role} onChange={(value) => setExperience(experience.map((e) => (e.id === item.id ? { ...e, role: value } : e)))} disabled={!canEdit} />
              <TextField label="From" type="date" value={item.from} onChange={(value) => setExperience(experience.map((e) => (e.id === item.id ? { ...e, from: value } : e)))} disabled={!canEdit} />
              <TextField label="To" type="date" value={item.to} onChange={(value) => setExperience(experience.map((e) => (e.id === item.id ? { ...e, to: value } : e)))} disabled={!canEdit} />
              <Button variant="ghost" disabled={!canEdit} onClick={() => setExperience(experience.filter((e) => e.id !== item.id))} aria-label={`Remove experience ${index + 1}`} icon={<Trash2 size={16} aria-hidden="true" />} />
            </div>
          ))}
        </div>
      </Card>
      <div>
        <Button variant="primary" onClick={save} disabled={!canEdit}>
          Save qualifications and experience
        </Button>
      </div>
    </div>
  );
}

function DocumentsTab({ member, canEdit, gaps }: { member: StaffMember; canEdit: boolean; gaps: string[] }) {
  const apply = useApply();
  const [documents, setDocuments] = useState<StaffDocument[]>(member.documents);
  const [error, setError] = useState('');
  const save = () => {
    const result = apply((snap, now, actor) => saveStaffLists(snap, member.id, { documents }, actor, now), 'Documents saved.');
    setError(result.ok ? '' : result.error);
  };
  return (
    <Card title="Documents" description="STF-09. Only the name and the details are kept here. File storage comes with the document service." actions={<Button size="sm" icon={<Plus size={14} aria-hidden="true" />} disabled={!canEdit} onClick={() => setDocuments([...documents, { id: uid('doc'), type: DOCUMENT_TYPES[0], name: '', verified: false }])}>Add document</Button>}>
      {gaps.length > 0 && <Alert tone="warning" title="Required by the staff policy and not yet verified" className="mb-4">{gaps.join(', ')}</Alert>}
      {error && <Alert tone="danger" className="mb-4">{error}</Alert>}
      {documents.length === 0 && <p className="mb-3 text-sm text-charcoal-600">No documents.</p>}
      <div className="space-y-3">
        {documents.map((doc, index) => (
          <div key={doc.id} className="grid grid-cols-1 gap-3 rounded-xl border border-warm-200 p-3 sm:grid-cols-[1fr_1.2fr_1fr_auto_auto] sm:items-end">
            <SelectField label={`Type ${index + 1}`} options={DOCUMENT_TYPES.map((type) => ({ value: type, label: type }))} value={doc.type} onChange={(value) => setDocuments(documents.map((d) => (d.id === doc.id ? { ...d, type: value } : d)))} disabled={!canEdit} />
            <TextField label="File name" value={doc.name} onChange={(value) => setDocuments(documents.map((d) => (d.id === doc.id ? { ...d, name: value } : d)))} disabled={!canEdit} />
            <TextField label="Expires" type="date" value={doc.expires ?? ''} onChange={(value) => setDocuments(documents.map((d) => (d.id === doc.id ? { ...d, expires: value || undefined } : d)))} disabled={!canEdit} />
            <CheckboxField label="Verified" checked={doc.verified} onChange={(checked) => setDocuments(documents.map((d) => (d.id === doc.id ? { ...d, verified: checked } : d)))} disabled={!canEdit} />
            <Button variant="ghost" disabled={!canEdit} onClick={() => setDocuments(documents.filter((d) => d.id !== doc.id))} aria-label={`Remove document ${index + 1}`} icon={<Trash2 size={16} aria-hidden="true" />} />
          </div>
        ))}
      </div>
      <div className="mt-4">
        <Button variant="primary" onClick={save} disabled={!canEdit}>
          Save documents
        </Button>
      </div>
    </Card>
  );
}

const PERMISSION_OPTIONS = permissionRows().flatMap((row) => row.actions.map((action) => ({ value: `${row.featureKey}.${action}`, label: `${row.moduleLabel}: ${row.featureLabel}, ${action}` })));

function AccessTab({ member }: { member: StaffMember }) {
  const { can, path } = usePortal();
  const { inst } = useInstStaff();
  const { roles, personas } = useStore(accessStore);
  const apply = useApply();
  const [error, setError] = useState('');
  const person = personas.find((item) => item.id === member.accountId);
  const membership = person?.memberships.find((item) => item.scope.type === 'inst' && item.scope.id === inst.id && !item.delegationId);
  const usable = rolesOf(roles, inst.orgId).filter((role) => role.level === 'inst');
  const [chosen, setChosen] = useState<string[]>(membership?.roleIds ?? []);
  const [grants, setGrants] = useState<string[]>(membership?.grants ?? []);
  const [denies, setDenies] = useState<string[]>(membership?.denies ?? []);
  const [grantPick, setGrantPick] = useState('');
  const [denyPick, setDenyPick] = useState('');
  const canEdit = can('staff.access.edit').allowed && !isExited(member.employment.status);

  const toggle = (id: string, on: boolean) => setChosen(on ? [...chosen, id] : chosen.filter((item) => item !== id));
  const run = (operation: Parameters<typeof apply>[0], done: string) => {
    const result = apply(operation, done);
    setError(result.ok ? '' : result.error);
  };

  if (!person) {
    return (
      <Card title="Sign-in account" description="STF-18. This person has no account yet. Without one they cannot sign in.">
        {error && <Alert tone="danger" className="mb-4">{error}</Alert>}
        <p className="mb-3 text-sm text-charcoal-700">Choose the roles the account starts with. Email: {member.person.email}</p>
        <div className="mb-4 grid gap-2 sm:grid-cols-2">
          {usable.map((role) => (
            <CheckboxField key={role.id} label={role.name} hint={role.description} checked={chosen.includes(role.id)} onChange={(checked) => toggle(role.id, checked)} disabled={!canEdit} />
          ))}
        </div>
        <Button variant="primary" disabled={!canEdit} onClick={() => run((snap, now, actor) => createAccount(snap, member.id, chosen, actor, now), 'Account created.')}>
          Create sign-in account
        </Button>
      </Card>
    );
  }

  return (
    <div className="grid gap-6">
      {error && <Alert tone="danger">{error}</Alert>}
      <Card title="Roles" description={`STF-18 to STF-20. ${person.name} signs in as ${person.email}.`} actions={<Link to={`${path('access-explainer')}?person=${person.id}&place=${inst.id}`} className="text-sm font-medium text-primary-700 hover:underline">Why can they do what they can?</Link>}>
        <div className="mb-4 grid gap-2 sm:grid-cols-2">
          {usable.map((role) => (
            <CheckboxField key={role.id} label={role.name} hint={role.description} checked={chosen.includes(role.id)} onChange={(checked) => toggle(role.id, checked)} disabled={!canEdit} />
          ))}
        </div>
        <Button variant="primary" disabled={!canEdit} onClick={() => run((snap, now, actor) => setStaffRoles(snap, member.id, chosen, actor, now), 'Roles saved.')}>
          Save roles
        </Button>
      </Card>
      <Card title="Individual permissions" description="STF-21. Extra permissions for this person only, and denies that beat every role.">
        <div className="grid gap-6 lg:grid-cols-2">
          <PermissionList title="Extra permissions" items={grants} onRemove={(item) => setGrants(grants.filter((value) => value !== item))} pick={grantPick} onPick={setGrantPick} onAdd={() => grantPick && !grants.includes(grantPick) && (setGrants([...grants, grantPick]), setGrantPick(''))} disabled={!canEdit} />
          <PermissionList title="Denied permissions" items={denies} onRemove={(item) => setDenies(denies.filter((value) => value !== item))} pick={denyPick} onPick={setDenyPick} onAdd={() => denyPick && !denies.includes(denyPick) && (setDenies([...denies, denyPick]), setDenyPick(''))} disabled={!canEdit} />
        </div>
        <div className="mt-4">
          <Button variant="primary" disabled={!canEdit} onClick={() => run((snap, now, actor) => setStaffGrants(snap, member.id, grants, denies, actor, now), 'Individual permissions saved.')}>
            Save individual permissions
          </Button>
        </div>
      </Card>
    </div>
  );
}

function PermissionList({ title, items, onRemove, pick, onPick, onAdd, disabled }: { title: string; items: string[]; onRemove: (item: string) => void; pick: string; onPick: (value: string) => void; onAdd: () => void; disabled: boolean }) {
  return (
    <div>
      <h3 className="mb-2 text-sm font-semibold text-charcoal-900">{title}</h3>
      <div className="mb-3 flex items-end gap-2">
        <SelectField className="flex-1" label={`Add to ${title.toLowerCase()}`} placeholder="Choose a permission" options={PERMISSION_OPTIONS} value={pick} onChange={onPick} disabled={disabled} />
        <Button onClick={onAdd} disabled={disabled || !pick}>
          Add
        </Button>
      </div>
      {items.length === 0 ? (
        <p className="text-sm text-charcoal-600">None.</p>
      ) : (
        <ul className="flex flex-wrap gap-2">
          {items.map((item) => (
            <li key={item} className="inline-flex items-center gap-1 rounded-full border border-warm-300 bg-white py-1 pl-3 pr-1 text-xs text-charcoal-800">
              {item}
              <button type="button" disabled={disabled} onClick={() => onRemove(item)} aria-label={`Remove ${item}`} className="rounded-full p-1 hover:bg-warm-100">
                <Trash2 size={12} aria-hidden="true" />
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
