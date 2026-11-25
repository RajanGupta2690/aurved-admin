import { useState } from 'react';
import { Link } from 'react-router-dom';
import { usePortal } from '../../../core/context/portalContext';
import { formatDate } from '../../../core/org/rules';
import { isExited, STATUS_LABEL } from '../../../core/staff/model';
import type { StaffMember } from '../../../core/staff/model';
import PageContainer from '../../../shared/layout/PageContainer';
import { StatusBadge } from '../../../shared/ui/Badge';
import Button from '../../../shared/ui/Button';
import DataTable from '../../../shared/ui/DataTable';
import type { Column } from '../../../shared/ui/DataTable';
import { SelectField } from '../../../shared/ui/Field';
import { Card, PageHeader } from '../../../shared/ui/Layout';
import { ExitDialog, TransferDialog } from '../components/ExitDialogs';
import StaffNav from '../components/StaffNav';
import { useInstStaff } from '../hooks';

/** STF-27 */
export default function StaffExitsPage() {
  const { can, path } = usePortal();
  const { inst, members, designationName } = useInstStaff();
  const [pick, setPick] = useState('');
  const [exiting, setExiting] = useState<StaffMember | null>(null);
  const [transferring, setTransferring] = useState<StaffMember | null>(null);
  const canExit = can('staff.exits.create').allowed;
  const left = members.filter((member) => isExited(member.employment.status));
  const current = members.filter((member) => !isExited(member.employment.status));
  const chosen = current.find((member) => member.id === pick);

  const columns: Column<StaffMember>[] = [
    { key: 'name', header: 'Person', sortable: true, accessor: (row) => row.person.fullName, cell: (row) => <Link to={path(`staff/${row.id}`)} className="font-medium text-primary-700 hover:underline">{row.person.fullName}</Link> },
    { key: 'designation', header: 'Was', accessor: (row) => designationName(row.employment.designationId) },
    { key: 'status', header: 'How', sortable: true, accessor: (row) => STATUS_LABEL[row.employment.status], cell: (row) => <StatusBadge status={row.employment.status} label={STATUS_LABEL[row.employment.status]} /> },
    { key: 'date', header: 'Last day', sortable: true, accessor: (row) => row.employment.exitDate ?? '', cell: (row) => formatDate(row.employment.exitDate) },
    { key: 'reason', header: 'Reason', accessor: (row) => row.employment.exitReason ?? '' },
  ];

  return (
    <PageContainer>
      <PageHeader title="Transfers and exits" eyebrow="STF-27" description="End an employment or move someone to another institution of the same organization. The record is always kept." breadcrumbs={[{ label: inst.shortName, to: path() }, { label: 'Transfers and exits' }]} />
      <StaffNav />
      <Card title="Record an exit or a transfer" className="mb-6">
        <div className="flex flex-wrap items-end gap-3">
          <SelectField label="Person" placeholder="Choose a person" options={current.map((member) => ({ value: member.id, label: member.person.fullName }))} value={pick} onChange={setPick} />
          <Button variant="danger" disabled={!canExit || !chosen} onClick={() => setExiting(chosen ?? null)}>End employment</Button>
          <Button disabled={!canExit || !chosen} onClick={() => setTransferring(chosen ?? null)}>Transfer</Button>
        </div>
        <p className="mt-3 text-sm text-charcoal-600">On exit: sign-in access, teaching assignments, duties and delegations end. People who reported to them move to their manager. Nothing is deleted.</p>
      </Card>
      <div className="card !p-0 overflow-hidden">
        <DataTable caption="People who left" rows={left} columns={columns} rowKey={(row) => row.id} searchText={(row) => `${row.person.fullName} ${row.employment.exitReason ?? ''}`} searchPlaceholder="Search" initialSort={{ key: 'date', direction: 'desc' }} emptyTitle="Nobody has left" />
      </div>
      <ExitDialog member={exiting} onClose={() => { setExiting(null); setPick(''); }} />
      <TransferDialog member={transferring} onClose={() => { setTransferring(null); setPick(''); }} />
    </PageContainer>
  );
}
