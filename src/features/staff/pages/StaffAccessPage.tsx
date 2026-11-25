import { useState } from 'react';
import { Link } from 'react-router-dom';
import { useStore } from '../../../core/api/persistedStore';
import { accessStore } from '../../../core/api/stores';
import { usePortal } from '../../../core/context/portalContext';
import { rolesOf } from '../../../core/org/accessOps';
import { isExited } from '../../../core/staff/model';
import type { StaffMember } from '../../../core/staff/model';
import { bulkSetRole, setStaffRoles } from '../../../core/staff/ops';
import PageContainer from '../../../shared/layout/PageContainer';
import { Badge } from '../../../shared/ui/Badge';
import Button from '../../../shared/ui/Button';
import DataTable from '../../../shared/ui/DataTable';
import type { Column } from '../../../shared/ui/DataTable';
import { SelectField } from '../../../shared/ui/Field';
import { Alert } from '../../../shared/ui/Feedback';
import { Card, PageHeader, TabPanel, Tabs } from '../../../shared/ui/Layout';
import { useApply } from '../../organization/hooks';
import StaffNav from '../components/StaffNav';
import { useInstStaff } from '../hooks';

/** STF-22 (bulk), STF-23 (co-administrators), STF-26 (access audit). Roles of one person are on their profile. */
export default function StaffAccessPage() {
  const { can, path } = usePortal();
  const { inst, state, members, designationName } = useInstStaff();
  const { roles, personas } = useStore(accessStore);
  const apply = useApply();
  const [tab, setTab] = useState('people');
  const [bulkRole, setBulkRole] = useState('');
  const [newAdmin, setNewAdmin] = useState('');
  const [error, setError] = useState('');
  const [today] = useState(() => new Date().toISOString().slice(0, 10));
  const canEdit = can('staff.access.edit').allowed;
  const usable = rolesOf(roles, inst.orgId).filter((role) => role.level === 'inst');
  const current = members.filter((member) => !isExited(member.employment.status));

  const membershipOf = (member: StaffMember) => personas.find((person) => person.id === member.accountId)?.memberships.find((item) => item.scope.type === 'inst' && item.scope.id === inst.id && !item.delegationId);
  const roleNames = (member: StaffMember) => (membershipOf(member)?.roleIds ?? []).map((id) => roles.find((role) => role.id === id)?.name ?? id);
  const admins = current.filter((member) => membershipOf(member)?.roleIds.includes('inst_admin'));

  const columns: Column<StaffMember>[] = [
    { key: 'name', header: 'Person', sortable: true, accessor: (row) => row.person.fullName, cell: (row) => <Link to={path(`staff/${row.id}`)} className="font-medium text-primary-700 hover:underline">{row.person.fullName}</Link> },
    { key: 'designation', header: 'Designation', sortable: true, accessor: (row) => designationName(row.employment.designationId) },
    { key: 'account', header: 'Account', sortable: true, accessor: (row) => (row.accountId ? 'Yes' : 'No'), cell: (row) => (row.accountId ? <Badge tone="success">Yes</Badge> : <span className="text-charcoal-500">No</span>) },
    { key: 'roles', header: 'Roles', accessor: (row) => roleNames(row).join(', '), cell: (row) => <span>{roleNames(row).join(', ') || <span className="text-charcoal-500">None</span>}</span> },
    { key: 'extras', header: 'Extra or denied', align: 'right', accessor: (row) => (membershipOf(row)?.grants?.length ?? 0) + (membershipOf(row)?.denies?.length ?? 0) },
  ];

  // STF-26: things worth a second look.
  const findings: Array<{ id: string; tone: 'danger' | 'warning' | 'info'; text: string; who?: StaffMember }> = [];
  admins.forEach((member) => findings.push({ id: `admin-${member.id}`, tone: 'info', text: `${member.person.fullName} is an institution administrator and can do everything here.`, who: member }));
  if (admins.length === 1) findings.push({ id: 'one-admin', tone: 'warning', text: 'There is only one institution administrator. Name a second so that access is not lost when they leave.' });
  current.filter((member) => member.employment.status === 'on_leave' && member.accountId).forEach((member) => findings.push({ id: `leave-${member.id}`, tone: 'warning', text: `${member.person.fullName} is on leave and can still sign in.`, who: member }));
  current.forEach((member) => {
    const ms = membershipOf(member);
    if (ms && ((ms.grants?.length ?? 0) > 0 || (ms.denies?.length ?? 0) > 0)) findings.push({ id: `extra-${member.id}`, tone: 'info', text: `${member.person.fullName} has ${ms.grants?.length ?? 0} extra and ${ms.denies?.length ?? 0} denied individual permissions.`, who: member });
  });
  state.delegations.filter((item) => item.instId === inst.id && item.status === 'active' && item.from <= today && today <= item.to).forEach((item) => findings.push({ id: `dlg-${item.id}`, tone: 'info', text: `A delegation is running until ${item.to}.` }));
  // Access that points at nobody on the staff list.
  personas.forEach((person) => {
    person.memberships.filter((item) => item.scope.type === 'inst' && item.scope.id === inst.id && !item.delegationId && item.roleIds.length > 0).forEach(() => {
      if (!state.members.some((member) => member.accountId === person.id && member.instId === inst.id && !isExited(member.employment.status))) findings.push({ id: `orphan-${person.id}`, tone: 'danger', text: `${person.name} holds a role here but is not on the current staff list.` });
    });
  });

  const run = (operation: Parameters<typeof apply>[0], done: string) => {
    const result = apply(operation, done);
    setError(result.ok ? '' : result.error);
    return result.ok;
  };

  return (
    <PageContainer>
      <PageHeader title="Staff access" eyebrow="STF-22, STF-23, STF-26" description="Who can sign in and what role they hold. Roles of one person are set on their profile. Here you can change many at once, manage co-administrators, and review access." breadcrumbs={[{ label: inst.shortName, to: path() }, { label: 'Access' }]} />
      <StaffNav />
      {error && <Alert tone="danger" className="mb-4">{error}</Alert>}
      <Tabs label="Access views" value={tab} onChange={setTab} items={[{ id: 'people', label: 'People and roles' }, { id: 'admins', label: 'Co-administrators', badge: admins.length }, { id: 'audit', label: 'Access review', badge: findings.length }]} />

      <TabPanel id="people" value={tab}>
        <div className="card !p-0 overflow-hidden">
          <DataTable
            caption="People and roles"
            rows={current}
            columns={columns}
            rowKey={(row) => row.id}
            selectable
            searchText={(row) => `${row.person.fullName} ${roleNames(row).join(' ')}`}
            searchPlaceholder="Search people or roles"
            initialSort={{ key: 'name', direction: 'asc' }}
            bulkActions={(selected, clear) => (
              <div className="flex flex-wrap items-end gap-3">
                <SelectField label="Role" hideLabel placeholder="Choose a role" options={usable.map((role) => ({ value: role.id, label: role.name }))} value={bulkRole} onChange={setBulkRole} />
                <Button disabled={!canEdit || !bulkRole} onClick={() => run((snap, now, actor) => bulkSetRole(snap, selected.map((item) => item.id), bulkRole, 'add', actor, now), `Role given to the selected people.`) && clear()}>Give role to {selected.length}</Button>
                <Button disabled={!canEdit || !bulkRole} onClick={() => run((snap, now, actor) => bulkSetRole(snap, selected.map((item) => item.id), bulkRole, 'remove', actor, now), `Role taken from the selected people.`) && clear()}>Take role from {selected.length}</Button>
              </div>
            )}
          />
        </div>
      </TabPanel>

      <TabPanel id="admins" value={tab}>
        <Card title="Institution administrators" description="They can do everything at this institution except organization pages. Keep at least two, so that access is never lost.">
          <ul className="mb-6 divide-y divide-warm-200">
            {admins.map((member) => (
              <li key={member.id} className="flex flex-wrap items-center justify-between gap-3 py-3 first:pt-0 last:pb-0">
                <span><Link to={path(`staff/${member.id}`)} className="font-medium text-primary-700 hover:underline">{member.person.fullName}</Link><span className="block text-xs text-charcoal-600">{designationName(member.employment.designationId)}</span></span>
                <Button size="sm" disabled={!canEdit} onClick={() => run((snap, now, actor) => setStaffRoles(snap, member.id, (membershipOf(member)?.roleIds ?? []).filter((id) => id !== 'inst_admin'), actor, now), `${member.person.fullName} is no longer an administrator.`)} aria-label={`Remove ${member.person.fullName} as administrator`}>Remove</Button>
              </li>
            ))}
            {admins.length === 0 && <li className="text-sm text-charcoal-600">Nobody holds the role.</li>}
          </ul>
          <div className="flex flex-wrap items-end gap-3">
            <SelectField label="Add a co-administrator" placeholder="Choose a person with an account" options={current.filter((member) => member.accountId && !admins.includes(member)).map((member) => ({ value: member.id, label: member.person.fullName }))} value={newAdmin} onChange={setNewAdmin} />
            <Button variant="primary" disabled={!canEdit || !newAdmin} onClick={() => { const member = current.find((item) => item.id === newAdmin); if (member && run((snap, now, actor) => setStaffRoles(snap, member.id, [...(membershipOf(member)?.roleIds ?? []), 'inst_admin'], actor, now), `${member.person.fullName} is now an administrator.`)) setNewAdmin(''); }}>Make administrator</Button>
          </div>
        </Card>
      </TabPanel>

      <TabPanel id="audit" value={tab}>
        <Card title="Access review" description="Things worth a second look. Nothing here is an error by itself.">
          {findings.length === 0 ? <p className="text-sm text-charcoal-700">Nothing to review.</p> : (
            <ul className="divide-y divide-warm-200">
              {findings.map((finding) => (
                <li key={finding.id} className="flex items-start gap-3 py-3 first:pt-0 last:pb-0">
                  <Badge tone={finding.tone}>{finding.tone === 'danger' ? 'Fix' : finding.tone === 'warning' ? 'Check' : 'Note'}</Badge>
                  <span className="text-sm text-charcoal-800">{finding.text} {finding.who && <Link to={path(`staff/${finding.who.id}`)} className="font-medium text-primary-700 hover:underline">Open</Link>}</span>
                </li>
              ))}
            </ul>
          )}
        </Card>
      </TabPanel>
    </PageContainer>
  );
}
