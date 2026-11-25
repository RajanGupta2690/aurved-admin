import { useState } from 'react';
import { Link } from 'react-router-dom';
import { UserPlus } from 'lucide-react';
import { usePortal } from '../../../core/context/portalContext';
import { CATEGORY_LABEL, EMPLOYMENT_LABEL, isExited, STATUS_LABEL } from '../../../core/staff/model';
import type { StaffMember } from '../../../core/staff/model';
import PageContainer from '../../../shared/layout/PageContainer';
import { Badge, StatusBadge } from '../../../shared/ui/Badge';
import DataTable from '../../../shared/ui/DataTable';
import type { Column } from '../../../shared/ui/DataTable';
import { SelectField } from '../../../shared/ui/Field';
import { PageHeader, TabPanel, Tabs } from '../../../shared/ui/Layout';
import StaffNav from '../components/StaffNav';
import { useInstStaff } from '../hooks';

/** STF-02 (directory), STF-03 (teaching) and STF-04 (non-teaching) are the three tabs of one table. */
export default function StaffDirectoryPage() {
  const { can, path } = usePortal();
  const { inst, members, departments, designationName, departmentName, nameOf } = useInstStaff();
  const [tab, setTab] = useState('all');
  const [show, setShow] = useState('current');
  const [department, setDepartment] = useState('');

  const rows = members.filter((member) => {
    if (tab === 'teaching' && member.employment.category !== 'teaching') return false;
    if (tab === 'non_teaching' && member.employment.category !== 'non_teaching') return false;
    if (show === 'current' && isExited(member.employment.status)) return false;
    if (show === 'left' && !isExited(member.employment.status)) return false;
    return !department || member.employment.departmentId === department;
  });
  const count = (category?: string) => members.filter((member) => !isExited(member.employment.status) && (!category || member.employment.category === category)).length;

  const columns: Column<StaffMember>[] = [
    {
      key: 'name',
      header: 'Name',
      sortable: true,
      accessor: (row) => row.person.fullName,
      cell: (row) => (
        <div>
          <Link to={path(`staff/${row.id}`)} className="font-medium text-primary-700 hover:underline">
            {row.person.fullName}
          </Link>
          <p className="text-xs text-charcoal-600">{row.person.email}</p>
        </div>
      ),
    },
    { key: 'emp', header: 'Employee no.', sortable: true, accessor: (row) => row.employment.employeeId },
    { key: 'designation', header: 'Designation', sortable: true, accessor: (row) => designationName(row.employment.designationId) },
    { key: 'department', header: 'Department', sortable: true, accessor: (row) => departmentName(row.employment.departmentId) },
    { key: 'category', header: 'Category', sortable: true, accessor: (row) => CATEGORY_LABEL[row.employment.category], defaultHidden: tab !== 'all' },
    { key: 'type', header: 'Type', sortable: true, accessor: (row) => EMPLOYMENT_LABEL[row.employment.type], defaultHidden: true },
    { key: 'reports', header: 'Reports to', accessor: (row) => nameOf(row.employment.reportsToId), defaultHidden: true },
    { key: 'joined', header: 'Joined', sortable: true, accessor: (row) => row.employment.joinDate, defaultHidden: true },
    { key: 'status', header: 'Status', sortable: true, accessor: (row) => STATUS_LABEL[row.employment.status], cell: (row) => <StatusBadge status={row.employment.status} label={STATUS_LABEL[row.employment.status]} /> },
    { key: 'account', header: 'Sign-in', accessor: (row) => (row.accountId ? 'Yes' : 'No'), cell: (row) => (row.accountId ? <Badge tone="success">Has account</Badge> : <span className="text-charcoal-500">None</span>) },
  ];

  return (
    <PageContainer>
      <PageHeader
        title="Staff"
        eyebrow="STF-02, STF-03, STF-04"
        description={`${count()} current staff at ${inst.shortName}: ${count('teaching')} teaching and ${count('non_teaching')} non-teaching.`}
        breadcrumbs={[{ label: inst.shortName, to: path() }, { label: 'Staff' }]}
        actions={
          can('staff.directory.create').allowed ? (
            <Link to={path('staff/new')} className="btn-primary inline-flex items-center gap-2">
              <UserPlus size={18} aria-hidden="true" />
              Add staff
            </Link>
          ) : undefined
        }
      />
      <StaffNav />
      <Tabs
        label="Staff categories"
        value={tab}
        onChange={setTab}
        items={[
          { id: 'all', label: 'All staff', badge: count() },
          { id: 'teaching', label: 'Teaching', badge: count('teaching') },
          { id: 'non_teaching', label: 'Non-teaching', badge: count('non_teaching') },
        ]}
      />
      <TabPanel id={tab} value={tab}>
        <div className="card !p-0 overflow-hidden">
          <DataTable
            caption="Staff directory"
            rows={rows}
            columns={columns}
            rowKey={(row) => row.id}
            searchText={(row) => `${row.person.fullName} ${row.person.email} ${row.employment.employeeId} ${designationName(row.employment.designationId)}`}
            searchPlaceholder="Search by name, email, number or designation"
            exportName={can('staff.directory.export').allowed ? `${inst.id}-staff` : undefined}
            initialSort={{ key: 'name', direction: 'asc' }}
            filters={
              <div className="flex flex-wrap items-end gap-3">
                <SelectField label="Show" hideLabel value={show} onChange={setShow} options={[{ value: 'current', label: 'Current staff' }, { value: 'left', label: 'People who left' }, { value: 'all', label: 'Everyone' }]} />
                <SelectField label="Department" hideLabel placeholder="All departments" value={department} onChange={setDepartment} options={departments.filter((item) => item.active).map((item) => ({ value: item.id, label: item.name }))} />
              </div>
            }
            emptyTitle="Nobody matches"
            emptyDescription="Change the filters or add staff."
          />
        </div>
      </TabPanel>
    </PageContainer>
  );
}
